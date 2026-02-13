/**
 * Batch Publish Endpoint
 *
 * POST /api/capture/publish-all
 *
 * Publishes all approved captures in a SINGLE GitHub commit.
 * This triggers only ONE Vercel deployment regardless of item count.
 *
 * Can be triggered:
 * 1. Manually via "Publish All" button in dashboard
 * 2. Via Vercel Cron (free, once/day)
 * 3. Via external cron service
 */

import type { APIRoute } from 'astro';
import {
  getApprovedCaptures,
  batchPublishCaptures,
  markAsPublished,
  isGitHubConfigured,
} from '../../../lib/capture';

export const prerender = false;

function verifyAuth(request: Request): boolean {
  const adminPassword = import.meta.env.ADMIN_PASSWORD;
  const cronSecret = import.meta.env.CRON_SECRET;

  // Check admin password (for manual trigger)
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (token === adminPassword) return true;
  }

  // Check cron secret (for Vercel Cron)
  // Vercel sends this header for cron jobs
  const cronHeader = request.headers.get('x-vercel-cron-secret');
  if (cronSecret && cronHeader === cronSecret) return true;

  // Also allow via Authorization header for cron
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;

  return false;
}

export const POST: APIRoute = async ({ request }) => {
  if (!verifyAuth(request)) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    if (!isGitHubConfigured()) {
      return new Response(
        JSON.stringify({ error: 'GitHub publishing not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get all approved (queued) captures
    const approved = await getApprovedCaptures();

    if (approved.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No items to publish',
          published: 0,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Batch publish all in one commit
    // Use each capture's stored preference for refined vs raw
    const result = await batchPublishCaptures(
      approved,
      true // Default to refined; individual preferences handled in transform
    );

    // Mark all as published
    await markAsPublished(result.ids);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Published ${result.filesAdded} items in one commit`,
        published: result.filesAdded,
        commit: result.sha,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Batch publish error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to publish',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Also support GET for Vercel Cron (cron jobs use GET by default)
export const GET: APIRoute = async (context) => {
  // Forward to POST handler
  return POST(context);
};
