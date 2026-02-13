/**
 * Capture Ingest Endpoint
 *
 * POST /api/capture/ingest
 *
 * Main entry point for all capture clients (Raycast, iOS Shortcut, Slack).
 * Validates input, infers content type, and stores in Redis.
 */

import type { APIRoute } from 'astro';
import {
  createCapture,
  type CaptureIngestPayload,
  type CaptureSource,
  type CaptureType,
  type InferredCollection,
  type InferredNoteType,
} from '../../../lib/capture';

export const prerender = false;

/**
 * Verify the API key from request headers
 */
function verifyApiKey(request: Request): boolean {
  const authHeader = request.headers.get('Authorization');
  const apiKey = import.meta.env.CAPTURE_API_KEY;

  if (!apiKey) {
    console.error('CAPTURE_API_KEY not configured');
    return false;
  }

  if (!authHeader) {
    return false;
  }

  // Support both "Bearer {key}" and just "{key}"
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  return token === apiKey;
}

/**
 * Detect the content type from the payload
 */
function detectContentType(payload: CaptureIngestPayload): CaptureType {
  const hasUrl = Boolean(payload.url);
  const hasText = Boolean(payload.text);
  const hasImage = Boolean(payload.imageBase64);

  if (hasImage && (hasUrl || hasText)) return 'mixed';
  if (hasImage) return 'image';
  if (hasUrl && hasText) return 'mixed';
  if (hasUrl) return 'url';
  return 'text';
}

/**
 * Infer which collection this content belongs to
 */
function inferCollection(payload: CaptureIngestPayload): InferredCollection {
  // If project is specified, it's a project update
  if (payload.project) {
    return 'project-update';
  }

  const textLength = (payload.text?.length || 0) + (payload.comment?.length || 0);

  // Short text = TIL
  if (textLength > 0 && textLength < 500 && !payload.url) {
    return 'til';
  }

  // URL with minimal text = likely a link note
  if (payload.url && textLength < 200) {
    return 'notes';
  }

  // Longer content = notes
  return 'notes';
}

/**
 * Infer the note type for notes collection
 */
function inferNoteType(payload: CaptureIngestPayload): InferredNoteType | undefined {
  // Project updates get their own type
  if (payload.project) {
    return 'project-update';
  }

  if (payload.url) {
    return 'link';
  }

  const textLength = (payload.text?.length || 0) + (payload.comment?.length || 0);

  if (textLength < 300) {
    return 'thought';
  }

  // Check if text contains code blocks
  if (payload.text?.includes('```')) {
    return 'snippet';
  }

  return 'thought';
}

/**
 * Validate the source value
 */
function isValidSource(source: string): source is CaptureSource {
  return ['raycast', 'shortcut', 'slack', 'api'].includes(source);
}

export const POST: APIRoute = async ({ request }) => {
  // Verify API key
  if (!verifyApiKey(request)) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const payload = await request.json() as CaptureIngestPayload;

    // Validate source
    if (!payload.source || !isValidSource(payload.source)) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing source' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate that we have some content
    if (!payload.url && !payload.text && !payload.imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Must provide url, text, or image' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL format if provided
    if (payload.url) {
      try {
        new URL(payload.url);
      } catch {
        return new Response(
          JSON.stringify({ error: 'Invalid URL format' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Detect content type and infer collection
    const type = detectContentType(payload);
    const inferredCollection = inferCollection(payload);
    const inferredNoteType = inferCollection(payload) === 'notes'
      ? inferNoteType(payload)
      : undefined;

    // Handle image upload (store base64 for now, could upload to CDN later)
    const images = payload.imageBase64
      ? [{ url: '', data: payload.imageBase64 }]
      : undefined;

    // Create the capture
    const capture = await createCapture({
      source: payload.source,
      type,
      url: payload.url,
      text: payload.text,
      comment: payload.comment,
      images,
      tags: payload.tags,
      project: payload.project,
      inferredCollection,
      inferredNoteType,
    });

    return new Response(
      JSON.stringify({
        id: capture.id,
        status: capture.status,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Capture ingest error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process capture' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
