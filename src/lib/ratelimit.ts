import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { env } from "./env";
import { RateLimitError } from "./errors";

// In-memory token bucket fallback for development / testing when Redis credentials are not set
class MemoryRateLimiter {
  private hits: Map<string, { count: number; expiresAt: number }> = new Map();

  async limit(identifier: string, maxRequests = 20, windowMs = 60000) {
    const now = Date.now();
    const entry = this.hits.get(identifier);

    if (!entry || now > entry.expiresAt) {
      this.hits.set(identifier, { count: 1, expiresAt: now + windowMs });
      return { success: true, limit: maxRequests, remaining: maxRequests - 1, reset: now + windowMs };
    }

    if (entry.count >= maxRequests) {
      return { success: false, limit: maxRequests, remaining: 0, reset: entry.expiresAt };
    }

    entry.count += 1;
    return { success: true, limit: maxRequests, remaining: maxRequests - entry.count, reset: entry.expiresAt };
  }
}

const memoryFallback = new MemoryRateLimiter();

let redisClient: Redis | null = null;
let ratelimitInstance: Ratelimit | null = null;

if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redisClient = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });

    ratelimitInstance = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(20, "60 s"),
      analytics: true,
      prefix: "ai_study_companion_ratelimit",
    });
  } catch (err) {
    console.warn("[RateLimit] Failed to initialize Upstash Redis. Using in-memory fallback.");
  }
}

export async function checkRateLimit(identifier: string, limit = 20, windowSeconds = 60) {
  if (ratelimitInstance && redisClient) {
    try {
      const result = await ratelimitInstance.limit(identifier);
      if (!result.success) {
        throw new RateLimitError();
      }
      return result;
    } catch (err) {
      if (err instanceof RateLimitError) throw err;
      // Fallback on transient redis network issues
      const fallback = await memoryFallback.limit(identifier, limit, windowSeconds * 1000);
      if (!fallback.success) throw new RateLimitError();
      return fallback;
    }
  }

  // Fallback
  const res = await memoryFallback.limit(identifier, limit, windowSeconds * 1000);
  if (!res.success) {
    throw new RateLimitError();
  }
  return res;
}
