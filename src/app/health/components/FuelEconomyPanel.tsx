import { DataTable } from "../../../reuse/DataTable/DataTable";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { InlineMessage } from "../../../components/ui/InlineMessage";
import type { FuelTruckRow } from "../../../api/fleetHealth.api";

/**
 * Fuel economy per truck.
 *
 * Sorted worst-first by the server, and left that way: this table exists to
 * be acted on, and the row worth looking at is the one at the top. Sorting by
 * registration number would bury it among vehicles that are fine.
 *
 * The honesty problem here is small samples. A truck with one 40 km trip and
 * a full tank shows a catastrophic mileage that means nothing, so rows the
 * server marks unreliable are shown with their number greyed and labelled
 * rather than dropped — "not enough data yet" is a fact the owner needs, and
 * a truck silently missing from the list looks like a bug.
 */

const fmt = (n: number | null | undefined, digits = 2) =>
  n == null ? "—" : n.toFixed(digits);

const km = (n: number) => `${Math.round(n).toLocaleString("en-IN")} km`;

/* A loaded Indian tipper or trailer lives between roughly 3 and 5 kmpl. The
   bands are for colour only and never replace the number itself. */
const economyTone = (kmpl: number | null, reliable: boolean) => {
  if (kmpl == null || !reliable) return "neutral" as const;
  if (kmpl < 2.5) return "danger" as const;
  if (kmpl < 3.5) return "warning" as const;
  return "success" as const;
};

export function FuelEconomyPanel({
  summary,
  trucks,
}: {
  summary: {
    totalKm: number;
    dieselLitres: number;
    fuelSpend: number;
    tripsMissingDistance: number;
    kmpl: number | null;
    fuelCostPerKm: number | null;
    trucksMeasured: number;
    trucksTotal: number;
  };
  trucks: FuelTruckRow[];
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-card border border-hairline bg-surface p-5 shadow-[var(--shadow-raised)]">
          <p className="text-caption text-sm text-ink-secondary">Fleet mileage</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-[-0.02em] text-ink">
            {summary.kmpl == null ? "—" : `${summary.kmpl.toFixed(2)} kmpl`}
          </p>
          {/* Named explicitly, because the intuitive reading is the mean of
              the per-truck figures — which weights a truck that ran 200 km
              the same as one that ran 20,000. */}
          <p className="mt-1 text-xs text-ink-tertiary">Total km ÷ total litres</p>
        </div>

        <div className="rounded-card border border-hairline bg-surface p-5 shadow-[var(--shadow-raised)]">
          <p className="text-caption text-sm text-ink-secondary">Fuel cost / km</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-[-0.02em] text-ink">
            {summary.fuelCostPerKm == null ? "—" : `₹${summary.fuelCostPerKm.toFixed(2)}`}
          </p>
          <p className="mt-1 text-xs text-ink-tertiary">
            ₹{Math.round(summary.fuelSpend).toLocaleString("en-IN")} on approved diesel
          </p>
        </div>

        <div className="rounded-card border border-hairline bg-surface p-5 shadow-[var(--shadow-raised)]">
          <p className="text-caption text-sm text-ink-secondary">Diesel used</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-[-0.02em] text-ink">
            {Math.round(summary.dieselLitres).toLocaleString("en-IN")} L
          </p>
          <p className="mt-1 text-xs text-ink-tertiary">over {km(summary.totalKm)}</p>
        </div>

        <div className="rounded-card border border-hairline bg-surface p-5 shadow-[var(--shadow-raised)]">
          <p className="text-caption text-sm text-ink-secondary">Trucks measured</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-[-0.02em] text-ink">
            {summary.trucksMeasured}
            <span className="text-base font-medium text-ink-tertiary">
              {" "}
              / {summary.trucksTotal}
            </span>
          </p>
          <p className="mt-1 text-xs text-ink-tertiary">with enough distance logged</p>
        </div>
      </div>

      {/* The size of the blind spot, stated. Mileage that quietly excludes a
          third of the fleet's trips is worse than no mileage figure, because
          it is believed. */}
      {summary.tripsMissingDistance > 0 && (
        <InlineMessage tone="warning">
          {summary.tripsMissingDistance} completed trip
          {summary.tripsMissingDistance === 1 ? " has" : "s have"} no distance recorded, so their
          fuel is excluded from these figures. Enter the closing odometer when completing a trip to
          bring them in.
        </InlineMessage>
      )}

      <DataTable<FuelTruckRow>
        title="Mileage by truck"
        subtitle="Worst first. A sustained drop on the same routes usually means a leak, a failing injector, or pilferage."
        data={trucks}
        emptyMessage="No completed trips with both distance and diesel logged yet."
        columns={[
          {
            key: "registrationNumber",
            header: "Truck",
            render: (r) => (
              <div>
                <div className="font-medium text-ink">{r.registrationNumber}</div>
                <div className="text-xs text-ink-tertiary">{r.model}</div>
              </div>
            ),
          },
          {
            key: "kmpl",
            header: "Mileage",
            align: "right",
            render: (r) => (
              <div className="flex items-center justify-end gap-2">
                <span
                  className={`font-semibold tabular-nums ${
                    r.reliable ? "text-ink" : "text-ink-tertiary"
                  }`}
                >
                  {fmt(r.kmpl)} kmpl
                </span>
                {r.kmpl != null && (
                  <StatusBadge tone={economyTone(r.kmpl, r.reliable)}>
                    {r.reliable ? "Measured" : "Low data"}
                  </StatusBadge>
                )}
              </div>
            ),
          },
          {
            key: "fuelCostPerKm",
            header: "₹ / km",
            align: "right",
            render: (r) => (
              <span className="tabular-nums">
                {r.fuelCostPerKm == null ? "—" : `₹${r.fuelCostPerKm.toFixed(2)}`}
              </span>
            ),
          },
          {
            key: "totalKm",
            header: "Distance",
            align: "right",
            render: (r) => <span className="tabular-nums">{km(r.totalKm)}</span>,
          },
          {
            key: "dieselLitres",
            header: "Diesel",
            align: "right",
            render: (r) => (
              <span className="tabular-nums">
                {Math.round(r.dieselLitres).toLocaleString("en-IN")} L
              </span>
            ),
          },
          {
            key: "tripsMissingDistance",
            header: "Unmeasured",
            align: "right",
            render: (r) =>
              r.tripsMissingDistance ? (
                <span className="text-caution-ink">
                  {r.tripsMissingDistance} trip{r.tripsMissingDistance === 1 ? "" : "s"}
                </span>
              ) : (
                <span className="text-ink-quaternary">—</span>
              ),
          },
        ]}
      />
    </div>
  );
}
