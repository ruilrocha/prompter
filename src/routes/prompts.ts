import { Hono } from "hono";
import { getTodayDate } from "../lib/date.js";
import { apiKeyAuth, rateLimit } from "../lib/middleware.js";
import { latestLimiter } from "../lib/ratelimit.js";
import { dateKey, type PromptEntry, redis } from "../lib/redis.js";

const prompts = new Hono();

// ---------------------------------------------------------------------------
// GET /latest  — returns today's prompt (keyed by current UTC date)
// Auth: x-api-key: <API_KEY>
// ---------------------------------------------------------------------------

prompts.get("/latest", apiKeyAuth(), rateLimit(latestLimiter), async (c) => {
	const date = getTodayDate();
	const payload = await redis.get<string>(dateKey(date));

	if (!payload) {
		return c.json({ error: "No prompt available for today yet" }, 404);
	}

	return c.json({ date, prompt: payload } satisfies PromptEntry, 200);
});

export default prompts;
