import { notFound } from 'next/navigation';
import { getSessionClient } from '@/lib/supabase/server';
import { listCategories } from '@/lib/queries';
import EditSareeForm from '@/components/EditSareeForm';
import type { Saree } from '@/lib/types';

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
    return <p className="p-5 text-red-700">Could not load: {error.message}</p>;
  }
  if (!data) notFound();

  return <EditSareeForm saree={data as Saree} categories={categories} />;
}
