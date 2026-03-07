import Redis from "ioredis";

let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (!_redis) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error("REDIS_URL is not set");
    _redis = new Redis(url, {
      tls: url.startsWith("rediss://") ? {} : undefined,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });
    _redis.on("error", (err) => {
      console.error("[Redis] connection error:", err.message);
    });
  }
  return _redis;
}
