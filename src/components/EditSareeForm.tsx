'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getBrowserClient } from '@/lib/supabase/client';
import type { Saree } from '@/lib/types';
import { formatBillDate, parseAmount } from '@/lib/bills';
import { BORDERS, FABRICS } from '@/lib/vocabulary';
import ChoiceField from './ChoiceField';
import BillLinePicker, { type LineChoice } from './BillLinePicker';
import SareePhoto from './SareePhoto';

/** The bill a saree was bought on, with the lines it could be. */
export type SareeBill = {
  id: string;
  company: string;
  billDate: string | null;
  lines: { description: string; rate: string | null }[];
};

export default function EditSareeForm({
  saree,
  categories,
  bill,
}: {
  saree: Saree;
  categories: string[];
  bill: SareeBill | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: saree.name,
    description: saree.description,
    category: saree.category,
    fabric: saree.fabric ?? '',
    border: saree.border ?? '',
    price: String(saree.price),
    cost_price: saree.cost_price != null ? String(saree.cost_price) : '',
    // Every saree here is a single piece, so stock is a yes or a no.
    forSale: saree.quantity_available > 0,
    has_blouse: saree.has_blouse,
  });
  const [line, setLine] = useState<LineChoice>(() => {
    const at = bill?.lines.findIndex((l) => l.description === saree.bill_item_name) ?? -1;
    return at >= 0 ? at : null;
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function rateOf(index: number): string {
    const rate = parseAmount(bill?.lines[index]?.rate);
    return rate != null ? String(rate) : '';
  }

  /** Choosing a line puts its rate in the cost price — that is what fixing a
   *  wrong match means. It can still be typed over afterwards. */
  function chooseLine(choice: LineChoice) {
    setLine(choice);
    if (typeof choice === 'number') {
      const rate = rateOf(choice);
      if (rate) setForm((f) => ({ ...f, cost_price: rate }));
    }
  }

  async function save() {
    setError(null);
    // Both of these go straight onto the public catalogue.
    if (!form.name.trim()) {
      setError('Please give this saree a name.');
      return;
    }
    const price = Number(form.price);
    if (!Number.isFinite(price) || price <= 0) {
      setError('Please enter the selling price.');
      return;
    }

    setBusy(true);

    // Only touch the bill link if she changed it; otherwise leave it exactly
    // as it was.
    const billFields =
      line === null || !bill
        ? {}
        : line === 'none'
          ? { bill_id: null, bill_item_name: null, supplier: null, purchased_on: null }
          : {
              bill_id: bill.id,
              bill_item_name: bill.lines[line]?.description ?? null,
              supplier: bill.company,
              purchased_on: bill.billDate,
            };

    const { error } = await getBrowserClient()
      .from('sarees')
      .update({
        name: form.name.trim(),
        description: form.description,
        category: form.category,
        fabric: form.fabric || null,
        border: form.border || null,
        price,
        cost_price: form.cost_price ? Number(form.cost_price) : null,
        quantity_available: form.forSale ? 1 : 0,
        // Kept at least 1, because available can never exceed it.
        quantity_total: Math.max(1, saree.quantity_total),
        has_blouse: form.has_blouse,
        ...billFields,
      })
      .eq('id', saree.id);

    if (error) {
      setError(`Could not save: ${error.message}`);
      setBusy(false);
      return;
    }
    router.push('/admin');
    router.refresh();
  }

  async function remove() {
    setBusy(true);
    setError(null);
    const { error } = await getBrowserClient()
      .from('sarees')
      .delete()
      .eq('id', saree.id);

    if (error) {
      // The schema blocks deleting anything with sales against it, so the
      // books can't be quietly rewritten by removing a saree.
      setError(
        error.message.includes('violates foreign key')
          ? 'This saree has a sale recorded against it, so it can’t be deleted. Switch off “For sale” instead.'
          : `Could not delete: ${error.message}`,
      );
      setBusy(false);
      return;
    }
    router.push('/admin');
    router.refresh();
  }

  const margin =
    Number(form.price) > 0 && Number(form.cost_price) > 0
      ? Number(form.price) - Number(form.cost_price)
      : null;

  return (
    <div className="max-w-lg mx-auto px-5 py-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-maroon-700 transition-colors mb-4 py-1"
      >
        <ArrowLeft size={16} /> Back to stock
      </Link>

      <h1 className="font-display text-[1.75rem] text-maroon-900 leading-tight mb-5">
        Edit saree
      </h1>

      {saree.photos.length > 0 && (
        <div className="flex gap-2.5 mb-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {saree.photos.map((url) => (
            <div key={url} className="frame w-20 h-[6.5rem] shrink-0">
              <SareePhoto
                url={url}
                alt=""
                widths={[128, 256]}
                sizes="80px"
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      <section className="card p-5 mb-4 space-y-4">
        <h2 className="eyebrow">Prices</h2>
        <Row label="Cost price" hint="Only we see this. Used for profit.">
          <div className="relative">
            <span className="field-prefix">₹</span>
            <input
              type="number"
              inputMode="numeric"
              value={form.cost_price}
              onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
              className="field field-money"
            />
          </div>
        </Row>
        <Row
          label="Selling price"
          hint={
            margin == null
              ? undefined
              : margin > 0
                ? `₹${margin.toLocaleString('en-IN')} on this saree.`
                : 'This is at or below the cost price.'
          }
        >
          <div className="relative">
            <span className="field-prefix">₹</span>
            <input
              type="number"
              inputMode="numeric"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="field field-money text-lg font-medium"
            />
          </div>
        </Row>

        {/* A switch rather than a stock count: each saree is one piece, so the
            only question is whether it is still on offer. */}
        <button
          type="button"
          role="switch"
          aria-checked={form.forSale}
          onClick={() => setForm({ ...form, forSale: !form.forSale })}
          className="w-full flex items-center justify-between gap-4 pt-1 text-left"
        >
          <span>
            <span className="block text-sm font-medium text-ink">For sale</span>
            <span className="block text-xs text-ink-soft mt-0.5">
              {form.forSale
                ? 'Shown in stock and on the catalogue.'
                : 'Hidden from stock and the catalogue.'}
            </span>
          </span>
          <span
            aria-hidden
            className={`relative w-12 h-7 rounded-full shrink-0 transition-colors ${
              form.forSale ? 'bg-maroon-700' : 'bg-line-strong'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                form.forSale ? 'translate-x-5' : ''
              }`}
            />
          </span>
        </button>
      </section>

      <section className="card p-5 mb-4 space-y-4">
        <h2 className="eyebrow">Details</h2>
        <Row label="Name">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="field"
          />
        </Row>
        <Row label="Description">
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="field"
          />
        </Row>
        <Row label="Type">
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="field"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Row>
        <Row label="Fabric">
          <ChoiceField
            value={form.fabric}
            options={FABRICS}
            onChange={(fabric) => setForm({ ...form, fabric })}
          />
        </Row>
        <Row label="Border">
          <ChoiceField
            value={form.border}
            options={BORDERS}
            onChange={(border) => setForm({ ...form, border })}
          />
        </Row>
        <label className="flex items-center gap-3 py-1 cursor-pointer">
          <input
            type="checkbox"
            checked={form.has_blouse}
            onChange={(e) => setForm({ ...form, has_blouse: e.target.checked })}
            className="w-5 h-5 accent-maroon-700"
          />
          <span className="text-sm text-ink">Blouse piece included</span>
        </label>
      </section>

      {bill && bill.lines.length > 0 && (
        <div className="mb-4">
          <BillLinePicker
            lines={bill.lines}
            chosen={line}
            onChoose={chooseLine}
            intro={`From ${bill.company}${
              bill.billDate ? `, ${formatBillDate(bill.billDate)}` : ''
            }. If the line is wrong or missing, tap the right one — it fills in the cost price.`}
          />
          <Link
            href={`/admin/receipts/${bill.id}`}
            className="inline-flex items-center gap-1 text-sm text-maroon-700 font-medium mt-2.5 py-1"
          >
            Open the bill →
          </Link>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="text-sm text-bad bg-bad-bg border border-bad/20 rounded-lg px-3 py-2.5 mb-4"
        >
          {error}
        </p>
      )}

      <button onClick={save} disabled={busy} className="btn btn-primary w-full mb-3">
        {busy ? 'Saving…' : 'Save changes'}
      </button>

      {confirmDelete ? (
        <div className="card border-bad/25 bg-bad-bg p-4">
          <p className="text-sm text-bad mb-3">Delete this saree permanently?</p>
          <div className="flex gap-2">
            <button
              onClick={remove}
              disabled={busy}
              className="btn flex-1 bg-bad text-white text-sm"
            >
              Yes, delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="btn btn-secondary flex-1 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          className="btn w-full border border-bad/25 text-bad text-sm hover:bg-bad-bg"
        >
          <Trash2 size={16} />
          Delete saree
        </button>
      )}
    </div>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-ink-soft mt-1.5">{hint}</p>}
    </div>
  );
}
