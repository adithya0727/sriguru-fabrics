import AddSareeForm from '@/components/AddSareeForm';
import { listCategories } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function AddPage() {
  const categories = await listCategories();
  return <AddSareeForm categories={categories} />;
}
