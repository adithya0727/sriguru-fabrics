'use client';

import { SHOP } from './shop';

/**
 * A receipt, drawn to a canvas.
 *
 * Deliberately an image rather than a PDF. In WhatsApp a PDF arrives as a grey
 * attachment the customer has to tap and wait for a viewer to open; an image is
 * simply there in the chat, readable at a glance and forwardable like a photo.
 * Canvas also needs no library and renders ₹ from system fonts, where a PDF's
 * built-in fonts have no rupee glyph at all.
 */

/** Only what a customer may see. Cost price and profit sit on the sales row
 *  right beside these and must never be passed in — this type is the guard. */
export type ReceiptLine = {
  name: string;
  category: string;
  askingPrice: number;
  finalPrice: number;
  discountPercent: number;
};

export type ReceiptData = {
  number: string;
  date: Date;
  customer: string | null;
  lines: ReceiptLine[];
};

const W = 1080;
const PAD = 72;
const BAND_H = 196;
const ROW_H = 104;

const INK = '#2b1b1f';
const INK_SOFT = '#6b565b';
const INK_FAINT = '#9c8a8e';
const MAROON = '#742836';
const MAROON_DEEP = '#5c1f2b';
const CANVAS_BG = '#fbf7f4';
const LINE = '#e3d7d0';
const GOOD = '#2f6b4f';

