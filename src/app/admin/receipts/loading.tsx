export default function Loading() {
  return (
    <div className="max-w-lg mx-auto">
      <header className="px-5 pt-8 pb-5">
        <div className="skeleton h-3 w-28" />
        <div className="skeleton h-7 w-56 mt-3" />
        <div className="skeleton h-px w-full mt-6" />
      </header>
      <div className="px-5">
        <div className="skeleton h-12 w-full rounded-[10px]" />
      </div>
      <div className="px-5 mt-8 space-y-8">
        {Array.from({ length: 2 }, (_, g) => (
          <section key={g}>
            <div className="skeleton h-5 w-52" />
            <div className="skeleton h-3 w-16 mt-2" />
            <div className="card divide-y divide-line mt-3">
              {Array.from({ length: 2 }, (_, i) => (
                <div key={i} className="p-3.5">
                  <div className="skeleton h-4 w-40" />
                  <div className="skeleton h-3 w-28 mt-2" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
