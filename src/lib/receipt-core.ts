import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { STANDARD_COLUMNS } from './bills';

/**
 * The model that reads bills: Opus 5.5, at low effort.
 *
 * Chosen on her own bills, not on a demo. Against four real ones — a
 * handwritten Gadwal estimate, a notebook page photographed sideways, a
 * printed GST invoice and a 22-line wholesale bill — Haiku 4.5 named none of
 * the four items on the handwritten bill correctly and put it in the wrong
 * month; Opus 5.5 read every number right, read printed shop names letter for
 * letter (Haiku had split one supplier into three), and flagged the single
 * row that did not add up. It took 3-13s, no slower than Haiku had been.
 *
 * Effort stays low on purpose. Medium was no more accurate here and added a
 * few seconds, and every second counts against the host's request limit.
 * Opus 5.5 always thinks, so adaptive thinking is not optional for it.
 */
const MODEL = 'claude-opus-5-5';

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
      'Cells you genuinely could not read, named so a person can check them — ' +
        'e.g. "row 3 rate" or "bill_date". Only real doubt: never a cell you ' +
        'then confirmed, and never commentary. An unflagged wrong number ' +
        'corrupts the books; a needless flag teaches people to ignore flags.',
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

Handwritten dates often use upright strokes as separators, and a stroke looks
exactly like the digit 1: "18|1|25" is 18 January 2025, not 18 November. Count
the strokes against the digits before deciding, and if a stroke could be a
separator or a 1, flag "bill_date" — a wrong month files the bill in the wrong
season and nobody notices.

THE PHOTO MAY BE SIDEWAYS
Bills are often photographed at an angle, turned 90 degrees, or upside down,
and some are a page torn from a notebook. Read the text in whichever direction
it actually runs. A rotated page is not an unreadable one.

THE SHOP NAME
Usually printed at the top, but on handwritten estimates it may be written in
by hand, sometimes in brackets beside a place name. Copy it letter for letter
— the same shop read two slightly different ways becomes two separate
suppliers in the books, so check every letter of a printed name.

COPY, DO NOT INTERPRET
Transcribe what is printed. Keep the seller's own wording and spelling for
item names, and keep numbers exactly as written — do not convert "1,250.00"
to 1250, do not add currency symbols, do not recompute a total you think is
wrong. A person is checking this against the paper, so it has to match it.

Handwritten bills abbreviate. Where a line is shorthand and its full name is
written nearby — a heading above it, a note beside it — give both: the line as
written, then the full name in brackets, e.g. "MGLR (MANGALGIRI)". If there is
no full name on the page, give the line as written and nothing more; never
expand an abbreviation from your own knowledge.

USE THE ARITHMETIC
On most bills quantity × rate = amount, and the amounts add up to the total.
When a digit is hard to read, let that relationship decide it. A row whose
three numbers agree is confirmed; do not flag it.

ONLY THE COLUMNS THIS BILL HAS
Bills differ. Report only the columns actually present on this one. If there
is no unit column, leave unit out of the columns list and null on every row.
Never invent a column, and never pad a row with a value that is not printed.

WHAT YOU CANNOT READ
A plausible wrong digit is worse than an admitted gap. If something is
genuinely unclear, give your best reading and name that cell in
low_confidence. If a cell is blank, leave it null.

Flag only real doubt. A person reads every flag, so each one must be worth
their attention: do not flag something you then confirmed, do not flag a row
because the handwriting is untidy if you read it with confidence, and do not
add commentary. Name the cell and nothing else — "row 2 rate", "bill_date".
`.trim();

/**
 * Read one photographed bill.
 *
 * @param image base64 JPEG, about 2576px on its long edge. That is where
 *   Opus 5.5 stops taking in more detail (measured: ~4,750 image tokens there,
 *   against ~1,050 at the 1024px this used to send). Small handwritten digits
 *   are exactly what the extra resolution is for.
 */
export async function readReceipt(image: {
  base64: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
}): Promise<ReceiptResult> {
  const client = new Anthropic();

  const response = await client.messages.parse({
    model: MODEL,
    // Room for its thinking plus a long bill — the 22-line one ran to ~1,700
    // output tokens.
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'low', format: zodOutputFormat(ReceiptSchema) },
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

  // A declined request returns successfully with no content; say so plainly
  // rather than surfacing it as an empty bill.
  if (response.stop_reason === 'refusal') {
    throw new Error('This photo could not be read. Enter the details by hand.');
  }
  const parsed = response.parsed_output;
  if (!parsed) {
    throw new Error('Could not read this bill. Enter the details by hand.');
  }

  // Opus 5.5 pricing, per million tokens: $4 in, $20 out (thinking included),
  // cache reads $0.20, cache writes $5.
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
        (usage.input_tokens * 4 +
          (usage.cache_read_input_tokens ?? 0) * 0.2 +
          (usage.cache_creation_input_tokens ?? 0) * 5 +
          usage.output_tokens * 20) /
        1_000_000,
    },
  };
}
