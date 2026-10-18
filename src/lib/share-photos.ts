'use client';

/**
 * Handing files to WhatsApp — saree photos as an album, and receipts.
 *
 * The saree case is what shaped it, and is described below; ReceiptSheet
 * reuses the same two functions to send a single generated receipt image.
 *
 * WhatsApp only unfurls a preview card for the FIRST link in a message, so a
 * message holding eight links shows one photo and seven bare URLs. The only
 * way to put eight saree photos in front of someone inside the chat is to
 * hand WhatsApp eight actual image files, which is what the Web Share API
 * does.
 *
 * The price is drawn onto each photo rather than written in the caption,
 * because Android routinely drops the text when files are attached — and a
 * customer swiping through eight unlabelled sarees has no idea what any of
 * them costs. Drawn on, the detail also survives the photo being forwarded
 * into another group, which is how these actually travel.
 *
 * The trade-off is real and worth remembering: a photo with a price burned
 * into it is frozen. If the price changes or the saree sells, that image is
 * wrong wherever it has reached. The shareable link is the honest version —
 * this is the reachable one.
 */

/**
 * How many photos go in one share — WhatsApp's own limit per message.
 *
 * This used to be 10, on the theory that a longer album stops being
 * browsable. That was the wrong call: a whole type is exactly what someone
 * asks to see, and quietly sending a quarter of it looked like a bug. A type
 * larger than this is sent in batches rather than truncated.
 */
export const PHOTOS_PER_SEND = 100;

/** Photos prepared at once. Enough to overlap the downloads, few enough that
 *  a mid-range phone is not holding a dozen full-size canvases at the same
 *  time. Order is preserved regardless of which finishes first. */
const PREPARE_AT_ONCE = 4;

/** Wide enough to judge a border, small enough to prepare over mobile data.
 *  Must be one of Next's configured image widths or the optimiser rejects it. */
const SHARE_WIDTH = 1080;

/**
 * Whether this browser can hand image files to another app.
 *
 * Probed with a throwaway file rather than assumed, and checked BEFORE any
 * photo is downloaded — discovering it after pulling two megabytes would
 * waste the data the whole route is built to save.
 */
export function photoSharingSupported(): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.canShare !== 'function') {
    return false;
  }
  try {
    const probe = new File([new Uint8Array([0xff, 0xd8, 0xff])], 'probe.jpg', {
      type: 'image/jpeg',
    });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

/**
 * Fetch one saree photo and draw its name and price along the bottom.
 *
 * Routed through Next's image optimiser, which both shrinks the download
 * (~520KB to ~220KB) and makes it same-origin, so the canvas stays untainted
 * and can be read back out. The canvas re-encodes to JPEG whatever came in —
 * which matters, because WhatsApp can mistake a WebP for a sticker.
 */
export async function buildLabelledPhoto(
  photoUrl: string,
  label: string,
  fileName: string,
): Promise<File> {
  const optimised = `/_next/image?url=${encodeURIComponent(photoUrl)}&w=${SHARE_WIDTH}&q=75`;
  const image = await loadImage(optimised);

  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser could not prepare the photo');

  ctx.drawImage(image, 0, 0);
  drawLabel(ctx, canvas, label);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.85),
  );
  if (!blob) throw new Error('This browser could not prepare the photo');

  return new File([blob], fileName, { type: 'image/jpeg' });
}

/** Hand the album to WhatsApp. Returns false if the share sheet was dismissed,
 *  which is a normal thing to do and not an error to report. */
export async function sharePhotos(files: File[], text: string): Promise<boolean> {
  try {
    await navigator.share({ files, text });
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return false;
    throw error;
  }
}

/**
 * Prepare a whole album, a few photos at a time, in the order given.
 *
 * One photo that will not load is left out rather than failing the album:
 * forty sarees should not go unsent because one image is unreachable. The
 * caller is told how many were dropped so it can say so.
 */
export async function prepareAlbum(
  items: { photoUrl: string; label: string; fileName: string }[],
  onProgress: (done: number, total: number) => void,
): Promise<{ files: File[]; failed: number }> {
  const results: (File | null)[] = new Array(items.length).fill(null);
  let next = 0;
  let done = 0;
  let failed = 0;

  async function worker() {
    while (next < items.length) {
      const i = next++;
      const item = items[i];
      try {
        results[i] = await buildLabelledPhoto(item.photoUrl, item.label, item.fileName);
      } catch {
        failed++;
      }
      done++;
      onProgress(done, items.length);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(PREPARE_AT_ONCE, items.length) }, worker),
  );

  return { files: results.filter((f): f is File => f !== null), failed };
}

// ---------------------------------------------------------------------------

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('A photo could not be loaded'));
    image.src = src;
  });
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  label: string,
) {
  const pad = Math.round(canvas.width * 0.035);
  const fontSize = Math.round(canvas.width * 0.046);

  ctx.font = `600 ${fontSize}px system-ui, -apple-system, Roboto, "Segoe UI", sans-serif`;
  ctx.textBaseline = 'alphabetic';

  // A gradient rather than a solid bar: a hard edge across the bottom of a
  // saree reads as damage to the photo, a fade reads as a caption.
  const fadeHeight = fontSize + pad * 3;
  const gradient = ctx.createLinearGradient(
    0,
    canvas.height - fadeHeight,
    0,
    canvas.height,
  );
  gradient.addColorStop(0, 'rgba(28, 16, 20, 0)');
  gradient.addColorStop(1, 'rgba(28, 16, 20, 0.88)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, canvas.height - fadeHeight, canvas.width, fadeHeight);

  ctx.fillStyle = '#ffffff';
  ctx.fillText(fitToWidth(ctx, label, canvas.width - pad * 2), pad, canvas.height - pad);
}

/** Long names would otherwise run off the edge of the photo. */
function fitToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;

  let trimmed = text;
  while (trimmed.length > 1 && ctx.measureText(`${trimmed}…`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${trimmed.trimEnd()}…`;
}
