'use client';

import { useState } from 'react';
import { X, Images, Link2, AlertCircle } from 'lucide-react';
import { categorySlug } from '@/lib/categories';
import {
  MAX_SHARE_PHOTOS,
  buildLabelledPhoto,
  photoSharingSupported,
  sharePhotos,
} from '@/lib/share-photos';

type Row = {
  id: string;
  name: string;
  category: string;
  price: number;
  photos: string[];
};

type Group = {
  category: string;
  sarees: Row[];
  low: number;
  high: number;
};

const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/**
 * Send a whole saree type at once, two ways.
 *
 * "Photos" hands WhatsApp an album of the actual saree photos, each with its
 * name and price drawn on, so every piece is visible and priced inside the
 * chat without anyone tapping a link. That is what makes it work in a group.
 *
 * "Link" sends the type's page instead — one card, and a page that updates
 * itself as stock changes. Slower to browse, but it never goes out of date,
 * so it is the better thing to send one customer directly.
 */
export default function SendByTypeSheet({
  sarees,
  origin,
  onClose,
}: {
  sarees: Row[];
  origin: string;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  // Preparing the photos and handing them over are deliberately two taps.
  // navigator.share() only works while a user gesture is still live — a few
  // seconds — and downloading eight photos over mobile data takes longer than
  // that, so sharing straight after preparing fails outright.
  const [ready, setReady] = useState<{
    category: string;
    files: File[];
    caption: string;
  } | null>(null);

  // Only types actually on the rack. Offering "Chiffon (0)" invites a tap
  // that can only disappoint.
  const groups: Group[] = Object.values(
    sarees.reduce<Record<string, Group>>((acc, s) => {
      const g = (acc[s.category] ??= {
        category: s.category,
        sarees: [],
        low: s.price,
        high: s.price,
      });
      g.sarees.push(s);
      g.low = Math.min(g.low, s.price);
      g.high = Math.max(g.high, s.price);
      return acc;
    }, {}),
  ).sort((a, b) => b.sarees.length - a.sarees.length);

  function captionFor(group: Group): string {
    const range =
      group.low === group.high
        ? rupees(group.low)
        : `${rupees(group.low)} to ${rupees(group.high)}`;
    return `${group.category} — ${range}\nAll details: ${origin}/c/${categorySlug(group.category)}`;
  }

  async function preparePhotos(group: Group) {
    setError(null);
    setReady(null);

    if (!photoSharingSupported()) {
      setError(
        'This phone cannot pass photos to WhatsApp from the browser. Use Link instead — that works everywhere.',
      );
      return;
    }

    // Every saree needs a photo to appear in the album at all.
    const batch = group.sarees
      .filter((s) => s.photos[0])
      .slice(0, MAX_SHARE_PHOTOS);

    if (batch.length === 0) {
      setError('None of these sarees has a photo yet.');
      return;
    }

    setBusy(group.category);
    setProgress({ done: 0, total: batch.length });

    try {
      const files: File[] = [];
      for (const [i, saree] of batch.entries()) {
        files.push(
          await buildLabelledPhoto(
            saree.photos[0],
            `${saree.name} — ${rupees(saree.price)}`,
            `${saree.id}.jpg`,
          ),
        );
        setProgress({ done: i + 1, total: batch.length });
      }
      setReady({ category: group.category, files, caption: captionFor(group) });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not prepare the photos');
    } finally {
      setBusy(null);
    }
  }

  function sendPrepared() {
    if (!ready) return;
    setError(null);

    // Nothing is awaited before this call on purpose: the share has to happen
    // inside the gesture that triggered it, and an await here would spend it.
    sharePhotos(ready.files, ready.caption)
      .then((shared) => {
        if (shared) onClose();
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : 'Could not open WhatsApp'),
      );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-ink/40 backdrop-blur-[2px]"
      onClick={busy ? undefined : onClose}
    >
      <div
        className="w-full max-w-lg mx-auto bg-surface rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto rise"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="eyebrow mb-1">Send a whole type</p>
            <h2 className="font-display text-xl text-maroon-900 leading-tight">
              Which type?
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={!!busy}
            aria-label="Close"
            className="btn btn-ghost !min-h-0 p-2 -m-1 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-ink-soft leading-relaxed mt-2 mb-5">
          <span className="text-ink font-medium">Photos</span> puts every saree
          in the chat as an album, each with its price on the picture — best for
          groups. <span className="text-ink font-medium">Link</span> sends one
          card and keeps itself correct as stock changes.
        </p>

        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 text-sm text-bad bg-bad-bg border border-bad/20 rounded-lg px-3 py-2.5 mb-4 leading-relaxed"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}

        {groups.length === 0 ? (
          <p className="text-sm text-ink-soft py-6 text-center">
            Nothing on the rack to send yet.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {groups.map((group) => {
              const sending = busy === group.category;
              const isReady = ready?.category === group.category;
              const over = group.sarees.length > MAX_SHARE_PHOTOS;

              return (
                <li key={group.category} className="card overflow-hidden">
                  <div className="px-3.5 pt-3 pb-2.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-display text-[1.0625rem] text-ink">
                        {group.category}
                      </p>
                      <span className="text-sm text-ink-soft tabular-nums shrink-0">
                        {group.sarees.length}{' '}
                        {group.sarees.length === 1 ? 'saree' : 'sarees'}
                      </span>
                    </div>
                    <p className="text-[0.8125rem] text-ink-faint mt-0.5 tabular-nums">
                      {group.low === group.high
                        ? rupees(group.low)
                        : `${rupees(group.low)} – ${rupees(group.high)}`}
                      {over && ` · photos send the newest ${MAX_SHARE_PHOTOS}`}
                    </p>
                  </div>

                  {sending ? (
                    <p className="border-t border-line py-3 text-center text-sm text-maroon-700">
                      Preparing {progress.done} of {progress.total}…
                    </p>
                  ) : isReady ? (
                    // Separate tap, so the share happens inside a live gesture.
                    <div className="border-t border-line p-3">
                      <button
                        onClick={sendPrepared}
                        className="btn btn-primary w-full"
                      >
                        <Images size={16} />
                        Send {ready.files.length}{' '}
                        {ready.files.length === 1 ? 'photo' : 'photos'}
                      </button>
                      <button
                        onClick={() => setReady(null)}
                        className="btn btn-ghost w-full !min-h-0 py-2 mt-1 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 border-t border-line">
                      <button
                        onClick={() => preparePhotos(group)}
                        disabled={!!busy}
                        className="py-3 text-sm font-medium text-maroon-700 hover:bg-maroon-50 transition-colors border-r border-line flex items-center justify-center gap-1.5"
                      >
                        <Images size={15} />
                        Photos
                      </button>
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          `${origin}/c/${categorySlug(group.category)}`,
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-3 text-sm font-medium text-ink-soft hover:bg-canvas-warm transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Link2 size={15} />
                        Link
                      </a>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
