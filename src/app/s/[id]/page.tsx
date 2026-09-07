import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicSaree, getSimilarSarees } from '@/lib/queries';

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

  // WhatsApp reads these tags off the server-rendered HTML to build the preview
  // card in the chat. Without them a shared link is a bare grey rectangle.
  return {
    title: `${saree.name} — ${price}`,
    description: sold
      ? `${saree.name} has been sold. See what else is available.`
      : saree.description || `${saree.category} saree — ${price}`,
    openGraph: {
      title: sold ? `${saree.name} (sold)` : `${saree.name} — ${price}`,
      description: saree.description,
      images: saree.photos[0] ? [{ url: saree.photos[0] }] : [],
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
      `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/s/${saree.id}`,
  );

  return (
    <main className="max-w-lg mx-auto bg-white min-h-screen">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={saree.photos[0] ?? ''}
          alt={saree.name}
          className={`w-full aspect-[3/4] object-cover ${sold ? 'grayscale opacity-60' : ''}`}
        />
        {sold && (
          <div className="absolute top-4 left-4 bg-stone-900 text-white text-sm font-medium px-3 py-1.5 rounded-full">
            Sold
          </div>
        )}
      </div>

      {saree.photos.length > 1 && (
        <div className="flex gap-2 p-3 overflow-x-auto">
          {saree.photos.slice(1).map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt=""
              className="w-24 h-32 object-cover rounded-lg shrink-0"
            />
          ))}
        </div>
      )}

      <div className="px-5 py-5">
        <p className="text-sm text-brand-700 font-medium">{saree.category}</p>
        <h1 className="text-2xl font-semibold text-stone-900 mt-1">
          {saree.name}
        </h1>
        <p className="text-2xl font-semibold text-stone-900 mt-3">₹{price}</p>

        {saree.description && (
          <p className="text-stone-600 mt-4 leading-relaxed">
            {saree.description}
          </p>
        )}

        <dl className="mt-5 grid grid-cols-2 gap-y-3 text-sm">
          {saree.fabric && <Detail label="Fabric" value={saree.fabric} />}
          {saree.border && <Detail label="Border" value={saree.border} />}
          {saree.colors.length > 0 && (
            <Detail label="Colour" value={saree.colors.join(', ')} />
          )}
          <Detail
            label="Blouse piece"
            value={saree.has_blouse ? 'Included' : 'Not included'}
          />
        </dl>

        {sold ? (
          <div className="mt-8">
            <p className="text-stone-600 mb-4">
              This one has been sold.
              {similar.length > 0 && ' Here is what else is available:'}
            </p>
            {similar.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {similar.map((s) => (
                  <Link key={s.id} href={`/s/${s.id}`} className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.photos[0] ?? ''}
                      alt={s.name}
                      className="w-full aspect-[3/4] object-cover rounded-lg"
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
            <Link
              href="/"
              className="tap-target mt-5 flex items-center justify-center w-full rounded-xl border border-brand-700 text-brand-700 font-medium"
            >
              See the full collection
            </Link>
          </div>
        ) : (
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${enquiry}`}
            target="_blank"
            rel="noreferrer"
            className="tap-target mt-8 flex items-center justify-center w-full rounded-xl bg-green-600 text-white font-medium py-4"
          >
            Enquire on WhatsApp
          </a>
        )}

        <p className="text-xs text-stone-400 text-center mt-6">
          Sri Guru Raghavendra Fabrics · Chikkalasandra, Bangalore
        </p>
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-stone-500">{label}</dt>
      <dd className="text-stone-900 capitalize">{value}</dd>
    </div>
  );
}
