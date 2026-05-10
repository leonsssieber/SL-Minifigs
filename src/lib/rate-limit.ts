// Rate limiting — Upstash Redis when configured, in-memory fallback otherwise.
//
// IMPORTANT: On Vercel serverless, the in-memory fallback does NOT work
// reliably — every cold function instance has its own counter, so brute-force
// protection effectively disappears. Upstash is REQUIRED in production.

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number; // seconds
}

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

let warnedAboutFallback = false;
function warnFallbackOnce() {
  if (warnedAboutFallback) return;
  warnedAboutFallback = true;
  if (process.env.NODE_ENV === "production") {
    console.error(
      "[rate-limit] Upstash Redis is NOT configured. The in-memory fallback " +
        "is unsafe on serverless (each cold instance gets its own bucket). " +
        "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
    );
  }
}

const redis = hasUpstash ? Redis.fromEnv() : null;

// Cache one Ratelimit instance per (limit, window) combo so we don't recreate
// a sliding-window object on every request.
const limiterCache = new Map<string, Ratelimit>();
function getLimiter(limit: number, windowSeconds: number): Ratelimit | null {
  if (!redis) return null;
  const cacheKey = `${limit}:${windowSeconds}`;
  let lim = limiterCache.get(cacheKey);
  if (!lim) {
    lim = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      analytics: false,
      prefix: "sl-minifigs/rl",
    });
    limiterCache.set(cacheKey, lim);
  }
  return lim;
}

// Local dev fallback: in-memory token bucket.
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function rateLimitInMemory(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  if (Math.random() < 0.01) {
    for (const [k, b] of buckets.entries()) if (b.resetAt < now) buckets.delete(k);
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, resetIn: windowSeconds };
  }
  if (bucket.count >= limit) {
    return { success: false, remaining: 0, resetIn: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count++;
  return {
    success: true,
    remaining: limit - bucket.count,
    resetIn: Math.ceil((bucket.resetAt - now) / 1000),
  };
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const limiter = getLimiter(limit, windowSeconds);

  if (!limiter) {
    warnFallbackOnce();
    return rateLimitInMemory(key, limit, windowSeconds);
  }

  try {
    const result = await limiter.limit(key);
    const resetIn = Math.max(0, Math.ceil((result.reset - Date.now()) / 1000));
    return {
      success: result.success,
      remaining: result.remaining,
      resetIn,
    };
  } catch (err) {
    // Fail open in dev, fail closed in production. Logging the error either way.
    console.error("[rate-limit] Upstash error:", err);
    if (process.env.NODE_ENV === "production") {
      return { success: false, remaining: 0, resetIn: windowSeconds };
    }
    return rateLimitInMemory(key, limit, windowSeconds);
  }
}

export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}
