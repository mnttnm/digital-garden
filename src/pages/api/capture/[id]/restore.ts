/**
 * Restore Capture Endpoint
 *
 * POST /api/capture/[id]/restore
 *
 * Restores a rejected capture back to pending status.
 */

import type { APIRoute } from 'astro';
import { getCapture, updateCaptureStatus } from '../../../../lib/capture';

export const prerender = false;

function verifyAdmin(request: Request): boolean {
  const adminPassword = import.meta.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error('ADMIN_PASSWORD not configured');
    return false;
  }

  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;
    if (token === adminPassword) {
      return true;
    }
  }

  return false;
}

export const POST: APIRoute = async ({ params, request }) => {
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

    if (capture.status !== 'rejected') {
      return new Response(
        JSON.stringify({ error: 'Can only restore rejected captures' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Move back to pending
    await updateCaptureStatus(id, 'pending');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Capture restored to pending',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Restore error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to restore capture' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
