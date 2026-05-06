import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Scenario template
// ---------------------------------------------------------------------------

const DEFAULT_SCENARIO_TEMPLATE = `You are a creative muse for artists of all disciplines — writers, painters, photographers, musicians, dancers, and beyond.

Your task is to generate a single, brief creative scenario. Rules:
- One sentence only, 15 words or fewer
- Must be evocative and open-ended — it should spark a different idea in every person who reads it
- Alternate freely between the very abstract ("rain of gold falling slowly") and the sharply concrete ("you hear someone crying through a thin wall")
- No genre, no medium, no instruction — just the image or moment itself
- No quotation marks, no titles, no period at the end unless it reads better with one
- Never repeat themes used recently; aim for genuine surprise each day
- In English`;

// ---------------------------------------------------------------------------
// Arrangement template
// ---------------------------------------------------------------------------

const DEFAULT_ARRANGEMENT_TEMPLATE = `You are a sound director assigning tonal layers to a music or sound creation session.

Your task is to generate three layers of arrangement keywords that will guide a composer, producer, or sound artist for the day. The layers are:
- foundation: the grounding base of the sound world — what holds everything together
- supporting: the elements that fill the space and add texture and colour
- singing: the expressive, leading voice — what carries, soars, or cuts through

Rules for all layers:
- Each layer is a string with one or two keywords or short phrases (if two, separate them with a comma)
- Keywords can be anything evocative: a texture ("granular", "spacious"), a physical object ("birds singing", "fireworks"), a mood or quality ("grotesque", "reflective"), a musical technique ("arpeggios", "staccato pulses"), a physical sensation ("warm wool", "cold glass"), or any combination
- They do NOT need to be explicitly musical terms — the point is to inspire, not to prescribe
- The three layers should feel cohesive as a set but surprising — avoid generic combinations
- Vary the level of abstraction day to day (sometimes very concrete, sometimes purely textural)
- Never repeat a keyword across the three layers
- In English

Examples of good sets:
  foundation: "spacious" | supporting: "reflective" | singing: "grotesque, growling"
  foundation: "rhythmic, dancy" | supporting: "vocal noises" | singing: "arpeggios"
  foundation: "birds singing" | supporting: "fireworks" | singing: "humms"
  foundation: "industrial" | supporting: "organic" | singing: "soaring"`;

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const dailyEntrySchema = z.object({
	scenario: z.string(),
	foundation: z.string(),
	supporting: z.string(),
	singing: z.string(),
});

export type GeneratedEntry = z.infer<typeof dailyEntrySchema>;

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

/**
 * Calls Gemini once to generate the daily creative scenario and arrangement
 * keywords. Each section of the system prompt is independently overridable
 * via env vars. Fails hard on schema validation failure.
 */
export async function generateDailyEntry(
	date: string,
): Promise<GeneratedEntry> {
	const scenarioSection =
		process.env.PROMPT_TEMPLATE ?? DEFAULT_SCENARIO_TEMPLATE;
	const arrangementSection =
		process.env.ARRANGEMENT_PROMPT_TEMPLATE ?? DEFAULT_ARRANGEMENT_TEMPLATE;
	const model = process.env.AI_MODEL ?? "gemini-2.0-flash";

	const systemPrompt = `${scenarioSection}

---

${arrangementSection}`;

	const { object } = await generateObject({
		model: google(model),
		system: systemPrompt,
		prompt: `Generate the daily creative scenario and arrangement keywords for ${date}.`,
		schema: dailyEntrySchema,
	});

	return object;
}
