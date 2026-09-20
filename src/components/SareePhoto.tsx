'use client';

/**
 * A saree photo, at the size it is actually displayed.
 *
 * The stored photos are ~520KB each. A catalogue of forty of them was a 20MB
 * page — opened from WhatsApp, on mobile data, which is how nearly every
 * customer arrives. Served through the optimiser at the width the card really
 * occupies, the same page is under 4MB.
 *
 * A client component for one reason: `onError`. If image optimisation is ever
 * unavailable, this falls back to the original file, so a customer sees a slow
 * photo rather than an empty card. There is no state and no effect, so the
 * cost of the boundary is a single event handler.
 */
export default function SareePhoto({
  url,
  alt,
  className,
  widths,
  sizes,
  eager,
}: {
  url: string | undefined;
  alt: string;
  className?: string;
  /** Widths to offer; the browser picks by screen density and layout. */
  widths: number[];
  /** How wide the image will be rendered, in CSS terms. */
  sizes: string;
  eager?: boolean;
}) {
  if (!url) {
    return <div className={className} aria-hidden />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={optimised(url, widths[0])}
      srcSet={widths.map((w) => `${optimised(url, w)} ${w}w`).join(', ')}
      sizes={sizes}
      onError={(e) => {
        const img = e.currentTarget;
        if (img.src !== url) {
          img.srcset = '';
          img.src = url;
        }
      }}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={className}
    />
  );
}

/** Widths must be ones Next is configured to produce, or the optimiser
 *  rejects the request outright. These are all defaults. */
function optimised(url: string, width: number): string {
  return `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=75`;
}
