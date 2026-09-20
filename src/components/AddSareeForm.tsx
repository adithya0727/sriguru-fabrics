'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera,
  Images,
  AlertCircle,
  Sparkles,
  ReceiptText,
  RefreshCw,
} from 'lucide-react';
import { getBrowserClient } from '@/lib/supabase/client';
import { prepareSareePhoto } from '@/lib/photos';
import type { TaggedAttributes } from '@/lib/types';
import { formatBillDate } from '@/lib/bills';

type Stage = 'photos' | 'working' | 'review';

/** A bill she can say this saree came from. */
export type BillChoice = {
  id: string;
  company: string;
  billNumber: string | null;
  billDate: string | null;
  itemCount: number;
};

/** What a matched bill line fills in, kept so it can be shown and saved. */
type Match = {
  billId: string;
  itemName: string;
  costPrice: number | null;
  quantity: number | null;
  supplier: string | null;
  purchasedOn: string | null;
};

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

export default function AddSareeForm({
  categories,
  bills,
}: {
  categories: string[];
  bills: BillChoice[];
}) {
  const router = useRouter();
  const [billId, setBillId] = useState<string>('');
  const [markup, setMarkup] = useState('');
  // Kept so a failed read can be retried without photographing again — the
  // photos are already uploaded by then, and asking her to reshoot for a
  // timeout that was never her fault is the wrong answer.
  const [readable, setReadable] = useState<
    { base64: string; mediaType: string }[]
  >([]);
  const [rereading, setRereading] = useState(false);
  const [match, setMatch] = useState<Match | null>(null);
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
      // One photo, not two. Measured, a second image roughly triples how long
      // the read takes — 15-37s against 7-20s — and the host kills the request
      // well before the longer end. A read that times out tells you nothing at
      // all, which is worse than one that saw only the full drape.
      const forReading = prepared.slice(0, 1).map((p) => ({
        base64: p.taggingBase64,
        mediaType: p.mediaType,
      }));
      setReadable(forReading);

      const [urls, tagged] = await Promise.all([
        uploadAll(prepared.map((p) => p.display)),
        requestTags(forReading),
      ]);

      setPhotoUrls(urls);
      setMatch(tagged?.match ?? null);

      if (tagged?.attributes) {
        const found = tagged.match;
        setDraft({
          ...EMPTY_DRAFT,
          ...tagged.attributes,
          // Straight off the bill rather than guessed from the photograph.
          // Still shown for confirmation — a wrong match would otherwise put
          // a wrong cost price into the accounts silently.
          cost_price: found?.costPrice != null ? String(found.costPrice) : '',
          // Only when the line is counted in whole pieces. Some are billed by
          // the metre, and 2.5 metres is not two and a half sarees.
          quantity_total:
            found?.quantity != null &&
            found.quantity >= 1 &&
            Number.isInteger(found.quantity)
              ? String(found.quantity)
              : EMPTY_DRAFT.quantity_total,
        });
        setAutoFilled(true);
      } else {
        setAutoFilled(false);
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

  /**
   * Ask the server to read the photos.
   *
   * Tagging is a convenience and never blocks saving, but the reason it failed
   * is recorded rather than swallowed. Treating every failure as "could not
   * read the photos" hid a host timeout for days: the message said the model
   * had looked and failed, when in truth it was never given the chance.
   */
  async function requestTags(
    images: { base64: string; mediaType: string }[],
  ): Promise<{ attributes: TaggedAttributes; match: Match | null } | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 55_000);

    try {
      const res = await fetch('/api/tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Only the id travels. The bill's lines are read on the server, since
        // they decide the cost price that gets recorded.
        body: JSON.stringify({ images, billId: billId || null }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setNote(
          body?.error
            ? `Could not read the photos: ${body.error}`
            : `Could not read the photos — the reader answered ${res.status}. Try again, or type the details.`,
        );
        return null;
      }

      const json = await res.json();
      return {
        attributes: json.attributes as TaggedAttributes,
        match: (json.match as Match | null) ?? null,
      };
    } catch (e) {
      const stopped = e instanceof DOMException && e.name === 'AbortError';
      setNote(
        stopped
          ? 'Reading the photos took too long and was stopped. The photos are saved — try reading them again, or just type the details.'
          : `Could not reach the reader: ${e instanceof Error ? e.message : 'no connection'}. The photos are saved.`,
      );
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  /** Retry the read on photos that are already uploaded. */
  async function readAgain() {
    if (readable.length === 0 || rereading) return;
    setRereading(true);
    setNote(null);

    const tagged = await requestTags(readable);
    if (tagged?.attributes) {
      setMatch(tagged.match);
      setDraft((current) => ({ ...current, ...tagged.attributes }));
      setAutoFilled(true);
    }
    setRereading(false);
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
        // Family-only. bill_item_name keeps the supplier's own wording so the
        // words printed on the paper will find this saree in the register.
        bill_id: match?.billId ?? (billId || null),
        bill_item_name: match?.itemName ?? null,
        supplier: match?.supplier ?? null,
        purchased_on: match?.purchasedOn ?? null,
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

  /** Cost plus a percentage, to the nearest rupee. */
  function sellingPriceFrom(cost: string, percent: string): string {
    const c = Number(cost);
    const p = Number(percent);
    if (!Number.isFinite(c) || c <= 0) return '';
    if (!Number.isFinite(p) || percent.trim() === '') return '';
    return String(Math.round(c * (1 + p / 100)));
  }

  /** Cost changed — carry the price with it only while a percentage is set, so
   *  a hand-typed price is never overwritten from underneath. */
  function changeCost(cost: string) {
    const price = sellingPriceFrom(cost, markup);
    setDraft({ ...draft, cost_price: cost, price: price || draft.price });
  }

  function changeMarkup(percent: string) {
    setMarkup(percent);
    const price = sellingPriceFrom(draft.cost_price, percent);
    if (price) setDraft({ ...draft, price });
  }

  /** Typing a price directly drops the percentage: it described how the price
   *  was arrived at, and once overridden it no longer does. Leaving "40" on
   *  screen beside a price that is not cost plus 40% would simply be wrong. */
  function changePrice(price: string) {
    setMarkup('');
    setDraft({ ...draft, price });
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

        {bills.length > 0 && (
          <div className="mt-7">
            <label
              htmlFor="bill"
              className="block text-sm font-medium text-ink mb-1.5"
            >
              Which bill is this from?
            </label>
            <select
              id="bill"
              value={billId}
              onChange={(e) => setBillId(e.target.value)}
              className="field"
            >
              <option value="">Not from a bill</option>
              {bills.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.company}
                  {b.billDate ? ` · ${formatBillDate(b.billDate)}` : ''}
                  {` · ${b.itemCount} ${b.itemCount === 1 ? 'item' : 'items'}`}
                </option>
              ))}
            </select>
            <p className="text-xs text-ink-soft mt-1.5 leading-relaxed">
              Choosing the bill lets the price and the shop's own name for this
              saree be filled in from it, instead of typed.
            </p>
          </div>
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
        <div className="text-sm text-warn bg-warn-bg border border-gold-300/40 rounded-lg px-3 py-2.5 mt-4">
          <p className="leading-relaxed">{note}</p>
          {readable.length > 0 && (
            <button
              onClick={readAgain}
              disabled={rereading}
              className="btn btn-secondary w-full mt-3 text-sm"
            >
              <RefreshCw size={15} className={rereading ? 'animate-spin' : ''} />
              {rereading ? 'Reading again…' : 'Read the photos again'}
            </button>
          )}
        </div>
      )}

      {match ? (
        <div className="card p-4 mt-4 border-good/30 bg-good-bg/50">
          <p className="flex items-center gap-2 text-sm text-good font-medium">
            <ReceiptText size={15} className="shrink-0" />
            Matched to the bill
          </p>
          <p className="text-sm text-ink mt-1.5 leading-relaxed">
            “{match.itemName}”
          </p>
          <p className="text-xs text-ink-soft mt-1.5 leading-relaxed">
            {match.supplier ?? 'Supplier'}
            {match.costPrice != null &&
              ` · cost ₹${match.costPrice.toLocaleString('en-IN')} filled in below`}
            . Worth a glance — if this is the wrong line, clear the cost price.
          </p>
        </div>
      ) : (
        billId && (
          <p className="text-sm text-ink-soft bg-canvas-warm border border-line rounded-lg px-3 py-2.5 mt-4 leading-relaxed">
            No line on that bill matched this saree, so the details below were
            read from the photos only.
          </p>
        )
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

      {/* Money first — it's the only part a person actually has to think about.
          Cost leads, because the selling price is worked out from it. */}
      <section className="card p-5 mt-6">
        <h2 className="eyebrow mb-4">Prices</h2>

        <Field label="What we paid" hint="Only we see this. Used for profit.">
          <div className="relative">
            <span className="field-prefix">₹</span>
            <input
              type="number"
              inputMode="numeric"
              autoFocus
              value={draft.cost_price}
              onChange={(e) => changeCost(e.target.value)}
              className="field field-money text-lg font-medium"
            />
          </div>
        </Field>

        <Field
          label="Add on"
          hint="The usual amounts are a tap away; any other number can be typed."
        >
          <div className="flex gap-2 mb-2.5">
            {['40', '50', '60'].map((percent) => (
              <button
                key={percent}
                type="button"
                onClick={() => changeMarkup(markup === percent ? '' : percent)}
                className={`chip ${markup === percent ? 'chip-active' : ''}`}
              >
                {percent}%
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              value={markup}
              onChange={(e) => changeMarkup(e.target.value)}
              placeholder="Percent on top of what we paid"
              className="field pr-9"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none">
              %
            </span>
          </div>
        </Field>

        <Field label="Selling price" required hint={marginHint(draft)}>
          <div className="relative">
            <span className="field-prefix">₹</span>
            <input
              type="number"
              inputMode="numeric"
              value={draft.price}
              onChange={(e) => changePrice(e.target.value)}
              className="field field-money text-lg font-medium"
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

/** What each piece earns, once both prices are in. The profit is shown rather
 *  than the sum that produced it — that is the number worth a second look. */
function marginHint(draft: {
  price: string;
  cost_price: string;
}): string | undefined {
  const price = Number(draft.price);
  const cost = Number(draft.cost_price);
  if (!Number.isFinite(price) || !Number.isFinite(cost)) return undefined;
  if (price <= 0 || cost <= 0) return undefined;

  const margin = price - cost;
  if (margin <= 0) return 'This is at or below what we paid.';
  return `₹${margin.toLocaleString('en-IN')} on each piece.`;
}
