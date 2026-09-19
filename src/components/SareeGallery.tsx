'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * The customer's view of a saree's photos: swipe sideways through them, with
 * the thumbnails underneath doubling as the position indicator.
 *
 * Built on native scroll-snap rather than a carousel library. A real scroll
 * container gives momentum, rubber-banding and mid-swipe interruption for
 * free, all of which a JS-driven slider has to imitate badly — and on the
 * mid-range Android phones these customers actually use, the native one is
 * the only version that feels right.
 *
 * Photos are shown whole (object-contain) rather than filled to the frame.
 * Cropping is fine on a grid card, where the photo is an index entry, but
 * this is the view where someone decides whether to buy: cutting off the
 * pallu or the border edge hides the part they are looking for.
 */
export default function SareeGallery({
  photos,
  name,
  sold,
}: {
  photos: string[];
  name: string;
  sold: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Read the position off the track rather than tracking taps. A swipe, a
  // thumbnail jump and a fling all end as a scroll offset, so that offset is
  // the one answer that is never out of step with what is on screen.
  const syncActive = useCallback(() => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    setActive(Math.min(Math.max(index, 0), photos.length - 1));
  }, [photos.length]);

  function goTo(index: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({
      left: index * track.clientWidth,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }

  if (photos.length === 0) {
    return (
      <div className="frame aspect-[3/4] rise flex items-center justify-center">
        <p className="text-sm text-ink-faint">No photo yet</p>
      </div>
    );
  }

  const single = photos.length === 1;

  return (
    <div className="rise">
      <div className="frame aspect-[3/4]">
        <div
          ref={trackRef}
          onScroll={syncActive}
          role="group"
          aria-label={`Photos of ${name}`}
          className={
            'flex h-full w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ' +
            // overscroll-x-contain matters more than it looks: without it, a
            // swipe past the last photo triggers Android Chrome's back
            // gesture and the customer loses the page entirely.
            (single
              ? ''
              : 'overflow-x-auto overscroll-x-contain snap-x snap-mandatory')
          }
        >
          {photos.map((url, i) => (
            <div
              key={url}
              className="w-full h-full shrink-0 snap-start flex items-center justify-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sized(url, 1080)}
                onError={(e) => fallBackToOriginal(e.currentTarget, url)}
                alt={i === 0 ? name : `${name}, photo ${i + 1}`}
                // Only the first photo is worth blocking the page for; the
                // rest arrive as they are swiped to.
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                draggable={false}
                className={`max-w-full max-h-full object-contain ${
                  sold ? 'grayscale-[0.7] opacity-70' : ''
                }`}
              />
            </div>
          ))}
        </div>

        {sold && (
          <div className="absolute top-4 left-4 bg-ink/90 text-white text-xs font-medium tracking-wide uppercase px-3 py-1.5 rounded-full backdrop-blur-sm">
            Sold
          </div>
        )}

        {!single && (
          <div
            aria-hidden
            className="absolute bottom-3 right-3 bg-ink/70 text-white text-[0.6875rem] font-medium tabular-nums px-2.5 py-1 rounded-full backdrop-blur-sm"
          >
            {active + 1} / {photos.length}
          </div>
        )}
      </div>

      {!single && (
        <div className="flex gap-2.5 mt-2.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {photos.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === active}
              className={`frame w-16 h-20 shrink-0 transition-opacity ${
                i === active
                  ? 'ring-2 ring-maroon-700 ring-offset-2 ring-offset-canvas'
                  : 'opacity-60'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sized(url, 256)}
                onError={(e) => fallBackToOriginal(e.currentTarget, url)}
                alt=""
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

/**
 * Serve a photo at the size it is actually displayed.
 *
 * The stored photos are ~520KB each, so a three-photo saree costs a customer
 * 1.5MB of mobile data to look at. Through the optimiser the same page opens
 * on about a fifth of that.
 */
function sized(url: string, width: number): string {
  return `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=75`;
}

/** If optimisation is unavailable, show the original rather than nothing —
 *  a slow photo is a bad day, a missing one loses the sale. */
function fallBackToOriginal(img: HTMLImageElement, original: string) {
  if (img.src !== original) img.src = original;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
