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
  body: z.string().describe('Clean markdown body - preserve original meaning, only fix grammar'),
  takeaway: z.string().optional().describe('One-sentence summary of the key insight'),
  description: z.string().optional().describe('For resources: 1-2 sentence description of what this resource is'),
  suggestedTags: z.array(z.string()).describe('2-4 relevant topic tags'),
  suggestedType: z.enum(['til', 'notes', 'resources', 'project-update']).describe('Which collection this belongs to'),
  suggestedNoteType: z.enum(['link', 'thought', 'essay', 'snippet']).optional()
    .describe('For notes collection, the type of note'),
  suggestedResourceType: z.enum(['blog', 'newsletter', 'twitter', 'youtube', 'community', 'podcast', 'tool']).optional()
    .describe('For resources collection, the type of resource'),
});

type RefinementOutput = z.infer<typeof refinementSchema>;

const REFINEMENT_PROMPT = `You are a minimal content editor. Your job is to PRESERVE the user's original message while only fixing grammar and spelling.

CRITICAL RULES:
- DO NOT add information the user didn't provide
- DO NOT remove information the user provided
- DO NOT change the meaning or tone
- DO NOT over-format with headers/lists unless the original clearly needs it
- DO NOT editorialize or add your own commentary
- ONLY fix grammar, spelling, and basic punctuation
- Keep the body SHORT - match the length of the original content

Content classification (pick the MOST appropriate):
- Resources: When user is SHARING a link/URL as a reference (twitter, blog, newsletter, youtube, podcast, tool, community)
  → Use this when the URL IS the content being shared
  → suggestedResourceType: twitter (for x.com/twitter.com), youtube (for youtube.com), blog, newsletter, podcast, tool, community
- TIL: Short learnings or tips the user discovered (< 200 words, no URL focus)
- Notes (link): URL + substantial user commentary/analysis about it
- Notes (thought): Personal reflections, opinions (no URL)
- Notes (essay): Longer structured pieces (> 300 words)
- Notes (snippet): Code-focused content
- Project Update: ONLY if a project is explicitly specified

For Resources:
- title: Name of the resource/author (e.g., "Simon Willison's Blog", "Pieter Levels on X")
- description: 1-2 sentences about what this resource offers
- body: User's comment about why they're sharing it (keep brief)

For Notes/TIL:
- title: Capture the essence in < 60 chars
- body: User's content with grammar fixes only
- takeaway: One sentence key insight

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
    description: output.description,
    suggestedTags: output.suggestedTags,
    suggestedType: output.suggestedType as InferredCollection,
    suggestedNoteType: output.suggestedNoteType as InferredNoteType | undefined,
    suggestedResourceType: output.suggestedResourceType as RefinedCapture['suggestedResourceType'],
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
