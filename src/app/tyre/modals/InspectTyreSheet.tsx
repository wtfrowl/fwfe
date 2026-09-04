import { useEffect, useMemo, useState } from "react";
import { Sheet } from "../../../motion/Sheet";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { InlineMessage } from "../../../components/ui/InlineMessage";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { inputClasses } from "../../../components/ui/inputStyles";
import { cn } from "../../../utils/cn";
import { inspectTyre } from "../../../api";
import type { ITyre } from "../../../types/tyre";
import { TreadMeter } from "../components/TreadMeter";
import { TREAD, positionLabel, treadHealth } from "../lib/tyre-standards";

/**
 * Logging a tread measurement.
 *
 * The reading itself was already possible — as an inline field that only
 * appeared on hover, over a pencil icon, on a card that gave no indication it
 * was editable. Anyone on a touch screen could not reach it at all.
 *
 * Making it an explicit action costs one tap and buys three things: a visible
 * affordance, room for the note that explains an unusual reading, and a
 * preview of what the new depth means before it is committed — which is the
 * whole point of measuring.
 */

interface Props {
  open: boolean;
  onClose: () => void;
  tyre: ITyre | null;
  onDone: (tyre: ITyre) => void;
}

export function InspectTyreSheet({ open, onClose, tyre, onDone }: Props) {
  const [depth, setDepth] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !tyre) return;
    setDepth(String(tyre.currentTreadDepth));
    setNotes("");
    setError(null);
  /* Keyed on the tyre's identity, not the object: re-seeding whenever the
     parent refetches would throw away whatever is half-typed. */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tyre?._id, tyre?.currentTreadDepth]);

  const value = Number(depth);
  const valid = depth !== "" && Number.isFinite(value) && value > 0;

  const preview = useMemo(
    () => (tyre && valid ? treadHealth(value, tyre.initialTreadDepth) : null),
    [tyre, valid, value]
  );

  /* Tread does not grow back. Catching it here means the user finds out while
     the gauge is still in their hand, rather than through a 400 from the API. */
  const deeperThanNew = Boolean(tyre && valid && value > tyre.initialTreadDepth);
  const grew = Boolean(tyre && valid && value > tyre.currentTreadDepth && !deeperThanNew);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tyre || !valid || deeperThanNew) return;

    setSaving(true);
    setError(null);
    try {
      const updated = await inspectTyre(tyre._id, {
        currentTreadDepth: value,
        notes: notes || undefined,
      });
      onDone(updated);
    } catch (err) {
      const message = (err as { message?: string })?.message;
      setError(message || "Could not save that reading. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Log inspection"
      description={
        tyre
          ? `${tyre.tyreNumber} — measured at ${positionLabel(tyre.position)}.`
          : "Record a tread measurement."
      }
      size="md"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            form="inspect-tyre-form"
            type="submit"
            loading={saving}
            disabled={!valid || deeperThanNew}
          >
            Save reading
          </Button>
        </div>
      }
    >
      <form id="inspect-tyre-form" onSubmit={handleSubmit} className="space-y-5">
        <InlineMessage tone="error">{error}</InlineMessage>

        {tyre && (
          <div className="rounded-control border border-hairline bg-canvas-sunken/50 p-4">
            <p className="text-xs font-semibold tracking-wide text-ink-tertiary uppercase">
              Last reading
            </p>
            <TreadMeter
              className="mt-2"
              current={tyre.currentTreadDepth}
              initial={tyre.initialTreadDepth}
            />
          </div>
        )}

        <FormField
          label="Tread depth now"
          htmlFor="inspect-depth"
          required
          hint={`Shallowest groove, in millimetres. Legal minimum is ${TREAD.legalMin} mm.`}
          error={
            deeperThanNew && tyre
              ? `Deeper than the tyre was new (${tyre.initialTreadDepth} mm). Check the gauge.`
              : grew
                ? "That is deeper than the last reading. Worth double-checking before saving."
                : undefined
          }
        >
          <input
            id="inspect-depth"
            type="number"
            min="0.5"
            max="30"
            step="0.5"
            autoFocus
            required
            className={cn(inputClasses, "text-lg font-semibold tabular-nums")}
            value={depth}
            onChange={(e) => setDepth(e.target.value)}
          />
        </FormField>

        {preview && tyre && (
          <div className="rounded-control border border-hairline bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ink">After this reading</p>
              <StatusBadge tone={preview.tone}>{preview.label}</StatusBadge>
            </div>
            <TreadMeter className="mt-3" current={value} initial={tyre.initialTreadDepth} />
            {preview.verdict === "illegal" || preview.verdict === "replaceNow" ? (
              <p className="mt-2 text-xs leading-relaxed text-critical-ink">
                Below the {TREAD.pullPoint} mm pull point — take it off while the casing is still
                worth retreading.
              </p>
            ) : null}
          </div>
        )}

        <FormField label="Note" htmlFor="inspect-notes" hint="Optional">
          <input
            id="inspect-notes"
            className={inputClasses}
            placeholder="Uneven wear on the inner shoulder"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </FormField>
      </form>
    </Sheet>
  );
}