const rupees = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export async function renderReceipt(data: ReceiptData): Promise<Blob> {
  // The page's own fonts, so the receipt looks like the shop rather than like
  // a browser default. Reading the family off the CSS variable is how to reach
  // a next/font face by name from canvas.
  await document.fonts.ready;
  const root = getComputedStyle(document.documentElement);
  const display = root.getPropertyValue('--font-fraunces').trim() || 'Georgia';
  const sans = root.getPropertyValue('--font-inter').trim() || 'system-ui';

  const serif = (size: number, weight = 600) =>
    `${weight} ${size}px ${display}, Georgia, serif`;
  const text = (size: number, weight = 400) =>
    `${weight} ${size}px ${sans}, system-ui, sans-serif`;

  const totalFinal = data.lines.reduce((t, l) => t + l.finalPrice, 0);
  const totalAsking = data.lines.reduce((t, l) => t + l.askingPrice, 0);
  const saved = totalAsking - totalFinal;

  const height =
    BAND_H +
    56 + 96 +                      // receipt number block
    (data.customer ? 96 : 0) +     // customer block
    70 +                           // column heads
    data.lines.length * ROW_H +
    40 + (saved > 0 ? 150 : 110) + // totals
    56 + 190;                      // footer

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = Math.round(height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser could not draw the receipt');

  ctx.fillStyle = CANVAS_BG;
  ctx.fillRect(0, 0, W, canvas.height);
  ctx.textBaseline = 'alphabetic';

  // ---- header band ----
  ctx.fillStyle = MAROON_DEEP;
  ctx.fillRect(0, 0, W, BAND_H);

  ctx.fillStyle = '#ffffff';
  ctx.font = serif(48);
  ctx.textAlign = 'center';
  ctx.fillText(SHOP.name, W / 2, 96);

  ctx.font = text(24);
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.fillText(SHOP.tagline, W / 2, 140);

  // A thin gold rule for the zari the shop actually sells.
  ctx.fillStyle = '#c9a227';
  ctx.fillRect(0, BAND_H - 6, W, 6);

  let y = BAND_H + 72;

  // ---- receipt number and date ----
  ctx.textAlign = 'left';
  ctx.fillStyle = INK_FAINT;
  ctx.font = text(20, 500);
  ctx.fillText('RECEIPT', PAD, y);

  ctx.textAlign = 'right';
  ctx.fillStyle = MAROON;
  ctx.font = text(30, 600);
  ctx.fillText(data.number, W - PAD, y);

  y += 40;
  ctx.textAlign = 'left';
  ctx.fillStyle = INK_SOFT;
  ctx.font = text(26);
  ctx.fillText(
    data.date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    PAD,
    y,
  );

  y += 56;

  // ---- customer ----
  if (data.customer) {
    ctx.fillStyle = INK_FAINT;
    ctx.font = text(20, 500);
    ctx.fillText('FOR', PAD, y);
    y += 40;
    ctx.fillStyle = INK;
    ctx.font = serif(34);
    ctx.fillText(data.customer, PAD, y);
    y += 56;
  }

  // ---- column heads ----
  rule(ctx, y);
  y += 38;
  ctx.fillStyle = INK_FAINT;
  ctx.font = text(19, 500);
  ctx.textAlign = 'left';
  ctx.fillText('ITEM', PAD, y);
  ctx.textAlign = 'right';
  ctx.fillText('AMOUNT', W - PAD, y);
  y += 22;
  rule(ctx, y);

  // ---- lines ----
  for (const line of data.lines) {
    y += ROW_H;

    ctx.textAlign = 'left';
    ctx.fillStyle = INK;
    ctx.font = text(29, 500);
    ctx.fillText(fit(ctx, line.name, W - PAD * 2 - 280), PAD, y - 40);

    ctx.fillStyle = INK_FAINT;
    ctx.font = text(23);
    const note =
      line.discountPercent > 0
        ? `${line.category} · ${rupees(line.askingPrice)} less ${line.discountPercent}%`
        : line.category;
    ctx.fillText(note, PAD, y - 8);

    ctx.textAlign = 'right';
    ctx.fillStyle = INK;
    ctx.font = text(30, 500);
    ctx.fillText(rupees(line.finalPrice), W - PAD, y - 40);
  }

  y += 40;
  rule(ctx, y);
  y += 66;

  // ---- total ----
  ctx.textAlign = 'left';
  ctx.fillStyle = INK_SOFT;
  ctx.font = text(28);
  ctx.fillText('Total', PAD, y);

  ctx.textAlign = 'right';
  ctx.fillStyle = MAROON_DEEP;
  ctx.font = serif(46);
  ctx.fillText(rupees(totalFinal), W - PAD, y);

  if (saved > 0) {
    y += 44;
    ctx.textAlign = 'right';
    ctx.fillStyle = GOOD;
    ctx.font = text(24, 500);
    ctx.fillText(`You saved ${rupees(saved)}`, W - PAD, y);
  }

  y += 56;
  rule(ctx, y);
  y += 60;

  // ---- footer ----
  ctx.textAlign = 'center';
  ctx.fillStyle = INK_SOFT;
  ctx.font = text(24);
  for (const addressLine of SHOP.addressLines) {
    ctx.fillText(addressLine, W / 2, y);
    y += 36;
  }
  ctx.fillText(SHOP.phoneDisplay, W / 2, y);

  y += 58;
  ctx.fillStyle = MAROON;
  ctx.font = serif(30);
  ctx.fillText('Thank you', W / 2, y);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.95),
  );
  if (!blob) throw new Error('This browser could not draw the receipt');
  return blob;
}

function rule(ctx: CanvasRenderingContext2D, y: number) {
  ctx.fillStyle = LINE;
  ctx.fillRect(PAD, y, W - PAD * 2, 1);
}

/** Long saree names must not run into the amount column. */
function fit(ctx: CanvasRenderingContext2D, value: string, maxWidth: number): string {
  if (ctx.measureText(value).width <= maxWidth) return value;
  let trimmed = value;
  while (trimmed.length > 1 && ctx.measureText(`${trimmed}…`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${trimmed.trimEnd()}…`;
}

/**
 * The next receipt number in the SGRF-0001 series.
 *
 * Derived from what is already stored rather than kept in a counter, so it
 * cannot drift out of step with the ledger. Numbers she typed herself in some
 * other format are ignored for sequencing rather than guessed at.
 */
export function nextReceiptNumber(existing: (string | null)[]): string {
  const used = existing
    .map((value) => /^SGRF-(\d+)$/.exec(value ?? '')?.[1])
    .filter((n): n is string => Boolean(n))
    .map(Number);

  const next = used.length > 0 ? Math.max(...used) + 1 : 1;
  return `SGRF-${String(next).padStart(4, '0')}`;
}
