import { useEffect, useState } from "react";
import { Sheet } from "../../../motion/Sheet";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { InlineMessage } from "../../../components/ui/InlineMessage";
import { inputClasses } from "../../../components/ui/inputStyles";
import { cn } from "../../../utils/cn";
import { updateTyreDetails } from "../../../api";
import type { ITyre } from "../../../types/tyre";
import {
  AXLE_APPLICATIONS,
  type AxleApplication,
  COMMON_BRANDS,
  COMMON_SIZES,
} from "../lib/tyre-standards";

/**
 * Correcting what was typed when the tyre was bought.
 *
 * This used to be an "edit mode" that turned the page's own heading into a
 * bare underlined input and scattered three more inputs through cards that
 * were otherwise read-only — so the page had two layouts, and the fields you
 * could change were wherever their values happened to be displayed.
 *
 * Editing facts about the tyre is a separate task from reading its condition,
 * so it gets its own surface. Status, position and history are not here on
 * purpose: those are moved by fitting, removing and inspecting, never by a
 * form.
 */

interface Props {
  open: boolean;
  onClose: () => void;
  tyre: ITyre | null;
  onDone: (tyre: ITyre) => void;
}

export function EditTyreSheet({ open, onClose, tyre, onDone }: Props) {
  const [form, setForm] = useState({
    tyreNumber: "",
    brand: "",
    model: "",
    size: "",
    axleApplication: "All" as AxleApplication,
    purchasePrice: "",
    vendorName: "",
    initialTreadDepth: "",
    purchaseDate: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !tyre) return;
    setForm({
      tyreNumber: tyre.tyreNumber ?? "",
      brand: tyre.brand ?? "",
      model: tyre.model ?? "",
      size: tyre.size ?? "",
      axleApplication: tyre.axleApplication ?? "All",
      purchasePrice: tyre.purchasePrice != null ? String(tyre.purchasePrice) : "",
      vendorName: tyre.vendorName ?? "",
      initialTreadDepth: tyre.initialTreadDepth != null ? String(tyre.initialTreadDepth) : "",
      purchaseDate: tyre.purchaseDate ? tyre.purchaseDate.slice(0, 10) : "",
    });
    setError(null);
  /* Keyed on the tyre's identity, not the object: re-seeding whenever the
     parent refetches would throw away whatever is half-typed. */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tyre?._id]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /* Lowering the new-tyre depth below the current reading would leave the
     tyre with more tread than it ever had. The server guards this too; saying
     so here means the user finds out before they submit. */
  const newDepth = Number(form.initialTreadDepth);
  const belowCurrent = Boolean(
    tyre && form.initialTreadDepth !== "" && newDepth < tyre.currentTreadDepth
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tyre) return;

    setSaving(true);
    setError(null);
    try {
      const updated = await updateTyreDetails(tyre._id, {
        tyreNumber: form.tyreNumber.trim().toUpperCase(),
        brand: form.brand.trim(),
        model: form.model.trim(),
        size: form.size.trim(),
        axleApplication: form.axleApplication,
        purchasePrice: Number(form.purchasePrice) || undefined,
        vendorName: form.vendorName.trim(),
        initialTreadDepth: newDepth || undefined,
        purchaseDate: form.purchaseDate
          ? new Date(form.purchaseDate).toISOString()
          : undefined,
      });
      onDone(updated);
    } catch (err) {
      const message = (err as { message?: string })?.message;
      setError(message || "Could not save those details. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Edit tyre details"
      description="Correct what was recorded at purchase. Fitting and condition are changed elsewhere."
      size="lg"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button form="edit-tyre-form" type="submit" loading={saving}>
            Save changes
          </Button>
        </div>
      }
    >
      <form id="edit-tyre-form" onSubmit={handleSubmit} className="space-y-4">
        <InlineMessage tone="error">{error}</InlineMessage>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Serial number" htmlFor="e-number" required>
            <input
              id="e-number"
              className={cn(inputClasses, "uppercase")}
              required
              value={form.tyreNumber}
              onChange={(e) => set("tyreNumber", e.target.value)}
            />
          </FormField>

          <FormField label="Size" htmlFor="e-size" required>
            <input
              id="e-size"
              className={inputClasses}
              required
              list="edit-tyre-sizes"
              value={form.size}
              onChange={(e) => set("size", e.target.value)}
            />
            <datalist id="edit-tyre-sizes">
              {COMMON_SIZES.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </FormField>

          <FormField label="Brand" htmlFor="e-brand" required>
            <input
              id="e-brand"
              className={inputClasses}
              required
              list="edit-tyre-brands"
              value={form.brand}
              onChange={(e) => set("brand", e.target.value)}
            />
            <datalist id="edit-tyre-brands">
              {COMMON_BRANDS.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </FormField>

          <FormField label="Pattern / model" htmlFor="e-model">
            <input
              id="e-model"
              className={inputClasses}
              value={form.model}
              onChange={(e) => set("model", e.target.value)}
            />
          </FormField>
        </div>

        <FormField label="Built for" htmlFor="e-application">
          <select
            id="e-application"
            className={inputClasses}
            value={form.axleApplication}
            onChange={(e) => set("axleApplication", e.target.value as AxleApplication)}
          >
            {AXLE_APPLICATIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} — {option.hint}
              </option>
            ))}
          </select>
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField
            label="New tread depth"
            htmlFor="e-tread"
            hint="Millimetres, when new"
            error={
              belowCurrent && tyre
                ? `The tyre currently reads ${tyre.currentTreadDepth} mm, which this would be below.`
                : undefined
            }
          >
            <input
              id="e-tread"
              type="number"
              min="1"
              max="30"
              step="0.5"
              className={inputClasses}
              value={form.initialTreadDepth}
              onChange={(e) => set("initialTreadDepth", e.target.value)}
            />
          </FormField>

          <FormField label="Price" htmlFor="e-price" hint="₹">
            <input
              id="e-price"
              type="number"
              min="1"
              className={inputClasses}
              value={form.purchasePrice}
              onChange={(e) => set("purchasePrice", e.target.value)}
            />
          </FormField>

          <FormField label="Purchased on" htmlFor="e-date">
            <input
              id="e-date"
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              className={inputClasses}
              value={form.purchaseDate}
              onChange={(e) => set("purchaseDate", e.target.value)}
            />
          </FormField>
        </div>

        <FormField label="Vendor" htmlFor="e-vendor" hint="Optional">
          <input
            id="e-vendor"
            className={inputClasses}
            value={form.vendorName}
            onChange={(e) => set("vendorName", e.target.value)}
          />
        </FormField>
      </form>
    </Sheet>
  );
}
