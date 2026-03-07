/**
 * Plan Routes — REST API for content-addressed workout plan storage
 *
 * POST /api/get-plan-id  → validate, canonicalize, store, return planId
 * GET  /api/get-plan/:id → fetch plan JSON from Redis
 */
import { Router, Request, Response } from "express";
import { validateWorkoutPlan } from "../client/src/lib/workoutSchema";
import { storePlan, fetchPlan } from "./planService";

const MAX_PAYLOAD_BYTES = 64 * 1024; // 64KB

function logRequest(fields: Record<string, unknown>) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), ...fields }));
}

function logError(fields: Record<string, unknown>, err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error(
    JSON.stringify({
      ts: new Date().toISOString(),
      ...fields,
      error_message: error.message,
      error_name: error.name,
      stack: error.stack?.split("\n").slice(0, 6).join(" | "),
    })
  );
}

// Use VITE_APP_ID-based URL or fallback. The frontend passes window.location.origin
// in the request body for accurate play_url generation.
function buildBaseUrl(req: Request): string {
  // Prefer origin header from browser/GPT caller
  const origin = req.headers["origin"];
  if (origin && origin.startsWith("http")) return origin.replace(/\/$/, "");
  // Fallback: reconstruct from request
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] as string || req.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

export function registerPlanRoutes(app: Router) {
  // ── POST /api/get-plan-id ──────────────────────────────────────────────────
  app.post("/api/get-plan-id", async (req: Request, res: Response) => {
    const requestId = crypto.randomUUID();
    const userAgent = req.headers["user-agent"] ?? "unknown";
    const origin = req.headers["origin"] ?? req.headers["referer"] ?? "unknown";
    logRequest({
      request_id: requestId,
      event: "plan_create_start",
      user_agent: userAgent,
      origin,
      content_type: req.headers["content-type"],
      body_type: typeof req.body,
      body_keys: req.body && typeof req.body === "object" ? Object.keys(req.body) : null,
    });

    try {
      // Payload size check
      let payloadSize: number;
      try {
        payloadSize = Buffer.byteLength(JSON.stringify(req.body), "utf8");
      } catch (serializeErr) {
        logError({ request_id: requestId, event: "plan_serialize_error", status_code: 400 }, serializeErr);
        res.status(400).json({ error: "Invalid JSON body" });
        return;
      }

      if (payloadSize > MAX_PAYLOAD_BYTES) {
        logRequest({ request_id: requestId, event: "plan_too_large", payload_bytes: payloadSize, status_code: 413 });
        res.status(413).json({ error: "Payload too large", max_bytes: MAX_PAYLOAD_BYTES });
        return;
      }

      // Schema validation
      const result = validateWorkoutPlan(req.body);
      if (!result.valid) {
        logRequest({
          request_id: requestId,
          event: "plan_validation_failed",
          status_code: 422,
          validation_errors: result.errors,
          payload_preview: JSON.stringify(req.body).slice(0, 300),
        });
        res.status(422).json({ error: "Validation failed", details: result.errors });
        return;
      }

      // Store and get planId
      let planId: string;
      try {
        planId = await storePlan(req.body);
      } catch (redisErr) {
        logError({ request_id: requestId, event: "plan_redis_store_error", status_code: 500 }, redisErr);
        res.status(500).json({ error: "Failed to store plan" });
        return;
      }

      const baseUrl = buildBaseUrl(req);
      const playUrl = `${baseUrl}/play?id=${planId}`;

      logRequest({
        request_id: requestId,
        event: "plan_created",
        planId,
        status_code: 201,
        payload_bytes: payloadSize,
        step_count: Array.isArray(req.body?.steps) ? req.body.steps.length : 0,
      });

      res
        .status(201)
        .set("X-Plan-Id", planId)
        .set("Access-Control-Expose-Headers", "X-Plan-Id")
        .json({ id: planId, play_url: playUrl });
    } catch (err) {
      logError(
        {
          request_id: requestId,
          event: "plan_create_unexpected_error",
          status_code: 500,
          body_preview: JSON.stringify(req.body ?? {}).slice(0, 300),
        },
        err
      );
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ── GET /api/get-plan/:id ──────────────────────────────────────────────────
  app.get("/api/get-plan/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const requestId = crypto.randomUUID();
    logRequest({
      request_id: requestId,
      event: "plan_fetch_start",
      planId: id,
      user_agent: req.headers["user-agent"] ?? "unknown",
    });

    try {
      let plan: unknown;
      try {
        plan = await fetchPlan(id);
      } catch (redisErr) {
        logError({ request_id: requestId, event: "plan_redis_fetch_error", planId: id, status_code: 500 }, redisErr);
        res.status(500).json({ error: "Failed to fetch plan" });
        return;
      }

      if (!plan) {
        logRequest({ request_id: requestId, event: "plan_not_found", planId: id, status_code: 404 });
        res.status(404).json({ error: "Plan not found or expired" });
        return;
      }

      logRequest({ request_id: requestId, event: "plan_fetched", planId: id, status_code: 200 });

      // FIX: Disable caching to prevent 304 responses causing stale/empty animation data
      res
        .status(200)
        .set("Cache-Control", "no-store, no-cache, must-revalidate")
        .set("Pragma", "no-cache")
        .set("Expires", "0")
        .json(plan);
    } catch (err) {
      logError({ request_id: requestId, event: "plan_fetch_unexpected_error", planId: id, status_code: 500 }, err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}
