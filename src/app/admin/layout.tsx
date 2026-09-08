import Link from 'next/link';
import { Plus, Package, BookOpen } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-24">
      {children}

      {/* Bottom bar: this is used one-handed, standing at the rack, so the
          controls live where a thumb already is. */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-surface/92 backdrop-blur-md border-t border-line">
        <div className="max-w-lg mx-auto grid grid-cols-3">
          <NavItem href="/admin" icon={<Package size={19} />} label="Stock" />
          <NavItem href="/admin/add" icon={<Plus size={19} />} label="Add saree" primary />
          <NavItem href="/admin/accounts" icon={<BookOpen size={19} />} label="Accounts" />
        </div>
      </nav>
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
  primary,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] text-[0.6875rem] font-medium transition-colors ${
        primary
          ? 'text-maroon-700'
          : 'text-ink-soft hover:text-maroon-700'
      }`}
    >
      <span
        className={
          primary
            ? 'flex items-center justify-center w-9 h-9 rounded-full bg-maroon-700 text-white'
            : ''
        }
      >
        {icon}
      </span>
      {label}
    </Link>
  );
}
