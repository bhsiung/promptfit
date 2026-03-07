import Redis from "ioredis";

let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (!_redis) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error("REDIS_URL is not set");

    _redis = new Redis(url, {
      tls: url.startsWith("rediss://") ? { rejectUnauthorized: false } : undefined,
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      // Upstash closes idle connections — auto-reconnect silently
      retryStrategy: (times) => Math.min(times * 100, 3000),
      reconnectOnError: () => true,
      lazyConnect: false,
    });

    _redis.on("error", (err) => {
      // Suppress noisy TLS disconnect warnings from Upstash idle timeout
      if (err.message?.includes("TLS connection") || err.message?.includes("disconnected")) return;
      console.error("[Redis] connection error:", err.message);
    });
  }
  return _redis;
}
