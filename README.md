# Prompter

A Hono API deployed on Vercel that generates daily creative scenarios using Gemini (via the Vercel AI SDK) and stores them in Upstash Redis (KV).

Prompts are brief, evocative scenarios applicable to any art form — writing, painting, music, photography, etc.

---

## Endpoints

### `POST /prompts/generate`

Generates a writing prompt for **tomorrow's date** and saves it to Redis.

- **Auth:** `Authorization: Bearer <CRON_SECRET>`
- **Idempotent:** Returns the cached prompt (HTTP 200) if one already exists for that date; otherwise generates, saves, and returns (HTTP 201).
- **Response:**
  ```json
  { "date": "2026-05-07", "prompt": "a bee searching for roses in a concrete city", "cached": false }
  ```

### `GET /prompts/latest`

Returns the most recently generated prompt.

- **Auth:** `x-api-key: <API_KEY>` header
- **Response:**
  ```json
  { "date": "2026-05-07", "prompt": "a bee searching for roses in a concrete city" }
  ```
- Returns `404` if no prompt has been generated yet.

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values.

| Variable          | Description                                                       |
|-------------------|-------------------------------------------------------------------|
| `KV_REST_API_URL` | Upstash Redis REST URL (set automatically by Vercel KV integration) |
| `KV_REST_API_TOKEN` | Upstash Redis token (set automatically by Vercel KV integration) |
| `CRON_SECRET`     | Shared secret for the `/prompts/generate` endpoint               |
| `API_KEY`         | API key for the `/prompts/latest` endpoint                       |
| `PROMPT_TEMPLATE` | *(Optional)* Override the Gemini system prompt                   |

---

## GitHub Actions Cron

The workflow at `.github/workflows/daily-prompt.yml` hits `POST /prompts/generate` every day at **21:00 UTC** (generating the prompt for the following day).

Add these secrets to your GitHub repository (`Settings → Secrets and variables → Actions`):

| Secret              | Value                                   |
|---------------------|-----------------------------------------|
| `CRON_SECRET`       | Same value as the Vercel env var        |
| `PROMPTER_API_URL`  | Your deployed Vercel URL (no trailing slash), e.g. `https://prompter.vercel.app` |

---

## Development

Prerequisites:

- [Vercel CLI](https://vercel.com/docs/cli) installed globally

```bash
cp .env.example .env.local   # fill in your values
pnpm install
vc dev
```

```
open http://localhost:3000
```

## Build & Deploy

```bash
pnpm install
vc build    # local build
vc deploy   # deploy to Vercel
```
