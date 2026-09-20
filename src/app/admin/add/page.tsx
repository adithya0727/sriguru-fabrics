import AddSareeForm, { type BillChoice } from '@/components/AddSareeForm';
import { listCategories } from '@/lib/queries';
import { getSessionClient } from '@/lib/supabase/server';
import type { BillItem } from '@/lib/bills';

export const dynamic = 'force-dynamic';

type BillRow = {
  id: string;
  bill_number: string | null;
  bill_date: string | null;
  items: BillItem[];
  bill_companies: { name: string } | { name: string }[] | null;
};

export default async function AddPage() {
  const supabase = await getSessionClient();

  const [categories, { data }] = await Promise.all([
    listCategories(),
    // Recent bills only. A consignment is photographed within days of its
    // bill arriving, so a long list is all noise and more to scroll past.
    supabase
      .from('bills')
      .select('id, bill_number, bill_date, items, bill_companies(name)')
      .order('bill_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const bills: BillChoice[] = ((data ?? []) as BillRow[]).map((b) => {
    const company = Array.isArray(b.bill_companies)
      ? b.bill_companies[0]
      : b.bill_companies;
    return {
      id: b.id,
      company: company?.name ?? 'Unknown shop',
      billNumber: b.bill_number,
      billDate: b.bill_date,
      itemCount: b.items?.length ?? 0,
    };
  });

  return <AddSareeForm categories={categories} bills={bills} />;
}
