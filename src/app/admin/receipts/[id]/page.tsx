import { notFound } from 'next/navigation';
import { getSessionClient } from '@/lib/supabase/server';
import EditBillForm from '@/components/EditBillForm';
import type { Bill, BillCompany } from '@/lib/bills';

export const dynamic = 'force-dynamic';

export default async function EditBillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await getSessionClient();

  const [{ data: bill, error }, { data: companies }] = await Promise.all([
    supabase.from('bills').select('*').eq('id', id).maybeSingle(),
    supabase.from('bill_companies').select('*').order('name'),
  ]);

  if (error) {
    return (
      <p className="m-5 card p-4 text-sm text-bad bg-bad-bg">
        Could not load: {error.message}
      </p>
    );
  }
  if (!bill) notFound();

  // The bucket is private, so the photo is reachable only through a short-lived
  // signed URL minted for this request — never a public link.
  let photoUrl: string | null = null;
  if (bill.photo_path) {
    const { data: signed } = await supabase.storage
      .from('bill-photos')
      .createSignedUrl(bill.photo_path, 60 * 60);
    photoUrl = signed?.signedUrl ?? null;
  }

  return (
    <EditBillForm
      bill={bill as Bill}
      companies={(companies ?? []) as BillCompany[]}
      photoUrl={photoUrl}
    />
  );
}
