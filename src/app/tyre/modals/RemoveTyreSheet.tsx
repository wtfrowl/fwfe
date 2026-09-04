import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Sheet } from "../../../motion/Sheet";
import { spring } from "../../../motion/springs";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { InlineMessage } from "../../../components/ui/InlineMessage";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { inputClasses } from "../../../components/ui/inputStyles";
import { cn } from "../../../utils/cn";
import { dismountTyre } from "../../../api";
import type { ITyre } from "../../../types/tyre";
import { TreadMeter } from "../components/TreadMeter";
import {
  DISMOUNT_REASONS,
  type DismountReason,
  positionLabel,
  statusLabel,
  statusTone,
  treadHealth,
} from "../lib/tyre-standards";

/**
 * Taking a tyre off.
 *
 * This used to be `confirm("Are you sure?")` followed by
 * `prompt("Enter Reason (Rotation, Puncture, Retread, Scrap):", "Rotation")` —
 * two browser dialogs, a free-text field validated against an enum it never
 * showed, and no indication anywhere of what would happen to the tyre next.
 * Typing "rotation" in lower case failed the API's validator with a 400 the
 * user never saw.
 *
 * Reason is the whole decision, so reason is the whole screen: five choices,
 * each stating where the tyre lands afterwards, before it lands there.
 */

interface RemoveTyreSheetProps {
  open: boolean;
  onClose: () => void;
  onDone: (tyre: ITyre) => void;
  tyre: ITyre | null;
  /** The truck's odometer now — what the covered distance is measured against. */
  odometer?: number | null;
}

export function RemoveTyreSheet({
  open,
  onClose,
  onDone,
  tyre,
  odometer = null,
}: RemoveTyreSheetProps) {
  const [reason, setReason] = useState<DismountReason["value"]>("Spare");
  const [km, setKm] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setReason(defaultReasonFor(tyre));
    setKm(odometer != null ? String(odometer) : "");
    setNotes("");
    setError(null);
  /* Keyed on the tyre's identity, not the object: re-seeding whenever the
     parent refetches would throw away whatever is half-typed. */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tyre?._id, odometer]);

  const handleSubmit = async () => {
    if (!tyre) return;
    setSaving(true);
    setError(null);
    try {
      const response = await dismountTyre({
        tyreId: tyre._id,
        reason,
        currentKm: km === "" ? undefined : Number(km),
        notes: notes || undefined,
      });
      onDone(response.tyre);
    } catch (err) {
      const message = (err as { message?: string })?.message;
      setError(message || "Could not take that tyre off. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const chosen = DISMOUNT_REASONS.find((r) => r.value === reason)!;
  const destructive = reason === "Scrap";

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Take tyre off"
      description={
        tyre
          ? `${tyre.tyreNumber} — currently at ${positionLabel(tyre.position)}.`
          : "Remove a tyre from the vehicle."
      }
      size="md"
      /* A removal is a decision, and a sheet you can throw away by accident is
         the wrong affordance for one. */
      dismissible={false}
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant={destructive ? "danger" : "primary"}
            onClick={handleSubmit}
            loading={saving}
          >
            {destructive ? "Scrap tyre" : "Take it off"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <InlineMessage tone="error">{error}</InlineMessage>

        {tyre && (
          <div className="rounded-control border border-hairline bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{tyre.tyreNumber}</p>
                <p className="truncate text-sm text-ink-secondary">
                  {tyre.brand} {tyre.model} · {tyre.size}
                </p>
              </div>
              <StatusBadge tone={statusTone(tyre.status)}>{statusLabel(tyre.status)}</StatusBadge>
            </div>
            <TreadMeter
              className="mt-3"
              current={tyre.currentTreadDepth}
              initial={tyre.initialTreadDepth}
            />
          </div>
        )}

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-semibold text-ink-vibrant">Why is it coming off?</legend>
          {DISMOUNT_REASONS.map((option) => (
            <ReasonRow
              key={option.value}
              option={option}
              selected={option.value === reason}
              onSelect={() => setReason(option.value)}
            />
          ))}
        </fieldset>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Odometer"
            htmlFor="remove-km"
            hint="Reading now — decides the kilometres credited to this tyre"
          >
            <input
              id="remove-km"
              type="number"
              min="0"
              className={inputClasses}
              value={km}
              onChange={(e) => setKm(e.target.value)}
            />
          </FormField>

          <FormField label="Note" htmlFor="remove-notes" hint="Optional">
            <input
              id="remove-notes"
              className={inputClasses}
              placeholder="Sidewall cut on the left shoulder"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </FormField>
        </div>

        <p className="text-sm text-ink-vibrant-secondary">
          Afterwards this tyre will be{" "}
          <span className="font-semibold text-ink-vibrant">
            {statusLabel(chosen.resulting).toLowerCase()}
          </span>
          .
        </p>
      </div>
    </Sheet>
  );
}

/**
 * Default to the honest answer. A tyre at the pull point is not going back on
 * a truck, so pre-selecting "back to stock" for it invites the wrong click on
 * the one removal where the choice actually matters.
 */
function defaultReasonFor(tyre: ITyre | null): DismountReason["value"] {
  if (!tyre) return "Spare";
  const { verdict } = treadHealth(tyre.currentTreadDepth, tyre.initialTreadDepth);
  if (verdict === "illegal" || verdict === "replaceNow") return "Retread";
  return "Spare";
}

function ReasonRow({
  option,
  selected,
  onSelect,
}: {
  option: DismountReason;
  selected: boolean;
  onSelect: () => void;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      whileTap={reduced ? { opacity: 0.7 } : { scale: 0.99 }}
      transition={spring.snappy}
      className={cn(
        "flex w-full items-start gap-3 rounded-control border px-3.5 py-3 text-left",
        "transition-colors duration-150 ease-[var(--ease-out-quart)]",
        selected
          ? option.value === "Scrap"
            ? "border-critical bg-critical-soft/60"
            : "border-accent bg-accent-soft/60"
          : "border-hairline bg-surface hover:border-hairline-strong"
      )}
    >
      <span
        className={cn(
          "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border transition-colors duration-150",
          selected
            ? option.value === "Scrap"
              ? "border-critical"
              : "border-accent"
            : "border-hairline-strong"
        )}
        aria-hidden
      >
        {selected && (
          <motion.span
            className={cn(
              "block h-2 w-2 rounded-full",
              option.value === "Scrap" ? "bg-critical" : "bg-accent"
            )}
            initial={reduced ? false : { scale: 0.6 }}
            animate={{ scale: 1 }}
            transition={spring.snappy}
          />
        )}
      </span>

      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink">{option.label}</span>
        <span className="block text-xs leading-relaxed text-ink-tertiary">
          {option.description}
        </span>
      </span>
    </motion.button>
  );
}
