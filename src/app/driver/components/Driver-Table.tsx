import React from "react";
import { useNavigate } from "react-router-dom";
import type { Driver } from "../Drivers";
import { StatusBadge } from "../../../components/ui/StatusBadge";

interface DriverTableProps {
  drivers: Driver[];
  role?: "owner" | "driver" | null;
}

/* `driver.firstName[0]` threw on a driver with a blank name, which the
   sanitiser in Drivers.tsx allows through as "". */
const initials = (driver: Driver) =>
  `${driver.firstName?.[0] ?? ""}${driver.lastName?.[0] ?? ""}`.toUpperCase() || "–";

export const DriverTable: React.FC<DriverTableProps> = ({ drivers }) => {
  const navigate = useNavigate();

  return (
    <>
      {/* --- Desktop --- */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-hairline">
              {["Name", "Contact / licence", "Location", "Trips", "Status"].map((h) => (
                <th
                  key={h}
                  className="text-caption px-5 py-3 text-left text-xs font-semibold uppercase text-ink-tertiary"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver) => (
              <tr
                key={driver.id}
                onClick={() => navigate(`${driver.id}`)}
                className="group cursor-pointer border-b border-hairline/70 transition-colors duration-150 last:border-0 hover:bg-ink/3"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent-ink">
                      {initials(driver)}
                    </div>
                    <span className="font-semibold text-ink">
                      {driver.firstName} {driver.lastName}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="text-sm tabular-nums text-ink">{driver.contactNumber}</div>
                  <div className="text-xs text-ink-tertiary">Lic. {driver.license}</div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="text-sm text-ink">{driver.city}</div>
                  <div className="text-xs text-ink-tertiary">{driver.state}</div>
                </td>
                <td className="px-5 py-3.5 text-sm tabular-nums text-ink-secondary">
                  {driver.totalTrips}
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge tone={driver.status === "Available" ? "success" : "neutral"}>
                    {driver.status}
                  </StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Mobile ---
          The desktop table used to be the only view, so on a phone this page
          was a five-column table squeezed into 360px. */}
      <div className="space-y-3 p-3 md:hidden">
        {drivers.map((driver) => (
          <button
            key={driver.id}
            type="button"
            onClick={() => navigate(`${driver.id}`)}
            className="w-full rounded-card border border-hairline bg-surface p-4 text-left shadow-[var(--shadow-hairline)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent-ink">
                  {initials(driver)}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">
                    {driver.firstName} {driver.lastName}
                  </p>
                  <p className="truncate text-sm tabular-nums text-ink-secondary">
                    {driver.contactNumber}
                  </p>
                </div>
              </div>
              <StatusBadge tone={driver.status === "Available" ? "success" : "neutral"}>
                {driver.status}
              </StatusBadge>
            </div>

            <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-hairline pt-3 text-sm">
              <div className="flex gap-1.5">
                <dt className="text-ink-tertiary">Location</dt>
                <dd className="font-medium text-ink-secondary">
                  {driver.city}, {driver.state}
                </dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="text-ink-tertiary">Trips</dt>
                <dd className="font-medium tabular-nums text-ink-secondary">{driver.totalTrips}</dd>
              </div>
            </dl>
          </button>
        ))}
      </div>
    </>
  );
};
