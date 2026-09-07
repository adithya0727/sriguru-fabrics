'use client';

import { useRef, useState } from 'react';
import { Camera, Images, Loader2, Check, Share2, AlertCircle } from 'lucide-react';
import { getBrowserClient } from '@/lib/supabase/client';
import { prepareSareePhoto } from '@/lib/photos';
import type { TaggedAttributes } from '@/lib/types';

type Stage = 'photos' | 'working' | 'review' | 'saved';

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
  const [stage, setStage] = useState<Stage>('photos');
  const [previews, setPreviews] = useState<string[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

      // Upload and tag at the same time. Done in sequence this is two waits;
      // in parallel it's one, and the whole point is that adding a saree has
      // to feel faster than not bothering.
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
        setNote(null);
      } else {
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
      // Tagging is a convenience, never a blocker — the person can always type.
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

    const quantity = Math.max(1, Number(draft.quantity_total) || 1);
    const supabase = getBrowserClient();

    const { data, error } = await supabase
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
      })
      .select('id')
      .single();

    if (error) {
      setError(`Could not save: ${error.message}`);
      return;
    }

    setSavedId(data.id);
    setStage('saved');
  }

  function reset() {
    setStage('photos');
    setPreviews([]);
    setPhotoUrls([]);
    setDraft(EMPTY_DRAFT);
    setSavedId(null);
    setNote(null);
    setError(null);
  }

  // ---------------------------------------------------------------- rendering

  if (stage === 'saved' && savedId) {
    const url = `${window.location.origin}/s/${savedId}`;
    const message = `${draft.name}\n₹${Number(draft.price).toLocaleString('en-IN')}\n${url}`;
    return (
      <div className="px-5 py-8 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <Check className="text-green-700" size={28} />
        </div>
        <h2 className="text-lg font-semibold text-stone-900">Saved</h2>
        <p className="text-sm text-stone-500 mt-1 mb-6">
          This link stays correct on its own — if the saree sells, anyone who
          opens it later sees that, and other sarees to look at.
        </p>

        <div className="bg-white border border-stone-200 rounded-xl p-3 text-sm text-stone-600 break-all mb-4">
          {url}
        </div>

        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noreferrer"
          className="tap-target flex items-center justify-center gap-2 w-full rounded-lg bg-green-600 text-white font-medium mb-3"
        >
          <Share2 size={18} />
          Send on WhatsApp
        </a>

        <button
          onClick={reset}
          className="tap-target w-full rounded-lg border border-brand-700 text-brand-700 font-medium"
        >
          Add another saree
        </button>
      </div>
    );
  }

  if (stage === 'photos') {
    return (
      <div className="px-5 py-8">
        <h1 className="text-xl font-semibold text-stone-900 mb-1">Add a saree</h1>
        <p className="text-sm text-stone-500 mb-6">
          Take two or three photos: the full saree, the border, and the pallu.
          The details fill in by themselves.
        </p>

        {error && (
          <p className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}

        <button
          onClick={() => cameraRef.current?.click()}
          className="tap-target w-full flex items-center justify-center gap-2 rounded-xl bg-brand-700 text-white font-medium mb-3 py-4"
        >
          <Camera size={20} />
          Take photos
        </button>

        <button
          onClick={() => galleryRef.current?.click()}
          className="tap-target w-full flex items-center justify-center gap-2 rounded-xl border border-stone-300 text-stone-700 font-medium py-4"
        >
          <Images size={20} />
          Choose from gallery
        </button>

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
      <div className="px-5 py-16 text-center">
        <Loader2 className="animate-spin mx-auto text-brand-600 mb-4" size={32} />
        <p className="text-stone-700 font-medium">Reading the photos…</p>
        <p className="text-sm text-stone-500 mt-1">This takes a few seconds.</p>
        {previews.length > 0 && (
          <div className="flex gap-2 justify-center mt-6">
            {previews.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt=""
                className="w-16 h-20 object-cover rounded-lg opacity-60"
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // stage === 'review'
  const uncertain = new Set(draft.low_confidence);

  return (
    <div className="px-5 py-6">
      <h1 className="text-xl font-semibold text-stone-900 mb-1">Check and save</h1>
      <p className="text-sm text-stone-500 mb-5">
        Only the prices need typing. Change anything that looks wrong.
      </p>

      {note && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
          {note}
        </p>
      )}

      {previews.length > 0 && (
        <div className="flex gap-2 mb-5">
          {previews.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt=""
              className="w-20 h-24 object-cover rounded-lg border border-stone-200"
            />
          ))}
        </div>
      )}

      {/* Money first — it's the only part a person actually has to think about. */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 mb-5">
        <Field label="Selling price (₹)" required>
          <input
            type="number"
            inputMode="numeric"
            autoFocus
            value={draft.price}
            onChange={(e) => setDraft({ ...draft, price: e.target.value })}
            className="tap-target w-full px-3 rounded-lg border border-stone-300 text-lg font-medium focus:border-brand-600 outline-none"
          />
        </Field>

        <Field label="What we paid (₹)" hint="Only we see this. Used for profit.">
          <input
            type="number"
            inputMode="numeric"
            value={draft.cost_price}
            onChange={(e) => setDraft({ ...draft, cost_price: e.target.value })}
            className="tap-target w-full px-3 rounded-lg border border-stone-300 focus:border-brand-600 outline-none"
          />
        </Field>

        <Field label="How many pieces of this design?">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={draft.quantity_total}
            onChange={(e) =>
              setDraft({ ...draft, quantity_total: e.target.value })
            }
            className="tap-target w-full px-3 rounded-lg border border-stone-300 focus:border-brand-600 outline-none"
          />
        </Field>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-4 mb-5">
        <Field label="Name">
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="tap-target w-full px-3 rounded-lg border border-stone-300 focus:border-brand-600 outline-none"
          />
        </Field>

        <Field label="Description">
          <textarea
            rows={3}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:border-brand-600 outline-none"
          />
        </Field>

        <Field label="Type">
          <select
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            className="tap-target w-full px-3 rounded-lg border border-stone-300 bg-white focus:border-brand-600 outline-none"
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
          hint={uncertain.has('fabric') ? 'Please check this one' : undefined}
        >
          <input
            value={draft.fabric}
            onChange={(e) => setDraft({ ...draft, fabric: e.target.value })}
            className={`tap-target w-full px-3 rounded-lg border outline-none ${
              uncertain.has('fabric')
                ? 'border-amber-400 bg-amber-50'
                : 'border-stone-300'
            }`}
          />
        </Field>

        <label className="flex items-center gap-3 py-2">
          <input
            type="checkbox"
            checked={draft.has_blouse}
            onChange={(e) => setDraft({ ...draft, has_blouse: e.target.checked })}
            className="w-5 h-5 accent-brand-700"
          />
          <span className="text-sm text-stone-700">
            Blouse piece included
            {uncertain.has('has_blouse') && (
              <span className="text-amber-700"> — please check</span>
            )}
          </span>
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <button
        onClick={handleSave}
        className="tap-target w-full rounded-xl bg-brand-700 text-white font-medium py-4"
      >
        Save saree
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
      <label className="block text-sm font-medium text-stone-700 mb-1.5">
        {label}
        {required && <span className="text-brand-600"> *</span>}
        {flagged && <span className="text-amber-600"> ⚠</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-stone-500 mt-1">{hint}</p>}
    </div>
  );
}
