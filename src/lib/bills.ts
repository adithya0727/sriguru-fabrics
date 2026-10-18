/**
 * Shapes and labels for store receipts.
 *
 * Deliberately free of imports: both the browser table and the server-side
 * reader need these, and receipt-core.ts pulls in the Anthropic SDK. Sharing
 * them from there would drag the whole SDK into the client bundle.
 */

/** Columns common enough to be worth recognising by name, so the same idea is
 *  called the same thing across suppliers. Anything else a bill happens to
 *  carry is kept verbatim per row in `extra`. */
export const STANDARD_COLUMNS = [
  'sl_no',
  'description',
  'quantity',
  'unit',
  'rate',
  'amount',
] as const;

export type StandardColumn = (typeof STANDARD_COLUMNS)[number];

export const COLUMN_LABELS: Record<StandardColumn, string> = {
  sl_no: 'Sl No.',
  description: 'Item',
  quantity: 'Qty',
  unit: 'Unit',
  rate: 'Rate',
  amount: 'Amount',
};

export type LabelledValue = { label: string; value: string };

export type BillItem = {
  sl_no: string | null;
  description: string;
  quantity: string | null;
  unit: string | null;
  rate: string | null;
  amount: string | null;
  extra: LabelledValue[];
};

export type BillCompany = {
  id: string;
  name: string;
  created_at: string;
};

export type Bill = {
  id: string;
  company_id: string;
  bill_number: string | null;
  bill_date: string | null;
  photo_path: string | null;
  columns: StandardColumn[];
  extra_columns: string[];
  items: BillItem[];
  totals: LabelledValue[];
  notes: string | null;
  low_confidence: string[];
  created_at: string;
  updated_at: string;
};

/** An empty row, shaped so every column the bill uses has somewhere to go. */
export function blankItem(): BillItem {
  return {
    sl_no: null,
    description: '',
    quantity: null,
    unit: null,
    rate: null,
    amount: null,
    extra: [],
  };
}

/** Read one cell, standard or extra, without the caller caring which it is. */
export function cellValue(item: BillItem, column: string): string {
  if ((STANDARD_COLUMNS as readonly string[]).includes(column)) {
    return item[column as StandardColumn] ?? '';
  }
  return item.extra.find((e) => e.label === column)?.value ?? '';
}

/** Write one cell, creating the extra entry if this row lacked it. */
export function withCellValue(
  item: BillItem,
  column: string,
  value: string,
): BillItem {
  if ((STANDARD_COLUMNS as readonly string[]).includes(column)) {
    return { ...item, [column]: value === '' ? null : value };
  }
  const extra = [...item.extra];
  const at = extra.findIndex((e) => e.label === column);
  if (at >= 0) extra[at] = { label: column, value };
  else extra.push({ label: column, value });
  return { ...item, extra };
}

export function columnLabel(column: string): string {
  return COLUMN_LABELS[column as StandardColumn] ?? column;
}

/** Bill date for display: the stored value is yyyy-mm-dd, but everyone here
 *  reads dates as day/month. */
export function formatBillDate(date: string | null): string {
  if (!date) return 'No date';
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * A figure off a bill, as a number.
 *
 * Bills are stored exactly as printed so they can be checked against the
 * paper, and her suppliers write numbers several ways. Anything that has to be
 * arithmetic — a cost price, a row check — goes through here, so the
 * conventions are handled in one place:
 *
 *   "1,250.00"  printed       → 1250
 *   "2880/-"    rupee dash    → 2880
 *   "1250=00"   handwritten   → 1250    (was read as 125000 — 100x too high)
 *   "₹980"      symbol        → 980
 *   "56.170"    money, dotted thousands → 56170
 *
 * The last applies to money only. Money never has three decimal places, so a
 * dot before exactly three digits is a thousands mark; but printed bills write
 * quantities as "12.000", which is twelve, not twelve thousand.
 */
export function parseAmount(
  value: string | null | undefined,
  kind: 'money' | 'quantity' = 'money',
): number | null {
  if (!value) return null;
  let v = String(value).trim();
  v = v.replace(/\/-\s*$/, ''); // "2880/-"
  v = v.replace(/=\s*(\d{1,2})\s*$/, '.$1'); // "1250=00" → "1250.00"
  if (kind === 'money' && /^\D*\d{1,3}(\.\d{3})+\D*$/.test(v)) {
    v = v.replace(/\./g, ''); // "56.170" → "56170"
  }
  const cleaned = v.replace(/[^0-9.]/g, '');
  if (cleaned === '' || cleaned.split('.').length > 2) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/**
 * Whether a row adds up: quantity × rate against its amount, to the rupee.
 *
 * Null when the row lacks one of the three, or carries a discount of its own
 * — there the plain product is the wrong test and would flag a correct row.
 * Most of her bills do add up row by row, so a row that doesn't is the single
 * best sign of a misread digit, and worth putting in front of her.
 */
export function rowArithmetic(item: BillItem): { expected: number; ok: boolean } | null {
  if (item.extra.some((e) => /disc|less/i.test(e.label))) return null;
  const quantity = parseAmount(item.quantity, 'quantity');
  const rate = parseAmount(item.rate);
  const amount = parseAmount(item.amount);
  if (quantity == null || rate == null || amount == null) return null;
  if (quantity === 0 || rate === 0) return null;
  const expected = Math.round(quantity * rate * 100) / 100;
  return { expected, ok: Math.abs(expected - amount) < 1 };
}
