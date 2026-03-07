/**
 * Rate Limiter for Newsletter Subscriptions
 *
 * Uses Upstash Redis to limit subscription attempts per IP.
 * Follows the pattern from src/lib/capture/store.ts
 */

import { Redis } from '@upstash/redis';
import { createHash } from 'node:crypto';

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_ATTEMPTS_PER_WINDOW = 3;

// Initialize Redis client (lazy, same pattern as capture store)
function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    // Rate limiting disabled if Redis not configured
    return null;
  }

  return new Redis({ url, token });
}

// Hash IP for privacy (don't store raw IPs)
function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

// Key for rate limit counter
const rateLimitKey = (ipHash: string) => `ratelimit:subscribe:${ipHash}`;

/**
 * Extract client IP from request headers (Vercel/Cloudflare compatible)
 */
export function getClientIp(request: Request): string {
  // Vercel
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  // Cloudflare
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;

  // Fallback
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  return 'unknown';
}

/**
 * Check if request is within rate limit
 */
export async function checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  const redis = getRedis();

  // Fail open if Redis not configured
  if (!redis) {
    return { allowed: true, remaining: MAX_ATTEMPTS_PER_WINDOW };
  }

  const ipHash = hashIp(ip);
  const key = rateLimitKey(ipHash);

  try {
    const count = await redis.get<number>(key);
    const currentCount = count ?? 0;
    const remaining = Math.max(0, MAX_ATTEMPTS_PER_WINDOW - currentCount);

    return {
      allowed: currentCount < MAX_ATTEMPTS_PER_WINDOW,
      remaining,
    };
  } catch (error) {
    // Fail open on Redis errors
    console.error('Rate limit check failed:', error);
    return { allowed: true, remaining: MAX_ATTEMPTS_PER_WINDOW };
  }
}

/**
 * Increment rate limit counter after successful subscription
 */
export async function incrementRateLimit(ip: string): Promise<void> {
  const redis = getRedis();

  if (!redis) return;

  const ipHash = hashIp(ip);
  const key = rateLimitKey(ipHash);
  const ttlSeconds = Math.ceil(RATE_LIMIT_WINDOW_MS / 1000);

  try {
    const exists = await redis.exists(key);

    if (exists) {
      await redis.incr(key);
    } else {
      await redis.set(key, 1, { ex: ttlSeconds });
    }
  } catch (error) {
    // Don't fail the request if rate limit tracking fails
    console.error('Rate limit increment failed:', error);
  }
}
