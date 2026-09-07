import { getSessionClient } from '@/lib/supabase/server';
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
      <p className="p-5 text-red-700">Could not load stock: {error.message}</p>
    );
  }

  const sarees = data ?? [];
  const stockValue = sarees.reduce(
    (sum, s) => sum + Number(s.price) * s.quantity_available,
    0,
  );

  return (
    <div>
      <header className="px-5 pt-6 pb-4 bg-white border-b border-stone-200">
        <h1 className="text-xl font-semibold text-stone-900">Stock</h1>
        <p className="text-sm text-stone-500 mt-0.5">
          {sarees.length} designs · ₹{stockValue.toLocaleString('en-IN')} on the
          rack
        </p>
      </header>

      <StockList
        sarees={sarees.map((s) => ({ ...s, price: Number(s.price), cost_price: s.cost_price != null ? Number(s.cost_price) : null }))}
        siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? ''}
      />
    </div>
  );
}
