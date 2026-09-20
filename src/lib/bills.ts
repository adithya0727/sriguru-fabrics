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
 * paper — "1,450.00", "₹890", "12 pcs". Anything that has to be arithmetic
 * (a cost price, a piece count) goes through here rather than being parsed at
 * the call site, so Indian digit grouping is handled in one place.
 */
export function parseAmount(value: string | null | undefined): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.]/g, '');
  if (cleaned === '') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
