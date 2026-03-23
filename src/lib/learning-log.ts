import { getCollection, type CollectionEntry } from 'astro:content';

type DiscoveryKind = CollectionEntry<'discoveries'>['data']['kind'];
type ProjectActivity = CollectionEntry<'projects'>['data']['activity'][number];

export type FeedBucket = 'project-updates' | 'discoveries';
export type FeedSourceType = DiscoveryKind | ProjectActivity['activityType'];

export interface FeedLinkPreview {
  title: string;
  url: string;
  domain: string;
  tweetAuthor?: string;
}

export interface FeedCodePreview {
  language: string;
  code: string;
}

export interface FeedImagePreview {
  src: string;
  alt: string;
  caption?: string;
}

export interface FeedVideoPreview {
  src: string;
  poster?: string;
  title?: string;
  caption?: string;
}

export interface FeedActionLink {
  label: string;
  href: string;
  isExternal: boolean;
}

export interface FeedItem {
  id: string;
  bucket: FeedBucket;
  date: Date;
  title: string;
  crux: string;
  href: string;
  isExternal: boolean;

  // Context
  kind?: DiscoveryKind;
  projectSlug?: string;
  projectTitle?: string;
  activityType?: ProjectActivity['activityType'];

  // Media previews
  images?: FeedImagePreview[];
  video?: FeedVideoPreview;
  code?: FeedCodePreview;

  // Link preview (for entries with url)
  linkPreview?: FeedLinkPreview;

  // Action link (for project updates)
  actionLink?: FeedActionLink;

  tags: string[];
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

function firstSentenceOrExcerpt(markdown: string, maxLength = 180): string {
  const clean = stripMarkdown(markdown);
  if (!clean) return '';

  const sentences = clean.match(/[^.!?]+[.!?]+/g);
  if (!sentences) return truncate(clean, maxLength);

  let result = '';
  for (const sentence of sentences) {
    const candidate = result ? `${result} ${sentence.trim()}` : sentence.trim();
    if (candidate.length > maxLength) break;
    result = candidate;
  }

  if (!result) return truncate(sentences[0].trim(), maxLength);

  const hasMore = result.length < clean.trim().length;
  return hasMore ? `${result} …` : result;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function getTweetAuthor(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host !== 'twitter.com' && host !== 'x.com') return undefined;

    const match = parsed.pathname.match(/^\/([^/]+)\/status\/(\d+)/);
    if (!match) return undefined;

    return match[1];
  } catch {
    return undefined;
  }
}

function getCodePreview(code: string | undefined, language: string | undefined): FeedCodePreview | undefined {
  if (!code) return undefined;

  return {
    language: (language || 'text').toLowerCase(),
    code: truncate(code.trim(), 320),
  };
}

