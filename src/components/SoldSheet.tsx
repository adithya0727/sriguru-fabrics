'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '@/lib/supabase/client';
import type { SaleChannel } from '@/lib/types';

const CHANNELS: { value: SaleChannel; label: string }[] = [
  { value: 'home', label: 'At home' },
  { value: 'stall', label: 'Stall' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'reseller', label: 'Reseller' },
  { value: 'other', label: 'Other' },
];

/**
 * The one-tap sale. Everything here is pre-filled with the likely answer so
 * the common case — sold at the asking price, at home, to a walk-in — is a
 * single confirm. If recording a sale is slower than skipping it, it gets
 * skipped, and the whole stock register rots.
 */
export default function SoldSheet({
  saree,
  onClose,
}: {
  saree: { id: string; name: string; price: number; quantity_available: number };
  onClose: () => void;
}) {
  const router = useRouter();
  const [price, setPrice] = useState(String(saree.price));
  const [quantity, setQuantity] = useState('1');
  const [channel, setChannel] = useState<SaleChannel>('home');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    const supabase = getBrowserClient();

    let customerId: string | null = null;

    // A name without a phone number is not much use for following up later,
    // so only create a customer record when there's something to reach.
    if (customerName.trim() && phone.trim()) {
      const { data, error } = await supabase
        .from('customers')
        .upsert(
          { name: customerName.trim(), phone: phone.trim() },
          { onConflict: 'phone' },
        )
        .select('id')
        .single();
      if (error) {
        setError(`Could not save the customer: ${error.message}`);
        setBusy(false);
        return;
      }
      customerId = data.id;
    }

    const { error } = await supabase.rpc('record_sale', {
      p_saree_id: saree.id,
      p_unit_price: Number(price),
      p_quantity: Number(quantity) || 1,
      p_customer_id: customerId,
      p_channel: channel,
      p_notes: null,
    });

    if (error) {
      setError(
        error.message.includes('available_not_over_total') ||
          error.message.includes('quantity_available')
          ? 'That is more pieces than are in stock.'
          : `Could not record the sale: ${error.message}`,
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
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg mx-auto bg-surface rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto rise"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="eyebrow mb-1">Record a sale</p>
            <h2 className="font-display text-xl text-maroon-900 leading-tight">
              {saree.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="btn btn-ghost !min-h-0 p-2 -m-1 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <label className="block text-sm font-medium text-ink mb-1.5">
          Sold for
        </label>
        <div className="relative mb-4">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint">
            ₹
          </span>
          <input
            type="number"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="field pl-8 text-lg font-medium"
          />
        </div>

        {saree.quantity_available > 1 && (
          <>
            <label className="block text-sm font-medium text-ink mb-1.5">
              How many pieces? ({saree.quantity_available} in stock)
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={saree.quantity_available}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="field mb-4"
            />
          </>
        )}

        <label className="block text-sm font-medium text-ink mb-2">
          Where?
        </label>
        <div className="flex flex-wrap gap-2 mb-5">
          {CHANNELS.map((c) => (
            <button
              key={c.value}
              onClick={() => setChannel(c.value)}
              className={`chip ${channel === c.value ? 'chip-active' : ''}`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <details className="mb-5 group">
          <summary className="text-sm text-maroon-700 font-medium cursor-pointer py-2 list-none flex items-center gap-1.5">
            <span className="transition-transform group-open:rotate-90">›</span>
            Add customer (optional)
          </summary>
          <p className="text-xs text-ink-soft mt-1 mb-3 leading-relaxed">
            Worth doing — this is how you know who to tell when similar stock
            comes in.
          </p>
          <input
            placeholder="Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="field mb-2"
          />
          <input
            placeholder="Phone"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="field"
          />
        </details>

        {error && (
          <p
            role="alert"
            className="text-sm text-bad bg-bad-bg border border-bad/20 rounded-lg px-3 py-2.5 mb-4"
          >
            {error}
          </p>
        )}

        <button
          onClick={confirm}
          disabled={busy}
          className="btn btn-primary w-full"
        >
          {busy ? 'Saving…' : 'Confirm sale'}
        </button>
      </div>
    </div>
  );
}
