import { useState } from "react";
import { addTyre } from "../../../api";
import { Sheet } from "../../../motion/Sheet";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { inputClasses } from "../../../components/ui/inputStyles";
import { InlineMessage } from "../../../components/ui/InlineMessage";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onTyreAdded: () => void;
}

const EMPTY = {
  tyreNumber: "",
  brand: "",
  model: "",
  size: "",
  purchasePrice: "",
  vendorName: "",
  initialTreadDepth: 16,
};

export function AddTyreModal({ isOpen, onClose, onTyreAdded }: Props) {
  const [formData, setFormData] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await addTyre({
        ...formData,
        purchaseDate: new Date().toISOString(),
        decryptedPayload: { id: "TEMP" },
      });
      setFormData(EMPTY);
      onTyreAdded();
    } catch (err) {
      console.error("Failed to add tyre:", err);
      /* This used to be a native `alert()` — a modal browser dialog on top of
         a modal, that cannot be styled, cannot be dismissed by Escape in the
         same way, and drops the user out of the app's own language. */
      setError("Could not add that tyre. Check the details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet
      open={isOpen}
      onClose={onClose}
      title="Add tyre"
      description="Add a tyre to your inventory so it can be mounted and tracked."
      size="md"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button form="add-tyre-form" type="submit" loading={loading}>
            Add to inventory
          </Button>
        </div>
      }
    >
      <form id="add-tyre-form" onSubmit={handleSubmit} className="space-y-4">
        <InlineMessage tone="error">{error}</InlineMessage>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Tyre number" htmlFor="t-number" required>
            <input
              id="t-number"
              className={inputClasses}
              required
              value={formData.tyreNumber}
              onChange={(e) => set("tyreNumber", e.target.value)}
            />
          </FormField>

          <FormField label="Size" htmlFor="t-size" hint="e.g. 295/80 R22.5" required>
            <input
              id="t-size"
              className={inputClasses}
              required
              value={formData.size}
              onChange={(e) => set("size", e.target.value)}
            />
          </FormField>

          <FormField label="Brand" htmlFor="t-brand" required>
            <input
              id="t-brand"
              className={inputClasses}
              required
              value={formData.brand}
              onChange={(e) => set("brand", e.target.value)}
            />
          </FormField>

          <FormField label="Model" htmlFor="t-model" required>
            <input
              id="t-model"
              className={inputClasses}
              required
              value={formData.model}
              onChange={(e) => set("model", e.target.value)}
            />
          </FormField>

          <FormField label="Purchase price" htmlFor="t-price" hint="₹" required>
            <input
              id="t-price"
              type="number"
              min="0"
              className={inputClasses}
              required
              value={formData.purchasePrice}
              onChange={(e) => set("purchasePrice", e.target.value)}
            />
          </FormField>

          <FormField label="Tread depth" htmlFor="t-tread" hint="In millimetres" required>
            <input
              id="t-tread"
              type="number"
              min="0"
              step="0.5"
              className={inputClasses}
              required
              value={formData.initialTreadDepth}
              onChange={(e) => set("initialTreadDepth", Number(e.target.value))}
            />
          </FormField>
        </div>

        {/* `vendorName` was in the form state and sent to the API, but no
            input ever existed for it — so it always posted empty. */}
        <FormField label="Vendor" htmlFor="t-vendor" hint="Optional">
          <input
            id="t-vendor"
            className={inputClasses}
            value={formData.vendorName}
            onChange={(e) => set("vendorName", e.target.value)}
            placeholder="Who you bought it from"
          />
        </FormField>
      </form>
    </Sheet>
  );
}
