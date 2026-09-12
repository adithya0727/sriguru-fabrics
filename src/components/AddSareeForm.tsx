'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Images, AlertCircle, Sparkles } from 'lucide-react';
import { getBrowserClient } from '@/lib/supabase/client';
import { prepareSareePhoto } from '@/lib/photos';
import type { TaggedAttributes } from '@/lib/types';

type Stage = 'photos' | 'working' | 'review';

type Draft = TaggedAttributes & {
  price: string;
  cost_price: string;
  quantity_total: string;
};

const EMPTY_DRAFT: Draft = {
  name: '',
  description: '',
  category: 'Gadwal',
  fabric: 'semi silk',
  colors: [],
  border: 'plain border',
  motifs: [],
  tags: [],
  has_blouse: false,
  occasion: 'festive',
  low_confidence: [],
  price: '',
  cost_price: '',
  quantity_total: '1',
};

export default function AddSareeForm({ categories }: { categories: string[] }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('photos');
  const [previews, setPreviews] = useState<string[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoFilled, setAutoFilled] = useState(false);
  const [saving, setSaving] = useState(false);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const chosen = Array.from(files).slice(0, 3);
    setPreviews(chosen.map((f) => URL.createObjectURL(f)));
    setStage('working');
    setError(null);
    setNote(null);

    try {
      const prepared = await Promise.all(chosen.map(prepareSareePhoto));

      // Upload and tag at the same time. In sequence this is two waits; in
      // parallel it's one, and the whole point is that adding a saree has to
      // feel faster than not bothering.
      const [urls, tagged] = await Promise.all([
        uploadAll(prepared.map((p) => p.display)),
        requestTags(
          // The border close-up carries most of the identifying detail, so
          // send at most two photos: the full drape and the next one.
          prepared.slice(0, 2).map((p) => ({
            base64: p.taggingBase64,
            mediaType: p.mediaType,
          })),
        ),
      ]);

      setPhotoUrls(urls);

      if (tagged) {
        setDraft({ ...EMPTY_DRAFT, ...tagged });
        setAutoFilled(true);
      } else {
        setAutoFilled(false);
        setNote(
          'Could not read the photos automatically — please fill in the details.',
        );
      }
      setStage('review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setStage('photos');
    }
  }

  async function uploadAll(files: File[]): Promise<string[]> {
    const supabase = getBrowserClient();
    return Promise.all(
      files.map(async (file) => {
        const path = `${crypto.randomUUID()}.jpg`;
        const { error } = await supabase.storage
          .from('saree-photos')
          .upload(path, file, { contentType: 'image/jpeg', upsert: false });
        if (error) throw new Error(`Photo upload failed: ${error.message}`);
        return supabase.storage.from('saree-photos').getPublicUrl(path).data
          .publicUrl;
      }),
    );
  }

  async function requestTags(
    images: { base64: string; mediaType: string }[],
  ): Promise<TaggedAttributes | null> {
    try {
      const res = await fetch('/api/tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images }),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.attributes as TaggedAttributes;
    } catch {
      // Tagging is a convenience, never a blocker — a person can always type.
      return null;
    }
  }

  async function handleSave() {
    setError(null);
    const price = Number(draft.price);
    if (!Number.isFinite(price) || price <= 0) {
      setError('Please enter the selling price.');
      return;
    }

    setSaving(true);
    const quantity = Math.max(1, Number(draft.quantity_total) || 1);
    const supabase = getBrowserClient();

    const { error } = await supabase
      .from('sarees')
      .insert({
        name: draft.name || 'Untitled saree',
        description: draft.description,
        category: draft.category,
        photos: photoUrls,
        fabric: draft.fabric,
        colors: draft.colors,
        border: draft.border,
        motifs: draft.motifs,
        tags: draft.tags,
        has_blouse: draft.has_blouse,
        occasion: draft.occasion,
        price,
        cost_price: draft.cost_price ? Number(draft.cost_price) : null,
        quantity_total: quantity,
        quantity_available: quantity,
        low_confidence: draft.low_confidence,
      });

    if (error) {
      setError(`Could not save: ${error.message}`);
      setSaving(false);
      return;
    }

    // Straight back to the rack. The saree is in the register and its own
    // Send button is on the row, so there is nothing to confirm on the way.
    router.push('/admin');
    router.refresh();
  }

  // ---------------------------------------------------------------- rendering

  if (stage === 'photos') {
    return (
      <div className="max-w-lg mx-auto px-5 py-10 rise">
        <p className="eyebrow mb-2">New arrival</p>
        <h1 className="font-display text-[1.75rem] text-maroon-900 leading-tight">
          Add a saree
        </h1>
        <p className="text-ink-soft mt-2.5 leading-relaxed">
          Three photos is ideal — the full saree, the border, and the pallu.
          Everything else fills in by itself.
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
            <span className="text-base">Take photos</span>
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

        <div className="flex items-start gap-3 text-sm text-ink-soft">
          <Sparkles size={17} className="text-gold-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            The name, description, fabric, border and colours are written for
            you. You only type the two prices.
          </p>
        </div>

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    );
  }

  if (stage === 'working') {
    return (
      <div className="max-w-lg mx-auto px-5 py-20 text-center">
        {previews.length > 0 && (
          <div className="flex gap-2.5 justify-center mb-8">
            {previews.map((src, i) => (
              <div
                key={src}
                className="frame w-20 h-[6.5rem] rise"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
        <div className="inline-flex items-center gap-2.5 text-maroon-700">
          <Sparkles size={18} className="animate-pulse" />
          <p className="font-display text-lg">Reading the photos</p>
        </div>
        <p className="text-sm text-ink-soft mt-2">This takes a few seconds.</p>
      </div>
    );
  }

  // stage === 'review'
  const uncertain = new Set(draft.low_confidence);

  return (
    <div className="max-w-lg mx-auto px-5 py-8">
      <p className="eyebrow mb-2">Almost done</p>
      <h1 className="font-display text-[1.75rem] text-maroon-900 leading-tight">
        Check and save
      </h1>
      <p className="text-ink-soft mt-2">
        Only the prices need typing. Change anything that looks wrong.
      </p>

      {autoFilled && (
        <p className="flex items-center gap-2 text-sm text-maroon-700 bg-maroon-50 border border-maroon-100 rounded-lg px-3 py-2.5 mt-4">
          <Sparkles size={15} className="shrink-0" />
          Details filled in from the photos
        </p>
      )}
      {note && (
        <p className="text-sm text-warn bg-warn-bg border border-gold-300/40 rounded-lg px-3 py-2.5 mt-4">
          {note}
        </p>
      )}

      {previews.length > 0 && (
        <div className="flex gap-2.5 mt-6">
          {previews.map((src) => (
            <div key={src} className="frame w-20 h-[6.5rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Money first — it's the only part a person actually has to think about. */}
      <section className="card p-5 mt-6">
        <h2 className="eyebrow mb-4">Prices</h2>

        <Field label="Selling price" required>
          <div className="relative">
            <span className="field-prefix">
              ₹
            </span>
            <input
              type="number"
              inputMode="numeric"
              autoFocus
              value={draft.price}
              onChange={(e) => setDraft({ ...draft, price: e.target.value })}
              className="field field-money text-lg font-medium"
            />
          </div>
        </Field>

        <Field label="What we paid" hint="Only we see this. Used for profit.">
          <div className="relative">
            <span className="field-prefix">
              ₹
            </span>
            <input
              type="number"
              inputMode="numeric"
              value={draft.cost_price}
              onChange={(e) => setDraft({ ...draft, cost_price: e.target.value })}
              className="field field-money"
            />
          </div>
        </Field>

        <Field label="How many pieces of this design?">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={draft.quantity_total}
            onChange={(e) => setDraft({ ...draft, quantity_total: e.target.value })}
            className="field"
          />
        </Field>
      </section>

      <section className="card p-5 mt-4">
        <h2 className="eyebrow mb-4">Details</h2>

        <Field label="Name">
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="field"
          />
        </Field>

        <Field label="Description">
          <textarea
            rows={3}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            className="field"
          />
        </Field>

        <Field label="Type">
          <select
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            className="field"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Fabric"
          flagged={uncertain.has('fabric')}
          hint={
            uncertain.has('fabric')
              ? 'Hard to tell from a photo — please check'
              : undefined
          }
        >
          <input
            value={draft.fabric}
            onChange={(e) => setDraft({ ...draft, fabric: e.target.value })}
            className={`field ${uncertain.has('fabric') ? 'field-flagged' : ''}`}
          />
        </Field>

        <label className="flex items-center gap-3 py-1 cursor-pointer">
          <input
            type="checkbox"
            checked={draft.has_blouse}
            onChange={(e) => setDraft({ ...draft, has_blouse: e.target.checked })}
            className="w-5 h-5 accent-maroon-700"
          />
          <span className="text-sm text-ink">
            Blouse piece included
            {uncertain.has('has_blouse') && (
              <span className="text-warn"> — please check</span>
            )}
          </span>
        </label>
      </section>

      {error && (
        <p
          role="alert"
          className="text-sm text-bad bg-bad-bg border border-bad/20 rounded-lg px-3 py-2.5 mt-4"
        >
          {error}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn btn-primary w-full mt-6"
      >
        {saving ? 'Saving…' : 'Save saree'}
      </button>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  flagged,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  flagged?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <label className="block text-sm font-medium text-ink mb-1.5">
        {label}
        {required && <span className="text-maroon-600"> *</span>}
        {flagged && <span className="text-gold-700"> ⚠</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-ink-soft mt-1.5">{hint}</p>}
    </div>
  );
}
