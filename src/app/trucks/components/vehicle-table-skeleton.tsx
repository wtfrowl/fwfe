/**
 * Skeleton shaped like the table it stands in for. Its columns and row height
 * match `VehicleTable` exactly, so the real content does not shove the page
 * around when it lands.
 *
 * The old version drew six columns for a five-column table, and two action
 * buttons per row that the table never had — the layout visibly jumped on
 * every load.
 */
const VehicleTableSkeleton = () => {
  const Bar = ({ className }: { className: string }) => (
    <div className={`animate-pulse rounded-chip bg-ink/8 ${className}`} />
  );

  return (
    <div aria-busy="true" aria-label="Loading trucks">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-hairline">
              {["Vehicle", "Type", "Status", "Health", "Alert"].map((h) => (
                <th key={h} className="px-4 py-3 text-left">
                  <Bar className="h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="border-b border-hairline/70 last:border-0">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-ink/8" />
                    <Bar className="h-4 w-28" />
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <Bar className="h-4 w-16" />
                </td>
                <td className="px-4 py-3.5">
                  <Bar className="h-6 w-24 rounded-full" />
                </td>
                <td className="w-56 px-4 py-3.5">
                  <Bar className="h-1.5 w-full rounded-full" />
                </td>
                <td className="px-4 py-3.5">
                  <Bar className="h-6 w-24 rounded-full" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-3 md:hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3 rounded-card border border-hairline bg-surface p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 animate-pulse rounded-full bg-ink/8" />
                <Bar className="h-4 w-28" />
              </div>
              <Bar className="h-6 w-20 rounded-full" />
            </div>
            <Bar className="h-3 w-40" />
            <Bar className="h-1.5 w-full rounded-full" />
            <Bar className="h-6 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VehicleTableSkeleton;
