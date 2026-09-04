/**
 * Matches the shape of `DriverTable` — avatar, two-line identity, status pill
 * — so nothing shifts when the real rows arrive. The old skeleton drew two
 * action icons per row that the table has never had.
 */
export default function DriverTableSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading drivers">
      {[...Array(5)].map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 border-b border-hairline/70 px-5 py-3.5 last:border-0"
        >
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-ink/8" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 animate-pulse rounded-chip bg-ink/8" />
            <div className="h-3 w-24 animate-pulse rounded-chip bg-ink/8" />
          </div>
          <div className="hidden h-3 w-20 animate-pulse rounded-chip bg-ink/8 sm:block" />
          <div className="h-6 w-24 animate-pulse rounded-full bg-ink/8" />
        </div>
      ))}
    </div>
  );
}
