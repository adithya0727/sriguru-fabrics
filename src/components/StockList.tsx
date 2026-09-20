'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Share2,
  Search,
  ChevronRight,
  Layers,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import SellSheet from './SellSheet';
import SendByTypeSheet from './SendByTypeSheet';
import SareePhoto from './SareePhoto';

type Sort = 'newest' | 'price-asc' | 'price-desc';

const SORTS: { value: Sort; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
];

type Row = {
  id: string;
  name: string;
  category: string;
  price: number;
  cost_price: number | null;
  photos: string[];
  quantity_available: number;
  quantity_total: number;
  /** The supplier's own wording on their bill, when this saree came from one. */
  bill_item_name: string | null;
};

export default function StockList({
  sarees,
  siteUrl,
}: {
  sarees: Row[];
  siteUrl: string;
}) {
  const [selling, setSelling] = useState<Row | null>(null);
  const [sendingType, setSendingType] = useState(false);
  const [query, setQuery] = useState('');
  const [type, setType] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>('newest');
  const [showFilters, setShowFilters] = useState(false);

  // null means "the whole range", so the slider needs no resetting when a sale
  // changes what is on the rack. Holding two numbers instead would leave them
  // pointing at prices that are no longer stocked.
  const [range, setRange] = useState<[number, number] | null>(null);

  // The server's idea of the site URL comes from configuration, which can be
  // stale or missing on a deploy. The browser is standing on the real domain,
  // so once mounted it is the better authority. Set after mount rather than
  // during render, so the first paint still matches what the server sent.
  const [origin, setOrigin] = useState(siteUrl);
  useEffect(() => setOrigin(window.location.origin), []);

  // Only types actually on the rack. A filter that can only ever return
  // nothing is worse than no filter.
  const types = useMemo(
    () => [...new Set(sarees.map((s) => s.category))].sort(),
    [sarees],
  );

  // Rounded outwards to hundreds so the slider lands on prices a person would
  // say out loud, rather than on 1,847.
  const bounds = useMemo(() => {
    if (sarees.length === 0) return { low: 0, high: 1000 };
    const prices = sarees.map((s) => s.price);
    const low = Math.floor(Math.min(...prices) / 100) * 100;
    const high = Math.ceil(Math.max(...prices) / 100) * 100;
    return { low, high: high > low ? high : low + 100 };
  }, [sarees]);

  const [low, high] = range ?? [bounds.low, bounds.high];
  const priceNarrowed = low > bounds.low || high < bounds.high;
  const activeFilters =
    (type ? 1 : 0) + (priceNarrowed ? 1 : 0) + (sort !== 'newest' ? 1 : 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const matched = sarees.filter((s) => {
      if (type && s.category !== type) return false;
      if (s.price < low || s.price > high) return false;
      if (!q) return true;
      // The bill's wording is searched alongside the shop's own name, because
      // the two rarely match: a customer asks about what the supplier called
      // it and the register calls it something else. Either set finds it.
      return (
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.bill_item_name ?? '').toLowerCase().includes(q)
      );
    });

    // Newest is the order the server already sent, so leave it untouched.
    if (sort === 'price-asc') return [...matched].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') return [...matched].sort((a, b) => b.price - a.price);
    return matched;
  }, [sarees, query, type, low, high, sort]);

  function clearAll() {
    setQuery('');
    setType(null);
    setRange(null);
    setSort('newest');
  }

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
      {/* Search and type are always visible — they answer "where is that one"
          and "show me the Gadwals", which is most of what gets asked at the
          rack. Price and order sit behind one tap, so the top of the screen
          stays a list of sarees rather than a control panel. */}
      <div className="px-5 pb-3 space-y-2.5">
        <div className="relative">
          <Search
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, type, or the bill"
            className="field field-icon"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Clear the search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2.5 text-ink-faint"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {types.length > 1 && (
          <div className="flex gap-2 overflow-x-auto -mx-5 px-5 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setType(null)}
              className={`chip ${type === null ? 'chip-active' : ''}`}
            >
              All
            </button>
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setType(type === t ? null : t)}
                className={`chip ${type === t ? 'chip-active' : ''}`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`chip ${showFilters || activeFilters > 0 ? 'chip-active' : ''}`}
          >
            <SlidersHorizontal size={14} />
            Price &amp; order
            {activeFilters > 0 && ` · ${activeFilters}`}
          </button>

          <p className="text-xs text-ink-faint tabular-nums shrink-0">
            {filtered.length === sarees.length
              ? `${sarees.length} ${sarees.length === 1 ? 'saree' : 'sarees'}`
              : `${filtered.length} of ${sarees.length}`}
          </p>
        </div>

        {showFilters && (
          <div className="card p-4 space-y-4 rise">
            <div>
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <span className="text-sm font-medium text-ink">Price</span>
                <span className="text-sm text-ink-soft tabular-nums">
                  ₹{low.toLocaleString('en-IN')} – ₹{high.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="range-dual">
                <div className="range-dual__track" />
                <div
                  className="range-dual__fill"
                  style={{
                    left: `${percent(low, bounds)}%`,
                    right: `${100 - percent(high, bounds)}%`,
                  }}
                />
                <input
                  type="range"
                  aria-label="Lowest price"
                  min={bounds.low}
                  max={bounds.high}
                  step={100}
                  value={low}
                  onChange={(e) => setRange(clamp(Number(e.target.value), high, bounds, 'low'))}
                />
                <input
                  type="range"
                  aria-label="Highest price"
                  min={bounds.low}
                  max={bounds.high}
                  step={100}
                  value={high}
                  onChange={(e) => setRange(clamp(Number(e.target.value), low, bounds, 'high'))}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="sort"
                className="block text-sm font-medium text-ink mb-1.5"
              >
                Order
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="field"
              >
                {SORTS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {(activeFilters > 0 || query) && (
              <button
                onClick={clearAll}
                className="btn btn-ghost w-full !min-h-0 py-2 text-sm"
              >
                Clear everything
              </button>
            )}
          </div>
        )}
      </div>

      <div className="px-5 pb-3">
        <button
          onClick={() => setSendingType(true)}
          className="btn btn-secondary w-full"
        >
          <Layers size={16} />
          Send a whole type
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 px-5">
          <p className="text-ink-soft text-sm">
            {query ? `Nothing matches “${query}”` : 'Nothing matches these filters'}
            {type && ` in ${type}`}.
          </p>
          <button onClick={clearAll} className="btn btn-secondary mt-5 text-sm">
            Clear everything
          </button>
        </div>
      ) : (
        <ul className="px-5 space-y-2.5">
          {filtered.map((s) => {
            const url = `${origin}/s/${s.id}`;
            const margin = s.cost_price != null ? s.price - s.cost_price : null;

            return (
              <li key={s.id} className="card overflow-hidden">
                <div className="flex gap-3.5 p-3">
                  <Link href={`/admin/s/${s.id}`} className="frame w-16 h-20 shrink-0">
                    <SareePhoto
                      url={s.photos[0]}
                      alt=""
                      widths={[128, 256]}
                      sizes="64px"
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
                    {s.bill_item_name && (
                      <p className="text-xs text-ink-faint mt-1 truncate">
                        Bill: {s.bill_item_name}
                      </p>
                    )}
                  </Link>
                </div>

                <div className="grid grid-cols-2 border-t border-line">
                  <button
                    onClick={() => setSelling(s)}
                    className="py-3 text-sm font-medium text-maroon-700 hover:bg-maroon-50 transition-colors border-r border-line"
                  >
                    Sell
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

      {selling && <SellSheet saree={selling} onClose={() => setSelling(null)} />}

      {sendingType && (
        <SendByTypeSheet
          sarees={sarees}
          origin={origin}
          onClose={() => setSendingType(false)}
        />
      )}
    </>
  );
}

/** Where a price sits along the slider, as a percentage of its span. */
function percent(value: number, bounds: { low: number; high: number }): number {
  const span = bounds.high - bounds.low;
  if (span <= 0) return 0;
  return ((value - bounds.low) / span) * 100;
}

const STEP = 100;

/**
 * Keep the two thumbs at least one step apart.
 *
 * Sitting on the same value, they overlap exactly and only whichever input is
 * painted on top can still be grabbed — the other is unreachable, and the
 * range looks stuck. A step of daylight between them costs nothing and keeps
 * both draggable.
 */
function clamp(
  value: number,
  other: number,
  bounds: { low: number; high: number },
  which: 'low' | 'high',
): [number, number] {
  const roomy = bounds.high - bounds.low > STEP;
  if (which === 'low') {
    const ceiling = roomy ? other - STEP : other;
    return [Math.min(value, ceiling), other];
  }
  const floor = roomy ? other + STEP : other;
  return [other, Math.max(value, floor)];
}
