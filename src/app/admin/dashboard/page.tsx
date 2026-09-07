import { getSessionClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const rupees = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export default async function DashboardPage() {
  const supabase = await getSessionClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [{ data: monthSales }, { data: deadStock }, { data: byCategory }] =
    await Promise.all([
      supabase
        .from('sale_margins')
        .select('margin, unit_price, quantity')
        .gte('sold_at', startOfMonth.toISOString()),
      supabase
        .from('dead_stock')
        .select('id, name, category, price, days_held, quantity_available')
        .order('days_held', { ascending: false })
        .limit(10),
      supabase
        .from('category_performance')
        .select('category, pieces_sold, total_margin, avg_days_to_sell'),
    ]);

  const sales = monthSales ?? [];
  const revenue = sales.reduce(
    (t, s) => t + Number(s.unit_price) * s.quantity,
    0,
  );
  const profit = sales.reduce((t, s) => t + Number(s.margin ?? 0), 0);
  const pieces = sales.reduce((t, s) => t + s.quantity, 0);

  return (
    <div>
      <header className="px-5 pt-6 pb-4 bg-white border-b border-stone-200">
        <h1 className="text-xl font-semibold text-stone-900">This month</h1>
      </header>

      <div className="grid grid-cols-3 gap-px bg-stone-200">
        <Stat label="Sold" value={String(pieces)} />
        <Stat label="Revenue" value={rupees(revenue)} />
        <Stat label="Profit" value={rupees(profit)} highlight />
      </div>

      <section className="p-5">
        <h2 className="font-semibold text-stone-900 mb-1">
          Money stuck on the rack
        </h2>
        <p className="text-sm text-stone-500 mb-3">
          Held 90 days or more with nothing sold. This is where cash is trapped.
        </p>
        {(deadStock ?? []).length === 0 ? (
          <p className="text-sm text-stone-500">
            Nothing sitting too long. Good.
          </p>
        ) : (
          <ul className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100">
            {(deadStock ?? []).map((s) => (
              <li key={s.id} className="flex justify-between p-3">
                <div className="min-w-0">
                  <p className="font-medium text-stone-900 truncate">{s.name}</p>
                  <p className="text-sm text-stone-500">
                    {s.category} · {rupees(Number(s.price))}
                  </p>
                </div>
                <span className="text-sm text-amber-700 font-medium shrink-0 ml-3">
                  {s.days_held} days
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="px-5 pb-8">
        <h2 className="font-semibold text-stone-900 mb-1">
          What actually earns
        </h2>
        <p className="text-sm text-stone-500 mb-3">
          Use this when deciding what to buy more of.
        </p>
        <div className="bg-white rounded-xl border border-stone-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-stone-500 border-b border-stone-100">
              <tr>
                <th className="text-left font-medium p-3">Type</th>
                <th className="text-right font-medium p-3">Sold</th>
                <th className="text-right font-medium p-3">Profit</th>
                <th className="text-right font-medium p-3">Days to sell</th>
              </tr>
            </thead>
            <tbody>
              {(byCategory ?? []).map((c) => (
                <tr key={c.category} className="border-b border-stone-50 last:border-0">
                  <td className="p-3 font-medium text-stone-900">{c.category}</td>
                  <td className="p-3 text-right text-stone-700">
                    {c.pieces_sold ?? 0}
                  </td>
                  <td className="p-3 text-right text-stone-700">
                    {rupees(Number(c.total_margin ?? 0))}
                  </td>
                  <td className="p-3 text-right text-stone-700">
                    {c.avg_days_to_sell ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-white px-3 py-4 text-center">
      <p className="text-xs text-stone-500">{label}</p>
      <p
        className={`text-lg font-semibold mt-0.5 ${
          highlight ? 'text-green-700' : 'text-stone-900'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
