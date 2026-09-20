import { getSessionClient } from '@/lib/supabase/server';
import AddBillForm from '@/components/AddBillForm';
import type { BillCompany } from '@/lib/bills';

export const dynamic = 'force-dynamic';

export default async function AddBillPage() {
  const supabase = await getSessionClient();
  const { data } = await supabase.from('bill_companies').select('*').order('name');
  return <AddBillForm companies={(data ?? []) as BillCompany[]} />;
}
