import { Hono } from "hono";
import { generateDailyEntry } from "../lib/ai.js";
import { getTomorrowDate } from "../lib/date.js";
import { bearerAuth, rateLimitFixed } from "../lib/middleware.js";
import { generateLimiter } from "../lib/ratelimit.js";
import {
	type DailyEntry,
	entryDateKey,
	PROMPT_TTL,
	redis,
} from "../lib/redis.js";

const generate = new Hono();

// ---------------------------------------------------------------------------
// POST /generate  — called by the GitHub Actions cron job
// Auth: Authorization: Bearer <CRON_SECRET>
// Query params: ?force=true  — skip cache and regenerate (for testing)
// ---------------------------------------------------------------------------

generate.post(
	"/",
	bearerAuth(),
	rateLimitFixed(generateLimiter, "cron"),
	async (c) => {
		const force = c.req.query("force") === "true";
		const date = getTomorrowDate();

		// Serve from cache unless force=true
		if (!force) {
			const existing = await redis.get<DailyEntry>(entryDateKey(date));
			if (existing) {
				return c.json({ date, ...existing, cached: true }, 200);
			}
		}

		let entry: DailyEntry;
		try {
			const generated = await generateDailyEntry(date);
			entry = {
				scenario: generated.scenario,
				arrangement: generated.arrangement,
			};
		} catch (err) {
			console.error("Failed to generate daily entry:", err);
			return c.json({ error: "Failed to generate daily entry" }, 500);
		}

		await redis.set(entryDateKey(date), entry, { ex: PROMPT_TTL });

		return c.json({ date, ...entry, cached: false }, 201);
	},
);

export default generate;
