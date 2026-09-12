import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { listCategories, listPublicSarees } from '@/lib/queries';
import { categoryFromSlug } from '@/lib/categories';
import { getSiteUrl } from '@/lib/site-url';
import type { PublicSaree } from '@/lib/types';

// Rendered fresh every time, like the single-saree page. This is what makes
// "all the Gadwals" worth sending once: the link shows what is on the rack
// today, not what was there the afternoon it was shared.
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ type: string }> };

const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/** "Gadwal — 8 sarees, ₹1,800 to ₹4,500". The whole WhatsApp card, one line. */
function headline(category: string, sarees: PublicSaree[]): string {
  if (sarees.length === 0) return `${category} — none available just now`;

  const prices = sarees.map((s) => Number(s.price));
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const count = `${sarees.length} ${sarees.length === 1 ? 'saree' : 'sarees'}`;

  return low === high
    ? `${category} — ${count}, ${rupees(low)}`
    : `${category} — ${count}, ${rupees(low)} to ${rupees(high)}`;
}

async function loadType(params: Props['params']) {
  const { type } = await params;
  const category = categoryFromSlug(type, await listCategories());
  if (!category) return null;
  return { slug: type, category, sarees: await listPublicSarees({ category }) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await loadType(params);
  if (!found) return { title: 'Not found' };

  const { slug, category, sarees } = found;
  const siteUrl = await getSiteUrl();
  const title = headline(category, sarees);

  return {
    metadataBase: new URL(siteUrl),
    title,
    // Null on purpose, as on a saree page: anything here becomes a second
    // line under the headline in WhatsApp, and og:description inherits it.
    description: null,
    alternates: { canonical: `/c/${slug}` },
    openGraph: {
      title,
      url: `${siteUrl}/c/${slug}`,
      // One strong photo rather than a tiled collage — at the size WhatsApp
      // draws a card, four sarees become four smudges and one reads clearly.
      images: sarees[0]?.photos[0]
        ? [{ url: sarees[0].photos[0], width: 1200, height: 1600, alt: category }]
        : [],
      type: 'website',
    },
  };
}

export default async function TypePage({ params }: Props) {
  const found = await loadType(params);
  if (!found) notFound();

  const { category, sarees } = found;

  return (
    <div className="min-h-screen">
      <header className="px-5 pt-12 pb-8 text-center rise">
        <p className="eyebrow mb-3">Sri Guru Raghavendra Fabrics</p>
        <h1 className="font-display text-[2rem] leading-tight text-maroon-900">
          {category}
        </h1>
        <div className="rule-fade max-w-[160px] mx-auto my-5" />
        <p className="text-ink-soft text-sm">
          {sarees.length > 0
            ? `${sarees.length} ${sarees.length === 1 ? 'saree' : 'sarees'} available now`
            : 'Nothing in this type just now'}
        </p>
      </header>

      <main className="max-w-5xl mx-auto px-5 pb-10">
        {sarees.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-ink-soft text-sm mb-6">
              New stock arrives often — do have a look at the rest.
            </p>
            <Link href="/" className="btn btn-secondary">
              See everything
            </Link>
          </div>
        ) : (
          <>
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
                  <h2 className="font-display text-[1.0625rem] leading-snug text-ink mt-3 group-hover:text-maroon-700 transition-colors">
                    {s.name}
                  </h2>
                  <p className="text-ink-soft mt-0.5 tabular-nums">
                    {rupees(Number(s.price))}
                  </p>
                </Link>
              ))}
            </div>

            <Link href="/" className="btn btn-secondary w-full mt-10">
              See every type
            </Link>
          </>
        )}
      </main>

      <footer className="border-t border-line bg-surface/60">
        <div className="max-w-5xl mx-auto px-5 py-9 text-center">
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
