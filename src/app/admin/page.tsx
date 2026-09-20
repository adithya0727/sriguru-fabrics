import { getSessionClient } from '@/lib/supabase/server';
import { getSiteUrl } from '@/lib/site-url';
import StockList from '@/components/StockList';

export const dynamic = 'force-dynamic';

export default async function StockPage() {
  const supabase = await getSessionClient();

  const { data, error } = await supabase
    .from('sarees')
    .select(
      'id, name, category, price, cost_price, photos, quantity_available, quantity_total, bill_item_name',
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

  return (
    <div className="max-w-lg mx-auto">
      <header className="px-5 pt-8 pb-5">
        <p className="eyebrow mb-2">Stock register</p>
        <h1 className="font-display text-[1.75rem] text-maroon-900 leading-tight">
          On the rack
        </h1>
        <div className="rule-fade mt-4" />
      </header>

      <StockList sarees={sarees} siteUrl={await getSiteUrl()} />
    </div>
  );
}
