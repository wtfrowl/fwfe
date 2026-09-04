import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { FaMinus, FaPlus } from "react-icons/fa";
import { addTyre, addTyresBatch } from "../../../api";
import { Sheet } from "../../../motion/Sheet";
import { spring } from "../../../motion/springs";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { InlineMessage } from "../../../components/ui/InlineMessage";
import { inputClasses } from "../../../components/ui/inputStyles";
import { cn } from "../../../utils/cn";
import type { ICreateTyrePayload } from "../../../types/tyre";
import {
  AXLE_APPLICATIONS,
  type AxleApplication,
  COMMON_BRANDS,
  COMMON_SIZES,
  formatCurrency,
  serialRun,
  suggestedInitialTread,
} from "../lib/tyre-standards";

/**
 * Adding tyres.
 *
 * Nobody buys one tyre. They buy a set of six, and their serial numbers run
 * consecutively — so the old form, which took one tyre at a time and made you
 * hand-type every serial, was six openings and six chances to transpose a
 * digit into a number that then never matched the sidewall.
 *
 * Here the shared facts are entered once, the serials are generated from the
 * first one and stay editable, and the whole set posts in a single request.
 * Sizes and brands come from a catalogue so the inventory does not end up with
 * "MRF", "M.R.F" and "mrf" as three different manufacturers.
 */

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onTyreAdded: () => void;
}

const MAX_BATCH = 12;

const EMPTY = {
  firstSerial: "",
  brand: "",
  model: "",
  size: "",
  axleApplication: "All" as AxleApplication,
  purchasePrice: "",
  vendorName: "",
  initialTreadDepth: "",
  purchaseDate: new Date().toISOString().slice(0, 10),
};

