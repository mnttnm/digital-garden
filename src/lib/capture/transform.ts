/**
 * Transform Capture to MDX
 *
 * Converts approved captures into MDX content files
 * ready to be committed to the repository.
 */

import type {
  Capture,
  TransformResult,
  TilFrontmatter,
  NoteFrontmatter,
  InferredNoteType,
} from './types';
import { generateFallbackTitle } from './refine';

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
 * Serialize frontmatter to YAML
 */
function serializeFrontmatter(fm: Record<string, unknown>): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(fm)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${key}: []`);
      } else {
        lines.push(`${key}:`);
        value.forEach((item) => lines.push(`  - "${item}"`));
      }
    } else if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else if (typeof value === 'string') {
      // Quote strings that might have special characters
      if (value.includes(':') || value.includes('"') || value.includes('\n')) {
        lines.push(`${key}: "${value.replace(/"/g, '\\"')}"`);
      } else {
        lines.push(`${key}: "${value}"`);
      }
    } else {
      lines.push(`${key}: ${value}`);
    }
  }

  return lines.join('\n');
}

/**
 * Get the title from refined content or generate a fallback
 */
function getTitle(capture: Capture, useRefined: boolean): string {
  if (useRefined && capture.refined?.title) {
    return capture.refined.title;
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

  // Build body from raw content
  const parts: string[] = [];

  if (capture.comment) {
    parts.push(capture.comment);
  }

  if (capture.text && capture.text !== capture.comment) {
    parts.push(capture.text);
  }

  return parts.join('\n\n') || '';
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
 * Determine the note type for notes collection
 */
function getNoteType(capture: Capture, useRefined: boolean): InferredNoteType {
  if (useRefined && capture.refined?.suggestedNoteType) {
    return capture.refined.suggestedNoteType;
  }

  if (capture.inferredNoteType) {
    return capture.inferredNoteType;
  }

  // Infer from content
  if (capture.url && (!capture.text || capture.text.length < 200)) {
    return 'link';
  }

  const textLength = (capture.text?.length || 0) + (capture.comment?.length || 0);

  if (textLength < 300) {
    return 'thought';
  }

  return 'essay';
}

/**
 * Transform a capture to TIL format
 */
function transformToTil(capture: Capture, useRefined: boolean): TransformResult {
  const date = formatDate(capture.createdAt);
  const title = getTitle(capture, useRefined);
  const body = getBody(capture, useRefined);
  const tags = getTags(capture, useRefined);

  const frontmatter: TilFrontmatter = {
    title,
    date,
    tags,
    draft: false,
  };

  const filename = `${date}-${slugify(title)}.md`;
  const fullContent = `---\n${serializeFrontmatter(frontmatter as unknown as Record<string, unknown>)}\n---\n\n${body}\n`;

  return {
    collection: 'til',
    filename,
    frontmatter,
    body,
    fullContent,
  };
}

/**
 * Transform a capture to Notes format
 */
function transformToNote(capture: Capture, useRefined: boolean): TransformResult {
  const date = formatDate(capture.createdAt);
  const title = getTitle(capture, useRefined);
  const body = getBody(capture, useRefined);
  const tags = getTags(capture, useRefined);
  const noteType = getNoteType(capture, useRefined);
  const takeaway = useRefined ? capture.refined?.takeaway : undefined;

  const frontmatter: NoteFrontmatter = {
    title,
    date,
    tags,
    type: noteType,
    featured: false,
    draft: false,
  };

  // Add link fields for link-type notes
  if (noteType === 'link' && capture.url) {
    frontmatter.link = capture.url;
    frontmatter.linkTitle = title;
  }

  // Add takeaway if available
  if (takeaway) {
    frontmatter.takeaway = takeaway;
  }

  const filename = `${date}-${slugify(title)}.md`;
  const fullContent = `---\n${serializeFrontmatter(frontmatter as unknown as Record<string, unknown>)}\n---\n\n${body}\n`;

  return {
    collection: 'notes',
    filename,
    frontmatter,
    body,
    fullContent,
  };
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
): TransformResult {
  // Use refined suggestion if available, otherwise use inferred collection
  const collection = useRefined && capture.refined?.suggestedType
    ? capture.refined.suggestedType
    : capture.inferredCollection;

  if (collection === 'til') {
    return transformToTil(capture, useRefined);
  }

  return transformToNote(capture, useRefined);
}

/**
 * Get the file path for a transformed capture
 */
export function getContentPath(result: TransformResult): string {
  return `src/content/${result.collection}/${result.filename}`;
}
