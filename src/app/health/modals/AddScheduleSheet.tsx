import { useEffect, useState } from "react";
import { Sheet } from "../../../motion/Sheet";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { inputClasses } from "../../../components/ui/inputStyles";
import { InlineMessage } from "../../../components/ui/InlineMessage";
import { MaintenanceAPI } from "../../../api/fleetHealth.api";

/**
 * Creating a standing service rule.
 *
 * The only genuinely awkward decision here is the baseline — "when was this
 * last done?" — because a fleet setting up schedules for the first time is
 * being asked about work that happened before the software existed. Left
 * blank it defaults to the truck's current odometer and today, which is the
 * assumption "treat it as freshly serviced". That is optimistic, and stated
 * as such in the form, because the alternative (defaulting to zero) would
 * flag the entire fleet as catastrophically overdue on day one and teach the
 * owner to ignore the alerts before they ever mean anything.
 */

/* Sensible starting points for an Indian long-haul truck, so the form is a
   confirmation rather than a research task. All editable. */
const PRESETS: Record<string, { km?: number; days?: number }> = {
  "Engine oil": { km: 15000, days: 180 },
  "Oil filter": { km: 15000 },
  "Air filter": { km: 20000 },
  "Fuel filter": { km: 20000 },
  Greasing: { km: 5000 },
  "Brake service": { km: 30000, days: 365 },
  Clutch: { km: 60000 },
  Suspension: { km: 40000 },
  "Gearbox oil": { km: 60000 },
  "Differential oil": { km: 60000 },
  Coolant: { days: 365 },
  Battery: { days: 730 },
  Electrical: { days: 365 },
  "Body work": { days: 365 },
  "Tyre rotation": { km: 20000 },
  "Wheel alignment": { km: 25000 },
  "General service": { km: 20000, days: 180 },
  Other: {},
};

export function AddScheduleSheet({
  open,
  onClose,
  trucks,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  trucks: { _id: string; registrationNumber: string; totalKm?: number }[];
  onSaved: () => void;
}) {
  const [tasks, setTasks] = useState<string[]>(Object.keys(PRESETS));
  const [truckId, setTruckId] = useState("");
  const [task, setTask] = useState("Engine oil");
  const [label, setLabel] = useState("");
  const [intervalKm, setIntervalKm] = useState("15000");
  const [intervalDays, setIntervalDays] = useState("180");
  const [lastServiceKm, setLastServiceKm] = useState("");
  const [lastServiceDate, setLastServiceDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    MaintenanceAPI.getTasks()
      .then((r) => setTasks(r.tasks))
      .catch(() => undefined);
  }, [open]);

  useEffect(() => {
    if (!truckId && trucks.length) setTruckId(trucks[0]._id);
  }, [trucks, truckId]);

  /* Changing the job re-seeds the intervals. Deliberately overwrites rather
     than preserving what was typed: the intervals belong to the job, and a
     15,000 km figure left over from an oil change on a battery replacement is
     a wrong number that looks deliberate. */
  const handleTaskChange = (next: string) => {
    setTask(next);
    const preset = PRESETS[next] ?? {};
    setIntervalKm(preset.km ? String(preset.km) : "");
    setIntervalDays(preset.days ? String(preset.days) : "");
  };

  const selectedTruck = trucks.find((t) => t._id === truckId);

  const handleSave = async () => {
    setError(null);

    if (!intervalKm && !intervalDays) {
      setError("Give a distance interval, a time interval, or both.");
      return;
    }

    setSaving(true);
    try {
      await MaintenanceAPI.createSchedule({
        truckId,
        task,
        label: label.trim() || undefined,
        intervalKm: intervalKm ? Number(intervalKm) : undefined,
        intervalDays: intervalDays ? Number(intervalDays) : undefined,
        lastServiceKm: lastServiceKm ? Number(lastServiceKm) : undefined,
        lastServiceDate: lastServiceDate || undefined,
      });
      onSaved();
      setLabel("");
    } catch (err: any) {
      setError(err?.message ?? "Could not create the schedule.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add service schedule"
      description="A standing rule for one job on one truck. You will be alerted before it falls due."
      size="md"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving} disabled={!truckId}>
            Add schedule
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <InlineMessage tone="error">{error}</InlineMessage>

        <FormField label="Truck" htmlFor="sched-truck" required>
          <select
            id="sched-truck"
            value={truckId}
            onChange={(e) => setTruckId(e.target.value)}
            className={inputClasses}
          >
            {trucks.map((t) => (
              <option key={t._id} value={t._id}>
                {t.registrationNumber}
                {t.totalKm != null ? ` — ${t.totalKm.toLocaleString("en-IN")} km` : ""}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Job" htmlFor="sched-task" required>
          <select
            id="sched-task"
            value={task}
            onChange={(e) => handleTaskChange(e.target.value)}
            className={inputClasses}
          >
            {tasks.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Note" htmlFor="sched-label" hint="Optional — e.g. front axle only">
          <input
            id="sched-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className={inputClasses}
            placeholder=""
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Every" htmlFor="sched-km" hint="Kilometres">
            <input
              id="sched-km"
              type="number"
              min="0"
              value={intervalKm}
              onChange={(e) => setIntervalKm(e.target.value)}
              className={inputClasses}
              placeholder="15000"
            />
          </FormField>

          <FormField label="Or every" htmlFor="sched-days" hint="Days">
            <input
              id="sched-days"
              type="number"
              min="0"
              value={intervalDays}
              onChange={(e) => setIntervalDays(e.target.value)}
              className={inputClasses}
              placeholder="180"
            />
          </FormField>
        </div>

        {/* Whichever comes first, spelled out — the alternative reading (the
            later of the two) is the one that lets a service be skipped
            indefinitely on a truck that is not running much. */}
        {intervalKm && intervalDays ? (
          <p className="text-xs text-ink-tertiary">
            Due at whichever comes first: {Number(intervalKm).toLocaleString("en-IN")} km or{" "}
            {intervalDays} days.
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Last done at"
            htmlFor="sched-last-km"
            hint={
              selectedTruck?.totalKm != null
                ? `Blank = now (${selectedTruck.totalKm.toLocaleString("en-IN")} km)`
                : "Blank = now"
            }
          >
            <input
              id="sched-last-km"
              type="number"
              min="0"
              value={lastServiceKm}
              onChange={(e) => setLastServiceKm(e.target.value)}
              className={inputClasses}
              placeholder={selectedTruck?.totalKm != null ? String(selectedTruck.totalKm) : "0"}
            />
          </FormField>

          <FormField label="Last done on" htmlFor="sched-last-date" hint="Blank = today">
            <input
              id="sched-last-date"
              type="date"
              value={lastServiceDate}
              onChange={(e) => setLastServiceDate(e.target.value)}
              className={inputClasses}
            />
          </FormField>
        </div>

        <p className="text-xs text-ink-tertiary">
          Left blank, this assumes the job was just done. If you know when it actually was, enter it
          — the first alert will be accurate instead of a full interval late.
        </p>
      </div>
    </Sheet>
  );
}
