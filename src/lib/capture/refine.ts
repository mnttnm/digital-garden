/**
 * AI Refinement for Captures
 *
 * Transforms raw captured content into publication-ready markdown
 * using the configured AI provider.
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import { getAIModel, isAIConfigured } from './providers';
import type { Capture, RefinedCapture, InferredNoteType, InferredCollection } from './types';

// Schema for AI-generated refinement
const refinementSchema = z.object({
  title: z.string().describe('Concise title under 60 characters'),
  body: z.string().describe('Clean, formatted markdown body'),
  takeaway: z.string().optional().describe('One-sentence summary of the key insight'),
  suggestedTags: z.array(z.string()).describe('2-4 relevant topic tags'),
  suggestedType: z.enum(['til', 'notes', 'project-update']).describe('Which collection this belongs to'),
  suggestedNoteType: z.enum(['link', 'thought', 'essay', 'snippet', 'project-update']).optional()
    .describe('For notes collection, the type of note'),
});

type RefinementOutput = z.infer<typeof refinementSchema>;

const REFINEMENT_PROMPT = `You are a content editor for a developer's personal site. Given raw captured content, produce publication-ready markdown.

Rules:
- Fix grammar and spelling without changing voice
- Add markdown formatting (headers, lists, code blocks) where appropriate
- Generate a concise title (under 60 chars)
- Write a one-sentence takeaway/summary
- Suggest 2-4 relevant tags (lowercase, hyphenated)
- Preserve technical accuracy - don't simplify jargon
- Keep the author's personality and tone

Content classification:
- TIL: Short learnings, quick tips, code snippets (< 300 words)
- Notes (link): Content that's primarily about a URL/resource
- Notes (thought): Reflections, opinions, observations
- Notes (essay): Longer, structured pieces
- Notes (snippet): Code-focused content with explanations
- Project Update: Progress updates, milestones, or discoveries about a specific project

Raw capture:
{capture}

URL (if provided): {url}
User's comment (if provided): {comment}
Project (if specified): {project}`;

/**
 * Build the prompt from a capture
 */
function buildPrompt(capture: Capture): string {
  const captureText = capture.text || '';
  const url = capture.url || 'None';
  const comment = capture.comment || 'None';
  const project = capture.project || 'None';

  return REFINEMENT_PROMPT
    .replace('{capture}', captureText)
    .replace('{url}', url)
    .replace('{comment}', comment)
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

    return mapToRefinedCapture(object);
  } catch (error) {
    console.error('AI refinement failed:', error);
    return null;
  }
}

/**
 * Map AI output to RefinedCapture type
 */
function mapToRefinedCapture(output: RefinementOutput): RefinedCapture {
  return {
    title: output.title,
    body: output.body,
    takeaway: output.takeaway,
    suggestedTags: output.suggestedTags,
    suggestedType: output.suggestedType as InferredCollection,
    suggestedNoteType: output.suggestedNoteType as InferredNoteType | undefined,
    refinedAt: new Date().toISOString(),
  };
}

/**
 * Get a simple auto-generated title from content
 * Used as fallback when AI is not available
 */
export function generateFallbackTitle(capture: Capture): string {
  if (capture.comment) {
    // Use first sentence of comment
    const firstSentence = capture.comment.match(/^[^.!?]+[.!?]?/)?.[0] || capture.comment;
    return truncate(firstSentence, 60);
  }

  if (capture.text) {
    // Use first sentence of text
    const firstSentence = capture.text.match(/^[^.!?]+[.!?]?/)?.[0] || capture.text;
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
