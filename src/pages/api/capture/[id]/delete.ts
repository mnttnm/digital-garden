/**
 * Delete Capture Endpoint
 *
 * DELETE /api/capture/[id]/delete
 *
 * Permanently removes a capture from Redis.
 * Only allows deletion of rejected or pending captures.
 */

import type { APIRoute } from 'astro';
import { getCapture, deleteCapture } from '../../../../lib/capture';

export const prerender = false;

function verifyAdmin(request: Request): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  return token === adminPassword;
}

export const DELETE: APIRoute = async ({ params, request }) => {
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

    // Only allow deletion of pending or rejected captures
    if (capture.status === 'approved' || capture.status === 'published') {
      return new Response(
        JSON.stringify({
          error: 'Cannot delete approved or published captures',
          status: capture.status,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const deleted = await deleteCapture(id);

    if (!deleted) {
      return new Response(
        JSON.stringify({ error: 'Failed to delete capture' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Capture permanently deleted',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Delete capture error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete capture' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Also support POST for clients that don't support DELETE
export const POST = DELETE;
