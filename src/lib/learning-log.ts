import { getCollection, type CollectionEntry } from 'astro:content';

type NoteType = CollectionEntry<'notes'>['data']['type'];
type ProjectActivity = CollectionEntry<'projects'>['data']['activity'][number];

export type LearningLogBucket = 'project-updates' | 'what-i-discovered';
export type LearningLogSourceType = NoteType | ProjectActivity['type'];
export type LearningLogCategory = 'projects' | 'learnings' | 'resources' | 'thoughts';

export interface LearningLogLinkPreview {
  title: string;
  url: string;
  domain: string;
}

export interface LearningLogCodePreview {
  language: string;
  code: string;
}

export interface LearningLogImagePreview {
  src: string;
  alt: string;
  caption?: string;
}

export interface LearningLogActionLink {
  label: string;
  href: string;
  isExternal: boolean;
}

export interface LearningLogItem {
  id: string;
  bucket: LearningLogBucket;
  category: LearningLogCategory;
  date: Date;
  title: string;
  crux: string;
  href: string;
  projectSlug?: string;
  projectTitle?: string;
  tags: string[];
  sourceType: LearningLogSourceType;
  isExternal: boolean;
  linkPreview?: LearningLogLinkPreview;
  codePreview?: LearningLogCodePreview;
  imagePreview?: LearningLogImagePreview;
  actionLink?: LearningLogActionLink;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

function formatDateToken(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

export function getProjectEventAnchor(
  projectSlug: string,
  eventDate: Date,
  eventTitle: string
): string {
  return `event-${slugify(projectSlug)}-${formatDateToken(eventDate)}-${slugify(eventTitle)}`;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s*/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstSentenceOrExcerpt(markdown: string): string {
  const clean = stripMarkdown(markdown);
  if (!clean) return '';

  const sentenceMatch = clean.match(/[^.!?]+[.!?]/);
  if (sentenceMatch?.[0]) {
    return truncate(sentenceMatch[0].trim(), 180);
  }

  return truncate(clean, 180);
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function getCodePreview(markdown: string): LearningLogCodePreview | undefined {
  const match = markdown.match(/```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/);
  if (!match?.[2]) return undefined;

  return {
    language: (match[1] || 'text').toLowerCase(),
    code: truncate(match[2].trim(), 320),
  };
}

function getNoteCategory(type: NoteType): LearningLogCategory {
  if (type === 'link') return 'resources';
  if (type === 'thought') return 'thoughts';
  return 'learnings';
}

export async function getLearningLogItems(): Promise<LearningLogItem[]> {
  const [notes, projects] = await Promise.all([
    getCollection('notes', ({ data }) => !data.draft),
    getCollection('projects', ({ data }) => !data.draft),
  ]);

  const noteItems: LearningLogItem[] = notes.map((note) => {
    const isExternal = note.data.type === 'link' && Boolean(note.data.link);
    const href = isExternal ? note.data.link! : `/notes/${note.slug}/`;
    const crux = note.data.takeaway?.trim() || firstSentenceOrExcerpt(note.body) || note.data.title;
    const linkPreview = note.data.type === 'link' && note.data.link
      ? {
          title: note.data.linkTitle || note.data.title,
          url: note.data.link,
          domain: getDomain(note.data.link),
        }
      : undefined;
    const codePreview = note.data.type === 'snippet' ? getCodePreview(note.body) : undefined;

    return {
      id: `note-${note.slug}`,
      bucket: 'what-i-discovered',
      category: getNoteCategory(note.data.type),
      date: note.data.date,
      title: note.data.title,
      crux,
      href,
      tags: note.data.tags ?? [],
      sourceType: note.data.type,
      isExternal,
      linkPreview,
      codePreview,
    };
  });

  const projectItems: LearningLogItem[] = projects.flatMap((project) =>
    project.data.activity.map((event) => {
      const anchor = getProjectEventAnchor(project.slug, event.date, event.title);
      const eventTags = event.tags ?? [];
      const actionHref = event.actionUrl;
      const actionIsExternal = actionHref ? /^https?:\/\//i.test(actionHref) : false;

      return {
        id: `project-${project.slug}-${anchor}`,
        bucket: 'project-updates' as const,
        category: 'projects' as const,
        date: event.date,
        title: event.title,
        crux: event.summary,
        href: `/projects/${project.slug}/#${anchor}`,
        projectSlug: project.slug,
        projectTitle: project.data.title,
        tags: eventTags.length > 0 ? eventTags : (project.data.tags ?? []),
        sourceType: event.type,
        isExternal: false,
        linkPreview: !event.image && event.links[0]
          ? {
              title: event.links[0].label,
              url: event.links[0].url,
              domain: getDomain(event.links[0].url),
            }
          : undefined,
        codePreview: event.code
          ? {
              language: (event.codeLanguage || 'text').toLowerCase(),
              code: truncate(event.code.trim(), 320),
            }
          : undefined,
        imagePreview: event.image
          ? {
              src: event.image,
              alt: event.imageAlt || event.title,
              caption: event.imageCaption,
            }
          : undefined,
        actionLink: actionHref && event.actionLabel
          ? {
              label: event.actionLabel,
              href: actionHref,
              isExternal: actionIsExternal,
            }
          : undefined,
      };
    })
  );

  return [...projectItems, ...noteItems].sort((a, b) => b.date.valueOf() - a.date.valueOf());
}
