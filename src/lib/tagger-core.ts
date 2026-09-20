
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import {
  BANNED_PHRASES,
  BORDERS,
  CATEGORIES,
  CATEGORY_NOTES,
  FABRICS,
  MOTIFS,
  OCCASIONS,
} from './vocabulary';
import type { TaggedAttributes } from './types';

/**
 * Haiku 4.5 — about a fifth of what Opus 5 cost per saree (~$0.024 to ~$0.005).
 *
 * The trade is judgement: it is weaker at the genuinely hard calls, above all
 * telling pure silk from semi silk in a photograph. That is what low_confidence
 * is for, and every listing is reviewed by a person before it goes out.
 *
 * Haiku 4.5 also rejects two parameters a Claude 5 model accepts — adaptive
 * thinking (4.6+ only) and `output_config.effort` (errors here). Both were
 * removed below. Put them back if this ever points at a Claude 5 model again.
 */
const MODEL = 'claude-haiku-4-5';

const TagSchema = z.object({
  name: z
    .string()
    .describe(
      'Short product name, 2-4 words, in the shop\'s plain style — the colour ' +
        'and whatever stands out. e.g. "Peacock Blue with Golden Butta" or ' +
        '"Red Pallu, Green Body". Do NOT include the saree type (Gadwal, ' +
        'Ilkal, Paithani, Chiffon and so on): it is recorded separately in ' +
        'category and is displayed right beside the name, so naming it here ' +
        'prints it twice.',
    ),
  description: z
    .string()
    .describe(
      'Two short sentences a customer would find useful: what it is, what it ' +
        'looks like, and when someone would wear it. Plain language, no sales ' +
        'adjectives.',
    ),
  category: z.enum(CATEGORIES),
  fabric: z.enum(FABRICS),
  colors: z
    .array(z.string())
    .describe('One to three plain colour names, most prominent first.'),
  border: z.enum(BORDERS),
  motifs: z.array(z.enum(MOTIFS)),
  tags: z
    .array(z.string())
    .describe('Three to six short search keywords a customer might type.'),
  has_blouse: z
    .boolean()
    .describe(
      'True only if an attached or matching blouse piece is actually visible ' +
        'in a photo. If you cannot see one, answer false and list "has_blouse" ' +
        'in low_confidence.',
    ),
  occasion: z.enum(OCCASIONS),
  low_confidence: z
    .array(z.string())
    .describe(
      'Field names you are genuinely unsure about, so a person can check them. ' +
        'Be honest — an unflagged wrong guess is worse than a flagged one. ' +
        'Fabric is frequently uncertain from a photograph; say so when it is.',
    ),
});

const SYSTEM_PROMPT = `
You catalogue sarees for Sri Guru Raghavendra Fabrics, a family saree business
in Chikkalasandra, Bangalore. You are shown photographs of one saree and you
fill in its listing.

The shop sources traditional handloom sarees — mostly the South Indian Gadwal
and Ilkal, with some Maharashtrian Paithani — plus soft silks, plain cottons,
chiffons and some printed fancy pieces. Customers are largely local women
buying for festivals, weddings, gifting and daily wear.

HOW TO IDENTIFY THE CATEGORY
${CATEGORY_NOTES}

HOUSE STYLE
Write the way the shop writes: direct and concrete. Name the colour, the
border, the motif. A good description reads "Semi silk with a golden butta all
over and a contrast bentex border. Light enough for all-day wear at a function."

Never use these words or anything like them: ${BANNED_PHRASES.join(', ')}.
Do not describe how the saree will make someone feel. Do not mention price,
quality grading, or authenticity claims — the shop makes those judgements, not you.

BEING HONEST ABOUT WHAT YOU CANNOT SEE
Distinguishing pure silk from semi silk from a photograph is genuinely hard.
So is judging whether a blouse piece is included. Make your best guess, then
list those field names in low_confidence so a person checks them. A person will
review every listing, so a flagged uncertainty costs nothing and a confident
wrong answer costs a customer's trust.
`.trim();

export type TagResult = {
  attributes: TaggedAttributes;
  usage: { inputTokens: number; outputTokens: number; estimatedCostUsd: number };
};

/**
 * Reads a saree's photos and fills in its listing.
 *
 * @param images base64-encoded JPEGs, already downscaled by the caller to
 *   roughly 768px on the long edge. Resolution beyond that buys no accuracy
 *   but costs tokens on every single upload, which matters at this scale.
 */
export async function tagSareePhotos(
  images: { base64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' }[],
): Promise<TagResult> {
  if (images.length === 0) throw new Error('At least one photo is required');

  const client = new Anthropic();

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 2000,
    output_config: { format: zodOutputFormat(TagSchema) },
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        // Stable across every upload, so it should be paid for once, not once
        // per saree.
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: [
          ...images.map(
            (img) =>
              ({
                type: 'image' as const,
                source: {
                  type: 'base64' as const,
                  media_type: img.mediaType,
                  data: img.base64,
                },
              }),
          ),
          {
            type: 'text',
            text:
              images.length > 1
                ? 'These photographs are all of the same saree. Catalogue it.'
                : 'Catalogue this saree.',
          },
        ],
      },
    ],
  });

  const parsed = response.parsed_output;
  if (!parsed) {
    throw new Error('The tagger could not read these photos. Enter details manually.');
  }

  // Haiku 4.5 pricing: $1 / $5 per million tokens.
  const inputTokens =
    response.usage.input_tokens +
    (response.usage.cache_read_input_tokens ?? 0) +
    (response.usage.cache_creation_input_tokens ?? 0);
  const outputTokens = response.usage.output_tokens;

  return {
    attributes: parsed as TaggedAttributes,
    usage: {
      inputTokens,
      outputTokens,
      estimatedCostUsd:
        (response.usage.input_tokens * 1 +
          (response.usage.cache_read_input_tokens ?? 0) * 0.1 +
          (response.usage.cache_creation_input_tokens ?? 0) * 1.25 +
          outputTokens * 5) /
        1_000_000,
    },
  };
}
