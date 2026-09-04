import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { FaSearch } from "react-icons/fa";
import { Sheet } from "../../../motion/Sheet";
import { ease, spring } from "../../../motion/springs";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { InlineMessage } from "../../../components/ui/InlineMessage";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { inputClasses } from "../../../components/ui/inputStyles";
import { cn } from "../../../utils/cn";
import { mountTyre, moveTyre } from "../../../api";
import type { ITyre } from "../../../types/tyre";
import { AxleDiagram } from "../components/AxleDiagram";
import { TreadMeter } from "../components/TreadMeter";
import {
  type WheelPosition,
  fitmentWarning,
  inferLayoutId,
  layoutById,
  layoutLabel,
  parsePosition,
  positionCode,
  refId,
  treadHealth,
} from "../lib/tyre-standards";

/**
 * Putting a tyre on a hub — whether it comes from the stockroom or off another
 * hub — is one action, so it is one sheet.
 *
 * The old flow split it in two and made both worse: mounting was a dropdown of
 * seven prose positions that had no idea which hubs were taken, and moving did
 * not exist at all. To rotate a tyre you dismounted it (`confirm()`), typed a
 * reason into a `prompt()`, then went and mounted it again — three dialogs,
 * two API calls, and a window in the middle where the tyre belonged nowhere.
 */

export interface FitTruck {
  _id: string;
  registrationNumber: string;
  axleLayout?: string | null;
  /** Odometer, used to date the fitment and to accrue kilometres on removal. */
  totalKm?: number | null;
}

interface FitTyreSheetProps {
  open: boolean;
  onClose: () => void;
  /** Fires with the updated tyre once the server has confirmed it. */
  onDone: (tyre: ITyre) => void;

  /** Every tyre the owner has — used for stock and for hub occupancy. */
  tyres: ITyre[];
  /** The truck being worked on, and any others a tyre can be moved to. */
  truck: FitTruck;
  otherTrucks?: FitTruck[];

  /**
   * The tyre already chosen. Set when the user tapped a fitted tyre and asked
   * to move it; left empty when they tapped an empty hub.
   */
  subject?: ITyre | null;
  /** The hub they tapped, if any. */
  initialPosition?: string | null;
}

