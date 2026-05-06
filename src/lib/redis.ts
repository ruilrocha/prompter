import { Redis } from '@upstash/redis'

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  throw new Error('Missing KV_REST_API_URL or KV_REST_API_TOKEN environment variables.')
}

/**
 * Singleton Redis client using the Vercel Upstash KV integration env vars.
 */
export const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
})

/** Shape of a stored prompt entry. */
export interface PromptEntry {
  date: string
  prompt: string
}

/** Redis key for a specific date (YYYY-MM-DD). */
export const dateKey = (date: string) => `prompt:${date}`

/** Redis key that always holds the most recently generated prompt. */
export const LATEST_KEY = 'prompt:latest'

/** 30 days in seconds. */
export const PROMPT_TTL = 60 * 60 * 24 * 30

