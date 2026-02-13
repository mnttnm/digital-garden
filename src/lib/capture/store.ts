/**
 * Capture Store - Upstash Redis operations
 *
 * Key patterns:
 * - capture:{id} → individual capture JSON
 * - captures:pending → sorted set of pending IDs (score = timestamp)
 * - captures:approved → sorted set of approved IDs
 * - captures:rejected → sorted set of rejected IDs
 */

import { Redis } from '@upstash/redis';
import type { Capture, CaptureStatus, CaptureUpdatePayload, RefinedCapture } from './types';

// Initialize Redis client
function getRedis(): Redis {
  const url = import.meta.env.UPSTASH_REDIS_REST_URL;
  const token = import.meta.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error('Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN');
  }

  return new Redis({ url, token });
}

// Generate a unique ID for captures
function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

// Key helpers
const captureKey = (id: string) => `capture:${id}`;
const statusSetKey = (status: CaptureStatus) => `captures:${status}`;

/**
 * Create a new capture
 */
export async function createCapture(
  data: Omit<Capture, 'id' | 'createdAt' | 'status'>
): Promise<Capture> {
  const redis = getRedis();
  const id = generateId();
  const createdAt = new Date().toISOString();

  const capture: Capture = {
    id,
    createdAt,
    status: 'pending',
    ...data,
  };

  // Store capture and add to pending set
  await redis.set(captureKey(id), JSON.stringify(capture));
  await redis.zadd(statusSetKey('pending'), {
    score: Date.now(),
    member: id,
  });

  return capture;
}

/**
 * Get a capture by ID
 */
export async function getCapture(id: string): Promise<Capture | null> {
  const redis = getRedis();
  const data = await redis.get<string>(captureKey(id));

  if (!data) return null;

  // Handle both string and object responses
  return typeof data === 'string' ? JSON.parse(data) : data as unknown as Capture;
}

/**
 * List captures by status
 */
export async function listCaptures(
  status: CaptureStatus,
  limit = 50,
  offset = 0
): Promise<Capture[]> {
  const redis = getRedis();

  // Get IDs from sorted set (newest first)
  const ids = await redis.zrange<string[]>(statusSetKey(status), offset, offset + limit - 1, {
    rev: true,
  });

  if (!ids || ids.length === 0) return [];

  // Fetch all captures in parallel
  const captures = await Promise.all(
    ids.map(async (id) => {
      const data = await redis.get<string>(captureKey(id));
      if (!data) return null;
      return typeof data === 'string' ? JSON.parse(data) : data as unknown as Capture;
    })
  );

  return captures.filter((c): c is Capture => c !== null);
}

/**
 * Update a capture's metadata
 */
export async function updateCapture(
  id: string,
  updates: CaptureUpdatePayload
): Promise<Capture | null> {
  const redis = getRedis();
  const capture = await getCapture(id);

  if (!capture) return null;

  const updated: Capture = {
    ...capture,
    text: updates.text ?? capture.text,
    comment: updates.comment ?? capture.comment,
    tags: updates.tags ?? capture.tags,
    inferredCollection: updates.inferredCollection ?? capture.inferredCollection,
    inferredNoteType: updates.inferredNoteType ?? capture.inferredNoteType,
  };

  await redis.set(captureKey(id), JSON.stringify(updated));
  return updated;
}

/**
 * Update a capture's status
 */
export async function updateCaptureStatus(
  id: string,
  newStatus: CaptureStatus
): Promise<Capture | null> {
  const redis = getRedis();
  const capture = await getCapture(id);

  if (!capture) return null;

  const oldStatus = capture.status;

  // Update capture object
  const updated: Capture = {
    ...capture,
    status: newStatus,
  };

  // Move between status sets
  await redis.zrem(statusSetKey(oldStatus), id);
  await redis.zadd(statusSetKey(newStatus), {
    score: Date.now(),
    member: id,
  });

  // Save updated capture
  await redis.set(captureKey(id), JSON.stringify(updated));

  return updated;
}

/**
 * Store AI refinement for a capture
 */
export async function storeRefinement(
  id: string,
  refined: Omit<RefinedCapture, 'refinedAt'>
): Promise<Capture | null> {
  const redis = getRedis();
  const capture = await getCapture(id);

  if (!capture) return null;

  const updated: Capture = {
    ...capture,
    refined: {
      ...refined,
      refinedAt: new Date().toISOString(),
    },
  };

  await redis.set(captureKey(id), JSON.stringify(updated));
  return updated;
}

/**
 * Delete a capture permanently
 */
export async function deleteCapture(id: string): Promise<boolean> {
  const redis = getRedis();
  const capture = await getCapture(id);

  if (!capture) return false;

  // Remove from status set and delete the capture
  await redis.zrem(statusSetKey(capture.status), id);
  await redis.del(captureKey(id));

  return true;
}

/**
 * Get count of captures by status
 */
export async function getCaptureCount(status: CaptureStatus): Promise<number> {
  const redis = getRedis();
  return await redis.zcard(statusSetKey(status));
}

/**
 * Get all approved captures (queued for publishing)
 */
export async function getApprovedCaptures(): Promise<Capture[]> {
  return listCaptures('approved', 100, 0);
}

/**
 * Bulk update captures to published status with slug info
 */
export async function markAsPublished(
  publishedInfo: Array<{ id: string; slug: string; collection: string }>
): Promise<void> {
  const redis = getRedis();

  for (const info of publishedInfo) {
    const capture = await getCapture(info.id);
    if (capture && capture.status === 'approved') {
      // Update capture with published slug and collection
      const updated: Capture = {
        ...capture,
        status: 'published',
        publishedSlug: info.slug,
        publishedCollection: info.collection as 'til' | 'notes',
      };

      // Move between status sets
      await redis.zrem(statusSetKey('approved'), info.id);
      await redis.zadd(statusSetKey('published'), {
        score: Date.now(),
        member: info.id,
      });

      // Save updated capture
      await redis.set(captureKey(info.id), JSON.stringify(updated));
    }
  }
}
