import { useState } from "react";
import { FaPlus } from "react-icons/fa6";
import { DataTable } from "../../../reuse/DataTable/DataTable";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Button } from "../../../components/ui/Button";
import type { MaintenanceSchedule } from "../../../api/fleetHealth.api";
import { AddScheduleSheet } from "../modals/AddScheduleSheet";
import { LogServiceSheet } from "../modals/LogServiceSheet";

/**
 * Standing service rules and how close each is to falling due.
 *
 * The state comes from the server rather than being recomputed here, on
 * purpose: the same calculation drives the notification that tells an owner a
 * service is due, and a list that disagreed with the alert that prompted them
 * to open it would make both untrustworthy.
 */

const TONE = {
  overdue: "danger",
  due: "danger",
  "due-soon": "warning",
  ok: "success",
  unknown: "neutral",
} as const;

const LABEL = {
  overdue: "Overdue",
  due: "Due now",
  "due-soon": "Due soon",
  ok: "OK",
  unknown: "No baseline",
} as const;

/** The remaining budget, in whichever measures the schedule actually uses. */
const remaining = (s: MaintenanceSchedule) => {
  const parts: string[] = [];

  if (s.due.kmRemaining !== null) {
    const km = Math.round(s.due.kmRemaining);
    parts.push(
      km < 0
        ? `${Math.abs(km).toLocaleString("en-IN")} km over`
        : `${km.toLocaleString("en-IN")} km`
    );
  }

  if (s.due.daysRemaining !== null) {
    const d = s.due.daysRemaining;
    parts.push(d < 0 ? `${Math.abs(d)} days over` : `${d} days`);
  }

  /* A km-based schedule on a truck with no odometer reading cannot be
     evaluated at all. Saying so points at the fix; a blank cell does not. */
  if (!parts.length) return s.intervalKm ? "Odometer not set" : "No baseline";

  return parts.join(" · ");
};

const interval = (s: MaintenanceSchedule) =>
  [
    s.intervalKm ? `${s.intervalKm.toLocaleString("en-IN")} km` : null,
    s.intervalDays ? `${s.intervalDays} days` : null,
  ]
    .filter(Boolean)
    .join(" / ");

export function ServiceSchedulePanel({
  schedules,
  trucks,
  onChanged,
}: {
  schedules: MaintenanceSchedule[];
  trucks: { _id: string; registrationNumber: string; totalKm?: number }[];
  onChanged: () => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [logFor, setLogFor] = useState<MaintenanceSchedule | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setAddOpen(true)}>
          <FaPlus className="mr-2 h-3 w-3" />
          Add schedule
        </Button>
      </div>

      <DataTable<MaintenanceSchedule>
        title="Service schedules"
        subtitle="Standing rules per truck. Logging a service resets its clock."
        data={schedules}
        emptyMessage="No service schedules yet. Add one to start getting alerts before a service falls due."
        columns={[
          {
            key: "registrationNumber",
            header: "Truck",
            render: (s) => <span className="font-medium text-ink">{s.registrationNumber}</span>,
          },
          {
            key: "task",
            header: "Job",
            render: (s) => (
              <div>
                <div className="font-medium text-ink">{s.task}</div>
                {s.label && <div className="text-xs text-ink-tertiary">{s.label}</div>}
              </div>
            ),
          },
          {
            key: "intervalKm",
            header: "Every",
            render: (s) => <span className="text-ink-secondary">{interval(s)}</span>,
          },
          {
            key: "lastServiceKm",
            header: "Last done",
            render: (s) => (
              <span className="text-ink-secondary">
                {s.lastServiceDate ? new Date(s.lastServiceDate).toLocaleDateString() : "—"}
                {s.lastServiceKm != null && (
                  <span className="text-ink-tertiary">
                    {" "}
                    · {s.lastServiceKm.toLocaleString("en-IN")} km
                  </span>
                )}
              </span>
            ),
          },
          {
            key: "due",
            header: "Remaining",
            align: "right",
            render: (s) => <span className="tabular-nums text-ink">{remaining(s)}</span>,
          },
          {
            key: "urgency",
            header: "Status",
            align: "right",
            render: (s) => <StatusBadge tone={TONE[s.due.state]}>{LABEL[s.due.state]}</StatusBadge>,
          },
          {
            key: "active",
            header: "",
            align: "right",
            render: (s) => (
              <Button variant="secondary" onClick={() => setLogFor(s)}>
                Log service
              </Button>
            ),
          },
        ]}
      />

      <AddScheduleSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        trucks={trucks}
        onSaved={() => {
          setAddOpen(false);
          onChanged();
        }}
      />

      <LogServiceSheet
        schedule={logFor}
        onClose={() => setLogFor(null)}
        onSaved={() => {
          setLogFor(null);
          onChanged();
        }}
      />
    </div>
  );
}
