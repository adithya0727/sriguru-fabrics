/** The catalogue while it loads: the same grid, without the photographs. */
export default function GridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8">
      {Array.from({ length: cards }, (_, i) => (
        <div key={i}>
          <div className="skeleton aspect-[3/4] rounded-xl" />
          <div className="skeleton h-3 w-16 mt-3" />
          <div className="skeleton h-4 w-full mt-2" />
          <div className="skeleton h-3 w-20 mt-2" />
        </div>
      ))}
    </div>
  );
}
