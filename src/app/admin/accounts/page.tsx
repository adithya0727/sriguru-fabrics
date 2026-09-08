import { getSessionClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const rupees = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export default async function AccountsPage() {
  const supabase = await getSessionClient();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [{ data: thisMonth }, { data: lastMonth }, { data: deadStock }, { data: byCategory }] =
    await Promise.all([
      supabase
        .from('sale_margins')
        .select('margin, unit_price, quantity')
        .gte('sold_at', startOfMonth.toISOString()),
      supabase
        .from('sale_margins')
        .select('margin, unit_price, quantity')
        .gte('sold_at', startOfLastMonth.toISOString())
        .lt('sold_at', startOfMonth.toISOString()),
      supabase
        .from('dead_stock')
        .select('id, name, category, price, days_held, quantity_available')
        .order('days_held', { ascending: false })
        .limit(8),
      supabase
        .from('category_performance')
        .select('category, pieces_sold, total_margin, avg_days_to_sell'),
    ]);

  const total = (rows: typeof thisMonth) => {
    const list = rows ?? [];
    return {
      pieces: list.reduce((t, s) => t + s.quantity, 0),
      revenue: list.reduce((t, s) => t + Number(s.unit_price) * s.quantity, 0),
      profit: list.reduce((t, s) => t + Number(s.margin ?? 0), 0),
    };
  };

  const current = total(thisMonth);
  const previous = total(lastMonth);

  const monthName = now.toLocaleString('en-IN', { month: 'long' });

  const categories = (byCategory ?? [])
    .map((c) => ({
      name: c.category as string,
      pieces: Number(c.pieces_sold ?? 0),
      margin: Number(c.total_margin ?? 0),
      days: c.avg_days_to_sell != null ? Number(c.avg_days_to_sell) : null,
    }))
    .sort((a, b) => b.margin - a.margin);

  const maxMargin = Math.max(...categories.map((c) => c.margin), 1);
  const trapped = (deadStock ?? []).reduce(
    (t, s) => t + Number(s.price) * s.quantity_available,
    0,
  );

  return (
    <div className="max-w-lg mx-auto">
      <header className="px-5 pt-8 pb-5">
        <p className="eyebrow mb-2">Accounts</p>
        <h1 className="font-display text-[1.75rem] text-maroon-900 leading-tight">
          {monthName} so far
        </h1>
        <div className="rule-fade mt-5" />
      </header>

      {/* Hero numbers rather than a chart: three values with no trend to
          trace, so a plot would add ink without adding meaning. */}
      <section className="px-5">
        <div className="card divide-y divide-line">
          <Figure
            label="Profit"
            value={rupees(current.profit)}
            prior={previous.profit}
            current={current.profit}
            emphasis
          />
          <div className="grid grid-cols-2 divide-x divide-line">
            <Figure
              label="Revenue"
              value={rupees(current.revenue)}
              prior={previous.revenue}
              current={current.revenue}
              compact
            />
            <Figure
              label="Pieces sold"
              value={String(current.pieces)}
              prior={previous.pieces}
              current={current.pieces}
              compact
            />
          </div>
        </div>
        {current.pieces === 0 && (
          <p className="text-sm text-ink-soft mt-3 leading-relaxed">
            Nothing recorded this month yet. Numbers appear here as you mark
            sarees sold.
          </p>
        )}
      </section>

      {/* Single series (margin by category), so one hue and no legend — the
          heading names what the bars measure. Values are direct-labelled, so
          the bars carry comparison and the text carries precision. */}
      {categories.some((c) => c.margin > 0) && (
        <section className="px-5 mt-9">
          <h2 className="font-display text-lg text-maroon-800">
            What earns the most
          </h2>
          <p className="text-sm text-ink-soft mt-1 mb-4">
            Total profit by type. Use it when deciding what to buy more of.
          </p>

          <div className="card p-4 space-y-3.5">
            {categories.map((c) => (
              <div key={c.name}>
                <div className="flex items-baseline justify-between gap-3 mb-1.5">
                  <span className="text-sm text-ink font-medium">{c.name}</span>
                  <span className="text-sm text-ink tabular-nums">
                    {rupees(c.margin)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-canvas-warm overflow-hidden">
                  <div
                    className="h-full rounded-full bg-maroon-600"
                    style={{
                      width: `${Math.max((c.margin / maxMargin) * 100, c.margin > 0 ? 3 : 0)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-ink-faint mt-1 tabular-nums">
                  {c.pieces} sold
                  {c.days != null && ` · ${c.days} days to sell on average`}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="px-5 mt-9">
        <h2 className="font-display text-lg text-maroon-800">
          Money sitting still
        </h2>
        <p className="text-sm text-ink-soft mt-1 mb-4">
          Held 90 days or more with nothing sold. This is where cash is trapped.
        </p>

        {(deadStock ?? []).length === 0 ? (
          <div className="card p-5 text-center">
            <p className="text-sm text-good font-medium">
              Nothing sitting too long
            </p>
            <p className="text-xs text-ink-soft mt-1">
              Every design has either sold or arrived recently.
            </p>
          </div>
        ) : (
          <>
            <div className="card divide-y divide-line">
              {(deadStock ?? []).map((s) => (
                <Link
                  key={s.id}
                  href={`/admin/s/${s.id}`}
                  className="flex items-center justify-between gap-3 p-3.5 hover:bg-canvas-warm transition-colors first:rounded-t-[13px] last:rounded-b-[13px]"
                >
                  <div className="min-w-0">
                    <p className="text-ink truncate">{s.name}</p>
                    <p className="text-xs text-ink-faint mt-0.5">
                      {s.category} · {rupees(Number(s.price))}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-warn bg-warn-bg px-2.5 py-1 rounded-full shrink-0 tabular-nums">
                    {s.days_held} days
                  </span>
                </Link>
              ))}
            </div>
            <p className="text-sm text-ink-soft mt-3">
              About <span className="text-ink font-medium">{rupees(trapped)}</span>{' '}
              is tied up here. Clearing it at a discount frees cash for stock
              that moves.
            </p>
          </>
        )}
      </section>

      <div className="h-6" />
    </div>
  );
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
  const change =
    prior > 0 ? Math.round(((current - prior) / prior) * 100) : null;

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
