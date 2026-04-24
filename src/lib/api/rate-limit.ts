// Rate limiter — in-memory sliding window [SO §6]
// R47: default 100/min, auth 10/min, AI 20/min, reports 30/min, webhook 10/min

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}, 5 * 60 * 1000);

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a given key.
 * @param key - Unique identifier (e.g. "user:uuid" or "ip:1.2.3.4")
 * @param limit - Max requests allowed in the window
 * @param windowMs - Window duration in milliseconds (default 60s)
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  entry.count++;

  if (entry.count > limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

// Pre-configured limiters matching SO §6 / R47
export const RateLimits = {
  AUTH: { limit: 10, windowMs: 60_000 },        // /api/auth/* — 10/min per IP
  AI_CHAT: { limit: 20, windowMs: 60_000 },     // /api/ai/chat — 20/min per user
  REPORTS: { limit: 30, windowMs: 60_000 },      // /api/reports/* — 30/min per user
  WEBHOOK: { limit: 10, windowMs: 60_000 },      // /api/contact-submissions/webhook — 10/min per key
  DEFAULT: { limit: 100, windowMs: 60_000 },     // all other — 100/min per user
} as const;
