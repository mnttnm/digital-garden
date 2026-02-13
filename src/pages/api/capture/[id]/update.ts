/**
 * Update Capture Endpoint
 *
 * PATCH /api/capture/[id]/update
 *
 * Updates capture metadata (title, text, tags, etc.)
 */

import type { APIRoute } from 'astro';
import {
  getCapture,
  updateCapture,
  type CaptureUpdatePayload,
} from '../../../../lib/capture';

export const prerender = false;

function verifyAdmin(request: Request): boolean {
  const adminPassword = import.meta.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  return token === adminPassword;
}

export const PATCH: APIRoute = async ({ params, request }) => {
  if (!verifyAdmin(request)) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { id } = params;

  if (!id) {
    return new Response(
      JSON.stringify({ error: 'Missing capture ID' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const capture = await getCapture(id);

    if (!capture) {
      return new Response(
        JSON.stringify({ error: 'Capture not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updates = await request.json() as CaptureUpdatePayload;

    // Validate updates
    if (updates.inferredCollection &&
        !['til', 'notes'].includes(updates.inferredCollection)) {
      return new Response(
        JSON.stringify({ error: 'Invalid collection' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (updates.inferredNoteType &&
        !['link', 'thought', 'essay', 'snippet'].includes(updates.inferredNoteType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid note type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updated = await updateCapture(id, updates);

    return new Response(
      JSON.stringify({ success: true, capture: updated }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Update capture error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update capture' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Also support POST for clients that don't support PATCH
export const POST = PATCH;
