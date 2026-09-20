export default function Loading() {
  return (
    <div className="min-h-screen pb-28">
      <div className="max-w-lg mx-auto px-5 pt-5">
        <div className="skeleton h-4 w-24" />
      </div>
      <main className="max-w-lg mx-auto px-5 pt-4">
        <div className="skeleton aspect-[3/4] rounded-xl" />
        <div className="flex gap-2.5 mt-2.5">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="skeleton w-16 h-20 rounded-xl" />
          ))}
        </div>
        <div className="skeleton h-3 w-20 mt-7" />
        <div className="skeleton h-7 w-3/4 mt-3" />
        <div className="skeleton h-6 w-28 mt-3" />
        <div className="skeleton h-3 w-full mt-5" />
        <div className="skeleton h-3 w-5/6 mt-2" />
      </main>
    </div>
  );
}
