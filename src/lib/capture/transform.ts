/**
 * Transform Capture to MDX
 *
 * Converts approved captures into MDX content files
 * ready to be committed to the repository.
 */

import type {
  Capture,
  TransformResult,
  ProjectActivityTransformResult,
  DiscoveryFrontmatter,
  ProjectActivityEntry,
} from './types';
import { generateFallbackTitle } from './refine';

export { formatDate, slugify };

/**
 * Slugify a string for use in filenames
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'untitled';
}

/**
 * Format date for frontmatter (YYYY-MM-DD)
 */
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Check if a string value needs YAML quoting
 */
function needsQuoting(value: string): boolean {
  if (value.length === 0) return true;
  if (/[:\[\]{}#&*!|>'"%@`\n\r]/.test(value)) return true;
  if (/^[-?]/.test(value)) return true;
  if (/^(true|false|null|yes|no|on|off|\d+\.?\d*|\.inf|\.nan)$/i.test(value)) return true;
  return false;
}

/**
 * Serialize a value for YAML
 */
function serializeValue(value: unknown, indent = 0): string {
  const prefix = '  '.repeat(indent);

  if (value === undefined || value === null) {
    return '';
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }

    // Check if it's an array of objects
    if (typeof value[0] === 'object' && value[0] !== null) {
      const items = value.map((item) => {
        const entries = Object.entries(item as Record<string, unknown>);
        const lines: string[] = [];
        let first = true;
        for (const [k, v] of entries) {
          if (v === undefined || v === null) continue;
          const itemPrefix = first ? `${prefix}  - ` : `${prefix}    `;
          first = false;
          if (typeof v === 'string' && needsQuoting(v)) {
            lines.push(`${itemPrefix}${k}: "${v.replace(/"/g, '\\"')}"`);
          } else {
            lines.push(`${itemPrefix}${k}: ${v}`);
          }
        }
        return lines.join('\n');
      });
      return '\n' + items.join('\n');
    }

    // Array of primitives
    const items = value.map((item) => {
      const str = String(item);
      if (needsQuoting(str)) {
        return `${prefix}  - "${str.replace(/"/g, '\\"')}"`;
      }
      return `${prefix}  - ${str}`;
    });
    return '\n' + items.join('\n');
  }

  if (typeof value === 'boolean') {
    return String(value);
  }

  if (typeof value === 'string') {
    if (needsQuoting(value)) {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return value;
  }

  return String(value);
}

/**
 * Serialize frontmatter to YAML
 */
function serializeFrontmatter(fm: Record<string, unknown>): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(fm)) {
    if (value === undefined || value === null) continue;

    const serialized = serializeValue(value);
    if (serialized.startsWith('\n')) {
      lines.push(`${key}:${serialized}`);
    } else {
      lines.push(`${key}: ${serialized}`);
    }
  }

  return lines.join('\n');
}

/**
 * Get the title from refined content, saved title, or generate a fallback
 */
function getTitle(capture: Capture, useRefined: boolean): string {
  if (useRefined && capture.refined?.title) {
    return capture.refined.title;
  }
  if (capture.title) {
    return capture.title;
  }
  return generateFallbackTitle(capture);
}

/**
 * Get the body content from refined or raw capture
 */
function getBody(capture: Capture, useRefined: boolean): string {
  if (useRefined && capture.refined?.body) {
    return capture.refined.body;
  }

  // Build body from raw content (note field renamed from text)
  return capture.note || '';
}

/**
 * Get tags from refined content or capture
 */
function getTags(capture: Capture, useRefined: boolean): string[] {
  if (useRefined && capture.refined?.suggestedTags?.length) {
    return capture.refined.suggestedTags;
  }
  return capture.tags || [];
}

/**
 * Get kind from refined content or capture
 */
function getKind(capture: Capture, useRefined: boolean): 'learning' | 'resource' {
  if (useRefined && capture.refined?.suggestedKind) {
    return capture.refined.suggestedKind;
  }
  return capture.kind;
}

