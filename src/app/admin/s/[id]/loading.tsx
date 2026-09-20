/** A form screen while its data arrives. Shapes rather than a spinner, so the
 *  page does not jump when the real fields replace them. */
export default function Loading() {
  return (
    <div className="max-w-lg mx-auto px-5 py-8">
      <div className="skeleton h-3 w-24" />
      <div className="skeleton h-7 w-52 mt-3" />
      <div className="skeleton h-3 w-72 mt-4" />
      <div className="card p-5 mt-6 space-y-5">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i}>
            <div className="skeleton h-3 w-28" />
            <div className="skeleton h-12 w-full mt-2 rounded-[10px]" />
          </div>
        ))}
      </div>
    </div>
  );
}
