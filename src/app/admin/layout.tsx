import Link from 'next/link';
import { Plus, Package, TrendingUp } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {children}

      {/* Bottom bar: thumb-reachable on a phone, which is where this is used. */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-stone-200 grid grid-cols-3 z-40">
        <Link
          href="/admin"
          className="tap-target flex flex-col items-center justify-center gap-0.5 text-xs text-stone-600 py-2"
        >
          <Package size={20} />
          Stock
        </Link>
        <Link
          href="/admin/add"
          className="tap-target flex flex-col items-center justify-center gap-0.5 text-xs font-medium text-white bg-brand-700 py-2"
        >
          <Plus size={22} />
          Add saree
        </Link>
        <Link
          href="/admin/dashboard"
          className="tap-target flex flex-col items-center justify-center gap-0.5 text-xs text-stone-600 py-2"
        >
          <TrendingUp size={20} />
          Profit
        </Link>
      </nav>
    </div>
  );
}
