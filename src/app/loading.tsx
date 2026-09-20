import GridSkeleton from '@/components/GridSkeleton';

export default function Loading() {
  return (
    <div className="min-h-screen">
      <header className="px-5 pt-14 pb-10 flex flex-col items-center">
        <div className="skeleton h-3 w-40" />
        <div className="skeleton h-9 w-64 mt-5" />
        <div className="skeleton h-9 w-44 mt-2" />
        <div className="skeleton h-3 w-72 mt-7" />
      </header>
      <div className="border-y border-line py-3">
        <div className="max-w-5xl mx-auto flex gap-2 px-5">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="skeleton h-8 w-24 rounded-full" />
          ))}
        </div>
      </div>
      <main className="max-w-5xl mx-auto px-5 py-8">
        <GridSkeleton />
      </main>
    </div>
  );
}
