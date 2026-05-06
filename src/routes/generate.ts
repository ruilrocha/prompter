import { Hono } from "hono";
import { generateDailyEntry } from "../lib/ai.js";
import { getTomorrowDate } from "../lib/date.js";
import { bearerAuth, rateLimitFixed } from "../lib/middleware.js";
import { generateLimiter } from "../lib/ratelimit.js";
import {
	type ArrangementEntry,
	arrangementDateKey,
	dateKey,
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
			const existingPrompt = await redis.get<string>(dateKey(date));
			if (existingPrompt) {
				const existingArrangement = await redis.get<ArrangementEntry>(
					arrangementDateKey(date),
				);
				return c.json(
					{
						date,
						prompt: existingPrompt,
						arrangement: existingArrangement,
						cached: true,
					},
					200,
				);
			}
		}

		let entry: Awaited<ReturnType<typeof generateDailyEntry>>;
		try {
			entry = await generateDailyEntry(date);
		} catch (err) {
			console.error("Failed to generate daily entry:", err);
			return c.json({ error: "Failed to generate daily entry" }, 500);
		}

		const { scenario: prompt, ...arrangement } = entry;
		const arrangementEntry: ArrangementEntry = { date, ...arrangement };

		await Promise.all([
			redis.set(dateKey(date), prompt, { ex: PROMPT_TTL }),
			redis.set(arrangementDateKey(date), arrangementEntry, { ex: PROMPT_TTL }),
		]);

		return c.json(
			{ date, prompt, arrangement: arrangementEntry, cached: false },
			201,
		);
	},
);

export default generate;
