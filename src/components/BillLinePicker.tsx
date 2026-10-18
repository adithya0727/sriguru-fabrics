'use client';

import { parseAmount } from '@/lib/bills';

/** A line on the chosen bill, "not on this bill", or not yet answered. */
export type LineChoice = number | 'none' | null;

/**
 * Which line of a bill a saree is.
 *
 * A choice rather than a verdict. On her own sarees the reader never picked a
 * wrong line, but it often isn't sure — and then one tap here beats typing a
 * cost off the paper. The same list lets an old, wrongly matched saree be put
 * right from its edit screen.
 */
export default function BillLinePicker({
  lines,
  chosen,
  suggested,
  onChoose,
  intro,
}: {
  lines: { description: string; rate: string | null }[];
  chosen: LineChoice;
  /** The reader's pick, kept marked even after a different line is chosen. */
  suggested?: number | null;
  onChoose: (choice: LineChoice) => void;
  intro: string;
}) {
  return (
    <section className="card p-5">
      <h2 className="eyebrow">Which line on the bill?</h2>
      <p className="text-xs text-ink-soft mt-1.5 mb-3.5 leading-relaxed">{intro}</p>
      <div className="space-y-2" role="radiogroup" aria-label="Line on the bill">
        {lines.map((line, i) => {
          const on = chosen === i;
          const rate = parseAmount(line.rate);
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChoose(i)}
              className={`w-full text-left rounded-[10px] border px-3.5 py-3 flex items-center gap-3 transition-colors ${
                on ? 'border-maroon-700 bg-maroon-50' : 'border-line-strong bg-surface'
              }`}
            >
              <Radio on={on} />
              <span className="flex-1 min-w-0">
                <span className="block text-sm text-ink leading-snug">
                  {line.description || 'Unnamed line'}
                </span>
                {suggested === i && (
                  <span className="block text-[0.6875rem] font-medium text-good mt-0.5">
                    Matched from the photo
                  </span>
                )}
              </span>
              {rate != null && (
                <span className="text-sm text-ink-soft tabular-nums shrink-0">
                  ₹{rate.toLocaleString('en-IN')}
                </span>
              )}
            </button>
          );
        })}
        <button
          type="button"
          role="radio"
          aria-checked={chosen === 'none'}
          onClick={() => onChoose('none')}
          className={`w-full text-left rounded-[10px] border px-3.5 py-3 flex items-center gap-3 transition-colors ${
            chosen === 'none'
              ? 'border-maroon-700 bg-maroon-50'
              : 'border-dashed border-line-strong'
          }`}
        >
          <Radio on={chosen === 'none'} />
          <span className="text-sm text-ink-soft">Not on this bill</span>
        </button>
      </div>
    </section>
  );
}

/** The round mark beside a line. A native radio won't take the shop's colours,
 *  and the whole row is the tap target anyway. */
function Radio({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
        on ? 'border-maroon-700' : 'border-line-strong'
      }`}
    >
      {on && <span className="w-2.5 h-2.5 rounded-full bg-maroon-700" />}
    </span>
  );
}
