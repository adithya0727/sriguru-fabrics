'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Share2, Printer, AlertCircle } from 'lucide-react';
import { getBrowserClient } from '@/lib/supabase/client';
import { renderReceipt, nextReceiptNumber } from '@/lib/receipt-image';
import { photoSharingSupported, sharePhotos } from '@/lib/share-photos';
import type { SaleRow } from '@/lib/types';

const rupees = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

/**
 * Build a receipt for the chosen sales, show it, then send it.
 *
 * Generating and sharing are separate taps for two reasons. navigator.share
 * needs a live user gesture and drawing the receipt outlives one; and this
 * goes to a customer, so it should be looked at before it is sent.
 */
export default function ReceiptSheet({
  sales,
  onClose,
}: {
  sales: SaleRow[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [number, setNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<File | null>(null);

  const total = sales.reduce(
    (t, s) => t + Number(s.final_unit_price ?? s.unit_price),
    0,
  );

  // More than one name among the rows means this is not one person's receipt.
  const names = [...new Set(sales.map((s) => s.customer_name).filter(Boolean))];
  const mixed = names.length > 1;

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    (async () => {
      try {
        const supabase = getBrowserClient();

        // Regenerating an already-numbered receipt must give the same number,
        // so a second look does not burn a new one.
        const shared = [...new Set(sales.map((s) => s.receipt_number))];
        let receiptNumber =
          shared.length === 1 && shared[0] ? shared[0] : null;

        if (!receiptNumber) {
          const { data } = await supabase.from('sales').select('receipt_number');
          receiptNumber = nextReceiptNumber(
            (data ?? []).map((r) => r.receipt_number as string | null),
          );

          // Stamped on every included sale, so the ledger and the paper agree
          // and this receipt can be rebuilt from the rows later.
          const { error: stampError } = await supabase
            .from('sales')
            .update({ receipt_number: receiptNumber })
            .in('id', sales.map((s) => s.id));
          if (stampError) throw new Error(stampError.message);
        }

        const blob = await renderReceipt({
          number: receiptNumber,
          date: new Date(sales[0].sold_at),
          customer: names[0] ?? null,
          // Only these fields. Cost and profit sit on the row beside them and
          // must not reach a customer.
          lines: sales.map((s) => ({
            name: s.saree_name,
            category: s.category,
            askingPrice: Number(s.unit_price),
            finalPrice: Number(s.final_unit_price ?? s.unit_price),
            discountPercent: Number(s.discount_percent),
          })),
        });

        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        fileRef.current = new File([blob], `${receiptNumber}.jpg`, {
          type: 'image/jpeg',
        });
        setNumber(receiptNumber);
        setImageUrl(objectUrl);
        router.refresh();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not make the receipt');
        }
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // Built once for this selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function share() {
    const file = fileRef.current;
    if (!file) return;
    setError(null);

    if (!photoSharingSupported()) {
      setError(
        'This phone cannot pass files to WhatsApp from the browser. Use Save as PDF, or press and hold the receipt above to save the picture.',
      );
      return;
    }

    // Nothing awaited before the call: the share must happen inside the tap
    // that triggered it or the browser refuses it.
    sharePhotos([file], `${number} · ${rupees(total)}`)
      .then((shared) => {
        if (shared) onClose();
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : 'Could not open WhatsApp'),
      );
  }

  return (
    <div
      className="receipt-overlay fixed inset-0 z-50 flex items-end bg-ink/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg mx-auto bg-surface rounded-t-2xl p-5 max-h-[92vh] overflow-y-auto rise"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="eyebrow mb-1">Receipt</p>
            <h2 className="font-display text-xl text-maroon-900 leading-tight">
              {number ?? 'Preparing…'}
            </h2>
            <p className="text-sm text-ink-soft mt-1 tabular-nums">
              {sales.length} {sales.length === 1 ? 'item' : 'items'} ·{' '}
              {rupees(total)}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="btn btn-ghost !min-h-0 p-2 -m-1 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {mixed && (
          <p className="flex items-start gap-2 text-sm text-warn bg-warn-bg border border-gold-300/40 rounded-lg px-3 py-2.5 mb-4 leading-relaxed">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            These sales are under different names ({names.join(', ')}). The
            receipt is made out to {names[0]}.
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="text-sm text-bad bg-bad-bg border border-bad/20 rounded-lg px-3 py-2.5 mb-4 leading-relaxed"
          >
            {error}
          </p>
        )}

        {imageUrl ? (
          // Also the print source, so what prints is exactly what she saw.
          <div className="receipt-print frame mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={`Receipt ${number}`} className="w-full" />
          </div>
        ) : (
          !error && (
            <div className="frame aspect-[3/4] mb-4 flex items-center justify-center">
              <p className="text-sm text-ink-soft">Drawing the receipt…</p>
            </div>
          )
        )}

        <button
          onClick={share}
          disabled={!imageUrl}
          className="btn btn-whatsapp w-full"
        >
          <Share2 size={17} />
          Send on WhatsApp
        </button>

        <button
          onClick={() => window.print()}
          disabled={!imageUrl}
          className="btn btn-secondary w-full mt-2.5"
        >
          <Printer size={16} />
          Save as PDF
        </button>
      </div>
    </div>
  );
}
