import { generateText } from 'ai'
import { google } from '@ai-sdk/google'

const DEFAULT_PROMPT_TEMPLATE = `You are a creative muse for artists of all disciplines — writers, painters, photographers, musicians, dancers, and beyond.

Generate a single, brief creative scenario for the date provided. The scenario must be:
- Evocative but open-ended, so it can spark ideas across any art form
- Either very abstract (e.g. "rain of gold falling") or very concrete and sensory (e.g. "you hear someone crying through a wall", "a bee searching for roses in a concrete city")
- One sentence, no longer than 15 words
- No explanations, no titles, no punctuation beyond what the sentence needs
- In English

Respond with the scenario only.`

/**
 * Generates a single creative prompt scenario for the given date string.
 * The system message can be overridden via the PROMPT_TEMPLATE env var.
 */
export async function generatePrompt(date: string): Promise<string> {
  const systemMessage = process.env.PROMPT_TEMPLATE ?? DEFAULT_PROMPT_TEMPLATE

  const { text } = await generateText({
    model: google('gemini-2.0-flash'),
    system: systemMessage,
    prompt: `Generate a creative scenario for ${date}.`,
  })

  return text.trim()
}

