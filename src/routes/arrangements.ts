import { Hono } from "hono";
import { getTodayDate } from "../lib/date.js";
import { apiKeyAuth, rateLimit } from "../lib/middleware.js";
import { latestLimiter } from "../lib/ratelimit.js";
import { type DailyEntry, entryDateKey, redis } from "../lib/redis.js";

const arrangements = new Hono();

// ---------------------------------------------------------------------------
// GET /latest  — returns today's arrangement keywords (keyed by current UTC date)
// Auth: x-api-key: <API_KEY>
// Backward-compatible: returns { date, foundation, supporting, singing }
// ---------------------------------------------------------------------------

arrangements.get(
	"/latest",
	apiKeyAuth(),
	rateLimit(latestLimiter),
	async (c) => {
		const date = getTodayDate();
		const entry = await redis.get<DailyEntry>(entryDateKey(date));

		if (!entry) {
			return c.json({ error: "No arrangement available for today yet" }, 404);
		}

		return c.json({ date, ...entry.arrangement }, 200);
	},
);

export default arrangements;