function getCodePreviewFromMarkdown(markdown: string): FeedCodePreview | undefined {
  const match = markdown.match(/```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/);
  if (!match?.[2]) return undefined;

  return {
    language: (match[1] || 'text').toLowerCase(),
    code: truncate(match[2].trim(), 320),
  };
}

function getImagePreviews(images: Array<{ src: string; alt?: string; caption?: string }>): FeedImagePreview[] {
  return images
    .filter((img) => Boolean(img.src))
    .map((img) => ({
      src: img.src,
      alt: img.alt || 'Image',
      caption: img.caption,
    }));
}

function getImagePreviewsFromMarkdown(markdown: string): FeedImagePreview[] {
  const matches = Array.from(markdown.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g));
  if (matches.length === 0) return [];

  return matches
    .map((match) => ({
      src: match[2],
      alt: match[1] || 'Image',
    }))
    .filter((image) => Boolean(image.src));
}

function getVideoPreview(videos: Array<{ src: string; poster?: string; caption?: string; title?: string }>): FeedVideoPreview | undefined {
  const video = videos.find((v) => Boolean(v.src));
  if (!video) return undefined;

  return {
    src: video.src,
    poster: video.poster,
    title: video.title,
    caption: video.caption,
  };
}

function getProjectEventImagePreviews(event: ProjectActivity): FeedImagePreview[] {
  // First check for images array
  const galleryPreviews = event.images
    .filter((image) => Boolean(image.src))
    .map((image) => ({
      src: image.src,
      alt: image.alt || event.imageAlt || event.title,
      caption: image.caption || event.imageCaption,
    }));

  if (galleryPreviews.length > 0) return galleryPreviews;

  // Fall back to legacy single image field
  if (event.image) {
    return [{
      src: event.image,
      alt: event.imageAlt || event.title,
      caption: event.imageCaption,
    }];
  }

  // Fall back to video posters
  const videoPosterPreviews = event.videos
    .filter((video) => Boolean(video.poster))
    .map((video) => ({
      src: video.poster!,
      alt: video.title || event.title,
      caption: video.caption,
    }));

  return videoPosterPreviews;
}

function getProjectEventVideoPreview(event: ProjectActivity): FeedVideoPreview | undefined {
  const video = event.videos.find((v) => Boolean(v.src));
  if (!video) return undefined;

  return {
    src: video.src,
    poster: video.poster,
    title: video.title || event.title,
    caption: video.caption,
  };
}

export async function getFeedItems(): Promise<FeedItem[]> {
  const [discoveries, projects] = await Promise.all([
    getCollection('discoveries', ({ data }) => !data.draft),
    getCollection('projects', ({ data }) => !data.draft),
  ]);

  const discoveryItems: FeedItem[] = discoveries.map((discovery) => {
    const href = `/discoveries/${discovery.slug}/`;
    const crux = firstSentenceOrExcerpt(discovery.body) || discovery.data.title;

    // Build link preview if URL is present
    const linkPreview = discovery.data.url
      ? {
          title: discovery.data.linkTitle || discovery.data.title,
          url: discovery.data.url,
          domain: getDomain(discovery.data.url),
          tweetAuthor: getTweetAuthor(discovery.data.url),
        }
      : undefined;

    // Build code preview from frontmatter or body
    const codePreview = discovery.data.code
      ? getCodePreview(discovery.data.code, discovery.data.codeLanguage)
      : getCodePreviewFromMarkdown(discovery.body);

    // Build image previews from frontmatter or body
    const frontmatterImages = getImagePreviews(discovery.data.images);
    const bodyImages = getImagePreviewsFromMarkdown(discovery.body);
    const images = frontmatterImages.length > 0 ? frontmatterImages : bodyImages;

    // Build video preview from frontmatter
    const video = getVideoPreview(discovery.data.videos);

    return {
      id: `discovery-${discovery.slug}`,
      bucket: 'discoveries' as const,
      date: discovery.data.date,
      title: discovery.data.title,
      crux,
      href,
      isExternal: false,
      kind: discovery.data.kind,
      tags: discovery.data.tags ?? [],
      linkPreview,
      code: codePreview,
      images: images.length > 0 ? images : undefined,
      video,
    };
  });

  const projectItems: FeedItem[] = projects.flatMap((project) =>
    project.data.activity.map((event) => {
      const anchor = getProjectEventAnchor(project.slug, event.date, event.title);
      const eventTags = event.tags ?? [];
      const imagePreviews = getProjectEventImagePreviews(event);
      const videoPreview = getProjectEventVideoPreview(event);
      const hasVisualMedia = imagePreviews.length > 0 || videoPreview;

      // Build link preview from links array or url field
      let linkPreview: FeedLinkPreview | undefined;
      if (!hasVisualMedia) {
        if (event.url) {
          linkPreview = {
            title: event.title,
            url: event.url,
            domain: getDomain(event.url),
          };
        } else if (event.links && event.links[0]) {
          linkPreview = {
            title: event.links[0].label,
            url: event.links[0].url,
            domain: getDomain(event.links[0].url),
          };
        }
      }

      // Build action link if present
      const actionLink = event.actionUrl && event.actionLabel
        ? {
            label: event.actionLabel,
            href: event.actionUrl,
            isExternal: /^https?:\/\//i.test(event.actionUrl),
          }
        : undefined;

      return {
        id: `project-${project.slug}-${anchor}`,
        bucket: 'project-updates' as const,
        date: event.date,
        title: event.title,
        crux: event.summary,
        href: `/projects/${project.slug}/#${anchor}`,
        isExternal: false,
        projectSlug: project.slug,
        projectTitle: project.data.title,
        activityType: event.activityType,
        tags: eventTags.length > 0 ? eventTags : (project.data.tags ?? []),
        linkPreview,
        code: event.code
          ? getCodePreview(event.code, event.codeLanguage)
          : undefined,
        images: imagePreviews.length > 0 ? imagePreviews : undefined,
        video: videoPreview,
        actionLink,
      };
    })
  );

  return [...projectItems, ...discoveryItems].sort((a, b) => b.date.valueOf() - a.date.valueOf());
}

// Legacy export for backward compatibility during transition
export type LearningLogItem = FeedItem;
export type LearningLogBucket = FeedBucket;
export const getLearningLogItems = getFeedItems;
