/**
 * Capture Ingest Endpoint
 *
 * POST /api/capture/ingest
 *
 * Main entry point for all capture clients (Raycast, iOS Shortcut, Slack).
 * Validates input, infers content kind, and stores in Redis.
 */

import type { APIRoute } from 'astro';
import {
  createCapture,
  type CaptureIngestPayload,
  type CaptureSource,
  type DiscoveryKind,
  type ActivityType,
} from '../../../lib/capture';

export const prerender = false;

/**
 * Verify the API key from request headers
 */
function verifyApiKey(request: Request): boolean {
  const authHeader = request.headers.get('Authorization');
  const apiKey = process.env.CAPTURE_API_KEY;

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
 * Infer the kind of content
 */
function inferKind(payload: CaptureIngestPayload): DiscoveryKind {
  // URL-based content is typically a resource
  if (payload.url) {
    return 'resource';
  }

  // Everything else is a learning
  return 'learning';
}

/**
 * Validate the source value
 */
function isValidSource(source: string): source is CaptureSource {
  return ['raycast', 'shortcut', 'slack', 'api'].includes(source);
}

/**
 * Validate the activity type value
 */
function isValidActivityType(type: string): type is ActivityType {
  return ['update', 'milestone', 'fix', 'learning', 'discovery', 'experiment'].includes(type);
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
    const hasImages = payload.images && payload.images.length > 0;
    if (!payload.url && !payload.note && !hasImages) {
      return new Response(
        JSON.stringify({ error: 'Must provide url, note, or images' }),
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

    // Infer kind
    const kind = inferKind(payload);

    // Validate activity type if provided
    const activityType = payload.activityType && isValidActivityType(payload.activityType)
      ? payload.activityType
      : undefined;

    // Build images array from payload
    const images = payload.images?.map(img => ({
      src: '',
      data: img.data,
      alt: img.alt,
      caption: img.caption,
    }));

    // Build videos array from payload
    const videos = payload.videos?.map(vid => ({
      src: '',
      data: vid.data,
      poster: vid.poster,
      caption: vid.caption,
    }));

    // Create the capture
    const capture = await createCapture({
      source: payload.source,
      url: payload.url,
      note: payload.note,
      images,
      videos,
      tags: payload.tags,
      projectSlug: payload.project,
      kind,
      activityType,
      code: payload.code,
      codeLanguage: payload.codeLanguage,
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
