import { Redis } from "@upstash/redis";

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
	throw new Error(
		"Missing KV_REST_API_URL or KV_REST_API_TOKEN environment variables.",
	);
}

/**
 * Singleton Redis client using the Vercel Upstash KV integration env vars.
 */
export const redis = new Redis({
	url: process.env.KV_REST_API_URL,
	token: process.env.KV_REST_API_TOKEN,
});

export interface Arrangement {
	foundation: string;
	supporting: string;
	singing: string;
}

/**
 * Combined shape of a stored daily entry (prompt + arrangement).
 * Both the GraphQL endpoint and the REST endpoints read from this single key.
 */
export interface DailyEntry {
	scenario: string;
	arrangement: Arrangement;
}

/** Redis key for a daily entry (YYYY-MM-DD). */
export const entryDateKey = (date: string) => `entry:${date}`;

/** 7 days in seconds. */
export const PROMPT_TTL = 60 * 60 * 24 * 7;
