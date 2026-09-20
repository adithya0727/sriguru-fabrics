'use client';

import { useState } from 'react';
import { Plus, Trash2, AlertCircle, Sparkles } from 'lucide-react';
import BillTable from './BillTable';
import {
  type BillCompany,
  type BillItem,
  type LabelledValue,
  formatBillDate,
} from '@/lib/bills';

export type BillDraft = {
  companyId: string | null;
  companyName: string;
  billNumber: string;
  billDate: string;
  columns: string[];
  items: BillItem[];
  totals: LabelledValue[];
  notes: string;
  lowConfidence: string[];
};

/**
 * Check a read bill and correct it. Used both for a bill just photographed and
 * for one being revisited later, because the job is the same either way:
 * compare against the paper and fix whatever the model got wrong.
 */
export default function BillForm({
  draft,
  companies,
  photoUrl,
  saving,
  error,
  saveLabel,
  onChange,
  onSave,
  onDelete,
}: {
  draft: BillDraft;
  companies: BillCompany[];
  photoUrl: string | null;
  saving: boolean;
  error: string | null;
  saveLabel: string;
  onChange: (draft: BillDraft) => void;
  onSave: () => void;
  onDelete?: () => void;
}) {
  const [showPhoto, setShowPhoto] = useState(false);
  const set = (patch: Partial<BillDraft>) => onChange({ ...draft, ...patch });

  return (
    <div className="max-w-lg mx-auto px-5 py-8">
      <p className="eyebrow mb-2">Store receipt</p>
      <h1 className="font-display text-[1.75rem] text-maroon-900 leading-tight">
        Check the bill
      </h1>
      <p className="text-ink-soft mt-2 leading-relaxed">
        Compare against the paper and fix anything that came out wrong. Tap a
        row to correct it.
      </p>

      {draft.lowConfidence.length > 0 && (
        <p className="flex items-start gap-2 text-sm text-warn bg-warn-bg border border-gold-300/40 rounded-lg px-3 py-2.5 mt-4 leading-relaxed">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>
            Hard to read: {draft.lowConfidence.join(', ')}. These are marked
            with ⚠ — please confirm them.
          </span>
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="text-sm text-bad bg-bad-bg border border-bad/20 rounded-lg px-3 py-2.5 mt-4"
        >
          {error}
        </p>
      )}

      {photoUrl && (
        <div className="mt-5">
          <button
            onClick={() => setShowPhoto((v) => !v)}
            className="btn btn-secondary w-full text-sm"
          >
            {showPhoto ? 'Hide the photo' : 'Show the photo'}
          </button>
          {showPhoto && (
            <div className="frame mt-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl} alt="The bill" className="w-full" />
            </div>
          )}
        </div>
      )}

      <section className="card p-5 mt-5">
        <h2 className="eyebrow mb-4">Which shop</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-ink mb-1.5">
            Company
          </label>
          <select
            value={draft.companyId ?? 'new'}
            onChange={(e) =>
              set({
                companyId: e.target.value === 'new' ? null : e.target.value,
              })
            }
            className="field"
          >
            <option value="new">Add as a new company</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {draft.companyId === null && (
            <input
              value={draft.companyName}
              onChange={(e) => set({ companyName: e.target.value })}
              placeholder="Company name as printed on the bill"
              className="field mt-2"
            />
          )}
          <p className="text-xs text-ink-soft mt-1.5 leading-relaxed">
            Pick the existing company if this shop is already listed — the same
            shop typed twice becomes two separate sets of bills.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Bill no.
            </label>
            <input
              value={draft.billNumber}
              onChange={(e) => set({ billNumber: e.target.value })}
              className="field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={draft.billDate}
              onChange={(e) => set({ billDate: e.target.value })}
              className="field"
            />
          </div>
        </div>
        {draft.billDate && (
          <p className="text-xs text-ink-soft mt-1.5">
            {formatBillDate(draft.billDate)}
          </p>
        )}
      </section>

      <section className="card p-5 mt-4">
        <h2 className="eyebrow mb-4">Items</h2>
        <BillTable
          columns={draft.columns}
          items={draft.items}
          flagged={draft.lowConfidence}
          onChange={(items) => set({ items })}
        />
      </section>

      <section className="card p-5 mt-4">
        <h2 className="eyebrow mb-4">Totals</h2>
        {draft.totals.length === 0 && (
          <p className="text-sm text-ink-soft mb-3">
            None were read from this bill.
          </p>
        )}
        {draft.totals.map((t, i) => (
          <div key={i} className="flex gap-2 mb-2.5">
            <input
              value={t.label}
              onChange={(e) =>
                set({
                  totals: draft.totals.map((row, j) =>
                    j === i ? { ...row, label: e.target.value } : row,
                  ),
                })
              }
              placeholder="Label"
              className="field flex-1"
            />
            <input
              value={t.value}
              onChange={(e) =>
                set({
                  totals: draft.totals.map((row, j) =>
                    j === i ? { ...row, value: e.target.value } : row,
                  ),
                })
              }
              inputMode="decimal"
              placeholder="Amount"
              className="field w-32 tabular-nums"
            />
            <button
              onClick={() =>
                set({ totals: draft.totals.filter((_, j) => j !== i) })
              }
              aria-label="Remove"
              className="btn btn-ghost !min-h-0 px-2 text-ink-faint"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <button
          onClick={() => set({ totals: [...draft.totals, { label: '', value: '' }] })}
          className="btn btn-secondary w-full text-sm mt-1"
        >
          <Plus size={15} />
          Add a total
        </button>
      </section>

      <section className="card p-5 mt-4">
        <h2 className="eyebrow mb-4">Notes</h2>
        <textarea
          rows={2}
          value={draft.notes}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="Anything worth remembering about this bill"
          className="field"
        />
      </section>

      <button
        onClick={onSave}
        disabled={saving}
        className="btn btn-primary w-full mt-6"
      >
        {saving ? 'Saving…' : saveLabel}
      </button>

      {onDelete && (
        <button
          onClick={onDelete}
          disabled={saving}
          className="btn w-full mt-3 border border-bad/25 text-bad text-sm hover:bg-bad-bg"
        >
          <Trash2 size={16} />
          Delete this bill
        </button>
      )}

      <p className="flex items-start gap-2 text-xs text-ink-faint mt-6 leading-relaxed">
        <Sparkles size={14} className="mt-0.5 shrink-0 text-gold-500" />
        Read from the photo automatically. Always worth a glance against the
        paper before saving.
      </p>
    </div>
  );
}
