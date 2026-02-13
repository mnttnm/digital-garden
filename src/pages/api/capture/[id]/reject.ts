/**
 * Reject Capture Endpoint
 *
 * POST /api/capture/[id]/reject
 *
 * Rejects a capture, moving it to the rejected list.
 */

import type { APIRoute } from 'astro';
import { getCapture, updateCaptureStatus } from '../../../../lib/capture';

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

    if (capture.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: 'Capture is not pending' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await updateCaptureStatus(id, 'rejected');

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Reject capture error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to reject capture' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
