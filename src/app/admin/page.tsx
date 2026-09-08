import { getSessionClient } from '@/lib/supabase/server';
import { getSiteUrl } from '@/lib/site-url';
import StockList from '@/components/StockList';

export const dynamic = 'force-dynamic';

export default async function StockPage() {
  const supabase = await getSessionClient();

  const { data, error } = await supabase
    .from('sarees')
    .select(
      'id, name, category, price, cost_price, photos, quantity_available, quantity_total',
    )
    .gt('quantity_available', 0)
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <p className="m-5 card p-4 text-sm text-bad bg-bad-bg">
        Could not load stock: {error.message}
      </p>
    );
  }

  const sarees = (data ?? []).map((s) => ({
    ...s,
    price: Number(s.price),
    cost_price: s.cost_price != null ? Number(s.cost_price) : null,
  }));

  const pieces = sarees.reduce((n, s) => n + s.quantity_available, 0);
  const stockValue = sarees.reduce(
    (sum, s) => sum + s.price * s.quantity_available,
    0,
  );

  return (
    <div className="max-w-lg mx-auto">
      <header className="px-5 pt-8 pb-5">
        <p className="eyebrow mb-2">Stock register</p>
        <h1 className="font-display text-[1.75rem] text-maroon-900 leading-tight">
          On the rack
        </h1>
        <div className="flex gap-6 mt-4">
          <div>
            <p className="font-display text-xl text-ink tabular-nums">
              {sarees.length}
            </p>
            <p className="text-xs text-ink-faint">
              {sarees.length === 1 ? 'design' : 'designs'}
            </p>
          </div>
          <div>
            <p className="font-display text-xl text-ink tabular-nums">{pieces}</p>
            <p className="text-xs text-ink-faint">pieces</p>
          </div>
          <div>
            <p className="font-display text-xl text-ink tabular-nums">
              ₹{stockValue.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-ink-faint">at asking price</p>
          </div>
        </div>
        <div className="rule-fade mt-5" />
      </header>

      <StockList sarees={sarees} siteUrl={getSiteUrl()} />
    </div>
  );
}
