import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicSaree, getSimilarSarees } from '@/lib/queries';
import { getSiteUrl } from '@/lib/site-url';

// Rendered fresh on every request. This is what makes an old WhatsApp link
// tell the truth: a saree sold three weeks after the message was sent shows as
// sold when the link is finally opened, with no message to chase or delete.
export const dynamic = 'force-dynamic';

const WHATSAPP_NUMBER = '919663733683';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const saree = await getPublicSaree(id);
  if (!saree) return { title: 'Saree not found' };

  const sold = saree.quantity_available <= 0;
  const price = `₹${Number(saree.price).toLocaleString('en-IN')}`;

  // WhatsApp builds its preview card from these tags, read off the
  // server-rendered HTML. Without them a shared link is a bare grey rectangle.
  return {
    title: sold ? `${saree.name} (sold)` : `${saree.name} — ${price}`,
    description: sold
      ? `${saree.name} has been sold. See what else is available.`
      : saree.description || `${saree.category} saree — ${price}`,
    openGraph: {
      title: sold ? `${saree.name} — sold` : `${saree.name} — ${price}`,
      description: saree.description || `${saree.category} saree`,
      images: saree.photos[0]
        ? [{ url: saree.photos[0], width: 1200, height: 1600, alt: saree.name }]
        : [],
      type: 'website',
    },
  };
}

export default async function SareePage({ params }: Props) {
  const { id } = await params;
  const saree = await getPublicSaree(id);
  if (!saree) notFound();

  const sold = saree.quantity_available <= 0;
  const similar = sold ? await getSimilarSarees(saree) : [];
  const price = Number(saree.price).toLocaleString('en-IN');

  const enquiry = encodeURIComponent(
    `Hello, I'm interested in this saree:\n${saree.name}\n₹${price}\n` +
      `${getSiteUrl()}/s/${saree.id}`,
  );

  const details = [
    saree.fabric && { label: 'Fabric', value: saree.fabric },
    saree.border && { label: 'Border', value: saree.border },
    saree.colors.length > 0 && { label: 'Colour', value: saree.colors.join(', ') },
    saree.motifs.length > 0 && { label: 'Motif', value: saree.motifs.join(', ') },
    { label: 'Blouse piece', value: saree.has_blouse ? 'Included' : 'Not included' },
    saree.occasion && { label: 'Best for', value: saree.occasion },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="min-h-screen pb-28">
      <header className="max-w-lg mx-auto px-5 pt-5">
        <Link
          href="/"
          className="text-sm text-ink-soft hover:text-maroon-700 transition-colors"
        >
          ← All sarees
        </Link>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-4">
        <div className="frame aspect-[3/4] rise">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={saree.photos[0] ?? ''}
            alt={saree.name}
            className={`w-full h-full object-cover ${sold ? 'grayscale-[0.7] opacity-70' : ''}`}
          />
          {sold && (
            <div className="absolute top-4 left-4 bg-ink/90 text-white text-xs font-medium tracking-wide uppercase px-3 py-1.5 rounded-full backdrop-blur-sm">
              Sold
            </div>
          )}
        </div>

        {saree.photos.length > 1 && (
          <div className="flex gap-2.5 mt-2.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {saree.photos.slice(1).map((url) => (
              <div key={url} className="frame w-24 h-32 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="mt-7 rise" style={{ animationDelay: '90ms' }}>
          <p className="eyebrow">{saree.category}</p>
          <h1 className="font-display text-[1.75rem] leading-tight text-maroon-900 mt-2">
            {saree.name}
          </h1>
          <p className="font-display text-2xl text-ink mt-3 tabular-nums">
            ₹{price}
          </p>

          {saree.description && (
            <p className="text-ink-soft leading-relaxed mt-4">
              {saree.description}
            </p>
          )}

          <div className="rule-fade my-7" />

          <dl className="grid grid-cols-2 gap-x-5 gap-y-5">
            {details.map((d) => (
              <div key={d.label}>
                <dt className="text-[0.6875rem] uppercase tracking-wider text-ink-faint">
                  {d.label}
                </dt>
                <dd className="text-ink mt-1 capitalize">{d.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {sold && (
          <section className="mt-10 rise">
            <div className="card p-5 text-center">
              <p className="font-display text-lg text-ink">This one has sold</p>
              <p className="text-sm text-ink-soft mt-1.5">
                Each saree is bought in small numbers, so they do go quickly.
              </p>
            </div>

            {similar.length > 0 && (
              <>
                <h2 className="font-display text-lg text-maroon-800 mt-8 mb-4">
                  Still available
                </h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                  {similar.map((s) => (
                    <Link
                      key={s.id}
                      href={`/s/${s.id}`}
                      className="product-card group"
                    >
                      <div className="frame aspect-[3/4]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={s.photos[0] ?? ''}
                          alt={s.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="font-display text-[0.9375rem] text-ink mt-2 leading-snug group-hover:text-maroon-700 transition-colors">
                        {s.name}
                      </p>
                      <p className="text-sm text-ink-soft tabular-nums">
                        ₹{Number(s.price).toLocaleString('en-IN')}
                      </p>
                    </Link>
                  ))}
                </div>
              </>
            )}

            <Link href="/" className="btn btn-secondary w-full mt-7">
              See the whole collection
            </Link>
          </section>
        )}

        <p className="text-xs text-ink-faint text-center mt-12 leading-relaxed">
          Sri Guru Raghavendra Fabrics
          <br />
          Chikkalasandra, Bangalore
        </p>
      </main>

      {/* Sticky so the enquiry is always one thumb-reach away, however far
          down the page someone has read. */}
      {!sold && (
        <div className="fixed bottom-0 inset-x-0 z-30 bg-canvas/90 backdrop-blur-md border-t border-line">
          <div className="max-w-lg mx-auto px-5 py-3 flex items-center gap-4">
            <div className="min-w-0">
              <p className="text-[0.6875rem] uppercase tracking-wider text-ink-faint">
                Price
              </p>
              <p className="font-display text-lg text-ink tabular-nums leading-tight">
                ₹{price}
              </p>
            </div>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${enquiry}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-whatsapp flex-1"
            >
              Enquire on WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
