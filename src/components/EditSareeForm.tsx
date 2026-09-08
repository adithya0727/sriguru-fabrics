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
    <div className="max-w-lg mx-auto px-5 py-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-maroon-700 transition-colors mb-4"
      >
        <ArrowLeft size={16} /> Back to stock
      </Link>

      <h1 className="font-display text-[1.75rem] text-maroon-900 leading-tight mb-5">Edit saree</h1>

      {saree.photos.length > 0 && (
        <div className="flex gap-2 mb-5 overflow-x-auto">
          {saree.photos.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt=""
              className="w-20 h-24 object-cover rounded-lg shrink-0"
            />
          ))}
        </div>
      )}

      <div className="card p-5 mb-4 space-y-4">
        <Row label="Selling price (₹)">
          <input
            type="number"
            inputMode="numeric"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="field text-lg font-medium"
          />
        </Row>
        <Row label="What we paid (₹)" hint="Only we see this.">
          <input
            type="number"
            inputMode="numeric"
            value={form.cost_price}
            onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
            className="field"
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
              className="field"
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
              className="field"
            />
          </Row>
        </div>
      </div>

      <div className="card p-5 mb-4 space-y-4">
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
        <div className="grid grid-cols-2 gap-3">
          <Row label="Fabric">
            <input
              value={form.fabric}
              onChange={(e) => setForm({ ...form, fabric: e.target.value })}
              className="field"
            />
          </Row>
          <Row label="Border">
            <input
              value={form.border}
              onChange={(e) => setForm({ ...form, border: e.target.value })}
              className="field"
            />
          </Row>
        </div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.has_blouse}
            onChange={(e) => setForm({ ...form, has_blouse: e.target.checked })}
            className="w-5 h-5 accent-maroon-700"
          />
          <span className="text-sm text-ink">Blouse piece included</span>
        </label>
      </div>

      {error && (
        <p className="text-sm text-bad bg-bad-bg border border-bad/20 rounded-lg px-3 py-2.5 mb-4">
          {error}
        </p>
      )}

      <button
        onClick={save}
        disabled={busy}
        className="btn btn-primary w-full mb-3"
      >
        {busy ? 'Saving…' : 'Save changes'}
      </button>

      {confirmDelete ? (
        <div className="card border-bad/25 bg-bad-bg p-4">
          <p className="text-sm text-bad mb-3">
            Delete this saree permanently?
          </p>
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
      <label className="block text-sm font-medium text-ink mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-ink-soft mt-1.5">{hint}</p>}
    </div>
  );
}
