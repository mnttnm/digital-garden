/**
 * Preview Capture Endpoint
 *
 * GET /api/capture/[id]/preview
 *
 * Returns a preview of what would be published without actually committing.
 */

import type { APIRoute } from 'astro';
import { getCapture, previewPublish } from '../../../../lib/capture';

export const prerender = false;

function verifyAdmin(request: Request): boolean {
  const adminPassword = import.meta.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;

  const url = new URL(request.url);
  const queryPassword = url.searchParams.get('password');
  if (queryPassword === adminPassword) return true;

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  return token === adminPassword;
}

export const GET: APIRoute = async ({ params, request }) => {
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

    const url = new URL(request.url);
    const useRefined = url.searchParams.get('raw') !== 'true';

    const preview = previewPublish(capture, useRefined);

    return new Response(
      JSON.stringify({
        capture,
        preview,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Preview capture error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to preview capture' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
