const Redis = require("ioredis");

const redis = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 2000);
    return delay;
  },
  lazyConnect: true,
});

redis.on("connect", () => {
  console.log("🔴 Redis connected");
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err.message);
});

/**
 * Cache helper — get or set with TTL.
 * @param {string} key
 * @param {number} ttlSeconds
 * @param {Function} fetcher - async function that returns fresh data
 */
const cacheOrFetch = async (key, ttlSeconds, fetcher) => {
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);
  } catch {
    // Redis unavailable — fall through to fetcher
  }

  const freshData = await fetcher();

  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(freshData));
  } catch {
    // Silently fail cache write
  }

  return freshData;
};

/**
 * Invalidate cache keys by pattern.
 * @param {string} pattern - e.g. "products:*"
 */
const invalidateCache = async (pattern) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Silently fail
  }
};

module.exports = { redis, cacheOrFetch, invalidateCache };
