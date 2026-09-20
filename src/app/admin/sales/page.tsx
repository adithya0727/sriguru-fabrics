import { getSessionClient } from '@/lib/supabase/server';
import SalesTable from '@/components/SalesTable';
import type { SaleRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

const rupees = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export default async function SalesPage() {
  const supabase = await getSessionClient();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [{ data: all, error }, { data: lastMonth }] = await Promise.all([
    supabase
      .from('sale_margins')
      .select('*')
      .order('sold_at', { ascending: false }),
    supabase
      .from('sale_margins')
      .select('margin, final_unit_price, unit_price, quantity')
      .gte('sold_at', startOfLastMonth.toISOString())
      .lt('sold_at', startOfMonth.toISOString()),
  ]);

  if (error) {
    return (
      <p className="m-5 card p-4 text-sm text-bad bg-bad-bg">
        Could not load sales: {error.message}
      </p>
    );
  }

  const sales = (all ?? []) as SaleRow[];
  const thisMonth = sales.filter((s) => new Date(s.sold_at) >= startOfMonth);

  const current = totals(thisMonth);
  const previous = totals((lastMonth ?? []) as Partial<SaleRow>[]);
  const monthName = now.toLocaleString('en-IN', { month: 'long' });

  return (
    <div className="max-w-lg mx-auto">
      <header className="px-5 pt-8 pb-5">
        <p className="eyebrow mb-2">Sales book</p>
        <h1 className="font-display text-[1.75rem] text-maroon-900 leading-tight">
          {monthName} so far
        </h1>
        <div className="rule-fade mt-5" />
      </header>

      {/* Three figures with no trend to trace, so they are read as numbers
          rather than plotted. Profit is the one that decides anything, so it
          gets the room. */}
      <section className="px-5">
        <div className="card divide-y divide-line">
          <Figure
            label="Profit"
            value={rupees(current.profit)}
            current={current.profit}
            prior={previous.profit}
            emphasis
          />
          <div className="grid grid-cols-2 divide-x divide-line">
            <Figure
              label="Revenue"
              value={rupees(current.revenue)}
              current={current.revenue}
              prior={previous.revenue}
              compact
            />
            <Figure
              label="Pieces sold"
              value={String(current.pieces)}
              current={current.pieces}
              prior={previous.pieces}
              compact
            />
          </div>
        </div>
        {current.pieces === 0 && (
          <p className="text-sm text-ink-soft mt-3 leading-relaxed">
            Nothing recorded this month yet. Numbers appear here as you sell.
          </p>
        )}
      </section>

      <section className="px-5 mt-9 pb-6">
        <h2 className="font-display text-lg text-maroon-800">Every sale</h2>
        <p className="text-sm text-ink-soft mt-1 mb-4">
          Newest first. Tap any line to correct it or add a receipt number.
        </p>
        <SalesTable sales={sales} />
      </section>
    </div>
  );
}

function totals(rows: Partial<SaleRow>[]) {
  return {
    pieces: rows.reduce((t, s) => t + Number(s.quantity ?? 0), 0),
    revenue: rows.reduce(
      (t, s) =>
        t +
        Number(s.final_unit_price ?? s.unit_price ?? 0) * Number(s.quantity ?? 0),
      0,
    ),
    profit: rows.reduce((t, s) => t + Number(s.margin ?? 0), 0),
  };
}

function Figure({
  label,
  value,
  current,
  prior,
  emphasis,
  compact,
}: {
  label: string;
  value: string;
  current: number;
  prior: number;
  emphasis?: boolean;
  compact?: boolean;
}) {
  // Only claim a comparison when there is something to compare against —
  // "+100%" against a month with no sales is noise dressed as insight.
  const change = prior > 0 ? Math.round(((current - prior) / prior) * 100) : null;

  return (
    <div className={compact ? 'p-4' : 'p-5'}>
      <p className="text-[0.6875rem] uppercase tracking-wider text-ink-faint">
        {label}
      </p>
      <p
        className={`font-display tabular-nums mt-1.5 ${
          emphasis ? 'text-[2rem] text-maroon-800 leading-none' : 'text-xl text-ink'
        }`}
      >
        {value}
      </p>
      {change !== null && (
        <p
          className={`text-xs mt-1.5 tabular-nums ${
            change > 0 ? 'text-good' : change < 0 ? 'text-bad' : 'text-ink-faint'
          }`}
        >
          {change > 0 ? '↑' : change < 0 ? '↓' : '–'} {Math.abs(change)}% vs last
          month
        </p>
      )}
    </div>
  );
}