export function FitTyreSheet({
  open,
  onClose,
  onDone,
  tyres,
  truck,
  otherTrucks = [],
  subject = null,
  initialPosition = null,
}: FitTyreSheetProps) {
  const reduced = useReducedMotion();

  const [tyreId, setTyreId] = useState<string | null>(subject?._id ?? null);
  const [truckId, setTruckId] = useState<string>(truck._id);
  const [position, setPosition] = useState<string | null>(positionCode(initialPosition));
  const [odometer, setOdometer] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Re-seed from the props each time the sheet is opened. Keeping stale state
     between openings is how a user ends up fitting to the hub they picked
     three minutes ago. */
  useEffect(() => {
    if (!open) return;
    setTyreId(subject?._id ?? null);
    setTruckId(truck._id);
    setPosition(positionCode(initialPosition));
    setOdometer(truck.totalKm != null ? String(truck.totalKm) : "");
    setNotes("");
    setQuery("");
    setError(null);
  }, [open, subject?._id, truck._id, truck.totalKm, initialPosition]);

  const allTrucks = useMemo(
    () => [truck, ...otherTrucks.filter((t) => t._id !== truck._id)],
    [truck, otherTrucks]
  );

  const destination = allTrucks.find((t) => t._id === truckId) ?? truck;

  const chosen = useMemo(
    () => tyres.find((t) => t._id === tyreId) ?? null,
    [tyres, tyreId]
  );

  /* A fitted tyre is being moved; an unfitted one is being mounted. The verb
     changes, the mechanics change, but the user does the same two things. */
  const isMove = chosen?.status === "Mounted";

  const onDestination = useMemo(
    () => tyres.filter((t) => t.status === "Mounted" && refId(t.currentTruckId) === destination._id),
    [tyres, destination._id]
  );

  const layout = useMemo(() => {
    const id = destination.axleLayout || inferLayoutId(onDestination.length);
    return layoutById(id);
  }, [destination.axleLayout, onDestination.length]);

  /** Stock, most-worn last, so the tyre you should fit first is on top. */
  const stock = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tyres
      .filter((t) => t.status === "Spare")
      .filter(
        (t) =>
          !q ||
          t.tyreNumber.toLowerCase().includes(q) ||
          t.brand?.toLowerCase().includes(q) ||
          t.size?.toLowerCase().includes(q)
      )
      .sort((a, b) => b.currentTreadDepth - a.currentTreadDepth);
  }, [tyres, query]);

  const parsedPosition = parsePosition(position);

  /* The hub the tyre is on now is not a destination, and neither is a hub
     with something else already on it. */
  const occupied = useMemo(
    () =>
      onDestination
        .filter((t) => t._id !== chosen?._id)
        .map((t) => positionCode(t.position))
        .filter((c): c is string => Boolean(c)),
    [onDestination, chosen?._id]
  );

  const ownPosition =
    isMove && refId(chosen?.currentTruckId) === destination._id
      ? positionCode(chosen?.position)
      : null;

  const disabledSlots = useMemo(
    () => [...occupied, ...(ownPosition ? [ownPosition] : [])],
    [occupied, ownPosition]
  );

  const warning = fitmentWarning(chosen?.axleApplication, parsedPosition);

  const canSubmit = Boolean(chosen && position) && !saving;

  const handleSelectSlot = (slot: WheelPosition) => {
    if (disabledSlots.includes(slot.code)) return;
    setPosition(slot.code);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!chosen || !position) return;
    setSaving(true);
    setError(null);

    const km = odometer === "" ? undefined : Number(odometer);

    try {
      const response = isMove
        ? await moveTyre({
            tyreId: chosen._id,
            truckId: destination._id,
            position,
            currentKm: km,
            notes: notes || undefined,
          })
        : await mountTyre({
            tyreId: chosen._id,
            truckId: destination._id,
            position,
            currentKm: km,
            notes: notes || undefined,
          });

      onDone(response.tyre);
    } catch (err) {
      const message = (err as { message?: string })?.message;
      setError(message || "Could not fit that tyre. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const title = isMove ? "Move tyre" : "Fit a tyre";
  const description = isMove
    ? "Rotate it to another hub, or send it to a different truck. It stays fitted the whole way."
    : "Choose a tyre from stock, then tap the hub it goes on.";

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="xl"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-vibrant-secondary">
            {chosen && parsedPosition ? (
              <>
                <span className="font-semibold text-ink-vibrant">{chosen.tyreNumber}</span>
                {" → "}
                {parsedPosition.label} on {destination.registrationNumber}
              </>
            ) : !chosen ? (
              "Pick a tyre to fit."
            ) : (
              "Now tap a hub on the diagram."
            )}
          </p>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit} loading={saving}>
              {isMove ? "Move tyre" : "Fit tyre"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <InlineMessage tone="error">{error}</InlineMessage>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto]">
          {/* ---------- 1. The tyre ---------- */}
          <div className="space-y-3">
            <SectionLabel step={1}>{isMove ? "Tyre being moved" : "Tyre from stock"}</SectionLabel>

            {isMove && chosen ? (
              <ChosenTyreCard tyre={chosen} onClear={subject ? undefined : () => setTyreId(null)} />
            ) : (
              <>
                <div className="relative">
                  <FaSearch
                    className="pointer-events-none absolute top-1/2 left-3.5 h-3.5 w-3.5 -translate-y-1/2 text-ink-quaternary"
                    aria-hidden
                  />
                  <input
                    className={cn(inputClasses, "pl-9")}
                    placeholder="Search stock by number, brand or size"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search tyres in stock"
                  />
                </div>

                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {stock.length === 0 ? (
                    <p className="rounded-control border border-dashed border-hairline-strong bg-canvas-sunken/60 px-4 py-6 text-center text-sm text-ink-tertiary">
                      {query
                        ? "No tyre in stock matches that."
                        : "Nothing in stock. Add tyres to your inventory first."}
                    </p>
                  ) : (
                    stock.map((tyre) => (
                      <StockRow
                        key={tyre._id}
                        tyre={tyre}
                        selected={tyre._id === tyreId}
                        onSelect={() => {
                          setTyreId(tyre._id);
                          setError(null);
                        }}
                      />
                    ))
                  )}
                </div>
              </>
            )}

            {/* ---------- 3. The paperwork ---------- */}
            <div className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2">
              <FormField
                label="Odometer"
                htmlFor="fit-km"
                hint="Reading now — this is what dates the fitment"
              >
                <input
                  id="fit-km"
                  type="number"
                  min="0"
                  className={inputClasses}
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                />
              </FormField>

              <FormField label="Note" htmlFor="fit-notes" hint="Optional">
                <input
                  id="fit-notes"
                  className={inputClasses}
                  placeholder={isMove ? "Rotated to even out wear" : "New fitment"}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </FormField>
            </div>
          </div>

          {/* ---------- 2. The hub ---------- */}
          <div className="space-y-3 lg:w-[22rem]">
            <SectionLabel step={2}>Where it goes</SectionLabel>

            {allTrucks.length > 1 && (
              <FormField label="Truck" htmlFor="fit-truck">
                <select
                  id="fit-truck"
                  className={inputClasses}
                  value={truckId}
                  onChange={(e) => {
                    setTruckId(e.target.value);
                    setPosition(null);
                  }}
                >
                  {allTrucks.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.registrationNumber} · {layoutLabel(t.axleLayout)}
                      {t._id === truck._id ? " (this truck)" : ""}
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            <div className="rounded-card border border-hairline bg-canvas-sunken/50 p-4">
              <AxleDiagram
                layout={layout}
                tyres={onDestination}
                selected={position}
                onSelect={handleSelectSlot}
                disabled={disabledSlots}
                movingTyreId={isMove ? chosen?._id : null}
              />
            </div>

            <p className="text-xs leading-relaxed text-ink-tertiary">
              {layout.label} · {layout.drive}. Filled hubs cannot be chosen — take that tyre off
              first, or move it somewhere else.
            </p>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {warning && (
            <motion.div
              key="fitment"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={ease.enter}
            >
              <InlineMessage tone="warning">{warning}</InlineMessage>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Sheet>
  );
}

function SectionLabel({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-5 w-5 place-items-center rounded-full bg-ink/8 text-[0.625rem] font-bold text-ink-secondary tabular-nums">
        {step}
      </span>
      <span className="text-caption text-xs font-semibold tracking-wide text-ink-vibrant-secondary uppercase">
        {children}
      </span>
    </div>
  );
}

function ChosenTyreCard({ tyre, onClear }: { tyre: ITyre; onClear?: () => void }) {
  return (
    <div className="rounded-control border border-hairline bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{tyre.tyreNumber}</p>
          <p className="truncate text-sm text-ink-secondary">
            {tyre.brand} {tyre.model} · {tyre.size}
          </p>
        </div>
        {onClear ? (
          <Button variant="ghost" size="sm" onClick={onClear}>
            Change
          </Button>
        ) : null}
      </div>
      <TreadMeter
        className="mt-3"
        current={tyre.currentTreadDepth}
        initial={tyre.initialTreadDepth}
      />
    </div>
  );
}

function StockRow({
  tyre,
  selected,
  onSelect,
}: {
  tyre: ITyre;
  selected: boolean;
  onSelect: () => void;
}) {
  const reduced = useReducedMotion();
  const health = treadHealth(tyre.currentTreadDepth, tyre.initialTreadDepth);

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      whileTap={reduced ? { opacity: 0.7 } : { scale: 0.99 }}
      transition={spring.snappy}
      className={cn(
        "flex w-full items-center gap-3 rounded-control border px-3.5 py-3 text-left",
        "transition-colors duration-150 ease-[var(--ease-out-quart)]",
        selected
          ? "border-accent bg-accent-soft/60"
          : "border-hairline bg-surface hover:border-hairline-strong"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-ink">{tyre.tyreNumber}</span>
          {tyre.axleApplication && tyre.axleApplication !== "All" ? (
            <StatusBadge tone="neutral">{tyre.axleApplication}</StatusBadge>
          ) : null}
        </div>
        <p className="truncate text-xs text-ink-tertiary">
          {tyre.brand} {tyre.model} · {tyre.size}
        </p>
      </div>

      <div className="w-24 shrink-0">
        <TreadMeter
          current={tyre.currentTreadDepth}
          initial={tyre.initialTreadDepth}
          size="sm"
          showLabel={false}
        />
        <p className={cn("mt-1 text-right text-xs font-semibold tabular-nums", health.textClass)}>
          {tyre.currentTreadDepth} mm
        </p>
      </div>
    </motion.button>
  );
}
