import Link from 'next/link';
import { listPublicSarees, listCategories } from '@/lib/queries';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ category?: string }> };

export default async function CatalogPage({ searchParams }: Props) {
  const { category } = await searchParams;
  const [sarees, categories] = await Promise.all([
    listPublicSarees({ category }),
    listCategories(),
  ]);

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <header className="text-center mb-6">
        <h1 className="text-2xl font-semibold text-brand-800">
          Sri Guru Raghavendra Fabrics
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Gadwal, Ilkal and soft silk sarees · Chikkalasandra, Bangalore
        </p>
      </header>

      <nav className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4">
        <CategoryChip label="All" href="/" active={!category} />
        {categories.map((c) => (
          <CategoryChip
            key={c}
            label={c}
            href={`/?category=${encodeURIComponent(c)}`}
            active={category === c}
          />
        ))}
      </nav>

      {sarees.length === 0 ? (
        <p className="text-center text-stone-500 py-16">
          Nothing in this section right now.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {sarees.map((s) => (
            <Link key={s.id} href={`/s/${s.id}`} className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.photos[0] ?? ''}
                alt={s.name}
                className="w-full aspect-[3/4] object-cover rounded-xl bg-stone-100"
              />
              <p className="text-sm font-medium text-stone-900 mt-1.5 truncate">
                {s.name}
              </p>
              <p className="text-sm text-stone-600">
                ₹{Number(s.price).toLocaleString('en-IN')}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

function CategoryChip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 px-4 py-2 rounded-full text-sm border ${
        active
          ? 'bg-brand-700 text-white border-brand-700'
          : 'bg-white text-stone-700 border-stone-300'
      }`}
    >
      {label}
    </Link>
  );
}
