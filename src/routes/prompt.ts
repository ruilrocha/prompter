import { createSchema, createYoga } from "graphql-yoga";
import { Hono } from "hono";
import { getTodayDate } from "../lib/date.js";
import { apiKeyAuth, rateLimit } from "../lib/middleware.js";
import { latestLimiter } from "../lib/ratelimit.js";
import { type DailyEntry, entryDateKey, redis } from "../lib/redis.js";

// ---------------------------------------------------------------------------
// GraphQL schema
// Fields are placed directly on Query so the response shape is flat:
// { "data": { "scenario": "...", "arrangement": { ... } } }
// ---------------------------------------------------------------------------

const schema = createSchema({
	typeDefs: /* GraphQL */ `
    type Arrangement {
      "The grounding base of the sound world"
      foundation: String!
      "Elements that fill the space and add texture and colour"
      supporting: String!
      "The expressive, leading voice — what carries, soars, or cuts through"
      singing: String!
    }

    type Query {
      "A brief evocative creative scenario applicable to any art form"
      scenario: String
      "Tonal layers guiding sound and music creation"
      arrangement: Arrangement
    }
  `,
	resolvers: {
		Query: {
			scenario: async (): Promise<string | null> => {
				const entry = await redis.get<DailyEntry>(entryDateKey(getTodayDate()));
				return entry?.scenario ?? null;
			},
			arrangement: async (): Promise<DailyEntry["arrangement"] | null> => {
				const entry = await redis.get<DailyEntry>(entryDateKey(getTodayDate()));
				return entry?.arrangement ?? null;
			},
		},
	},
});

// ---------------------------------------------------------------------------
// Yoga instance — GraphiQL shown automatically in browser (Accept: text/html)
// ---------------------------------------------------------------------------

const yoga = createYoga({ schema, graphqlEndpoint: "/prompt" });

// ---------------------------------------------------------------------------
// Hono router — auth + rate limiting applied before the Yoga handler
// ---------------------------------------------------------------------------

const prompt = new Hono();

prompt.all("/", apiKeyAuth(), rateLimit(latestLimiter), async (c) => {
	const req = c.req.raw;
	return yoga.fetch(req.url, {
		method: req.method,
		headers: req.headers,
		body: req.body,
	});
});

export default prompt;
