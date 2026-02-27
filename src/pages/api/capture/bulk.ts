/**
 * Bulk Capture Actions Endpoint
 *
 * POST /api/capture/bulk
 *
 * Performs bulk operations on multiple captures.
 * Body: { action: 'approve'|'reject'|'delete', ids: string[] }
 * Returns: { success: true, processed: number, failed: string[] }
 */

import type { APIRoute } from 'astro';
import {
  getCapture,
  updateCaptureStatus,
  deleteCapture,
  updateCapture,
} from '../../../lib/capture';

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

type BulkAction = 'approve' | 'reject' | 'delete';

interface BulkRequest {
  action: BulkAction;
  ids: string[];
}

export const POST: APIRoute = async ({ request }) => {
  if (!verifyAdmin(request)) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json() as BulkRequest;
    const { action, ids } = body;

    if (!action || !['approve', 'reject', 'delete'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Must be approve, reject, or delete' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or empty ids array' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Limit to prevent DoS
    if (ids.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Too many IDs. Maximum 50 per request.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Process all IDs in parallel
    const results = await Promise.all(
      ids.map(async (id): Promise<{ id: string; success: boolean }> => {
        try {
          const capture = await getCapture(id);

          if (!capture) {
            return { id, success: false };
          }

          switch (action) {
            case 'approve':
              if (capture.status !== 'pending') {
                return { id, success: false };
              }
              await updateCapture(id, {
                publishUseRefined: Boolean(capture.refined),
              });
              await updateCaptureStatus(id, 'approved');
              return { id, success: true };

            case 'reject':
              if (capture.status !== 'pending' && capture.status !== 'approved') {
                return { id, success: false };
              }
              await updateCaptureStatus(id, 'rejected');
              return { id, success: true };

            case 'delete':
              if (capture.status === 'approved' || capture.status === 'published') {
                return { id, success: false };
              }
              const deleted = await deleteCapture(id);
              return { id, success: deleted };

            default:
              return { id, success: false };
          }
        } catch (error) {
          console.error(`Bulk action failed for ${id}:`, error);
          return { id, success: false };
        }
      })
    );

    const processed = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).map((r) => r.id);

    return new Response(
      JSON.stringify({
        success: true,
        action,
        processed,
        failed,
        total: ids.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Bulk action error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process bulk action' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
