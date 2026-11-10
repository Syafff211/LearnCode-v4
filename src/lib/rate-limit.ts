/**
 * Best-effort in-memory burst limiter.
 *
 * On Vercel, function instances are ephemeral and may run in parallel, so this
 * only slows down bursts hitting the same instance. It is a defense-in-depth
 * measure: the durable, authoritative limit is the daily quota stored in the
 * `ai_usage` table and checked on the server for every request.
 */
export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export class SlidingWindowLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  check(key: string, now = Date.now()): RateLimitResult {
    const windowStart = now - this.windowMs;
    const existing = this.hits.get(key) ?? [];
    const recent = existing.filter((timestamp) => timestamp > windowStart);

    if (recent.length >= this.limit) {
      const oldest = recent[0] ?? now;
      const retryAfterMs = Math.max(0, oldest + this.windowMs - now);
      this.hits.set(key, recent);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
      };
    }

    recent.push(now);
    this.hits.set(key, recent);

    // Opportunistic cleanup to keep memory bounded.
    if (this.hits.size > 5_000) {
      for (const [mapKey, timestamps] of this.hits) {
        const kept = timestamps.filter((timestamp) => timestamp > windowStart);
        if (kept.length === 0) this.hits.delete(mapKey);
        else this.hits.set(mapKey, kept);
      }
    }

    return {
      allowed: true,
      remaining: this.limit - recent.length,
      retryAfterSeconds: 0,
    };
  }
}

export const aiBurstLimiter = new SlidingWindowLimiter(6, 60_000);
export const aiConversationLimiter = new SlidingWindowLimiter(40, 60_000);
export const authActionLimiter = new SlidingWindowLimiter(10, 60_000);
export const certificateLimiter = new SlidingWindowLimiter(10, 60_000);

/**
 * Admin mutations are rate-limited per admin account. Like every limiter here
 * this is per-instance defence in depth; authorization and validation remain
 * mandatory on each action.
 */
export const adminActionLimiter = new SlidingWindowLimiter(60, 60_000);
export const adminSensitiveLimiter = new SlidingWindowLimiter(10, 60_000);
