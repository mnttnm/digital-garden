/**
 * Approve Capture Endpoint
 *
 * POST /api/capture/[id]/approve
 *
 * Marks a capture as approved (queued for publishing).
 * Does NOT publish immediately - use /api/capture/publish-all for batch publishing.
 */

import type { APIRoute } from 'astro';
import { getCapture, updateCaptureStatus, updateCapture } from '../../../../lib/capture';

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

    // Parse request body for publish preference
    let useRefined = true;
    try {
      const body = await request.json();
      useRefined = body.useRefined !== false;
    } catch {
      // No body or invalid JSON, use defaults
    }

    // Store the publish preference in capture metadata
    // We'll use this when batch publishing later
    await updateCapture(id, {
      // @ts-ignore - adding publish preference
      publishUseRefined: useRefined,
    });

    // Mark as approved (queued for publishing)
    await updateCaptureStatus(id, 'approved');

    return new Response(
      JSON.stringify({
        success: true,
        status: 'approved',
        message: 'Queued for publishing. Use "Publish All" to deploy.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Approve capture error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to approve capture' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
