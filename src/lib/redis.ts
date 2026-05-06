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

/** Shape of a stored prompt entry. */
export interface PromptEntry {
	date: string;
	prompt: string;
}

/** Shape of a stored arrangement entry. */
export interface ArrangementEntry {
	date: string;
	foundation: string;
	supporting: string;
	singing: string;
}

/** Redis key for a dated prompt (YYYY-MM-DD). */
export const dateKey = (date: string) => `prompt:${date}`;

/** Redis key for a dated arrangement (YYYY-MM-DD). */
export const arrangementDateKey = (date: string) => `arrangement:${date}`;

/** 30 days in seconds. */
export const PROMPT_TTL = 60 * 60 * 24 * 30;
