import Link from 'next/link';
import { Plus, ChevronRight } from 'lucide-react';
import { getSessionClient } from '@/lib/supabase/server';
import { type Bill, type BillCompany, formatBillDate } from '@/lib/bills';

export const dynamic = 'force-dynamic';

export default async function ReceiptsPage() {
  const supabase = await getSessionClient();

  const [{ data: companies }, { data: bills, error }] = await Promise.all([
    supabase.from('bill_companies').select('*').order('name'),
    supabase
      .from('bills')
      .select('*')
      .order('bill_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }),
  ]);

  if (error) {
    return (
      <p className="m-5 card p-4 text-sm text-bad bg-bad-bg">
        Could not load bills: {error.message}
      </p>
    );
  }

  const all = (bills ?? []) as Bill[];

  // Grouped by company, because that is how they are looked up — "what have we
  // bought from Venkateshwara" rather than "what did we buy in March".
  const groups = ((companies ?? []) as BillCompany[])
    .map((company) => ({
      company,
      bills: all.filter((b) => b.company_id === company.id),
    }))
    .filter((g) => g.bills.length > 0)
    .sort((a, b) => b.bills.length - a.bills.length);

  return (
    <div className="max-w-lg mx-auto">
      <header className="px-5 pt-8 pb-5">
        <p className="eyebrow mb-2">Store receipts</p>
        <h1 className="font-display text-[1.75rem] text-maroon-900 leading-tight">
          Bills from suppliers
        </h1>
        <div className="flex gap-6 mt-4">
          <div>
            <p className="font-display text-xl text-ink tabular-nums">
              {all.length}
            </p>
            <p className="text-xs text-ink-faint">
              {all.length === 1 ? 'bill' : 'bills'}
            </p>
          </div>
          <div>
            <p className="font-display text-xl text-ink tabular-nums">
              {groups.length}
            </p>
            <p className="text-xs text-ink-faint">
              {groups.length === 1 ? 'company' : 'companies'}
            </p>
          </div>
        </div>
        <div className="rule-fade mt-5" />
      </header>

      <div className="px-5 pb-4">
        <Link href="/admin/receipts/add" className="btn btn-primary w-full">
          <Plus size={17} />
          Add a bill
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-16 px-5">
          <p className="font-display text-lg text-ink">No bills yet</p>
          <p className="text-sm text-ink-soft mt-2 leading-relaxed">
            Photograph a supplier bill and it is read into a table you can
            correct.
          </p>
        </div>
      ) : (
        <div className="px-5 space-y-8 pb-6">
          {groups.map(({ company, bills: theirs }) => (
            <section key={company.id}>
              <h2 className="font-display text-lg text-maroon-800 leading-snug">
                {company.name}
              </h2>
              <p className="text-xs text-ink-faint mt-0.5 mb-3">
                {theirs.length} {theirs.length === 1 ? 'bill' : 'bills'}
              </p>

              <ul className="card divide-y divide-line">
                {theirs.map((bill) => (
                  <li key={bill.id}>
                    <Link
                      href={`/admin/receipts/${bill.id}`}
                      className="flex items-center justify-between gap-3 p-3.5 hover:bg-canvas-warm transition-colors first:rounded-t-[13px] last:rounded-b-[13px]"
                    >
                      <div className="min-w-0">
                        <p className="text-ink truncate">
                          {bill.bill_number || 'No bill number'}
                        </p>
                        <p className="text-xs text-ink-faint mt-0.5">
                          {formatBillDate(bill.bill_date)} ·{' '}
                          {bill.items.length}{' '}
                          {bill.items.length === 1 ? 'item' : 'items'}
                          {bill.low_confidence.length > 0 && (
                            <span className="text-warn"> · needs checking</span>
                          )}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-ink-faint shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
