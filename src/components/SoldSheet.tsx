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
    <div className="fixed inset-0 z-50 flex items-end bg-black/40">
      <div className="w-full bg-white rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-semibold text-stone-900">Mark as sold</h2>
            <p className="text-sm text-stone-500">{saree.name}</p>
          </div>
          <button onClick={onClose} className="p-2 -m-2 text-stone-400">
            <X size={22} />
          </button>
        </div>

        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          Sold for (₹)
        </label>
        <input
          type="number"
          inputMode="numeric"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="tap-target w-full px-3 rounded-lg border border-stone-300 text-lg font-medium mb-4 outline-none focus:border-brand-600"
        />

        {saree.quantity_available > 1 && (
          <>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              How many pieces? ({saree.quantity_available} in stock)
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={saree.quantity_available}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="tap-target w-full px-3 rounded-lg border border-stone-300 mb-4 outline-none focus:border-brand-600"
            />
          </>
        )}

        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          Where?
        </label>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {CHANNELS.map((c) => (
            <button
              key={c.value}
              onClick={() => setChannel(c.value)}
              className={`tap-target rounded-lg text-sm border ${
                channel === c.value
                  ? 'bg-brand-700 text-white border-brand-700'
                  : 'bg-white text-stone-700 border-stone-300'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <details className="mb-5">
          <summary className="text-sm text-brand-700 font-medium cursor-pointer tap-target flex items-center">
            Add customer (optional)
          </summary>
          <p className="text-xs text-stone-500 mt-2 mb-3">
            Worth doing — this is how you know who to tell when similar stock
            comes in.
          </p>
          <input
            placeholder="Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="tap-target w-full px-3 rounded-lg border border-stone-300 mb-2 outline-none focus:border-brand-600"
          />
          <input
            placeholder="Phone"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="tap-target w-full px-3 rounded-lg border border-stone-300 outline-none focus:border-brand-600"
          />
        </details>

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <button
          onClick={confirm}
          disabled={busy}
          className="tap-target w-full rounded-xl bg-brand-700 text-white font-medium py-4 disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Confirm sale'}
        </button>
      </div>
    </div>
  );
}
