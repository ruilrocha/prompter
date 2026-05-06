import type { Ratelimit } from "@upstash/ratelimit";
import type { MiddlewareHandler } from "hono";

/**
 * Middleware that validates the Authorization: Bearer <secret> header.
 * Reads the expected secret from process.env[envVar] at request time.
 */
export function bearerAuth(envVar = "CRON_SECRET"): MiddlewareHandler {
	return async (c, next) => {
		const expected = process.env[envVar];
		const header = c.req.header("authorization") ?? "";
		if (
			!expected ||
			!header.startsWith("Bearer ") ||
			header.slice(7) !== expected
		) {
			return c.json({ error: "Unauthorized" }, 401);
		}
		await next();
	};
}

/**
 * Middleware that validates the x-api-key header.
 * Reads the expected key from process.env[envVar] at request time.
 */
export function apiKeyAuth(envVar = "API_KEY"): MiddlewareHandler {
	return async (c, next) => {
		const expected = process.env[envVar];
		const provided = c.req.header("x-api-key");
		if (!expected || provided !== expected) {
			return c.json({ error: "Unauthorized" }, 401);
		}
		await next();
	};
}

/**
 * Middleware that applies a rate limiter keyed by caller IP.
 * Sets standard X-RateLimit-* response headers and returns 429 when exceeded.
 */
export function rateLimit(limiter: Ratelimit): MiddlewareHandler {
	return async (c, next) => {
		const ip =
			c.req.header("x-forwarded-for")?.split(",")[0].trim() ?? "anonymous";
		const { success, limit, remaining, reset } = await limiter.limit(ip);
		c.header("X-RateLimit-Limit", String(limit));
		c.header("X-RateLimit-Remaining", String(remaining));
		c.header("X-RateLimit-Reset", String(reset));
		if (!success) {
			return c.json({ error: "Too many requests" }, 429);
		}
		await next();
	};
}

/**
 * Middleware that applies a rate limiter keyed by a fixed identifier.
 * Intended for endpoints with a single known caller (e.g. a cron job).
 * Sets standard X-RateLimit-* response headers and returns 429 when exceeded.
 */
export function rateLimitFixed(
	limiter: Ratelimit,
	key: string,
): MiddlewareHandler {
	return async (c, next) => {
		const { success, limit, remaining, reset } = await limiter.limit(key);
		c.header("X-RateLimit-Limit", String(limit));
		c.header("X-RateLimit-Remaining", String(remaining));
		c.header("X-RateLimit-Reset", String(reset));
		if (!success) {
			return c.json({ error: "Too many requests" }, 429);
		}
		await next();
	};
}
