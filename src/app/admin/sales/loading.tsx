export default function Loading() {
  return (
    <div className="max-w-lg mx-auto">
      <header className="px-5 pt-8 pb-5">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-7 w-52 mt-3" />
        <div className="skeleton h-px w-full mt-6" />
      </header>
      <section className="px-5">
        <div className="card divide-y divide-line">
          <div className="p-5">
            <div className="skeleton h-3 w-16" />
            <div className="skeleton h-9 w-40 mt-3" />
          </div>
          <div className="grid grid-cols-2 divide-x divide-line">
            {Array.from({ length: 2 }, (_, i) => (
              <div key={i} className="p-4">
                <div className="skeleton h-3 w-20" />
                <div className="skeleton h-6 w-24 mt-3" />
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="px-5 mt-9">
        <div className="skeleton h-5 w-32" />
        <div className="skeleton h-3 w-64 mt-3" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex gap-3">
              <div className="skeleton h-9 flex-1" />
              <div className="skeleton h-9 w-20" />
              <div className="skeleton h-9 w-16" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
