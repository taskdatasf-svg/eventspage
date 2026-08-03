import Redis from 'ioredis';

type CacheClient = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode: 'EX', ttl: number): Promise<unknown>;
  del(...keys: string[]): Promise<unknown>;
};

const noopCache: CacheClient = {
  get: async () => null,
  set: async () => null,
  del: async () => null,
};

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
      console.warn('[Redis] connection error:', err.message);
    });
  }

  return globalForRedis.redis as unknown as CacheClient;
}

export const cache = createClient();

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await cache.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    await cache.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  try {
    if (keys.length > 0) await cache.del(...keys);
  } catch {
  }
}
