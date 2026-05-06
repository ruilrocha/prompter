import { Hono } from "hono";
import { getTodayDate } from "../lib/date.js";
import { apiKeyAuth, rateLimit } from "../lib/middleware.js";
import { latestLimiter } from "../lib/ratelimit.js";
import {
	type ArrangementEntry,
	arrangementDateKey,
	redis,
} from "../lib/redis.js";

const arrangements = new Hono();

// ---------------------------------------------------------------------------
// GET /latest  — returns today's arrangement keywords (keyed by current UTC date)
// Auth: x-api-key: <API_KEY>
// ---------------------------------------------------------------------------

arrangements.get(
	"/latest",
	apiKeyAuth(),
	rateLimit(latestLimiter),
	async (c) => {
		const date = getTodayDate();
		const payload = await redis.get<ArrangementEntry>(arrangementDateKey(date));

		if (!payload) {
			return c.json({ error: "No arrangement available for today yet" }, 404);
		}

		return c.json(payload, 200);
	},
);

export default arrangements;
