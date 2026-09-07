'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getBrowserClient } from '@/lib/supabase/client';
import type { Saree } from '@/lib/types';

export default function EditSareeForm({
  saree,
  categories,
}: {
  saree: Saree;
  categories: string[];
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
    quantity_available: String(saree.quantity_available),
    quantity_total: String(saree.quantity_total),
    has_blouse: saree.has_blouse,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function save() {
    setBusy(true);
    setError(null);

    const total = Math.max(1, Number(form.quantity_total) || 1);
    const available = Math.min(total, Math.max(0, Number(form.quantity_available) || 0));

    const { error } = await getBrowserClient()
      .from('sarees')
      .update({
        name: form.name,
        description: form.description,
        category: form.category,
        fabric: form.fabric || null,
        border: form.border || null,
        price: Number(form.price) || 0,
        cost_price: form.cost_price ? Number(form.cost_price) : null,
        quantity_total: total,
        quantity_available: available,
        has_blouse: form.has_blouse,
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
          ? 'This saree has sales recorded against it, so it cannot be deleted. Set its stock to 0 instead.'
          : `Could not delete: ${error.message}`,
      );
      setBusy(false);
      return;
    }
    router.push('/admin');
    router.refresh();
  }

  return (
    <div className="px-5 py-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-stone-500 mb-4"
      >
        <ArrowLeft size={16} /> Back to stock
      </Link>

      <h1 className="text-xl font-semibold text-stone-900 mb-5">Edit saree</h1>

      {saree.photos.length > 0 && (
        <div className="flex gap-2 mb-5 overflow-x-auto">
          {saree.photos.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt=""
              className="w-20 h-24 object-cover rounded-lg shrink-0 border border-stone-200"
            />
          ))}
        </div>
      )}

      <div className="bg-white border border-stone-200 rounded-xl p-4 mb-4 space-y-4">
        <Row label="Selling price (₹)">
          <input
            type="number"
            inputMode="numeric"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="tap-target w-full px-3 rounded-lg border border-stone-300 text-lg font-medium outline-none focus:border-brand-600"
          />
        </Row>
        <Row label="What we paid (₹)" hint="Only we see this.">
          <input
            type="number"
            inputMode="numeric"
            value={form.cost_price}
            onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
            className="tap-target w-full px-3 rounded-lg border border-stone-300 outline-none focus:border-brand-600"
          />
        </Row>
        <div className="grid grid-cols-2 gap-3">
          <Row label="In stock">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={form.quantity_available}
              onChange={(e) =>
                setForm({ ...form, quantity_available: e.target.value })
              }
              className="tap-target w-full px-3 rounded-lg border border-stone-300 outline-none focus:border-brand-600"
            />
          </Row>
          <Row label="Bought in total">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={form.quantity_total}
              onChange={(e) =>
                setForm({ ...form, quantity_total: e.target.value })
              }
              className="tap-target w-full px-3 rounded-lg border border-stone-300 outline-none focus:border-brand-600"
            />
          </Row>
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-4 mb-4 space-y-4">
        <Row label="Name">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="tap-target w-full px-3 rounded-lg border border-stone-300 outline-none focus:border-brand-600"
          />
        </Row>
        <Row label="Description">
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-stone-300 outline-none focus:border-brand-600"
          />
        </Row>
        <Row label="Type">
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="tap-target w-full px-3 rounded-lg border border-stone-300 bg-white outline-none focus:border-brand-600"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Row>
        <div className="grid grid-cols-2 gap-3">
          <Row label="Fabric">
            <input
              value={form.fabric}
              onChange={(e) => setForm({ ...form, fabric: e.target.value })}
              className="tap-target w-full px-3 rounded-lg border border-stone-300 outline-none focus:border-brand-600"
            />
          </Row>
          <Row label="Border">
            <input
              value={form.border}
              onChange={(e) => setForm({ ...form, border: e.target.value })}
              className="tap-target w-full px-3 rounded-lg border border-stone-300 outline-none focus:border-brand-600"
            />
          </Row>
        </div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.has_blouse}
            onChange={(e) => setForm({ ...form, has_blouse: e.target.checked })}
            className="w-5 h-5 accent-brand-700"
          />
          <span className="text-sm text-stone-700">Blouse piece included</span>
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <button
        onClick={save}
        disabled={busy}
        className="tap-target w-full rounded-xl bg-brand-700 text-white font-medium py-4 mb-3 disabled:opacity-60"
      >
        {busy ? 'Saving…' : 'Save changes'}
      </button>

      {confirmDelete ? (
        <div className="border border-red-200 bg-red-50 rounded-xl p-4">
          <p className="text-sm text-red-800 mb-3">
            Delete this saree permanently?
          </p>
          <div className="flex gap-2">
            <button
              onClick={remove}
              disabled={busy}
              className="tap-target flex-1 rounded-lg bg-red-700 text-white text-sm font-medium"
            >
              Yes, delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="tap-target flex-1 rounded-lg border border-stone-300 text-stone-700 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          className="tap-target w-full flex items-center justify-center gap-2 rounded-xl border border-red-200 text-red-700 text-sm"
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
      <label className="block text-sm font-medium text-stone-700 mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-stone-500 mt-1">{hint}</p>}
    </div>
  );
}
