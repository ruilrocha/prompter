import { Hono } from 'hono'
import { generatePrompt } from '../lib/ai.js'
import { redis, dateKey, LATEST_KEY, PROMPT_TTL, type PromptEntry } from '../lib/redis.js'

const prompts = new Hono()

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

function getTomorrowDate(): string {
  const tomorrow = new Date()
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  return tomorrow.toISOString().split('T')[0] // YYYY-MM-DD
}

function requireBearer(expectedSecret: string | undefined, authHeader: string | null): boolean {
  if (!expectedSecret) return false
  if (!authHeader?.startsWith('Bearer ')) return false
  return authHeader.slice(7) === expectedSecret
}

function requireApiKey(expectedKey: string | undefined, apiKeyHeader: string | null): boolean {
  if (!expectedKey) return false
  return apiKeyHeader === expectedKey
}

// ---------------------------------------------------------------------------
// POST /generate  — called by the GitHub Actions cron job
// Auth: Authorization: Bearer <CRON_SECRET>
// ---------------------------------------------------------------------------

prompts.post('/generate', async (c) => {
  const authHeader = c.req.header('authorization') ?? null

  if (!requireBearer(process.env.CRON_SECRET, authHeader)) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const date = getTomorrowDate()

  // Avoid regenerating a prompt that already exists for this date
  const existing = await redis.get<string>(dateKey(date))
  if (existing) {
    return c.json({ date, prompt: existing, cached: true }, 200)
  }

  let prompt: string
  try {
    prompt = await generatePrompt(date)
  } catch (err) {
    console.error('Failed to generate prompt:', err)
    return c.json({ error: 'Failed to generate prompt' }, 500)
  }

  // Persist: date-scoped key (TTL 30 days) + latest pointer (no TTL)
  await Promise.all([
    redis.set(dateKey(date), prompt, { ex: PROMPT_TTL }),
    redis.set(LATEST_KEY, { date, prompt } satisfies PromptEntry),
  ])

  return c.json({ date, prompt, cached: false }, 201)
})

// ---------------------------------------------------------------------------
// GET /latest  — returns the most recently generated prompt
// Auth: x-api-key: <API_KEY>
// ---------------------------------------------------------------------------

prompts.get('/latest', async (c) => {
  const apiKeyHeader = c.req.header('x-api-key') ?? null

  if (!requireApiKey(process.env.API_KEY, apiKeyHeader)) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const payload = await redis.get<PromptEntry>(LATEST_KEY)

  if (!payload) {
    return c.json({ error: 'No prompt available yet' }, 404)
  }


  return c.json(payload, 200)
})

export default prompts

