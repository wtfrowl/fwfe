import type { CurrentTrip } from "../types/truck";
import { StatusBadge } from "../../../../components/ui/StatusBadge";

interface CurrentTripCardProps {
  trip: CurrentTrip;
}

const Detail = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <dt className="text-caption text-sm text-ink-secondary">{label}</dt>
    <dd className="mt-0.5 font-medium text-ink">{value || "—"}</dd>
  </div>
);

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  /* The old card printed the raw ISO string straight from the API. */
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      });
};

export function CurrentTripCard({ trip }: CurrentTripCardProps) {
  if (!trip) {
    return (
      <div className="flex h-40 items-center justify-center rounded-card border border-hairline bg-surface text-sm text-ink-tertiary shadow-[var(--shadow-raised)]">
        No trip running right now
      </div>
    );
  }

  return (
    <div className="rounded-card border border-hairline bg-surface p-5 shadow-[var(--shadow-raised)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">Current trip</h2>
          <p className="text-sm text-ink-tertiary">{trip.id}</p>
        </div>
        {trip.status ? <StatusBadge tone="success">{trip.status}</StatusBadge> : null}
      </div>

      {/* The route is the headline of this card, so it reads as one line
          rather than as two equally-weighted "Departure"/"Arrival" fields. */}
      <p className="mt-4 text-lg font-semibold text-ink">
        {trip.departureLocation} → {trip.arrivalLocation}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-hairline pt-4">
        <Detail label="Driver" value={trip.driverContactNumber} />
        <Detail label="Speed" value={trip.speed !== undefined ? `${trip.speed} km/h` : "—"} />
        <Detail label="Started" value={formatDateTime(trip.departureDateTime)} />
      </dl>
    </div>
  );
}
