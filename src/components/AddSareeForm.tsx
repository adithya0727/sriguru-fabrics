'use client';

import { useEffect, useRef, useState } from 'react';
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
import { formatBillDate, parseAmount } from '@/lib/bills';
import { BORDERS, FABRICS } from '@/lib/vocabulary';
import ChoiceField from './ChoiceField';
import BillLinePicker, { type LineChoice } from './BillLinePicker';

type Stage = 'photos' | 'working' | 'review';

/** A bill she can say this saree came from. */
export type BillChoice = {
  id: string;
  company: string;
  billNumber: string | null;
  billDate: string | null;
  lines: { description: string; rate: string | null }[];
};

/** The line the reader matched, if it was sure enough to name one. */
type Match = { lineNumber: number };

type Draft = TaggedAttributes & {
  price: string;
  cost_price: string;
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
  // What the reader suggested, and what she has settled on. Kept apart so
  // the suggestion can stay marked even after she taps a different line.
  const [suggestedLine, setSuggestedLine] = useState<number | null>(null);
  const [chosenLine, setChosenLine] = useState<LineChoice>(null);
  const [stage, setStage] = useState<Stage>('photos');
  const [previews, setPreviews] = useState<string[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoFilled, setAutoFilled] = useState(false);
  const [saving, setSaving] = useState(false);

  const bill = bills.find((b) => b.id === billId) ?? null;

  // Previews are object URLs; release them when replaced or on leaving, or a
  // long session of adding sarees slowly holds every photo in memory.
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

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
      //
      // Every photo she chose goes to the reader. With the old model a second
      // photo tripled the wait past the host's limit, so only one was sent;
      // the current one answers in about three seconds, and a border or pallu
      // close-up is exactly what it needs to stop guessing the border.
      const forReading = prepared.map((p) => ({
        base64: p.taggingBase64,
        mediaType: p.mediaType,
      }));
      setReadable(forReading);

      const [urls, tagged] = await Promise.all([
        uploadAll(prepared.map((p) => p.display)),
        requestTags(forReading),
      ]);

      setPhotoUrls(urls);

      const line = tagged?.match ? tagged.match.lineNumber - 1 : null;
      setSuggestedLine(line);
      setChosenLine(line);

      if (tagged?.attributes) {
        setDraft({
          ...EMPTY_DRAFT,
          ...tagged.attributes,
          // Straight off the bill rather than guessed from the photograph.
          // Still shown, selected, among the other lines — a wrong match would
          // otherwise put a wrong cost price into the accounts silently.
          cost_price: line != null ? rateOf(line) : '',
        });
        setAutoFilled(true);
      } else {
        setDraft({ ...EMPTY_DRAFT, cost_price: line != null ? rateOf(line) : '' });
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
      const line = tagged.match ? tagged.match.lineNumber - 1 : null;
      setSuggestedLine(line);
      // Follow the new suggestion only if she hasn't already picked a line.
      if (chosenLine === null && line != null) {
        setChosenLine(line);
        setDraft((current) => ({ ...current, ...tagged.attributes, cost_price: rateOf(line) }));
      } else {
        setDraft((current) => ({ ...current, ...tagged.attributes }));
      }
      setAutoFilled(true);
    }
    setRereading(false);
  }

  async function handleSave() {
    setError(null);
    // A saree without a name goes public as "Untitled saree" — on the
    // catalogue, and once on the shop's own WhatsApp card.
    if (!draft.name.trim()) {
      setError('Please give this saree a name.');
      return;
    }
    const price = Number(draft.price);
    if (!Number.isFinite(price) || price <= 0) {
      setError('Please enter the selling price.');
      return;
    }

    setSaving(true);
    const supabase = getBrowserClient();

    // From the bill unless she said it isn't. A line gives the supplier's own
    // wording; the bill alone still tells us who sold it, and when.
    const fromBill = bill && chosenLine !== 'none' ? bill : null;
    const line = fromBill && typeof chosenLine === 'number' ? fromBill.lines[chosenLine] : null;

    const { error } = await supabase
      .from('sarees')
      .insert({
        name: draft.name.trim(),
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
        // One saree, one entry: she photographs and lists them individually.
        quantity_total: 1,
        quantity_available: 1,
        low_confidence: draft.low_confidence,
        // Family-only. bill_item_name keeps the supplier's own wording so the
        // words printed on the paper will find this saree in the register.
        bill_id: fromBill?.id ?? null,
        bill_item_name: line?.description ?? null,
        supplier: fromBill?.company ?? null,
        purchased_on: fromBill?.billDate ?? null,
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

  /** A bill line's rate as the cost-price field expects it, or ''. */
  function rateOf(index: number): string {
    const rate = parseAmount(bill?.lines[index]?.rate);
    return rate != null ? String(rate) : '';
  }

  /** Tapping a line fills its cost — through changeCost, so a percentage she
   *  already chose carries straight on to the selling price. */
  function chooseLine(choice: LineChoice) {
    const previous = typeof chosenLine === 'number' ? rateOf(chosenLine) : '';
    setChosenLine(choice);
    if (typeof choice === 'number') {
      changeCost(rateOf(choice));
    } else if (previous && draft.cost_price === previous) {
      // Leaving a line takes its cost with it — but never a cost she typed.
      changeCost('');
    }
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
          Photograph the whole saree, spread out in good light. Everything else
          fills in by itself.
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
                  {` · ${b.lines.length} ${b.lines.length === 1 ? 'item' : 'items'}`}
                </option>
              ))}
            </select>
            <p className="text-xs text-ink-soft mt-1.5 leading-relaxed">
              Choosing the bill fills in the cost price from it, so you don&rsquo;t
              have to type it.
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
            The name, type, fabric and border are filled in for you to check.
            For a sharper read of the border, add a close-up of it from the
            gallery too.
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

      {bill && bill.lines.length > 0 && (
        <div className="mt-4">
          <BillLinePicker
            lines={bill.lines}
            chosen={chosenLine}
            suggested={suggestedLine}
            onChoose={chooseLine}
            intro={
              (suggestedLine != null
                ? 'Matched from the photo — check it, or tap the right one.'
                : 'The photo didn’t clearly match a line. Tap the one this saree is.') +
              ' It fills in the cost price.'
            }
          />
        </div>
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

        <Field label="Cost price" hint="Only we see this. Used for profit.">
          <div className="relative">
            <span className="field-prefix">₹</span>
            <input
              type="number"
              inputMode="numeric"
              // With a bill, the first thing to do is pick its line, so the
              // keyboard shouldn't jump up over it.
              autoFocus={!bill}
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
              placeholder="Percent on top of the cost price"
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

      </section>

      <section className="card p-5 mt-4">
        <h2 className="eyebrow mb-4">Details</h2>

        <Field label="Name" required>
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
            hint={uncertain.has('fabric') ? 'Hard to tell — please check' : undefined}
          >
            <ChoiceField
              value={draft.fabric}
              options={FABRICS}
              flagged={uncertain.has('fabric')}
              onChange={(fabric) => setDraft({ ...draft, fabric })}
            />
          </Field>

          {/* Shown here, not only on the edit screen: a whole-saree photo
              shows the border as a thin strip, so this is the field most
              often worth correcting before saving. */}
          <Field
            label="Border"
            flagged={uncertain.has('border')}
            hint={uncertain.has('border') ? 'Hard to tell — please check' : undefined}
          >
            <ChoiceField
              value={draft.border}
              options={BORDERS}
              flagged={uncertain.has('border')}
              onChange={(border) => setDraft({ ...draft, border })}
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
  if (margin <= 0) return 'This is at or below the cost price.';
  return `₹${margin.toLocaleString('en-IN')} on each piece.`;
}

