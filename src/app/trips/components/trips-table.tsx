import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTrash } from "react-icons/fa";
import { motion, useReducedMotion } from "motion/react";
import type { Trip } from "../types/api";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { TablePagination } from "../../../components/ui/TablePagination";
import { spring } from "../../../motion/springs";

interface TripsTableProps {
  trips: Trip[];
  onDelete: (id: string) => Promise<void>;
}

const ITEMS_PER_PAGE = 5;

const toneFor = (status: Trip["status"]) =>
  status === "Running" ? "success" : status === "Completed" ? "info" : "neutral";

const rupees = (n: number | string) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export function TripsTable({ trips, onDelete }: TripsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const reduced = useReducedMotion();

  const totalPages = Math.max(1, Math.ceil(trips.length / ITEMS_PER_PAGE));
  const paginated = trips.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  /* The Edit and Copy buttons called handlers that only ran console.log, so
     every click did nothing. A control that does not work is worse than a
     missing one — it spends the user's trust. They are gone until the
     handlers exist. */

  return (
    <div>
      {/* --- Desktop --- */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-hairline">
              {["Trip", "Status", "Fare", ""].map((h, i) => (
                <th
                  key={h || i}
                  className="text-caption px-4 py-3 text-left text-xs font-semibold uppercase text-ink-tertiary"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((trip) => (
              <tr
                key={trip._id}
                onClick={() => navigate(`${trip._id}`)}
                className="cursor-pointer border-b border-hairline/70 transition-colors duration-150 last:border-0 hover:bg-ink/3"
              >
                <td className="px-4 py-3.5">
                  <p className="font-semibold text-ink">{trip.registrationNumber}</p>
                  <p className="text-sm text-ink-secondary">
                    {trip.departureLocation} → {trip.arrivalLocation}
                  </p>
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge tone={toneFor(trip.status)}>{trip.status}</StatusBadge>
                </td>
                <td className="px-4 py-3.5 font-semibold tabular-nums text-ink">
                  {rupees(trip.fare)}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <motion.button
                    type="button"
                    aria-label={`Delete trip ${trip.registrationNumber}`}
                    onClick={(e) => {
                      /* Without this the row's navigate fires too and the user
                         lands on the detail page of the trip they just asked
                         to delete. */
                      e.stopPropagation();
                      onDelete(trip._id);
                    }}
                    className="rounded-control p-2 text-ink-tertiary transition-colors duration-150 hover:bg-critical-soft hover:text-critical-ink"
                    whileTap={reduced ? { opacity: 0.6 } : { scale: 0.9 }}
                    transition={spring.snappy}
                  >
                    <FaTrash className="h-3.5 w-3.5" />
                  </motion.button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Mobile --- */}
      <div className="space-y-3 p-3 md:hidden">
        {paginated.map((trip) => (
          <div
            key={trip._id}
            className="rounded-card border border-hairline bg-surface p-4 shadow-[var(--shadow-hairline)]"
          >
            <button
              type="button"
              onClick={() => navigate(`${trip._id}`)}
              className="flex w-full items-start justify-between gap-3 text-left"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{trip.registrationNumber}</p>
                <p className="truncate text-sm text-ink-secondary">
                  {trip.departureLocation} → {trip.arrivalLocation}
                </p>
              </div>
              <StatusBadge tone={toneFor(trip.status)}>{trip.status}</StatusBadge>
            </button>

            <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
              <span className="font-semibold tabular-nums text-ink">{rupees(trip.fare)}</span>
              <motion.button
                type="button"
                aria-label={`Delete trip ${trip.registrationNumber}`}
                onClick={() => onDelete(trip._id)}
                className="rounded-control p-2 text-ink-tertiary hover:bg-critical-soft hover:text-critical-ink"
                whileTap={reduced ? { opacity: 0.6 } : { scale: 0.9 }}
                transition={spring.snappy}
              >
                <FaTrash className="h-3.5 w-3.5" />
              </motion.button>
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
