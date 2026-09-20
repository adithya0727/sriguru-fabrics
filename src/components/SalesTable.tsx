'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Trash2, ReceiptText, Check, Users } from 'lucide-react';
import ReceiptSheet from './ReceiptSheet';
import { getBrowserClient } from '@/lib/supabase/client';
import type { SaleRow } from '@/lib/types';

const rupees = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

/**
 * The Sales Book.
 *
 * Four columns are shown, not the ten a full ledger holds: a table wide enough
 * for all of them is a table you read sideways, one column at a time, which is
 * no way to glance at anything. The rest open on a tap, where they can also be
 * corrected — a receipt number in particular is usually written afterwards.
 */
export default function SalesTable({ sales }: { sales: SaleRow[] }) {
  const [editing, setEditing] = useState<SaleRow | null>(null);

  // Picking rows is a mode rather than a long press. Long press on the web
  // fights text selection, shows no affordance, and behaves differently in
  // every browser — a button says plainly that it is there.
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [showReceipt, setShowReceipt] = useState(false);

  function toggle(id: string) {
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function stopPicking() {
    setPicking(false);
    setPicked(new Set());
  }

  const chosen = sales.filter((s) => picked.has(s.id));

  // Usually it is all one person's shopping, so offer the rest of their sales
  // in a tap rather than making her find each line.
  const firstName = chosen[0]?.customer_name ?? null;
  const sameNameOutstanding = firstName
    ? sales.filter((s) => s.customer_name === firstName && !picked.has(s.id))
    : [];

  if (sales.length === 0) {
    return (
      <div className="text-center py-16 px-5">
        <p className="font-display text-lg text-ink">Nothing sold yet</p>
        <p className="text-sm text-ink-soft mt-2 leading-relaxed">
          Sales appear here as you record them from the stock register.
        </p>
      </div>
    );
  }

  // Numbered in the order they happened, so an entry keeps its number for good,
  // but listed newest first, which is what anyone opens this to see.
  const total = sales.length;

  return (
    <>
      {!picking && (
        <button
          onClick={() => setPicking(true)}
          className="btn btn-secondary w-full text-sm mb-3"
        >
          <ReceiptText size={15} />
          Generate a receipt
        </button>
      )}

      <div className="-mx-5">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-y border-line bg-canvas-warm">
              <th className="text-left text-xs font-medium text-ink-soft px-3 py-2.5 pl-5">
                Customer
              </th>
              <th className="text-left text-xs font-medium text-ink-soft px-2 py-2.5">
                Saree
              </th>
              <th className="text-right text-xs font-medium text-ink-soft px-2 py-2.5">
                Final
              </th>
              <th className="text-right text-xs font-medium text-ink-soft px-3 py-2.5 pr-5">
                Profit
              </th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale, i) => {
              const paid = Number(sale.final_unit_price ?? sale.unit_price);
              const profit = Number(sale.margin);
              return (
                <tr
                  key={sale.id}
                  onClick={() => (picking ? toggle(sale.id) : setEditing(sale))}
                  className={`border-b border-line cursor-pointer transition-colors ${
                    picked.has(sale.id)
                      ? 'bg-maroon-50'
                      : 'hover:bg-canvas-warm/60'
                  }`}
                >
                  <td className="px-3 py-3 pl-5 align-top">
                    <p className="text-sm text-ink truncate max-w-[7.5rem] flex items-center gap-1.5">
                      {picking && (
                        <span
                          className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center ${
                            picked.has(sale.id)
                              ? 'bg-maroon-700 border-maroon-700 text-white'
                              : 'border-line-strong'
                          }`}
                        >
                          {picked.has(sale.id) && <Check size={11} strokeWidth={3} />}
                        </span>
                      )}
                      <span className="truncate">
                        {sale.customer_name || (
                          <span className="text-ink-faint">Walk-in</span>
                        )}
                      </span>
                    </p>
                    <p className="text-[0.6875rem] text-ink-faint tabular-nums mt-0.5">
                      #{total - i} · {shortDate(sale.sold_at)}
                    </p>
                  </td>
                  <td className="px-2 py-3 align-top">
                    <p className="text-sm text-ink truncate max-w-[8rem]">
                      {sale.saree_name}
                    </p>
                    <p className="text-[0.6875rem] text-ink-faint truncate max-w-[8rem] mt-0.5">
                      {sale.category}
                    </p>
                  </td>
                  <td className="px-2 py-3 text-right align-top">
                    <p className="text-sm text-ink tabular-nums">{rupees(paid)}</p>
                    {Number(sale.discount_percent) > 0 && (
                      <p className="text-[0.6875rem] text-ink-faint tabular-nums mt-0.5">
                        −{Number(sale.discount_percent)}%
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3 pr-5 text-right align-top">
                    <p
                      className={`text-sm tabular-nums ${
                        profit > 0 ? 'text-good' : profit < 0 ? 'text-bad' : 'text-ink-soft'
                      }`}
                    >
                      {profit > 0 ? '+' : ''}
                      {rupees(profit)}
                    </p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {picking && (
        // Sits clear of the tab bar rather than over it — the way out of this
        // mode must never be the thing a thumb covers.
        <div className="fixed inset-x-0 bottom-16 z-40 px-5">
          <div className="max-w-lg mx-auto card shadow-lg p-3">
            {sameNameOutstanding.length > 0 && (
              <button
                onClick={() =>
                  setPicked(
                    (current) =>
                      new Set([
                        ...current,
                        ...sameNameOutstanding.map((s) => s.id),
                      ]),
                  )
                }
                className="btn btn-ghost w-full !min-h-0 py-2 text-sm mb-1"
              >
                <Users size={15} />
                Add {sameNameOutstanding.length} more of {firstName}&rsquo;s
              </button>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={stopPicking}
                className="btn btn-ghost !min-h-0 py-2.5 px-3 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowReceipt(true)}
                disabled={picked.size === 0}
                className="btn btn-primary flex-1 !min-h-0 py-2.5 text-sm"
              >
                Receipt for {picked.size}{' '}
                {picked.size === 1 ? 'item' : 'items'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReceipt && chosen.length > 0 && (
        <ReceiptSheet
          sales={chosen}
          onClose={() => {
            setShowReceipt(false);
            stopPicking();
          }}
        />
      )}

      {editing && (
        <SaleSheet
          sale={editing}
          number={total - sales.findIndex((s) => s.id === editing.id)}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

/** Every field of one sale, correctable. */
function SaleSheet({
  sale,
  number,
  onClose,
}: {
  sale: SaleRow;
  number: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [customer, setCustomer] = useState(sale.customer_name ?? '');
  const [receipt, setReceipt] = useState(sale.receipt_number ?? '');
  const [asking, setAsking] = useState(String(Number(sale.unit_price)));
  const [discount, setDiscount] = useState(String(Number(sale.discount_percent)));
  const [finalPrice, setFinalPrice] = useState(
    String(Number(sale.final_unit_price ?? sale.unit_price)),
  );
  const [cost, setCost] = useState(
    sale.unit_cost != null ? String(Number(sale.unit_cost)) : '',
  );
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The discount and the final price are the same fact twice. Whichever she
  // edits is the one she means, so the other is recalculated to match rather
  // than left contradicting it on screen.
  function changeDiscount(value: string) {
    setDiscount(value);
    const a = Number(asking);
    const d = Number(value);
    if (Number.isFinite(a) && Number.isFinite(d) && a > 0) {
      setFinalPrice(String(Math.round(a * (1 - d / 100))));
    }
  }

  function changeFinal(value: string) {
    setFinalPrice(value);
    const a = Number(asking);
    const f = Number(value);
    if (Number.isFinite(a) && Number.isFinite(f) && a > 0) {
      setDiscount(String(Math.max(0, Math.round(((a - f) / a) * 1000) / 10)));
    }
  }

  const profit =
    cost !== '' && finalPrice !== ''
      ? Number(finalPrice) - Number(cost)
      : null;

  async function save() {
    setBusy(true);
    setError(null);

    const { error: saveError } = await getBrowserClient()
      .from('sales')
      .update({
        customer_name: customer.trim() || null,
        receipt_number: receipt.trim() || null,
        unit_price: Number(asking) || 0,
        final_unit_price: Number(finalPrice) || 0,
        discount_percent: Math.min(100, Math.max(0, Number(discount) || 0)),
        unit_cost: cost === '' ? null : Number(cost),
      })
      .eq('id', sale.id);

    if (saveError) {
      setError(`Could not save: ${saveError.message}`);
      setBusy(false);
      return;
    }
    onClose();
    router.refresh();
  }

  async function remove() {
    setBusy(true);
    setError(null);

    // Deleting a sale does NOT put the piece back on the rack. Stock is
    // counted by hand often enough that silently adding one back would be
    // the more surprising outcome; correct the count on the saree instead.
    const { error: deleteError } = await getBrowserClient()
      .from('sales')
      .delete()
      .eq('id', sale.id);

    if (deleteError) {
      setError(`Could not delete: ${deleteError.message}`);
      setBusy(false);
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-ink/40 backdrop-blur-[2px]"
      onClick={busy ? undefined : onClose}
    >
      <div
        className="w-full max-w-lg mx-auto bg-surface rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto rise"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div className="min-w-0">
            <p className="eyebrow mb-1">Sale #{number}</p>
            <h2 className="font-display text-xl text-maroon-900 leading-tight truncate">
              {sale.saree_name}
            </h2>
            <p className="text-xs text-ink-faint mt-1">
              {sale.category}
              {sale.supplier && ` · from ${sale.supplier}`}
              {' · '}
              {new Date(sale.sold_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="btn btn-ghost !min-h-0 p-2 -m-1 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <Row label="Customer">
          <input
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            placeholder="Walk-in"
            className="field"
          />
        </Row>

        <Row label="Receipt no.">
          <input
            value={receipt}
            onChange={(e) => setReceipt(e.target.value)}
            className="field"
          />
        </Row>

        <div className="grid grid-cols-2 gap-3">
          <Row label="Asking price">
            <div className="relative">
              <span className="field-prefix">₹</span>
              <input
                type="number"
                inputMode="numeric"
                value={asking}
                onChange={(e) => setAsking(e.target.value)}
                className="field field-money"
              />
            </div>
          </Row>
          <Row label="Discount">
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                value={discount}
                onChange={(e) => changeDiscount(e.target.value)}
                className="field pr-9"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none">
                %
              </span>
            </div>
          </Row>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Row label="Final price">
            <div className="relative">
              <span className="field-prefix">₹</span>
              <input
                type="number"
                inputMode="numeric"
                value={finalPrice}
                onChange={(e) => changeFinal(e.target.value)}
                className="field field-money text-lg font-medium"
              />
            </div>
          </Row>
          <Row label="What we paid">
            <div className="relative">
              <span className="field-prefix">₹</span>
              <input
                type="number"
                inputMode="numeric"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="field field-money"
              />
            </div>
          </Row>
        </div>

        {profit != null && (
          <p
            className={`text-sm tabular-nums mb-4 ${
              profit > 0 ? 'text-good' : profit < 0 ? 'text-bad' : 'text-ink-soft'
            }`}
          >
            {profit >= 0 ? `${rupees(profit)} profit` : `${rupees(-profit)} loss`}{' '}
            on this sale.
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="text-sm text-bad bg-bad-bg border border-bad/20 rounded-lg px-3 py-2.5 mb-4"
          >
            {error}
          </p>
        )}

        <button onClick={save} disabled={busy} className="btn btn-primary w-full">
          {busy ? 'Saving…' : 'Save changes'}
        </button>

        {confirmDelete ? (
          <div className="card border-bad/25 bg-bad-bg p-4 mt-3">
            <p className="text-sm text-bad leading-relaxed">
              Remove this sale from the book? The piece is not put back on the
              rack — correct the saree&rsquo;s stock separately if it should be.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={remove}
                disabled={busy}
                className="btn flex-1 bg-bad text-white text-sm"
              >
                Yes, remove
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
            className="btn w-full mt-3 border border-bad/25 text-bad text-sm hover:bg-bad-bg"
          >
            <Trash2 size={15} />
            Remove this sale
          </button>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-ink mb-1.5">{label}</label>
      {children}
    </div>
  );
}
