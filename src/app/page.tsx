import type { Metadata } from 'next';
import Link from 'next/link';
import { listPublicSarees, listCategories } from '@/lib/queries';
import { SHOP } from '@/lib/shop';
import SareePhoto from '@/components/SareePhoto';
import { getSiteUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ category?: string }> };

const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/**
 * The card WhatsApp shows for the shop itself.
 *
 * This is the most-shared link there is — it goes on a visiting card, a status,
 * a reply to "where can I see what you have?" — and until now it unfurled with
 * no photograph at all, because the root layout sets no openGraph image and
 * this page set no metadata of its own.
 */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { category } = await searchParams;
  const [sarees, siteUrl] = await Promise.all([
    listPublicSarees({ category }),
    getSiteUrl(),
  ]);

  const prices = sarees.map((s) => Number(s.price));
  const low = prices.length > 0 ? Math.min(...prices) : 0;
  const high = prices.length > 0 ? Math.max(...prices) : 0;
  const count = `${sarees.length} ${sarees.length === 1 ? 'saree' : 'sarees'}`;

  const title =
    sarees.length === 0
      ? SHOP.name
      : `${category ?? SHOP.name} — ${count}, ` +
        (low === high ? rupees(low) : `${rupees(low)} to ${rupees(high)}`);

  const path = category ? `/?category=${encodeURIComponent(category)}` : '/';

  return {
    metadataBase: new URL(siteUrl),
    title,
    // Null on purpose, as on every other shareable page: anything here becomes
    // a second line under the headline in WhatsApp.
    description: null,
    alternates: { canonical: path },
    openGraph: {
      title,
      url: `${siteUrl}${path}`,
      // The newest saree, so the card refreshes itself as stock arrives.
      images: sarees[0]?.photos[0]
        ? [{ url: sarees[0].photos[0], width: 1200, height: 1600, alt: SHOP.name }]
        : [],
      type: 'website',
    },
  };
}

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
                    <SareePhoto
                      url={s.photos[0]}
                      alt={s.name}
                      widths={[256, 384, 640]}
                      sizes="(min-width: 768px) 33vw, 50vw"
                      eager={i < 4}
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
            {SHOP.addressLines[0]}
            <br />
            {SHOP.addressLines[1]}
          </p>
          <a href={`tel:${SHOP.phoneDial}`} className="btn btn-secondary mt-5">
            Call {SHOP.phoneDisplay}
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
