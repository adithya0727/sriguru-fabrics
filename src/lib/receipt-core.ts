import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { STANDARD_COLUMNS } from './bills';

/**
 * The model that reads bills.
 *
 * Deliberately one constant: Haiku 4.5 is the cheapest vision model (~$0.007 a
 * bill), and it is also the weakest at handwriting and thermal print, which is
 * what a lot of saree bills are. Judge it on real bills, and if it misreads
 * them, change this line — `claude-sonnet-5` costs about twice as much and is
 * markedly better at messy input.
 *
 * NOTE: Haiku 4.5 rejects two things the saree tagger used to send. Adaptive
 * thinking is 4.6+ only, and `output_config.effort` errors outright here. If
 * you move this to a Claude 5 model you can add them back; while it points at
 * Haiku, leave them off.
 */
const MODEL = 'claude-haiku-4-5';

/** A label/value pair. Used for a bill's own columns and for its totals rows,
 *  both of which vary per supplier and so cannot be fixed fields. */
const LabelledValue = z.object({
  label: z.string(),
  value: z.string(),
});

const LineItem = z.object({
  sl_no: z.string().nullable(),
  description: z.string(),
  quantity: z.string().nullable(),
  unit: z.string().nullable(),
  rate: z.string().nullable(),
  amount: z.string().nullable(),
  extra: z
    .array(LabelledValue)
    .describe(
      'Any other cell on this row, labelled with that column\'s heading. ' +
        'Empty array if the row has nothing beyond the standard columns.',
    ),
});

const ReceiptSchema = z.object({
  company_name: z
    .string()
    .describe(
      'The shop or company name printed at the top of the bill, copied exactly ' +
        'as written. If no name is printed, answer "Unknown" and say so in ' +
        'low_confidence.',
    ),
  bill_number: z.string().nullable(),
  bill_date: z
    .string()
    .nullable()
    .describe('As yyyy-mm-dd if you can work it out, otherwise exactly as printed.'),
  columns: z
    .array(z.enum(STANDARD_COLUMNS))
    .describe(
      'Which of the standard columns this bill actually shows, in the order ' +
        'they appear on it. Leave out any column the bill does not have — do ' +
        'not include a column just because it is available.',
    ),
  extra_columns: z
    .array(z.string())
    .describe(
      'Headings of any other columns this bill has, in order — HSN, Discount, ' +
        'GST and so on. Empty if it has none.',
    ),
  items: z.array(LineItem),
  totals: z
    .array(LabelledValue)
    .describe(
      'The summary rows under the items — Subtotal, GST, Discount, Grand ' +
        'Total. Copy the labels the bill uses. Empty if it shows none.',
    ),
  notes: z.string().nullable(),
  low_confidence: z
    .array(z.string())
    .describe(
      'Anything you could not read confidently, named so a person can check ' +
        'it — for example "row 3 rate" or "bill_date". Be honest: a flagged ' +
        'guess costs a glance, an unflagged wrong number corrupts the books.',
    ),
});

export type ExtractedReceipt = z.infer<typeof ReceiptSchema>;

export type ReceiptResult = {
  receipt: ExtractedReceipt;
  usage: { inputTokens: number; outputTokens: number; estimatedCostUsd: number };
};

const SYSTEM_PROMPT = `
You read supplier bills for Sri Guru Raghavendra Fabrics, a family saree
business in Chikkalasandra, Bangalore, and turn them into a table.

These are small-trade Indian bills: printed, handwritten, or a printed form
filled in by hand. They may mix English with Kannada or Hindi, use Indian
digit grouping (1,23,456.00), and abbreviate units as mtr, mts, pcs, nos.

DATES ARE DAY/MONTH/YEAR
These are Indian bills, so 12/09/2026 means 12 September 2026 — not 9 December.
Read every date that way when converting to yyyy-mm-dd. When both numbers are
12 or under the order cannot be proved from the page, so convert it as
day/month and name "bill_date" in low_confidence so a person confirms it.

COPY, DO NOT INTERPRET
Transcribe what is printed. Keep the seller's own wording and spelling for
item names, and keep numbers exactly as written — do not convert "1,250.00"
to 1250, do not add currency symbols, do not recompute a total you think is
wrong. A person is checking this against the paper, so it has to match it.

ONLY THE COLUMNS THIS BILL HAS
Bills differ. Report only the columns actually present on this one. If there
is no unit column, leave unit out of the columns list and null on every row.
Never invent a column, and never pad a row with a value that is not printed.

WHAT YOU CANNOT READ
Some of these are hard to read, and a plausible wrong digit is worse than an
admitted gap. If a figure is unclear, give your best reading and name that
cell in low_confidence. If a cell is genuinely blank, leave it null.
`.trim();

/**
 * Read one photographed bill.
 *
 * @param image base64 JPEG, downscaled by the caller to about 1024px wide.
 *   The API caps images near 1.19 megapixels, so anything larger is resized
 *   away before the model sees it — bigger uploads buy no extra legibility,
 *   only slower uploads on a phone.
 */
export async function readReceipt(image: {
  base64: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
}): Promise<ReceiptResult> {
  const client = new Anthropic();

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    output_config: { format: zodOutputFormat(ReceiptSchema) },
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        // Identical on every bill, so it should be paid for once.
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: image.mediaType,
              data: image.base64,
            },
          },
          { type: 'text', text: 'Read this bill.' },
        ],
      },
    ],
  });

  const parsed = response.parsed_output;
  if (!parsed) {
    throw new Error('Could not read this bill. Enter the details by hand.');
  }

  // Haiku 4.5 pricing: $1 / $5 per million tokens.
  const usage = response.usage;
  const inputTokens =
    usage.input_tokens +
    (usage.cache_read_input_tokens ?? 0) +
    (usage.cache_creation_input_tokens ?? 0);

  return {
    receipt: parsed as ExtractedReceipt,
    usage: {
      inputTokens,
      outputTokens: usage.output_tokens,
      estimatedCostUsd:
        (usage.input_tokens * 1 +
          (usage.cache_read_input_tokens ?? 0) * 0.1 +
          (usage.cache_creation_input_tokens ?? 0) * 1.25 +
          usage.output_tokens * 5) /
        1_000_000,
    },
  };
}