export function AddTyreModal({ isOpen, onClose, onTyreAdded }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [count, setCount] = useState(1);
  const [serials, setSerials] = useState<string[]>([""]);
  /* Once someone edits a serial by hand we stop overwriting the column —
     regenerating over a correction is the fastest way to lose their work. */
  const [serialsTouched, setSerialsTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (!isOpen) return;
    setForm(EMPTY);
    setCount(1);
    setSerials([""]);
    setSerialsTouched(false);
    setError(null);
    setNotice(null);
  }, [isOpen]);

  /* Serials follow the first one and the count until they are edited. */
  useEffect(() => {
    if (serialsTouched) {
      setSerials((prev) => {
        const next = prev.slice(0, count);
        while (next.length < count) next.push("");
        return next;
      });
      return;
    }
    setSerials(serialRun(form.firstSerial, count));
  }, [form.firstSerial, count, serialsTouched]);

  /* A new tyre's depth is a property of its size, so offer the standard
     figure rather than leaving a required field blank for someone to guess. */
  const suggestedTread = useMemo(() => suggestedInitialTread(form.size), [form.size]);

  useEffect(() => {
    if (suggestedTread != null && form.initialTreadDepth === "") {
      set("initialTreadDepth", String(suggestedTread));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestedTread]);

  const price = Number(form.purchasePrice) || 0;
  const total = price * count;

  const filledSerials = serials.map((s) => s.trim()).filter(Boolean);
  const duplicate = filledSerials.find((s, i) => filledSerials.indexOf(s) !== i);

  const canSubmit =
    filledSerials.length === count &&
    !duplicate &&
    form.brand.trim() !== "" &&
    form.size.trim() !== "" &&
    Number(form.initialTreadDepth) > 0 &&
    price > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);
    setNotice(null);

    const base = {
      brand: form.brand.trim(),
      model: form.model.trim() || undefined,
      size: form.size.trim(),
      axleApplication: form.axleApplication,
      purchaseDate: new Date(form.purchaseDate).toISOString(),
      purchasePrice: price,
      vendorName: form.vendorName.trim() || undefined,
      initialTreadDepth: Number(form.initialTreadDepth),
    };

    const payload: ICreateTyrePayload[] = filledSerials.map((tyreNumber) => ({
      ...base,
      tyreNumber: tyreNumber.toUpperCase(),
    }));

    try {
      if (payload.length === 1) {
        await addTyre(payload[0]);
      } else {
        const result = await addTyresBatch(payload);
        if (result.skipped?.length) {
          /* Partial success is still success for the eight that landed. Say
             which ones did not, rather than reporting the whole set failed. */
          setNotice(
            `${result.created.length} added. Already on file: ${result.skipped
              .map((s) => s.tyreNumber)
              .join(", ")}.`
          );
        }
      }
      onTyreAdded();
    } catch (err) {
      const message = (err as { message?: string })?.message;
      setError(message || "Could not add those tyres. Check the details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet
      open={isOpen}
      onClose={onClose}
      title={count > 1 ? `Add ${count} tyres` : "Add tyre"}
      description="Enter what the set has in common once. The serial numbers follow from the first."
      size="lg"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-vibrant-secondary">
            {count > 1 ? (
              <>
                {count} × {formatCurrency(price)} ={" "}
                <span className="font-semibold text-ink-vibrant">{formatCurrency(total)}</span>
              </>
            ) : (
              <>Added to stock, ready to fit.</>
            )}
          </p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button form="add-tyre-form" type="submit" loading={loading} disabled={!canSubmit}>
              {count > 1 ? `Add ${count} to stock` : "Add to stock"}
            </Button>
          </div>
        </div>
      }
    >
      <form id="add-tyre-form" onSubmit={handleSubmit} className="space-y-5">
        <InlineMessage tone="error">{error}</InlineMessage>
        <InlineMessage tone="warning">{notice}</InlineMessage>

        {/* ---- How many ---- */}
        <div className="flex items-center justify-between gap-4 rounded-control border border-hairline bg-canvas-sunken/60 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-ink-vibrant">How many</p>
            <p className="text-xs text-ink-vibrant-secondary">
              Same brand, size and invoice. Serials run on from the first.
            </p>
          </div>
          <Stepper value={count} onChange={setCount} min={1} max={MAX_BATCH} />
        </div>

        {/* ---- Identity ---- */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label={count > 1 ? "First serial number" : "Serial number"}
            htmlFor="t-number"
            hint="As engraved on the sidewall"
            required
          >
            <input
              id="t-number"
              className={cn(inputClasses, "uppercase")}
              required
              autoComplete="off"
              placeholder="MRF2024001"
              value={form.firstSerial}
              onChange={(e) => {
                setSerialsTouched(false);
                set("firstSerial", e.target.value);
              }}
            />
          </FormField>

          <FormField label="Size" htmlFor="t-size" hint="Pick one, or type your own" required>
            <input
              id="t-size"
              className={inputClasses}
              required
              list="tyre-sizes"
              placeholder="295/80 R22.5"
              value={form.size}
              onChange={(e) => set("size", e.target.value)}
            />
            <datalist id="tyre-sizes">
              {COMMON_SIZES.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </FormField>

          <FormField label="Brand" htmlFor="t-brand" required>
            <input
              id="t-brand"
              className={inputClasses}
              required
              list="tyre-brands"
              placeholder="MRF"
              value={form.brand}
              onChange={(e) => set("brand", e.target.value)}
            />
            <datalist id="tyre-brands">
              {COMMON_BRANDS.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </FormField>

          <FormField label="Pattern / model" htmlFor="t-model" hint="Optional">
            <input
              id="t-model"
              className={inputClasses}
              placeholder="Steel Muscle S1L4"
              value={form.model}
              onChange={(e) => set("model", e.target.value)}
            />
          </FormField>
        </div>

        {/* ---- Fitment ---- */}
        <FormField
          label="Built for"
          hint="Warns you later if it goes on the wrong axle"
          htmlFor="t-application"
        >
          <div
            id="t-application"
            role="radiogroup"
            aria-label="Axle application"
            className="scrollbar-hide flex gap-1 overflow-x-auto rounded-control bg-ink/8 p-1"
          >
            {AXLE_APPLICATIONS.map((option) => (
              <ApplicationChip
                key={option.value}
                label={option.label}
                hint={option.hint}
                selected={form.axleApplication === option.value}
                onSelect={() => set("axleApplication", option.value)}
              />
            ))}
          </div>
        </FormField>

        {/* ---- Condition and cost ---- */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField
            label="New tread depth"
            htmlFor="t-tread"
            hint={
              suggestedTread != null
                ? `${suggestedTread} mm is standard for this size`
                : "Millimetres, when new"
            }
            required
          >
            <input
              id="t-tread"
              type="number"
              min="1"
              max="30"
              step="0.5"
              className={inputClasses}
              required
              value={form.initialTreadDepth}
              onChange={(e) => set("initialTreadDepth", e.target.value)}
            />
          </FormField>

          <FormField label="Price each" htmlFor="t-price" hint="₹ per tyre" required>
            <input
              id="t-price"
              type="number"
              min="1"
              className={inputClasses}
              required
              value={form.purchasePrice}
              onChange={(e) => set("purchasePrice", e.target.value)}
            />
          </FormField>

          <FormField label="Purchased on" htmlFor="t-date" required>
            <input
              id="t-date"
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              className={inputClasses}
              required
              value={form.purchaseDate}
              onChange={(e) => set("purchaseDate", e.target.value)}
            />
          </FormField>
        </div>

        <FormField label="Vendor" htmlFor="t-vendor" hint="Optional">
          <input
            id="t-vendor"
            className={inputClasses}
            value={form.vendorName}
            onChange={(e) => set("vendorName", e.target.value)}
            placeholder="Who you bought it from"
          />
        </FormField>

        {/* ---- The generated set ---- */}
        {count > 1 && (
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold text-ink-vibrant">Serial numbers</p>
              <p className="text-xs text-ink-vibrant-secondary">
                Generated from the first — correct any that differ.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {serials.map((serial, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-right text-xs font-semibold text-ink-quaternary tabular-nums">
                    {index + 1}
                  </span>
                  <input
                    className={cn(
                      inputClasses,
                      "h-10 uppercase",
                      duplicate && serial.trim() === duplicate && "border-critical"
                    )}
                    aria-label={`Serial number ${index + 1}`}
                    value={serial}
                    onChange={(e) => {
                      setSerialsTouched(true);
                      setSerials((prev) =>
                        prev.map((s, i) => (i === index ? e.target.value : s))
                      );
                    }}
                  />
                </div>
              ))}
            </div>

            {duplicate ? (
              <p role="alert" className="text-xs font-medium text-critical-ink">
                {duplicate} appears twice. Every tyre needs its own serial.
              </p>
            ) : null}
          </div>
        )}
      </form>
    </Sheet>
  );
}

function Stepper({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
}) {
  const reduced = useReducedMotion();

  const button = (delta: number, label: string, Icon: typeof FaPlus) => {
    const next = value + delta;
    const disabled = next < min || next > max;
    return (
      <motion.button
        type="button"
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(next)}
        whileTap={disabled ? undefined : reduced ? { opacity: 0.6 } : { scale: 0.9 }}
        transition={spring.snappy}
        className={cn(
          "grid h-9 w-9 place-items-center rounded-chip text-ink-secondary",
          "transition-colors duration-150 hover:bg-ink/6 hover:text-ink",
          "disabled:cursor-not-allowed disabled:opacity-35"
        )}
      >
        <Icon className="h-3 w-3" />
      </motion.button>
    );
  };

  return (
    <div className="flex shrink-0 items-center gap-1 rounded-control border border-hairline bg-surface p-1">
      {button(-1, "One fewer", FaMinus)}
      <span
        className="w-8 text-center text-base font-semibold text-ink tabular-nums"
        aria-live="polite"
      >
        {value}
      </span>
      {button(1, "One more", FaPlus)}
    </div>
  );
}

function ApplicationChip({
  label,
  hint,
  selected,
  onSelect,
}: {
  label: string;
  hint: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={selected}
      title={hint}
      onClick={onSelect}
      whileTap={reduced ? { opacity: 0.7 } : { scale: 0.97 }}
      transition={spring.snappy}
      className={cn(
        "flex-1 shrink-0 rounded-[0.625rem] px-3 py-1.5 text-sm font-semibold whitespace-nowrap",
        "transition-colors duration-150",
        selected
          ? "bg-surface text-ink shadow-[var(--shadow-key)] ring-1 ring-hairline-strong"
          : "text-ink-tertiary hover:text-ink-secondary"
      )}
    >
      {label}
    </motion.button>
  );
}
