/**
 * List Captures Endpoint
 *
 * GET /api/capture/list
 *
 * Returns captures filtered by status with pagination.
 */

import type { APIRoute } from 'astro';
import { listCaptures, getCaptureCount, type CaptureStatus } from '../../../lib/capture';

export const prerender = false;

/**
 * Verify admin password from query param or cookie
 */
function verifyAdmin(request: Request): boolean {
  const url = new URL(request.url);
  const adminPassword = import.meta.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error('ADMIN_PASSWORD not configured');
    return false;
  }

  // Check query param
  const queryPassword = url.searchParams.get('password');
  if (queryPassword === adminPassword) {
    return true;
  }

  // Check Authorization header
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

export const GET: APIRoute = async ({ request }) => {
  if (!verifyAdmin(request)) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const url = new URL(request.url);
    const status = (url.searchParams.get('status') || 'pending') as CaptureStatus;
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Validate status
    if (!['pending', 'approved', 'published', 'rejected'].includes(status)) {
      return new Response(
        JSON.stringify({ error: 'Invalid status' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const [captures, total] = await Promise.all([
      listCaptures(status, limit, offset),
      getCaptureCount(status),
    ]);

    return new Response(
      JSON.stringify({
        captures,
        total,
        limit,
        offset,
        hasMore: offset + captures.length < total,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('List captures error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to list captures' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
