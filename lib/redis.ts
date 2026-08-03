/**
 * lib/redis.ts
 *
 * Shared ioredis client singleton.
 * If REDIS_URL is not set (e.g. plain `npm run dev` without Docker),
 * every cache call silently no-ops so the app keeps working normally.
 */

import Redis from 'ioredis';

// ─── Types ────────────────────────────────────────────────────────────────────
type CacheClient = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode: 'EX', ttl: number): Promise<unknown>;
  del(...keys: string[]): Promise<unknown>;
};

// ─── No-op fallback (when Redis is not configured) ───────────────────────────
const noopCache: CacheClient = {
  get: async () => null,
  set: async () => null,
  del: async () => null,
};

// ─── Singleton ────────────────────────────────────────────────────────────────
function createClient(): CacheClient {
  if (!process.env.REDIS_URL) {
    return noopCache;
  }

  const globalForRedis = globalThis as unknown as { redis?: Redis };

  if (!globalForRedis.redis) {
    globalForRedis.redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: false,
      lazyConnect: true,
    });

    globalForRedis.redis.on('error', (err) => {
      // Log but never crash the app — cache is optional
      console.warn('[Redis] connection error (cache disabled):', err.message);
    });
  }

  return globalForRedis.redis as unknown as CacheClient;
}

export const cache = createClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Try to get a cached JSON value. Returns null on miss or error. */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await cache.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Serialise and store a value with a TTL in seconds. */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    await cache.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // Silently ignore — Redis is non-critical
  }
}

/** Delete one or more cache keys (use after mutations). */
export async function cacheDel(...keys: string[]): Promise<void> {
  try {
    if (keys.length > 0) await cache.del(...keys);
  } catch {
    // Silently ignore
  }
}
