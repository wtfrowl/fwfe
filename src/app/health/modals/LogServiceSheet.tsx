import { useEffect, useState } from "react";
import { Sheet } from "../../../motion/Sheet";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { inputClasses } from "../../../components/ui/inputStyles";
import { InlineMessage } from "../../../components/ui/InlineMessage";
import { MaintenanceAPI, type MaintenanceSchedule } from "../../../api/fleetHealth.api";

/**
 * Logging a completed service.
 *
 * This is also what resets the schedule, which is why it is one form and not
 * two. Asking someone to record the work and then separately mark the
 * schedule as done guarantees that half the time only the first half happens,
 * and the truck keeps alerting as overdue for a job that was finished.
 */
export function LogServiceSheet({
  schedule,
  onClose,
  onSaved,
}: {
  schedule: MaintenanceSchedule | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [odometer, setOdometer] = useState("");
  const [servicedAt, setServicedAt] = useState("");
  const [cost, setCost] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [downtimeHours, setDowntimeHours] = useState("");
  const [notes, setNotes] = useState("");
  const [unplanned, setUnplanned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!schedule) return;
    /* Prefilled with what the system already knows, so the common case is one
       tap. The odometer is the truck's current reading — the number the
       mechanic would have copied off the dash anyway. */
    setOdometer(schedule.odometer != null ? String(schedule.odometer) : "");
    setServicedAt(new Date().toISOString().slice(0, 10));
    setCost("");
    setVendorName("");
    setDowntimeHours("");
    setNotes("");
    setUnplanned(false);
    setError(null);
  }, [schedule]);

  if (!schedule) return null;

  const reading = Number(odometer);
  const goesBackwards =
    odometer !== "" &&
    Number.isFinite(reading) &&
    schedule.lastServiceKm != null &&
    reading < schedule.lastServiceKm;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await MaintenanceAPI.logService({
        truckId: schedule.truck,
        scheduleId: schedule._id,
        task: schedule.task,
        servicedAt: servicedAt || undefined,
        odometer: odometer === "" ? undefined : Number(odometer),
        cost: cost === "" ? 0 : Number(cost),
        vendorName: vendorName.trim() || undefined,
        downtimeHours: downtimeHours === "" ? 0 : Number(downtimeHours),
        notes: notes.trim() || undefined,
        unplanned,
      });
      onSaved();
    } catch (err: any) {
      setError(err?.message ?? "Could not log that service.");
    } finally {
      setSaving(false);
    }
  };

  const nextDue =
    schedule.intervalKm && odometer !== "" && Number.isFinite(reading)
      ? reading + schedule.intervalKm
      : null;

  return (
    <Sheet
      open={Boolean(schedule)}
      onClose={onClose}
      title={`Log ${schedule.task.toLowerCase()}`}
      description={`${schedule.registrationNumber} — this resets the schedule from the reading you enter.`}
      size="md"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Log service
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <InlineMessage tone="error">{error}</InlineMessage>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Date" htmlFor="svc-date" required>
            <input
              id="svc-date"
              type="date"
              value={servicedAt}
              onChange={(e) => setServicedAt(e.target.value)}
              className={inputClasses}
            />
          </FormField>

          <FormField
            label="Odometer"
            htmlFor="svc-odo"
            hint={
              schedule.lastServiceKm != null
                ? `Last done at ${schedule.lastServiceKm.toLocaleString("en-IN")} km`
                : "Current reading"
            }
          >
            <input
              id="svc-odo"
              type="number"
              min="0"
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
              className={inputClasses}
            />
          </FormField>
        </div>

        {/* A reading that goes backwards would move the next due point behind
            the truck and re-flag it immediately. The server ignores it; saying
            so here is cheaper than letting someone wonder why nothing changed. */}
        {goesBackwards && (
          <InlineMessage tone="warning">
            That is below the last service reading of{" "}
            {schedule.lastServiceKm?.toLocaleString("en-IN")} km, so the schedule's distance
            baseline will not move.
          </InlineMessage>
        )}

        {nextDue && !goesBackwards && (
          <p className="text-sm text-ink-secondary">
            Next due at{" "}
            <span className="font-semibold tabular-nums text-ink">
              {nextDue.toLocaleString("en-IN")} km
            </span>
            .
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Cost" htmlFor="svc-cost" hint="Parts and labour, ₹">
            <input
              id="svc-cost"
              type="number"
              min="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className={inputClasses}
              placeholder="0"
            />
          </FormField>

          {/* The bill is only half of what a service costs; the other half is
              the load the truck could not carry. */}
          <FormField label="Downtime" htmlFor="svc-downtime" hint="Hours off the road">
            <input
              id="svc-downtime"
              type="number"
              min="0"
              step="0.5"
              value={downtimeHours}
              onChange={(e) => setDowntimeHours(e.target.value)}
              className={inputClasses}
              placeholder="0"
            />
          </FormField>
        </div>

        <FormField label="Workshop" htmlFor="svc-vendor" hint="Optional">
          <input
            id="svc-vendor"
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
            className={inputClasses}
          />
        </FormField>

        <FormField label="Notes" htmlFor="svc-notes" hint="Optional">
          <input
            id="svc-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={inputClasses}
          />
        </FormField>

        {/* Planned versus unplanned is the number that says whether a
            maintenance programme is working at all. */}
        <label className="flex items-center gap-2.5 text-sm text-ink-secondary">
          <input
            type="checkbox"
            checked={unplanned}
            onChange={(e) => setUnplanned(e.target.checked)}
            className="h-4 w-4 rounded border-hairline-strong"
          />
          This was a breakdown, not planned work
        </label>
      </div>
    </Sheet>
  );
}
