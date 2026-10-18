
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
 * Sonnet 5.5 at medium effort — a step below the bill reader, as asked, and
 * chosen on her own sarees.
 *
 * Graded against 40 sarees, using the line her own cost price points to as
 * the right answer (each line on those bills has a distinct rate). On the 28
 * not used for tuning, Haiku 4.5 matched 4 correctly and 11 to the WRONG line
 * — silently writing a wrong cost price each time — and crashed outright on 2,
 * which is what left sarees saved as "Untitled saree". Sonnet 5.5 matched 15
 * correctly and never once chose a wrong line: when it is unsure it answers
 * "no match", and the form then asks her to pick. Median 3s, against Haiku's 6.
 *
 * Medium effort and a 1280px photo were the best of the configurations tried;
 * low effort found fewer matches, and medium on a 768px photo made a mistake.
 */
const MODEL = 'claude-sonnet-5-5';

const BASE_SHAPE = {
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
};

const TagSchema = z.object(BASE_SHAPE);

/** Used when the saree is known to have come from a particular bill, so the
 *  model can say which line of it this is. */
const MatchedTagSchema = z.object({
  ...BASE_SHAPE,
  matched_item: z
    .number()
    .int()
    .describe(
      'The number of the bill line this saree is, from the list given. Use -1 ' +
        'when none of them plausibly describes it — a wrong match copies a ' +
        'wrong cost price into the books, so refusing is the safer answer.',
    ),
});

/** One line from the bill the saree is being matched against. */
export type BillCandidate = {
  /** 1-based, matching the numbering shown to the model. */
  number: number;
  description: string;
  quantity: string | null;
  rate: string | null;
};

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
  /** Which bill line the saree was matched to, or null when no bill was given
   *  or none of its lines fitted. */
  matchedNumber: number | null;
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
  candidates: BillCandidate[] = [],
): Promise<TagResult> {
  if (images.length === 0) throw new Error('At least one photo is required');

  const client = new Anthropic();
  const matching = candidates.length > 0;

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    thinking: { type: 'adaptive' },
    output_config: {
      effort: 'medium',
      format: zodOutputFormat(matching ? MatchedTagSchema : TagSchema),
    },
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
            // The bill's lines belong here rather than in the system prompt.
            // That prompt is cached and identical for every upload; folding a
            // different bill into it would throw the cache away each time.
            text: [
              images.length > 1
                ? 'These photographs are all of the same saree. Catalogue it.'
                : 'Catalogue this saree.',
              matching ? matchingInstructions(candidates) : '',
            ]
              .filter(Boolean)
              .join('\n\n'),
          },
        ],
      },
    ],
  });

  if (response.stop_reason === 'refusal') {
    throw new Error('These photos could not be read. Enter the details by hand.');
  }
  const parsed = response.parsed_output;
  if (!parsed) {
    throw new Error('The tagger could not read these photos. Enter details manually.');
  }

  // Sonnet 5.5 pricing, per million tokens: $2 in, $10 out (thinking
  // included), cache reads $0.10, cache writes $2.50.
  const inputTokens =
    response.usage.input_tokens +
    (response.usage.cache_read_input_tokens ?? 0) +
    (response.usage.cache_creation_input_tokens ?? 0);
  const outputTokens = response.usage.output_tokens;

  // matched_item exists only when a bill was supplied, so the parsed value is
  // read through a record rather than a shape the base schema does not have.
  const matchedRaw = (parsed as Record<string, unknown>).matched_item;
  const matchedNumber =
    matching && typeof matchedRaw === 'number' ? matchedRaw : -1;

  return {
    attributes: parsed as TaggedAttributes,
    matchedNumber: matchedNumber > 0 ? matchedNumber : null,
    usage: {
      inputTokens,
      outputTokens,
      estimatedCostUsd:
        (response.usage.input_tokens * 2 +
          (response.usage.cache_read_input_tokens ?? 0) * 0.1 +
          (response.usage.cache_creation_input_tokens ?? 0) * 2.5 +
          outputTokens * 10) /
        1_000_000,
    },
  };
}

/**
 * The bill's lines, as the model sees them.
 *
 * Quantity and rate are included because they discriminate: six pieces of a
 * green Gadwal is a far firmer match than "green" alone, and the rate is what
 * gets copied into the books if the match is accepted.
 */
function matchingInstructions(candidates: BillCandidate[]): string {
  const lines = candidates
    .map((c) => {
      const detail = [
        c.quantity ? `${c.quantity} pcs` : null,
        c.rate ? `@ ${c.rate}` : null,
      ]
        .filter(Boolean)
        .join(' ');
      return `${c.number}. ${c.description}${detail ? ` — ${detail}` : ''}`;
    })
    .join('\n');

  return `This saree was bought on a bill with these lines:

${lines}

Work out which line it is, using the type, the colour and anything else the
wording names. Answer with that number in matched_item.

Be willing to say no. If nothing here plausibly describes the saree in the
photographs, answer -1. The rate on a matched line becomes the recorded cost
price, so a forced match quietly corrupts the accounts — an honest -1 costs
nothing but a moment of typing.`;
}
