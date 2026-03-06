import type { APIRoute } from "astro";
import {
  getFeedItems,
  type FeedItem,
} from "../../lib/learning-log";

const ITEMS_PER_PAGE = 10;

function formatEntryDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getCategoryLabel(item: FeedItem) {
  if (item.bucket === 'project-updates') {
    return 'PROJECT UPDATE';
  }
  if (item.kind === 'resource') {
    return 'RESOURCE';
  }
  return 'LEARNING';
}

function getCategoryDotClass(item: FeedItem) {
  if (item.bucket === 'project-updates') {
    return 'dot-project';
  }
  if (item.kind === 'resource') {
    return 'dot-resource';
  }
  return 'dot-learning';
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function resolveHref(href: string, isExternal: boolean, base: string) {
  if (isExternal) return href;
  const normalized = href.startsWith("/") ? href.slice(1) : href;
  return `${base}${normalized}`;
}

function resolveInternalHref(href: string, base: string) {
  const normalized = href.startsWith("/") ? href.slice(1) : href;
  return `${base}${normalized}`;
}

function renderItem(item: FeedItem, index: number, base: string): string {
  const images = item.images || [];
  const tags = item.tags.slice(0, 3);

  let html = `<li class="entry-item reveal" style="--reveal-delay: ${Math.min(index * 42, 260)}ms;">
    <article class="entry-grid">
      <aside class="entry-margin">
        <time datetime="${item.date.toISOString()}">${formatEntryDate(item.date)}</time>
        <p class="entry-category">
          ${getCategoryLabel(item)}
          <span class="entry-dot ${getCategoryDotClass(item)}" aria-hidden="true"></span>
        </p>
      </aside>
      <div class="entry-main">`;

  if (item.projectTitle) {
    html += `<a class="project-label" href="${resolveInternalHref(`/projects/${item.projectSlug}/`, base)}">${escapeHtml(item.projectTitle)}</a>`;
  }

  html += `<h2 class="entry-title">
    <a href="${resolveHref(item.href, item.isExternal, base)}"${item.isExternal ? ' target="_blank" rel="noopener"' : ""}>
      ${escapeHtml(item.title)}
    </a>
  </h2>`;

  if (item.video) {
    html += `<div class="entry-video">
      <video controls preload="metadata" playsinline${item.video.poster ? ` poster="${escapeHtml(item.video.poster)}"` : ''}>
        <source src="${escapeHtml(item.video.src)}" />
      </video>
      ${item.video.caption ? `<p class="entry-video-caption">${escapeHtml(item.video.caption)}</p>` : ''}
    </div>`;
  } else if (images.length > 0) {
    html += `<div class="entry-thumbnails" data-lightbox-gallery>`;
    images.slice(0, 3).forEach((preview, i) => {
      const isLast = i === 2;
      const hasMore = isLast && images.length > 3;
      const extraCount = images.length - 3;
      html += `<div class="entry-thumbnail${hasMore ? " has-more" : ""}">
        <img src="${escapeHtml(preview.src)}" alt="${escapeHtml(preview.alt)}" loading="lazy" data-lightbox />
        ${hasMore ? `<span class="thumbnail-more">+${extraCount}</span>` : ""}
      </div>`;
    });
    images.slice(3).forEach((preview) => {
      html += `<img src="${escapeHtml(preview.src)}" alt="${escapeHtml(preview.alt)}" class="sr-only" data-lightbox />`;
    });
    html += `</div>`;
  }

  html += `<p class="entry-body">${escapeHtml(item.crux)}</p>`;

  if (item.linkPreview) {
    const isTweet = !!item.linkPreview.tweetAuthor;
    html += `<a class="link-preview${isTweet ? " link-preview-tweet" : ""}" href="${escapeHtml(item.linkPreview.url)}" target="_blank" rel="noopener" aria-label="Open ${escapeHtml(item.linkPreview.title)}">
      <div class="link-preview-main">
        ${
          isTweet
            ? `<span class="link-icon link-icon-x" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></span>`
            : `<span class="link-icon" aria-hidden="true">◌</span>`
        }
        <div class="link-copy">
          <p class="link-title">${escapeHtml(item.linkPreview.title)}</p>
          <p class="link-domain">${isTweet ? `@${escapeHtml(item.linkPreview.tweetAuthor!)}` : escapeHtml(item.linkPreview.domain)}</p>
        </div>
      </div>
      <span class="link-arrow" aria-hidden="true">↗</span>
    </a>`;
  }

  if (item.code) {
    html += `<div class="code-block">
      <div class="code-block-header">
        <span>${escapeHtml(item.code.language)}</span>
        <span>code</span>
      </div>
      <pre><code>${escapeHtml(item.code.code)}</code></pre>
    </div>`;
  }

  if (item.actionLink) {
    const actionHref = item.actionLink.isExternal
      ? item.actionLink.href
      : resolveInternalHref(item.actionLink.href, base);
    html += `<p class="entry-action">
      <a href="${escapeHtml(actionHref)}"${item.actionLink.isExternal ? ' target="_blank" rel="noopener"' : ""}>
        ${escapeHtml(item.actionLink.label)} →
      </a>
    </p>`;
  }

  if (tags.length > 0) {
    html += `<p class="entry-tags">`;
    tags.forEach((tag, i) => {
      html += `<span>#${escapeHtml(tag.toUpperCase())}${i < tags.length - 1 ? '<span class="tag-dot"> • </span>' : ""}</span>`;
    });
    html += `</p>`;
  }

  html += `<div class="entry-separator" aria-hidden="true"></div>
      </div>
    </article>
  </li>`;

  return html;
}

export const GET: APIRoute = async ({ url }) => {
  const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const validPage = Number.isFinite(page) && page > 0 ? page : 1;
  const base = import.meta.env.BASE_URL;

  const allItems = await getFeedItems();
  const start = (validPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const items = allItems.slice(start, end);
  const hasMore = allItems.length > end;

  const html = items.map((item, i) => renderItem(item, i, base)).join("");

  return new Response(
    JSON.stringify({
      html,
      hasMore,
      page: validPage,
      total: allItems.length,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};
