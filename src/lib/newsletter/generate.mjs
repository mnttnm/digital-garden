import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CONTENT_ROOT = fileURLToPath(new URL('../../content', import.meta.url));

function pad2(value) {
  return String(value).padStart(2, '0');
}

function toDateOnlyUtc(date) {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

function parseDateOrThrow(value, label) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
  return parsed;
}

function getEndOfDayUtc(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1, 0, 0, 0, 0));
}

function getStartOfDayUtc(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

export function getNewsletterWindow(type, dateInput) {
  const normalizedType = type === 'daily' ? 'daily' : 'weekly';
  const anchor = dateInput
    ? parseDateOrThrow(`${dateInput}T00:00:00.000Z`, 'date')
    : new Date();

  const endExclusive = getEndOfDayUtc(anchor);
  const days = normalizedType === 'daily' ? 1 : 7;
  const startInclusive = new Date(endExclusive.getTime() - days * 24 * 60 * 60 * 1000);

  return {
    type: normalizedType,
    startInclusive,
    endExclusive,
    anchorDate: getStartOfDayUtc(anchor),
  };
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function splitFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return { frontmatter: '', body: content };
  }
  return { frontmatter: match[1], body: match[2] || '' };
}

function parseFrontmatterValue(frontmatter, key) {
  const regex = new RegExp(`^${key}:\\s*(.+)$`, 'm');
  const match = frontmatter.match(regex);
  if (!match) return undefined;
  const raw = match[1].trim();
  return raw.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
}

function parseBoolean(value, fallback = false) {
  if (typeof value !== 'string') return fallback;
  return value.trim().toLowerCase() === 'true';
}

function stripMarkdown(input) {
  return input
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[[^\]]+\]\([^)]+\)/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s*/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstSentence(input) {
  const clean = stripMarkdown(input);
  if (!clean) return '';
  const sentence = clean.match(/[^.!?]+[.!?]/)?.[0]?.trim();
  return sentence || clean.slice(0, 180);
}

function listMarkdownFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...listMarkdownFiles(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

function relativeSlug(filePath, collectionName) {
  const base = path.join(CONTENT_ROOT, collectionName);
  const rel = path.relative(base, filePath);
  return rel.replace(/\.md$/, '').replace(/\\/g, '/');
}

function buildProjectEventAnchor(projectSlug, eventDate, eventTitle) {
  const slugify = (input) =>
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'item';

  const dateToken = eventDate.toISOString().slice(0, 10).replace(/-/g, '');
  return `event-${slugify(projectSlug)}-${dateToken}-${slugify(eventTitle)}`;
}

function parseProjectActivity(frontmatter) {
  const lines = frontmatter.split('\n');
  const events = [];
  let inActivity = false;
  let current = null;

  for (const line of lines) {
    if (!inActivity) {
      if (/^activity:\s*$/.test(line)) {
        inActivity = true;
      }
      continue;
    }

    if (!line.startsWith('  ') && line.trim() !== '') {
      if (current) events.push(current);
      break;
    }

    const eventDate = line.match(/^\s*-\s+date:\s*(.+)$/);
    if (eventDate) {
      if (current) events.push(current);
      current = {
        date: eventDate[1].trim(),
        title: '',
        summary: '',
        image: '',
        imageCaption: '',
      };
      continue;
    }

    if (!current) continue;

    const title = line.match(/^\s+title:\s*(.+)$/);
    if (title) {
      current.title = title[1].trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
      continue;
    }

    const summary = line.match(/^\s+summary:\s*(.+)$/);
    if (summary) {
      current.summary = summary[1].trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
      continue;
    }

    const image = line.match(/^\s+image:\s*(.+)$/);
    if (image) {
      current.image = image[1].trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
      continue;
    }

    const imageCaption = line.match(/^\s+imageCaption:\s*(.+)$/);
    if (imageCaption) {
      current.imageCaption = imageCaption[1].trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    }
  }

  if (current) events.push(current);
  return events;
}

function inWindow(date, window) {
  return date >= window.startInclusive && date < window.endExclusive;
}

function dedupeItems(items) {
  const seen = new Set();
  const deduped = [];
  for (const item of items) {
    const key = `${item.url}|${item.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }
  return deduped;
}

function formatHumanDate(date) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function formatItemDate(date) {
  return date.toISOString().slice(0, 10);
}

function buildSubject(type, anchorDate) {
  const cadence = type === 'daily' ? 'Daily' : 'Weekly';
  return `[${cadence}] Notes from Mohit — ${formatHumanDate(anchorDate)}`;
}

function renderItemHtml(item) {
  const imageHtml = item.image
    ? `<div style="margin: 8px 0;"><img src="${item.image}" alt="${item.imageCaption || item.title}" style="max-width: 100%; height: auto; border-radius: 8px;" />${item.imageCaption ? `<p style="margin: 4px 0 0; font-size: 13px; color: #666; font-style: italic;">${item.imageCaption}</p>` : ''}</div>`
    : '';
  return `<li style="margin: 0 0 20px;"><strong>${item.title}</strong> <span style="color:#888;">(${formatItemDate(item.date)})</span><br/>${item.summary}${imageHtml}<br/><a href="${item.url}" style="color: #0066cc;">Read more →</a></li>`;
}

function renderHtml({ subject, window, items, variant }) {
  const subtitle = variant === 'projects' ? 'Projects-only updates' : 'All updates';
  const listHtml = items.length === 0
    ? '<p style="margin: 0; color: #666;">No new updates in this window.</p>'
    : `<ul style="padding-left: 20px; margin: 0;">${items.map(renderItemHtml).join('')}</ul>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 640px; margin: 0 auto; padding: 32px 20px; color: #111; line-height: 1.5;">
  <h1 style="font-size: 22px; margin: 0 0 10px;">${subject}</h1>
  <p style="margin: 0 0 4px; color: #444;">${subtitle}</p>
  <p style="margin: 0 0 24px; color: #666; font-size: 14px;">Window: ${formatHumanDate(window.startInclusive)} to ${formatHumanDate(new Date(window.endExclusive.getTime() - 1))} (UTC)</p>
  ${listHtml}
</body>
</html>`;
}

function renderText({ subject, window, items, variant }) {
  const subtitle = variant === 'projects' ? 'Projects-only updates' : 'All updates';
  const header = `${subject}\n${subtitle}\nWindow: ${formatHumanDate(window.startInclusive)} to ${formatHumanDate(new Date(window.endExclusive.getTime() - 1))} (UTC)\n`;
  if (items.length === 0) {
    return `${header}\nNo new updates in this window.`;
  }

  const lines = items.map((item) => `- ${item.title} (${formatItemDate(item.date)})\n  ${item.summary}\n  ${item.url}`);
  return `${header}\n${lines.join('\n\n')}`;
}

function collectNotes(window) {
  const files = listMarkdownFiles(path.join(CONTENT_ROOT, 'notes'));
  const items = [];
  for (const filePath of files) {
    const slug = relativeSlug(filePath, 'notes');
    const parsed = splitFrontmatter(readFile(filePath));
    const draft = parseBoolean(parseFrontmatterValue(parsed.frontmatter, 'draft'));
    if (draft) continue;

    const dateRaw = parseFrontmatterValue(parsed.frontmatter, 'date');
    const title = parseFrontmatterValue(parsed.frontmatter, 'title') || slug;
    if (!dateRaw) continue;

    const date = parseDateOrThrow(dateRaw, `note date (${slug})`);
    if (!inWindow(date, window)) continue;

    const takeaway = parseFrontmatterValue(parsed.frontmatter, 'takeaway');
    items.push({
      kind: 'note',
      date,
      title,
      summary: takeaway || firstSentence(parsed.body),
      url: `/notes/${slug}/`,
    });
  }
  return items;
}

function collectTils(window) {
  const files = listMarkdownFiles(path.join(CONTENT_ROOT, 'til'));
  const items = [];
  for (const filePath of files) {
    const slug = relativeSlug(filePath, 'til');
    const parsed = splitFrontmatter(readFile(filePath));
    const draft = parseBoolean(parseFrontmatterValue(parsed.frontmatter, 'draft'));
    if (draft) continue;

    const dateRaw = parseFrontmatterValue(parsed.frontmatter, 'date');
    const title = parseFrontmatterValue(parsed.frontmatter, 'title') || slug;
    if (!dateRaw) continue;

    const date = parseDateOrThrow(dateRaw, `til date (${slug})`);
    if (!inWindow(date, window)) continue;

    items.push({
      kind: 'til',
      date,
      title,
      summary: firstSentence(parsed.body),
      url: `/til/${slug}/`,
    });
  }
  return items;
}

function collectProjects(window) {
  const files = listMarkdownFiles(path.join(CONTENT_ROOT, 'projects'));
  const items = [];

  for (const filePath of files) {
    const slug = relativeSlug(filePath, 'projects');
    const parsed = splitFrontmatter(readFile(filePath));
    const draft = parseBoolean(parseFrontmatterValue(parsed.frontmatter, 'draft'));
    if (draft) continue;

    const projectTitle = parseFrontmatterValue(parsed.frontmatter, 'title') || slug;
    const projectDescription = parseFrontmatterValue(parsed.frontmatter, 'description') || 'Project update';

    const events = parseProjectActivity(parsed.frontmatter);
    if (events.length > 0) {
      for (const event of events) {
        if (!event.date || !event.title) continue;
        const date = parseDateOrThrow(event.date, `project event date (${slug})`);
        if (!inWindow(date, window)) continue;
        const anchor = buildProjectEventAnchor(slug, date, event.title);
        items.push({
          kind: 'project',
          date,
          title: event.title,
          summary: event.summary || projectDescription,
          url: `/projects/${slug}/#${anchor}`,
          image: event.image || '',
          imageCaption: event.imageCaption || '',
        });
      }
      continue;
    }

    const dateRaw = parseFrontmatterValue(parsed.frontmatter, 'date');
    if (!dateRaw) continue;

    const date = parseDateOrThrow(dateRaw, `project date (${slug})`);
    if (!inWindow(date, window)) continue;

    items.push({
      kind: 'project',
      date,
      title: projectTitle,
      summary: projectDescription,
      url: `/projects/${slug}/`,
    });
  }

  return items;
}

