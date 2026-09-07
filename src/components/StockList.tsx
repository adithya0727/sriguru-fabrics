'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Share2, IndianRupee } from 'lucide-react';
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

  if (sarees.length === 0) {
    return (
      <p className="text-center text-stone-500 py-16 px-5">
        No sarees yet. Tap <span className="font-medium">Add saree</span> below
        to start.
      </p>
    );
  }

  return (
    <>
      <ul className="divide-y divide-stone-200">
        {sarees.map((s) => {
          const url = `${siteUrl}/s/${s.id}`;
          const message = `${s.name}\n₹${s.price.toLocaleString('en-IN')}\n${url}`;
          const margin =
            s.cost_price != null ? s.price - s.cost_price : null;

          return (
            <li key={s.id} className="flex gap-3 p-3 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.photos[0] ?? ''}
                alt=""
                className="w-16 h-20 object-cover rounded-lg bg-stone-100 shrink-0"
              />

              <Link href={`/admin/s/${s.id}`} className="flex-1 min-w-0">
                <p className="font-medium text-stone-900 truncate">{s.name}</p>
                <p className="text-sm text-stone-500">{s.category}</p>
                <p className="text-sm font-medium text-stone-900 mt-0.5">
                  ₹{s.price.toLocaleString('en-IN')}
                  {margin != null && (
                    <span
                      className={`ml-2 text-xs font-normal ${
                        margin > 0 ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {margin > 0 ? '+' : ''}₹{margin.toLocaleString('en-IN')}
                    </span>
                  )}
                </p>
                {s.quantity_total > 1 && (
                  <p className="text-xs text-stone-500 mt-0.5">
                    {s.quantity_available} of {s.quantity_total} left
                  </p>
                )}
              </Link>

              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  onClick={() => setSelling(s)}
                  className="tap-target px-3 rounded-lg bg-brand-700 text-white text-sm font-medium flex items-center gap-1"
                >
                  <IndianRupee size={14} />
                  Sold
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(message)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="tap-target px-3 rounded-lg border border-stone-300 text-stone-700 text-sm flex items-center gap-1"
                >
                  <Share2 size={14} />
                  Send
                </a>
              </div>
            </li>
          );
        })}
      </ul>

      {selling && (
        <SoldSheet saree={selling} onClose={() => setSelling(null)} />
      )}
    </>
  );
}
