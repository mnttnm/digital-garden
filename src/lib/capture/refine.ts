/**
 * AI Refinement for Captures
 *
 * Transforms raw captured content into publication-ready markdown
 * using the configured AI provider.
 *
 * Philosophy: Fix, don't transform
 * - Preserve the user's voice
 * - Fix grammar and spelling
 * - Never add or remove information
 * - Keep it raw and authentic
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import { getAIModel, isAIConfigured } from './providers';
import type { Capture, RefinedCapture, DiscoveryKind } from './types';

// Schema for AI-generated refinement
const refinementSchema = z.object({
  title: z.string().describe('User\'s title/framing of this entry (< 60 chars)'),
  body: z.string().describe('Clean markdown body - preserve original meaning, only fix grammar'),
  linkTitle: z.string().optional().describe('For URLs: the actual title of the linked page/article'),
  suggestedTags: z.array(z.string()).describe('2-4 relevant topic tags'),
  suggestedKind: z.enum(['learning', 'resource']).describe('learning = user insights, resource = sharing a link/tool'),
});

type RefinementOutput = z.infer<typeof refinementSchema>;

const REFINEMENT_PROMPT = `You are helping refine a personal note. The user's authentic voice matters more than polish.

Rules:
- Fix grammar, spelling, and sentence flow
- Keep the original tone and style (casual, personal, authentic)
- Do NOT add information the user didn't provide
- Do NOT remove any information
- Do NOT make it sound corporate or professional
- Preserve the user's personality and writing quirks
- Keep it SHORT — match the original length

Content classification:
- resource: When the user is SHARING a link/URL as a reference or recommendation
  → The URL IS the content being shared
- learning: User's own insights, discoveries, tips, or reflections
  → Personal experiences and learnings

For content with a URL:
- title: User's framing/commentary (e.g., "A Billboard worthy reminder", "Great thread on AI agents")
- linkTitle: The actual page/article title from the URL (e.g., "Building AI Agents with Claude")
- body: User's comment about why they're sharing it (keep brief)

For content without a URL:
- title: Capture the essence in < 60 chars
- body: User's content with grammar fixes only

Raw capture:
{capture}

URL (if provided): {url}
User's note (if provided): {note}
Project (if specified): {project}

Return the refined version that sounds like the same person wrote it, just cleaner.`;

/**
 * Build the prompt from a capture
 */
function buildPrompt(capture: Capture): string {
  const captureNote = capture.note || '';
  const url = capture.url || 'None';
  const project = capture.projectSlug || 'None';

  return REFINEMENT_PROMPT
    .replace('{capture}', captureNote)
    .replace('{url}', url)
    .replace('{note}', captureNote)
    .replace('{project}', project);
}

/**
 * Refine a capture using AI
 */
export async function refineCapture(capture: Capture): Promise<RefinedCapture | null> {
  if (!isAIConfigured()) {
    console.warn('AI not configured, skipping refinement');
    return null;
  }

  try {
    const model = getAIModel();
    const prompt = buildPrompt(capture);

    const { object } = await generateObject({
      model,
      schema: refinementSchema,
      prompt,
    });

    return mapToRefinedCapture(object, prompt);
  } catch (error) {
    console.error('AI refinement failed:', error);
    return null;
  }
}

/**
 * Map AI output to RefinedCapture type
 */
function mapToRefinedCapture(output: RefinementOutput, promptUsed: string): RefinedCapture {
  return {
    title: output.title,
    body: output.body,
    linkTitle: output.linkTitle,
    suggestedTags: output.suggestedTags,
    suggestedKind: output.suggestedKind as DiscoveryKind,
    refinedAt: new Date().toISOString(),
    promptUsed,
  };
}

/**
 * Get a simple auto-generated title from content
 * Used as fallback when AI is not available
 */
export function generateFallbackTitle(capture: Capture): string {
  if (capture.title) {
    return capture.title;
  }

  if (capture.note) {
    // Use first sentence of note
    const firstSentence = capture.note.match(/^[^.!?]+[.!?]?/)?.[0] || capture.note;
    return truncate(firstSentence, 60);
  }

  if (capture.url) {
    // Extract domain or path
    try {
      const url = new URL(capture.url);
      return `Link: ${url.hostname}`;
    } catch {
      return 'Captured link';
    }
  }

  return 'Untitled capture';
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text.trim();
  return text.slice(0, maxLength - 1).trim() + '...';
}
