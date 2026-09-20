'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '@/lib/supabase/client';
import BillForm, { type BillDraft } from './BillForm';
import type { Bill, BillCompany } from '@/lib/bills';

export default function EditBillForm({
  bill,
  companies,
  photoUrl,
}: {
  bill: Bill;
  companies: BillCompany[];
  photoUrl: string | null;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<BillDraft>({
    companyId: bill.company_id,
    companyName: companies.find((c) => c.id === bill.company_id)?.name ?? '',
    billNumber: bill.bill_number ?? '',
    billDate: bill.bill_date ?? '',
    columns: bill.columns,
    items: bill.items,
    totals: bill.totals,
    notes: bill.notes ?? '',
    lowConfidence: bill.low_confidence,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function save() {
    setError(null);
    const name = draft.companyName.trim();
    if (!draft.companyId && !name) {
      setError('Please give the company a name.');
      return;
    }

    setSaving(true);
    const supabase = getBrowserClient();

    try {
      let companyId = draft.companyId;
      if (!companyId) {
        const { data, error: companyError } = await supabase
          .from('bill_companies')
          .upsert({ name }, { onConflict: 'normalised_name' })
          .select('id')
          .single();
        if (companyError) throw new Error(companyError.message);
        companyId = data.id;
      }

      const { error: billError } = await supabase
        .from('bills')
        .update({
          company_id: companyId,
          bill_number: draft.billNumber || null,
          bill_date: draft.billDate || null,
          columns: draft.columns,
          items: draft.items,
          totals: draft.totals,
          notes: draft.notes || null,
          // Corrections have been made, so the reader's doubts no longer apply.
          low_confidence: [],
        })
        .eq('id', bill.id);
      if (billError) throw new Error(billError.message);

      router.push('/admin/receipts');
      router.refresh();
    } catch (e) {
      setError(`Could not save: ${e instanceof Error ? e.message : 'unknown error'}`);
      setSaving(false);
    }
  }

  async function remove() {
    setSaving(true);
    setError(null);
    const supabase = getBrowserClient();

    const { error: billError } = await supabase
      .from('bills')
      .delete()
      .eq('id', bill.id);

    if (billError) {
      setError(`Could not delete: ${billError.message}`);
      setSaving(false);
      return;
    }

    // Take the photo with it — a private bill photo left behind is storage
    // nobody can see and nobody will remember to clear.
    if (bill.photo_path) {
      await supabase.storage.from('bill-photos').remove([bill.photo_path]);
    }

    router.push('/admin/receipts');
    router.refresh();
  }

  if (confirmDelete) {
    return (
      <div className="max-w-lg mx-auto px-5 py-10">
        <div className="card border-bad/25 bg-bad-bg p-5">
          <p className="font-display text-lg text-bad">Delete this bill?</p>
          <p className="text-sm text-ink-soft mt-2 leading-relaxed">
            The photo goes too. This cannot be undone.
          </p>
          <div className="flex gap-2 mt-5">
            <button
              onClick={remove}
              disabled={saving}
              className="btn flex-1 bg-bad text-white text-sm"
            >
              {saving ? 'Deleting…' : 'Yes, delete'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="btn btn-secondary flex-1 text-sm"
            >
              Cancel
            </button>
          </div>
          {error && <p className="text-sm text-bad mt-3">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <BillForm
      draft={draft}
      companies={companies}
      photoUrl={photoUrl}
      saving={saving}
      error={error}
      saveLabel="Save changes"
      onChange={setDraft}
      onSave={save}
      onDelete={() => setConfirmDelete(true)}
    />
  );
}