/**
 * Transform a capture to Discovery format
 */
function transformToDiscovery(capture: Capture, useRefined: boolean): TransformResult {
  const date = formatDate(capture.createdAt);
  const title = getTitle(capture, useRefined);
  const body = getBody(capture, useRefined);
  const tags = getTags(capture, useRefined);
  const kind = getKind(capture, useRefined);

  // Build images array from capture
  const images = (capture.images || []).map((img) => ({
    src: img.src,
    alt: img.alt,
    caption: img.caption,
  }));

  // Build videos array from capture
  const videos = (capture.videos || []).map((vid) => ({
    src: vid.src,
    poster: vid.poster,
    caption: vid.caption,
  }));

  const frontmatter: DiscoveryFrontmatter = {
    title,
    date,
    kind,
    tags,
    images,
    videos,
    prompts: capture.prompts || [],
    draft: false,
  };

  // Add URL for link-based content
  if (capture.url) {
    frontmatter.url = capture.url;
    // Use refined linkTitle (actual page title) if available
    if (useRefined && capture.refined?.linkTitle) {
      frontmatter.linkTitle = capture.refined.linkTitle;
    }
  }

  // Add code fields if present
  if (capture.code) {
    frontmatter.code = capture.code;
    frontmatter.codeLanguage = capture.codeLanguage;
  }

  const filename = `${date}-${slugify(title)}.md`;
  const fullContent = `---\n${serializeFrontmatter(frontmatter as unknown as Record<string, unknown>)}\n---\n\n${body}\n`;

  return {
    collection: 'discoveries',
    filename,
    frontmatter,
    body,
    fullContent,
  };
}

/**
 * Transform a capture to Project Activity format
 */
function transformToProjectActivity(
  capture: Capture,
  useRefined: boolean
): ProjectActivityTransformResult {
  const date = formatDate(capture.createdAt);
  const title = getTitle(capture, useRefined);
  const summary = getBody(capture, useRefined);
  const tags = getTags(capture, useRefined);

  // Get image data if present (for uploading)
  const imageData = capture.images?.[0]?.data;

  // Build images array
  const images = (capture.images || [])
    .filter((img) => img.src)
    .map((img) => ({
      src: img.src,
      alt: img.alt,
      caption: img.caption,
    }));

  // Build videos array
  const videos = (capture.videos || [])
    .filter((vid) => vid.src)
    .map((vid) => ({
      src: vid.src,
      poster: vid.poster,
      caption: vid.caption,
    }));

  const activity: ProjectActivityEntry = {
    date,
    title,
    summary,
    tags,
    activityType: capture.activityType || 'update',
    images,
    videos,
    prompts: capture.prompts || [],
  };

  // Add optional fields
  if (capture.code) {
    activity.code = capture.code;
    activity.codeLanguage = capture.codeLanguage;
  }

  if (capture.url) {
    activity.url = capture.url;
  }

  return {
    collection: 'project-update',
    projectSlug: capture.projectSlug!,
    activity,
    imageData,
  };
}

/**
 * Check if a capture should be transformed as a project activity
 */
export function isProjectUpdate(capture: Capture): boolean {
  return Boolean(capture.projectSlug);
}

/**
 * Transform a capture into MDX content
 *
 * @param capture The capture to transform
 * @param useRefined Whether to use AI-refined content (default: true if available)
 */
export function transformCapture(
  capture: Capture,
  useRefined = true
): TransformResult | ProjectActivityTransformResult {
  // Route project updates to project activity transform
  if (capture.projectSlug) {
    return transformToProjectActivity(capture, useRefined);
  }

  // All non-project content goes to discoveries
  return transformToDiscovery(capture, useRefined);
}

/**
 * Get the file path for a transformed capture
 */
export function getContentPath(result: TransformResult): string {
  return `src/content/${result.collection}/${result.filename}`;
}
