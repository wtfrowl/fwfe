import { useNavigate } from "react-router-dom";
import type { Tyre } from "../tyre";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { cn } from "../../../utils/cn";

interface Props {
  tyres: Tyre[];
  userRole?: "owner" | "driver" | null;
}

const toneFor = (status: Tyre["status"]) => {
  switch (status) {
    case "Spare":
      return "success";
    case "Mounted":
      return "info";
    case "Scrapped":
      return "danger";
    case "SentForRetreading":
      return "warning";
    default:
      return "neutral";
  }
};

/* "SentForRetreading" is a database value, not something to show a person. */
const LABEL: Record<Tyre["status"], string> = {
  Spare: "Spare",
  Mounted: "Mounted",
  Scrapped: "Scrapped",
  SentForRetreading: "Retreading",
};

/** Below this, a tyre needs attention — so the number says so, not just its colour. */
const LOW_TREAD_MM = 3;

export function TyreTable({ tyres }: Props) {
  const navigate = useNavigate();

  const TreadDepth = ({ depth }: { depth: number }) => {
    const low = depth < LOW_TREAD_MM;
    return (
      <span
        className={cn(
          "text-sm font-semibold tabular-nums",
          low ? "text-critical-ink" : "text-ink-secondary"
        )}
      >
        {depth} mm{low ? " · low" : ""}
      </span>
    );
  };

  const TruckLink = ({ tyre }: { tyre: Tyre }) =>
    tyre.status === "Mounted" && tyre.currentTruckId ? (
      <button
        type="button"
        className="font-medium text-accent hover:underline"
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/owner-home/mytrucks/${tyre.currentTruckId?.registrationNumber}`);
        }}
      >
        {tyre.currentTruckId.registrationNumber || "Truck assigned"}
      </button>
    ) : (
      <span className="text-ink-tertiary">Inventory</span>
    );

  return (
    <>
      {/* --- Desktop --- */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-hairline">
              {["Tyre", "Brand & model", "Status", "Location", "Tread"].map((h) => (
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
            {tyres.map((tyre) => (
              <tr
                key={tyre._id}
                onClick={() => navigate(`${tyre._id}`)}
                className="cursor-pointer border-b border-hairline/70 transition-colors duration-150 last:border-0 hover:bg-ink/3"
              >
                <td className="px-5 py-3.5">
                  <div className="font-semibold text-ink">{tyre.tyreNumber}</div>
                  <div className="text-xs text-ink-tertiary">{tyre.size}</div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="text-sm text-ink">{tyre.brand}</div>
                  <div className="text-xs text-ink-tertiary">{tyre.model}</div>
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge tone={toneFor(tyre.status)}>
                    {LABEL[tyre.status] ?? tyre.status}
                  </StatusBadge>
                </td>
                <td className="px-5 py-3.5 text-sm">
                  <TruckLink tyre={tyre} />
                </td>
                <td className="px-5 py-3.5">
                  <TreadDepth depth={tyre.currentTreadDepth} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Mobile --- */}
      <div className="space-y-3 p-3 md:hidden">
        {tyres.map((tyre) => (
          <div
            key={tyre._id}
            className="rounded-card border border-hairline bg-surface p-4 shadow-[var(--shadow-hairline)]"
          >
            <button
              type="button"
              onClick={() => navigate(`${tyre._id}`)}
              className="flex w-full items-start justify-between gap-3 text-left"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{tyre.tyreNumber}</p>
                <p className="truncate text-sm text-ink-secondary">
                  {tyre.brand} {tyre.model}
                </p>
                <p className="text-xs text-ink-tertiary">{tyre.size}</p>
              </div>
              <StatusBadge tone={toneFor(tyre.status)}>
                {LABEL[tyre.status] ?? tyre.status}
              </StatusBadge>
            </button>

            <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3 text-sm">
              <TruckLink tyre={tyre} />
              <TreadDepth depth={tyre.currentTreadDepth} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
