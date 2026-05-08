import { Hono } from "hono";
import { getTodayDate } from "../lib/date.js";
import { apiKeyAuth, rateLimit } from "../lib/middleware.js";
import { latestLimiter } from "../lib/ratelimit.js";
import { type DailyEntry, entryDateKey, redis } from "../lib/redis.js";

const prompts = new Hono();

// ---------------------------------------------------------------------------
// GET /latest  — returns today's prompt (keyed by current UTC date)
// Auth: x-api-key: <API_KEY>
// Backward-compatible: returns { date, prompt } where prompt = entry.scenario
// ---------------------------------------------------------------------------

prompts.get("/latest", apiKeyAuth(), rateLimit(latestLimiter), async (c) => {
	const date = getTodayDate();
	const entry = await redis.get<DailyEntry>(entryDateKey(date));

	if (!entry) {
		return c.json({ error: "No prompt available for today yet" }, 404);
	}

	return c.json({ date, prompt: entry.scenario }, 200);
});

export default prompts;
