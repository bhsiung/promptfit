import { describe, expect, it, afterAll } from "vitest";
import "dotenv/config";

describe("Redis connection", () => {
  it("can connect and ping Upstash Redis", async () => {
    const url = process.env.REDIS_URL;
    expect(url, "REDIS_URL must be set").toBeTruthy();

    // Dynamically import to avoid top-level connection at test startup
    const { getRedis } = await import("./redis");
    const redis = getRedis();

    const pong = await redis.ping();
    expect(pong).toBe("PONG");

    await redis.quit();
  }, 10000);
});
