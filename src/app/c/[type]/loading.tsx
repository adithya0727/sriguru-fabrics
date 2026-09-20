import GridSkeleton from '@/components/GridSkeleton';

export default function Loading() {
  return (
    <div className="min-h-screen">
      <header className="px-5 pt-12 pb-8 flex flex-col items-center">
        <div className="skeleton h-3 w-48" />
        <div className="skeleton h-8 w-40 mt-4" />
        <div className="skeleton h-3 w-36 mt-6" />
      </header>
      <main className="max-w-5xl mx-auto px-5 pb-10">
        <GridSkeleton />
      </main>
    </div>
  );
}
