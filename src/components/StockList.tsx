'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Share2, Search, ChevronRight } from 'lucide-react';
import SoldSheet from './SoldSheet';

type Row = {
  id: string;
  name: string;
  category: string;
  price: number;
  cost_price: number | null;
  photos: string[];
  quantity_available: number;
  quantity_total: number;
};

export default function StockList({
  sarees,
  siteUrl,
}: {
  sarees: Row[];
  siteUrl: string;
}) {
  const [selling, setSelling] = useState<Row | null>(null);
  const [query, setQuery] = useState('');

  // The server's idea of the site URL comes from configuration, which can be
  // stale or missing on a deploy. The browser is standing on the real domain,
  // so once mounted it is the better authority. Set after mount rather than
  // during render, so the first paint still matches what the server sent.
  const [origin, setOrigin] = useState(siteUrl);
  useEffect(() => setOrigin(window.location.origin), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sarees;
    return sarees.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q),
    );
  }, [sarees, query]);

  if (sarees.length === 0) {
    return (
      <div className="text-center py-20 px-5">
        <p className="font-display text-lg text-ink">No sarees yet</p>
        <p className="text-sm text-ink-soft mt-2">
          Tap <span className="text-maroon-700 font-medium">Add saree</span> below
          to photograph your first one.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Search appears once the rack is big enough to need it. */}
      {sarees.length > 8 && (
        <div className="px-5 pb-3">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or type"
              className="field field-icon"
            />
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-center text-ink-soft py-16 text-sm">
          Nothing matches “{query}”.
        </p>
      ) : (
        <ul className="px-5 space-y-2.5">
          {filtered.map((s) => {
            const url = `${origin}/s/${s.id}`;
            const margin = s.cost_price != null ? s.price - s.cost_price : null;

            return (
              <li key={s.id} className="card overflow-hidden">
                <div className="flex gap-3.5 p-3">
                  <Link href={`/admin/s/${s.id}`} className="frame w-16 h-20 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.photos[0] ?? ''}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  <Link
                    href={`/admin/s/${s.id}`}
                    className="flex-1 min-w-0 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-display text-[1.0625rem] leading-snug text-ink truncate group-hover:text-maroon-700 transition-colors">
                        {s.name}
                      </p>
                      <ChevronRight
                        size={16}
                        className="text-ink-faint shrink-0 mt-1"
                      />
                    </div>
                    <p className="text-[0.8125rem] text-maroon-600 mt-0.5">
                      {s.category}
                    </p>
                    <div className="flex items-baseline gap-2 mt-1.5">
                      <span className="text-ink font-medium tabular-nums">
                        ₹{s.price.toLocaleString('en-IN')}
                      </span>
                      {margin != null && (
                        <span
                          className={`text-xs tabular-nums ${
                            margin > 0 ? 'text-good' : 'text-bad'
                          }`}
                        >
                          {margin > 0 ? '+' : ''}
                          {margin.toLocaleString('en-IN')} margin
                        </span>
                      )}
                    </div>
                    {s.quantity_total > 1 && (
                      <p className="text-xs text-ink-faint mt-1">
                        {s.quantity_available} of {s.quantity_total} left
                      </p>
                    )}
                  </Link>
                </div>

                <div className="grid grid-cols-2 border-t border-line">
                  <button
                    onClick={() => setSelling(s)}
                    className="py-3 text-sm font-medium text-maroon-700 hover:bg-maroon-50 transition-colors border-r border-line"
                  >
                    Mark sold
                  </button>
                  {/* The link and nothing else. WhatsApp expands it into a
                      card with the photo, name, type and price, so sending
                      those as text too would just print them twice. */}
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(url)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-3 text-sm font-medium text-ink-soft hover:bg-canvas-warm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Share2 size={14} />
                    Send
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {selling && <SoldSheet saree={selling} onClose={() => setSelling(null)} />}
    </>
  );
}