function sortItems(items) {
  return [...items].sort((a, b) => b.date.getTime() - a.date.getTime());
}

function buildVariant(subject, window, variant, items) {
  const sorted = sortItems(dedupeItems(items));
  return {
    variant,
    count: sorted.length,
    items: sorted,
    html: renderHtml({ subject, window, items: sorted, variant }),
    text: renderText({ subject, window, items: sorted, variant }),
  };
}

export function generateNewsletterBundle({ type, dateInput, siteUrl }) {
  const window = getNewsletterWindow(type, dateInput);

  const projects = collectProjects(window);
  const notes = collectNotes(window);
  const tils = collectTils(window);
  const all = [...projects, ...notes, ...tils];

  const subject = buildSubject(window.type, window.anchorDate);
  const normalizedSiteUrl = (siteUrl || '').replace(/\/$/, '');

  const toAbsolute = (variant) => ({
    ...variant,
    items: variant.items.map((item) => ({
      ...item,
      url: normalizedSiteUrl ? `${normalizedSiteUrl}${item.url}` : item.url,
      image: item.image && normalizedSiteUrl && item.image.startsWith('/')
        ? `${normalizedSiteUrl}${item.image}`
        : item.image,
    })),
    html: normalizedSiteUrl
      ? variant.html
          .replace(/href="\/(.*?)"/g, `href="${normalizedSiteUrl}/$1"`)
          .replace(/src="\/(.*?)"/g, `src="${normalizedSiteUrl}/$1"`)
      : variant.html,
    text: normalizedSiteUrl
      ? variant.text.replace(/\n  \//g, `\n  ${normalizedSiteUrl}/`)
      : variant.text,
  });

  const projectsVariant = buildVariant(subject, window, 'projects', projects);
  const allVariant = buildVariant(subject, window, 'all', all);

  return {
    type: window.type,
    generatedAt: new Date().toISOString(),
    subject,
    window: {
      startInclusive: window.startInclusive.toISOString(),
      endExclusive: window.endExclusive.toISOString(),
      dateLabel: `${toDateOnlyUtc(window.startInclusive)}..${toDateOnlyUtc(new Date(window.endExclusive.getTime() - 1))}`,
    },
    variants: {
      all: toAbsolute(allVariant),
      projects: toAbsolute(projectsVariant),
    },
  };
}
