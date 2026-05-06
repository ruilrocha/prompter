import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis.js";

/**
 * Sliding-window rate limiter for GET /prompts/latest.
 * Keyed by caller IP. Tune via env vars:
 *   RATE_LIMIT_REQUESTS  — max requests per window (default: 10)
 *   RATE_LIMIT_WINDOW_S  — window size in seconds (default: 10)
 */
const latestRequests = parseInt(process.env.RATE_LIMIT_REQUESTS ?? "10", 10);
const latestWindowSeconds = parseInt(
	process.env.RATE_LIMIT_WINDOW_S ?? "10",
	10,
);

export const latestLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.slidingWindow(latestRequests, `${latestWindowSeconds} s`),
	prefix: "ratelimit:prompter:latest",
	analytics: true,
});

/**
 * Fixed-window rate limiter for POST /prompts/generate.
 * Keyed on a fixed "cron" identifier — there is only one valid caller.
 * Tune via env vars:
 *   GENERATE_RATE_LIMIT_REQUESTS — max calls per window (default: 3)
 *   GENERATE_RATE_LIMIT_WINDOW_H — window size in hours (default: 24)
 */
const generateRequests = parseInt(
	process.env.GENERATE_RATE_LIMIT_REQUESTS ?? "3",
	10,
);
const generateWindowHours = parseInt(
	process.env.GENERATE_RATE_LIMIT_WINDOW_H ?? "24",
	10,
);

export const generateLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.fixedWindow(generateRequests, `${generateWindowHours} h`),
	prefix: "ratelimit:prompter:generate",
	analytics: true,
});
