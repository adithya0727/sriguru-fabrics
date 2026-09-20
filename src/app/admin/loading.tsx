export default function Loading() {
  return (
    <div className="max-w-lg mx-auto">
      <header className="px-5 pt-8 pb-5">
        <div className="skeleton h-3 w-28" />
        <div className="skeleton h-7 w-44 mt-3" />
        <div className="skeleton h-px w-full mt-6" />
      </header>
      <div className="px-5 space-y-2.5">
        <div className="skeleton h-12 w-full rounded-[10px]" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="skeleton h-8 w-20 rounded-full" />
          ))}
        </div>
        <div className="skeleton h-12 w-full rounded-[10px]" />
      </div>
      <ul className="px-5 space-y-2.5 mt-3">
        {Array.from({ length: 5 }, (_, i) => (
          <li key={i} className="card p-3 flex gap-3.5">
            <div className="skeleton w-16 h-20 rounded-xl shrink-0" />
            <div className="flex-1">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-20 mt-2" />
              <div className="skeleton h-4 w-24 mt-3" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
