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
    <div className="min-h-screen">
      <header className="px-5 pt-14 pb-10 text-center rise">
        <p className="eyebrow mb-4">Chikkalasandra · Bangalore</p>
        <h1 className="font-display text-[2.125rem] leading-[1.1] sm:text-5xl text-maroon-900">
          Sri Guru Raghavendra
          <span className="block text-maroon-700">Fabrics</span>
        </h1>
        <div className="rule-fade max-w-[180px] mx-auto my-6" />
        <p className="text-ink-soft max-w-md mx-auto leading-relaxed">
          Gadwal, Ilkal and soft silks, chosen one at a time. Fifteen years of
          buying carefully for families in South Bangalore.
        </p>
      </header>

      <nav
        aria-label="Saree types"
        className="sticky top-0 z-20 bg-canvas/85 backdrop-blur-md border-y border-line"
      >
        <div className="max-w-5xl mx-auto flex gap-2 overflow-x-auto px-5 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CategoryChip label="Everything" href="/" active={!category} />
          {categories.map((c) => (
            <CategoryChip
              key={c}
              label={c}
              href={`/?category=${encodeURIComponent(c)}`}
              active={category === c}
            />
          ))}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-5 py-8">
        {sarees.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-display text-xl text-ink">
              Nothing here just now
            </p>
            <p className="text-ink-soft mt-2 text-sm">
              New stock arrives often — do check back.
            </p>
            {category && (
              <Link href="/" className="btn btn-secondary mt-6">
                See everything
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-ink-faint mb-5">
              {sarees.length} {sarees.length === 1 ? 'saree' : 'sarees'}
              {category ? ` in ${category}` : ' available'}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8">
              {sarees.map((s, i) => (
                <Link
                  key={s.id}
                  href={`/s/${s.id}`}
                  className="product-card group rise"
                  style={{ animationDelay: `${Math.min(i * 45, 400)}ms` }}
                >
                  <div className="frame aspect-[3/4]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.photos[0] ?? ''}
                      alt={s.name}
                      loading={i < 6 ? 'eager' : 'lazy'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="pt-3">
                    <p className="text-[0.8125rem] text-maroon-600 font-medium">
                      {s.category}
                    </p>
                    <h2 className="font-display text-[1.0625rem] leading-snug text-ink mt-0.5 group-hover:text-maroon-700 transition-colors">
                      {s.name}
                    </h2>
                    <p className="text-ink-soft mt-1 tabular-nums">
                      ₹{Number(s.price).toLocaleString('en-IN')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>

      <footer className="mt-16 border-t border-line bg-surface/60">
        <div className="max-w-5xl mx-auto px-5 py-10 text-center">
          <p className="font-display text-lg text-maroon-800">
            Sri Guru Raghavendra Fabrics
          </p>
          <p className="text-sm text-ink-soft mt-2">
            No.3, Puja Classic Apartments, Chikkalasandra
            <br />
            Bangalore 560061
          </p>
          <a href="tel:+919663733683" className="btn btn-secondary mt-5">
            Call +91 96637 33683
          </a>
        </div>
      </footer>
    </div>
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
    <Link href={href} className={`chip ${active ? 'chip-active' : ''}`}>
      {label}
    </Link>
  );
}
