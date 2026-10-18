import { notFound } from 'next/navigation';
import { getSessionClient } from '@/lib/supabase/server';
import { listCategories } from '@/lib/queries';
import EditSareeForm, { type SareeBill } from '@/components/EditSareeForm';
import type { Saree } from '@/lib/types';
import type { BillItem } from '@/lib/bills';

export const dynamic = 'force-dynamic';

export default async function EditSareePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await getSessionClient();

  const [{ data, error }, categories] = await Promise.all([
    supabase.from('sarees').select('*').eq('id', id).maybeSingle(),
    listCategories(),
  ]);

  if (error) {
    return (
      <p className="m-5 card p-4 text-sm text-bad bg-bad-bg">
        Could not load: {error.message}
      </p>
    );
  }
  if (!data) notFound();
  const saree = data as Saree;

  // The bill it came from, with its lines, so a missing or wrong line can be
  // put right here. Many older sarees were matched by a weaker reader that
  // chose the wrong line about four times in ten.
  let bill: SareeBill | null = null;
  if (saree.bill_id) {
    const { data: row } = await supabase
      .from('bills')
      .select('id, bill_date, items, bill_companies(name)')
      .eq('id', saree.bill_id)
      .maybeSingle();
    if (row) {
      const company = Array.isArray(row.bill_companies)
        ? row.bill_companies[0]
        : (row.bill_companies as { name: string } | null);
      bill = {
        id: row.id as string,
        company: company?.name ?? 'Unknown shop',
        billDate: (row.bill_date as string | null) ?? null,
        lines: ((row.items as BillItem[]) ?? []).map((item) => ({
          description: item.description,
          rate: item.rate,
        })),
      };
    }
  }

  return <EditSareeForm saree={saree} categories={categories} bill={bill} />;
}
