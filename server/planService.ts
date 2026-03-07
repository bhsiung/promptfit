/**
 * Plan Service — content-addressed storage via SHA-256 Base62
 *
 * Flow:
 *   1. Validate schema
 *   2. Canonicalize JSON (sorted keys, no nulls)
 *   3. SHA-256 → Base62 (22 chars)
 *   4. Redis SETNX + EXPIRE (30 days, sliding)
 */
import crypto from "crypto";
import { getRedis } from "./redis";

// ─── Base62 ──────────────────────────────────────────────────────────────────
const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const PLAN_ID_LENGTH = 22;
const TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

function bufferToBase62(buf: Buffer): string {
  const num = Array.from(buf) as number[];

  function divideByBase62(arr: number[]): { quotient: number[]; remainder: number } {
    let rem = 0;
    const quot: number[] = [];
    for (const b of arr) {
      const cur = rem * 256 + b;
      quot.push(Math.floor(cur / 62));
      rem = cur % 62;
    }
    let start = 0;
    while (start < quot.length - 1 && quot[start] === 0) start++;
    return { quotient: quot.slice(start), remainder: rem };
  }

  const base62Digits: number[] = [];
  let current = num;
  while (current.length > 1 || current[0] !== 0) {
    const { quotient, remainder } = divideByBase62(current);
    base62Digits.unshift(remainder);
    current = quotient;
  }
  if (current[0] !== 0) base62Digits.unshift(current[0]);

  const result = base62Digits.map((d) => BASE62[d]).join("");
  return result.padStart(PLAN_ID_LENGTH, "0").slice(0, PLAN_ID_LENGTH);
}

// ─── Canonicalize ────────────────────────────────────────────────────────────
function canonicalize(value: unknown): unknown {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(canonicalize);
  const obj = value as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    const v = canonicalize(obj[key]);
    if (v !== undefined) sorted[key] = v;
  }
  return sorted;
}

export function canonicalizeJson(plan: unknown): string {
  return JSON.stringify(canonicalize(plan));
}

// ─── Hash ─────────────────────────────────────────────────────────────────────
export function computePlanId(canonicalJson: string): string {
  const hash = crypto.createHash("sha256").update(canonicalJson, "utf8").digest();
  return bufferToBase62(hash);
}

// ─── Redis ops ───────────────────────────────────────────────────────────────
const redisKey = (planId: string) => `plan:${planId}`;

/**
 * Store plan in Redis (SETNX for dedupe).
 * Returns planId regardless of whether it was a new write or dedupe hit.
 */
export async function storePlan(plan: unknown): Promise<string> {
  const canonical = canonicalizeJson(plan);
  const planId = computePlanId(canonical);
  const redis = getRedis();
  const key = redisKey(planId);

  // SETNX: only write if key doesn't exist (dedupe)
  await redis.setnx(key, canonical);
  // Always refresh TTL (sliding expiration)
  await redis.expire(key, TTL_SECONDS);

  return planId;
}

/**
 * Fetch plan JSON from Redis by planId.
 * Returns null if not found / expired.
 */
export async function fetchPlan(planId: string): Promise<unknown | null> {
  const redis = getRedis();
  const key = redisKey(planId);
  const raw = await redis.get(key);
  if (!raw) return null;

  // Refresh TTL on read (sliding expiration)
  await redis.expire(key, TTL_SECONDS);

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
