'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '@/lib/supabase/client';

const rupees = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

/**
 * Selling one piece.
 *
 * Three fields, because anything more gets skipped at a counter with a
 * customer waiting — and a sale that is too slow to record simply is not
 * recorded, which is how a stock register rots.
 *
 * The discount is shown as it is typed, in rupees, not left as arithmetic to
 * do in your head while someone waits.
 */
export default function SellSheet({
  saree,
  onClose,
}: {
  saree: { id: string; name: string; price: number; cost_price: number | null };
  onClose: () => void;
}) {
  const router = useRouter();
  const [customer, setCustomer] = useState('');
  const [discount, setDiscount] = useState('');
  const [receipt, setReceipt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const percent = Number(discount);
  const validPercent =
    discount.trim() !== '' && Number.isFinite(percent) && percent > 0 && percent <= 100;
  const finalPrice = validPercent
    ? Math.round(saree.price * (1 - percent / 100))
    : saree.price;
  const profit =
    saree.cost_price != null ? finalPrice - saree.cost_price : null;

  async function sell() {
    if (percent < 0 || percent > 100) {
      setError('The discount should be between 0 and 100.');
      return;
    }

    setBusy(true);
    setError(null);

    const { error: saleError } = await getBrowserClient().rpc('record_sale', {
      p_saree_id: saree.id,
      p_unit_price: saree.price,
      p_final_unit_price: finalPrice,
      p_discount_percent: validPercent ? percent : 0,
      p_customer_name: customer.trim() || null,
      p_receipt_number: receipt.trim() || null,
      p_notes: null,
    });

    if (saleError) {
      setError(
        saleError.message.includes('available_not_over_total') ||
          saleError.message.includes('quantity_available')
          ? 'There are no pieces of this design left.'
          : `Could not record the sale: ${saleError.message}`,
      );
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
            <p className="eyebrow mb-1">Sell</p>
            <h2 className="font-display text-xl text-maroon-900 leading-tight truncate">
              {saree.name}
            </h2>
            <p className="text-sm text-ink-soft mt-1 tabular-nums">
              Asking {rupees(saree.price)}
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

        <label
          htmlFor="customer"
          className="block text-sm font-medium text-ink mb-1.5"
        >
          Customer name
        </label>
        <input
          id="customer"
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          autoFocus
          className="field mb-4"
        />

        <label
          htmlFor="discount"
          className="block text-sm font-medium text-ink mb-1.5"
        >
          Extra discount
        </label>
        <div className="relative">
          <input
            id="discount"
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            placeholder="0"
            className="field pr-9"
          />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none">
            %
          </span>
        </div>

        {/* The number she will actually say out loud, worked out as she types. */}
        <div className="card bg-canvas-warm p-4 mt-3 mb-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-ink-soft">Customer pays</span>
            <span className="font-display text-2xl text-maroon-800 tabular-nums">
              {rupees(finalPrice)}
            </span>
          </div>
          {validPercent && (
            <p className="text-xs text-ink-faint mt-1 tabular-nums">
              {rupees(saree.price)} less {percent}% — saves{' '}
              {rupees(saree.price - finalPrice)}
            </p>
          )}
          {profit != null && (
            <p
              className={`text-xs mt-1.5 tabular-nums ${
                profit > 0 ? 'text-good' : 'text-bad'
              }`}
            >
              {profit > 0 ? `${rupees(profit)} profit` : `${rupees(-profit)} loss`}
            </p>
          )}
        </div>

        <label
          htmlFor="receipt"
          className="block text-sm font-medium text-ink mb-1.5"
        >
          Receipt no.{' '}
          <span className="text-ink-faint font-normal">— can be added later</span>
        </label>
        <input
          id="receipt"
          value={receipt}
          onChange={(e) => setReceipt(e.target.value)}
          className="field mb-5"
        />

        {error && (
          <p
            role="alert"
            className="text-sm text-bad bg-bad-bg border border-bad/20 rounded-lg px-3 py-2.5 mb-4"
          >
            {error}
          </p>
        )}

        <button onClick={sell} disabled={busy} className="btn btn-primary w-full">
          {busy ? 'Recording…' : `Sell for ${rupees(finalPrice)}`}
        </button>
      </div>
    </div>
  );
}
