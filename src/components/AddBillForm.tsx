'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Images, AlertCircle, ScanLine } from 'lucide-react';
import { getBrowserClient } from '@/lib/supabase/client';
import { prepareBillPhoto } from '@/lib/photos';
import BillForm, { type BillDraft } from './BillForm';
import {
  STANDARD_COLUMNS,
  type BillCompany,
  type BillItem,
  type LabelledValue,
} from '@/lib/bills';

type Stage = 'photo' | 'reading' | 'review';

/** Shape the reader returns. Kept local: the server type lives beside the
 *  Anthropic SDK and must not be imported into the browser. */
type Extracted = {
  company_name: string;
  bill_number: string | null;
  bill_date: string | null;
  columns: string[];
  extra_columns: string[];
  items: BillItem[];
  totals: LabelledValue[];
  notes: string | null;
  low_confidence: string[];
};

const normalise = (name: string) => name.toUpperCase().replace(/[^A-Z0-9]+/g, '');

export default function AddBillForm({ companies }: { companies: BillCompany[] }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('photo');
  const [preview, setPreview] = useState<string | null>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [draft, setDraft] = useState<BillDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  async function handleFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setStage('reading');
    setError(null);

    try {
      const prepared = await prepareBillPhoto(file);

      // Upload and read at the same time — in sequence this is two waits.
      const [path, extracted] = await Promise.all([
        upload(prepared.display),
        read(prepared.readingBase64, prepared.mediaType),
      ]);

      setPhotoPath(path);

      if (!extracted) {
        setDraft(emptyDraft());
        setError('Could not read this bill — please enter it by hand.');
      } else {
        setDraft(draftFrom(extracted, companies));
      }
      setStage('review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setStage('photo');
    }
  }

  async function upload(file: File): Promise<string> {
    // Private bucket: the path is stored, never a public URL. Bills show
    // supplier pricing and must not be fetchable without a session.
    const path = `${crypto.randomUUID()}.jpg`;
    const { error } = await getBrowserClient()
      .storage.from('bill-photos')
      .upload(path, file, { contentType: 'image/jpeg', upsert: false });
    if (error) throw new Error(`Could not upload the photo: ${error.message}`);
    return path;
  }

  async function read(
    base64: string,
    mediaType: string,
  ): Promise<Extracted | null> {
    try {
      const res = await fetch('/api/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: { base64, mediaType } }),
      });
      if (!res.ok) return null;
      return (await res.json()).receipt as Extracted;
    } catch {
      // Reading is a convenience, never a blocker — it can always be typed.
      return null;
    }
  }

  async function save() {
    if (!draft) return;
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
        // Upsert on the normalised name so the same shop entered twice, with
        // different capitals or punctuation, stays one company.
        const { data, error: companyError } = await supabase
          .from('bill_companies')
          .upsert({ name }, { onConflict: 'normalised_name' })
          .select('id')
          .single();
        if (companyError) throw new Error(companyError.message);
        companyId = data.id;
      }

      const { error: billError } = await supabase.from('bills').insert({
        company_id: companyId,
        bill_number: draft.billNumber || null,
        bill_date: draft.billDate || null,
        photo_path: photoPath,
        columns: draft.columns,
        items: draft.items,
        totals: draft.totals,
        notes: draft.notes || null,
        low_confidence: draft.lowConfidence,
      });
      if (billError) throw new Error(billError.message);

      router.push('/admin/receipts');
      router.refresh();
    } catch (e) {
      setError(`Could not save: ${e instanceof Error ? e.message : 'unknown error'}`);
      setSaving(false);
    }
  }

  if (stage === 'review' && draft) {
    return (
      <BillForm
        draft={draft}
        companies={companies}
        photoUrl={preview}
        saving={saving}
        error={error}
        saveLabel="Save bill"
        onChange={setDraft}
        onSave={save}
      />
    );
  }

  if (stage === 'reading') {
    return (
      <div className="max-w-lg mx-auto px-5 py-20 text-center">
        {preview && (
          <div className="frame w-32 mx-auto mb-8 rise">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="w-full" />
          </div>
        )}
        <div className="inline-flex items-center gap-2.5 text-maroon-700">
          <ScanLine size={18} className="animate-pulse" />
          <p className="font-display text-lg">Reading the bill</p>
        </div>
        <p className="text-sm text-ink-soft mt-2">
          This takes about fifteen seconds.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-5 py-10 rise">
      <p className="eyebrow mb-2">Store receipt</p>
      <h1 className="font-display text-[1.75rem] text-maroon-900 leading-tight">
        Add a bill
      </h1>
      <p className="text-ink-soft mt-2.5 leading-relaxed">
        Photograph the whole bill, straight on and in good light. The shop
        name, the items and the totals are read for you.
      </p>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 text-sm text-bad bg-bad-bg border border-bad/20 rounded-lg px-3 py-2.5 mt-5"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}

      <div className="mt-8 space-y-3">
        <button
          onClick={() => cameraRef.current?.click()}
          className="btn btn-primary w-full h-auto py-5 flex-col gap-2"
        >
          <Camera size={26} strokeWidth={1.6} />
          <span className="text-base">Photograph the bill</span>
        </button>
        <button
          onClick={() => galleryRef.current?.click()}
          className="btn btn-secondary w-full"
        >
          <Images size={18} />
          Choose from gallery
        </button>
      </div>

      <div className="rule-fade my-8" />

      <p className="text-sm text-ink-soft leading-relaxed">
        Small print is what decides whether this works. Fill the frame with the
        bill, keep it flat, and avoid shadow across the numbers.
      </p>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => handleFile(e.target.files)}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFile(e.target.files)}
      />
    </div>
  );
}

function emptyDraft(): BillDraft {
  return {
    companyId: null,
    companyName: '',
    billNumber: '',
    billDate: '',
    columns: ['sl_no', 'description', 'quantity', 'rate', 'amount'],
    items: [],
    totals: [],
    notes: '',
    lowConfidence: [],
  };
}

function draftFrom(e: Extracted, companies: BillCompany[]): BillDraft {
  // Standard columns keep the order the bill showed them in; the supplier's
  // own columns follow. Only columns this bill actually has are carried over.
  const standard = e.columns.filter((c) =>
    (STANDARD_COLUMNS as readonly string[]).includes(c),
  );
  const columns = [...standard, ...e.extra_columns];

  // If this shop is already on file, attach to it rather than creating a
  // near-duplicate that splits its bills in two.
  const match = companies.find(
    (c) => normalise(c.name) === normalise(e.company_name),
  );

  return {
    companyId: match?.id ?? null,
    companyName: match?.name ?? e.company_name,
    billNumber: e.bill_number ?? '',
    billDate: /^\d{4}-\d{2}-\d{2}$/.test(e.bill_date ?? '') ? e.bill_date! : '',
    columns: columns.length > 0 ? columns : ['description', 'amount'],
    items: e.items,
    totals: e.totals,
    notes: e.notes ?? '',
    lowConfidence: e.low_confidence,
  };
}
