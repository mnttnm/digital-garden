/**
 * Refine Capture Endpoint
 *
 * POST /api/capture/[id]/refine
 *
 * Triggers AI refinement for a capture.
 */

import type { APIRoute } from 'astro';
import {
  getCapture,
  refineCapture,
  storeRefinement,
  isAIConfigured,
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
    if (!isAIConfigured()) {
      return new Response(
        JSON.stringify({ error: 'AI refinement not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const capture = await getCapture(id);

    if (!capture) {
      return new Response(
        JSON.stringify({ error: 'Capture not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Run AI refinement
    const refined = await refineCapture(capture);

    if (!refined) {
      return new Response(
        JSON.stringify({ error: 'AI refinement failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Store the refinement
    const updated = await storeRefinement(id, refined);

    return new Response(
      JSON.stringify({
        success: true,
        refined: updated?.refined,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Refine capture error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to refine capture' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
