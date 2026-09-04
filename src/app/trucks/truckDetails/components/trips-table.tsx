import { useState } from "react";
import { FaTruck } from "react-icons/fa";
import type { TruckTrip } from "../types/truck";
import { StatusBadge } from "../../../../components/ui/StatusBadge";
import { TablePagination } from "../../../../components/ui/TablePagination";

interface TripsTableProps {
  trips: TruckTrip[];
}

const ITEMS_PER_PAGE = 5;

/* Fares and expenses were rendered with a `$` sign in an app whose every
   other number is in rupees. */
const rupees = (value: number | string | undefined) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const toneFor = (status: string) =>
  status === "Running" ? "success" : status === "Completed" ? "info" : "neutral";

export function TripsTable({ trips }: TripsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(trips.length / ITEMS_PER_PAGE));
  const paginated = trips.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  /* Removed: a header checkbox and a per-row checkbox that selected nothing,
     and an edit button with no handler. Three dead affordances in one table. */

  if (trips.length === 0) {
    return (
      <p className="flex h-40 items-center justify-center text-sm text-ink-tertiary">
        No trips recorded for this truck yet.
      </p>
    );
  }

  return (
    <div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-hairline">
              {["Trip", "Status", "Load", "Expenses"].map((h) => (
                <th
                  key={h}
                  className="text-caption px-4 py-3 text-left text-xs font-semibold uppercase text-ink-tertiary"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((trip) => (
              <tr key={trip.id} className="border-b border-hairline/70 last:border-0">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink/6 text-ink-secondary">
                      <FaTruck className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-ink">{trip.truckId}</span>
                      <p className="text-sm text-ink-secondary">
                        {trip.departure} → {trip.arrival}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  {/* Every row used to render green regardless of status. */}
                  <StatusBadge tone={toneFor(trip.status)}>{trip.status}</StatusBadge>
                </td>
                <td className="px-4 py-3.5 text-sm">
                  <div className="tabular-nums text-ink">{trip.weight} kg</div>
                  <div className="tabular-nums text-ink-tertiary">{rupees(trip.fare)}</div>
                </td>
                <td className="px-4 py-3.5 text-sm">
                  {trip?.expenses?.fuel ? (
                    <span className="tabular-nums text-ink-secondary">
                      Fuel {rupees(trip.expenses.fuel)}
                    </span>
                  ) : (
                    <span className="text-ink-quaternary">None recorded</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-3 md:hidden">
        {paginated.map((trip) => (
          <div key={trip.id} className="rounded-card border border-hairline bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{trip.truckId}</p>
                <p className="truncate text-sm text-ink-secondary">
                  {trip.departure} → {trip.arrival}
                </p>
              </div>
              <StatusBadge tone={toneFor(trip.status)}>{trip.status}</StatusBadge>
            </div>
            <div className="mt-3 flex justify-between border-t border-hairline pt-3 text-sm tabular-nums">
              <span className="text-ink-secondary">{trip.weight} kg</span>
              <span className="font-semibold text-ink">{rupees(trip.fare)}</span>
            </div>
          </div>
        ))}
      </div>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={trips.length}
        pageSize={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
