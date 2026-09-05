import { useState } from "react";
import { FaTriangleExclamation } from "react-icons/fa6";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { inputClasses } from "../../../components/ui/inputStyles";
import { InlineMessage } from "../../../components/ui/InlineMessage";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Sheet } from "../../../motion/Sheet";
import { reportIncident, resolveIncident } from "../../../api";

/**
 * Things that went wrong on the road.
 *
 * Detention is the one that pays for itself: a truck held twelve hours at a
 * consignee's gate is a cost the transporter can be billed for, but only if
 * somebody recorded when it started and when it ended. So an open incident
 * shows its running duration and offers a single button to close it, rather
 * than asking anyone to remember two timestamps.
 */

const TYPES = ["Delay", "Breakdown", "Accident", "Detention", "RouteChange", "Theft", "Other"];

const TONE: Record<string, "danger" | "warning" | "neutral"> = {
  Breakdown: "danger",
  Accident: "danger",
  Theft: "danger",
  Detention: "warning",
  Delay: "warning",
  RouteChange: "neutral",
  Other: "neutral",
};

interface Incident {
  _id: string;
  type: string;
  reportedAt: string;
  resolvedAt?: string;
  notes?: string;
  reportedByRole?: string;
}

/** How long an incident ran, or has been running. */
const duration = (from: string, to?: string) => {
  const minutes = Math.round(
    ((to ? new Date(to).getTime() : Date.now()) - new Date(from).getTime()) / 60000
  );
  if (minutes < 60) return `${Math.max(0, minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
};

export function IncidentPanel({
  tripId,
  incidents,
  canReport,
  onChanged,
}: {
  tripId: string;
  incidents: Incident[];
  canReport: boolean;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("Delay");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      /* The device's position is attached where the browser will give it, so
         a breakdown is pinned to a place rather than to a description of one.
         It is optional — a refused permission must not block the report. */
      const location = await new Promise<{ lat: number; lng: number } | undefined>((resolve) => {
        if (!navigator.geolocation) return resolve(undefined);
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(undefined),
          { timeout: 5000, maximumAge: 60_000 }
        );
      });

      await reportIncident(tripId, { type, notes: notes.trim() || undefined, location });
      setNotes("");
      setOpen(false);
      onChanged();
    } catch (err: any) {
      setError(err?.message ?? "Could not record that.");
    } finally {
      setBusy(false);
    }
  };

  const close = async (incidentId: string) => {
    setBusy(true);
    try {
      await resolveIncident(tripId, incidentId);
      onChanged();
    } catch (err: any) {
      setError(err?.message ?? "Could not close that incident.");
    } finally {
      setBusy(false);
    }
  };

  const openCount = incidents.filter((i) => !i.resolvedAt).length;

  return (
    <div className="rounded-card border border-hairline bg-surface p-5 shadow-[var(--shadow-raised)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">On the road</h2>
          <p className="text-sm text-ink-secondary">
            {incidents.length
              ? `${incidents.length} report${incidents.length === 1 ? "" : "s"}${
                  openCount ? ` · ${openCount} still open` : ""
                }`
              : "Delays, breakdowns and time held at a gate."}
          </p>
        </div>
        {canReport && (
          <Button variant="secondary" onClick={() => setOpen(true)}>
            <FaTriangleExclamation className="mr-2 h-3.5 w-3.5" />
            Report
          </Button>
        )}
      </div>

      {error && (
        <div className="mt-3">
          <InlineMessage tone="error">{error}</InlineMessage>
        </div>
      )}

      {incidents.length > 0 && (
        <ul className="mt-4 divide-y divide-hairline border-t border-hairline">
          {incidents.map((incident) => (
            <li key={incident._id} className="flex items-start gap-3 py-3">
              <StatusBadge tone={TONE[incident.type] ?? "neutral"}>{incident.type}</StatusBadge>

              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink">
                  {incident.notes || `${incident.type} reported`}
                </p>
                <p className="text-xs text-ink-tertiary">
                  {new Date(incident.reportedAt).toLocaleString()} ·{" "}
                  {incident.resolvedAt
                    ? `lasted ${duration(incident.reportedAt, incident.resolvedAt)}`
                    : `open for ${duration(incident.reportedAt)}`}
                </p>
              </div>

              {!incident.resolvedAt && canReport && (
                <Button variant="ghost" disabled={busy} onClick={() => close(incident._id)}>
                  Close
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Report what happened"
        description="The owner is told straight away."
        size="md"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={submit} loading={busy}>
              Report
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="What happened" htmlFor="incident-type" required>
            <select
              id="incident-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={inputClasses}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === "RouteChange" ? "Route change" : t}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Details" htmlFor="incident-notes" hint="Optional">
            <input
              id="incident-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClasses}
              placeholder="Held at the gate since 6am, no labour"
            />
          </FormField>

          {type === "Detention" && (
            <InlineMessage tone="info">
              Close this when the truck is released. The hours between are what you can bill the
              transporter for.
            </InlineMessage>
          )}

          <p className="text-xs text-ink-tertiary">
            Your location is attached if your device shares it.
          </p>
        </div>
      </Sheet>
    </div>
  );
}
