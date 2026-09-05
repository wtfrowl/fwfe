import { useState } from "react";
import { addTruck } from "../../../api";
import { Sheet } from "../../../motion/Sheet";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { inputClasses } from "../../../components/ui/inputStyles";
import { InlineMessage } from "../../../components/ui/InlineMessage";
import {
  AXLE_LAYOUTS,
  DEFAULT_LAYOUT_ID,
  wheelCountFor,
} from "../../tyre/lib/tyre-standards";

const EMPTY = {
  registrationNumber: "",
  model: "",
  capacity: "",
  lastMaintenance: "",
  currentLat: "",
  currentLng: "",
  availableFrom: "",
  availableTill: "",
  /* How many wheels the truck runs on. Asked for at registration because the
     whole tyre side is generated from it — the fitting diagram, the legal
     position codes, "8 of 10 hubs filled". Guessing it later from however many
     tyres happen to be fitted is how a 12-wheeler ends up drawn as a 10. */
  axleLayout: DEFAULT_LAYOUT_ID,
  /* What the vehicle can carry. This is the field a load is matched on —
     matching used to compare a load's "Container" against the truck's make
     ("Tata 4018"), which could never be equal, so no truck ever matched a
     load and the board looked permanently empty. */
  bodyType: "Open",
  /* Opening odometer. Asked for here because every per-kilometre number in the
     product — tyre cost-per-km, fuel economy, service intervals — is measured
     from it, and a fleet that starts at zero on a vehicle with 400,000 km on
     the clock gets nonsense for its first year. */
  totalKm: "",
};

/* Kept in step with BODY_TYPES on the server; a value outside this list is
   rejected by the truck validator. */
const BODY_TYPES = [
  "Open",
  "Container",
  "Trailer",
  "Tanker",
  "Tipper",
  "Refrigerated",
  "Flatbed",
  "Other",
] as const;

export const AddTruckModal = ({
  isOpen,
  onClose,
  onTruckAdded,
}: {
  isOpen: boolean;
  onClose: () => void;
  onTruckAdded: () => void;
}) => {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleClose = () => {
    /* Reset on close so reopening does not present the last attempt's values
       and its stale error. */
    setForm(EMPTY);
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const lat = parseFloat(form.currentLat);
      const lng = parseFloat(form.currentLng);

      await addTruck({
        registrationNumber: form.registrationNumber.trim(),
        model: form.model.trim(),
        capacity: parseFloat(form.capacity),
        lastMaintenance: form.lastMaintenance,
        status: "Available",
        /* Blank coordinates used to become NaN and get posted as-is. */
        currentLocation:
          Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : undefined,
        availableFrom: form.availableFrom,
        availableTill: form.availableTill,
        axleLayout: form.axleLayout,
        bodyType: form.bodyType,
        totalKm: form.totalKm === "" ? 0 : parseFloat(form.totalKm),
      });

      setForm(EMPTY);
      onTruckAdded();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Could not add that truck. Check the details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet
      open={isOpen}
      onClose={handleClose}
      title="Add truck"
      description="Register a vehicle so it can be assigned to trips and loads."
      size="xl"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" form="add-truck-form" loading={loading}>
            Add truck
          </Button>
        </div>
      }
    >
      <form id="add-truck-form" onSubmit={handleSubmit} className="space-y-4">
        <InlineMessage tone="error">{error}</InlineMessage>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Registration number" htmlFor="reg" required>
            <input
              id="reg"
              name="registrationNumber"
              value={form.registrationNumber}
              onChange={handleChange}
              className={inputClasses}
              placeholder="RJ14GA1234"
              required
            />
          </FormField>

          <FormField label="Truck model" htmlFor="model" required>
            <input
              id="model"
              name="model"
              value={form.model}
              onChange={handleChange}
              className={inputClasses}
              placeholder="Tata 4018"
              required
            />
          </FormField>

          <FormField label="Capacity" htmlFor="capacity" hint="In tonnes" required>
            <input
              id="capacity"
              name="capacity"
              type="number"
              min="0"
              step="0.1"
              value={form.capacity}
              onChange={handleChange}
              className={inputClasses}
              placeholder="14"
              required
            />
          </FormField>

          <FormField
            label="Wheel configuration"
            htmlFor="axleLayout"
            hint={`${wheelCountFor(form.axleLayout)} road wheels — sets the tyre positions`}
            required
          >
            <select
              id="axleLayout"
              name="axleLayout"
              value={form.axleLayout}
              onChange={handleChange}
              className={inputClasses}
              required
            >
              {AXLE_LAYOUTS.map((layout) => (
                <option key={layout.id} value={layout.id}>
                  {layout.label} · {layout.drive}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Body type"
            htmlFor="bodyType"
            hint="What loads this truck is offered"
            required
          >
            <select
              id="bodyType"
              name="bodyType"
              value={form.bodyType}
              onChange={handleChange}
              className={inputClasses}
              required
            >
              {BODY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Odometer"
            htmlFor="totalKm"
            hint="Current reading in km — starts every cost-per-km figure"
          >
            <input
              id="totalKm"
              name="totalKm"
              type="number"
              min="0"
              step="1"
              value={form.totalKm}
              onChange={handleChange}
              className={inputClasses}
              placeholder="0"
            />
          </FormField>

          <FormField label="Last maintenance" htmlFor="lastMaintenance">
            <input
              id="lastMaintenance"
              name="lastMaintenance"
              type="date"
              value={form.lastMaintenance}
              onChange={handleChange}
              className={inputClasses}
            />
          </FormField>

          <FormField label="Current latitude" htmlFor="lat" hint="Optional">
            <input
              id="lat"
              name="currentLat"
              type="number"
              step="any"
              value={form.currentLat}
              onChange={handleChange}
              className={inputClasses}
              placeholder="26.9124"
            />
          </FormField>

          <FormField label="Current longitude" htmlFor="lng" hint="Optional">
            <input
              id="lng"
              name="currentLng"
              type="number"
              step="any"
              value={form.currentLng}
              onChange={handleChange}
              className={inputClasses}
              placeholder="75.7873"
            />
          </FormField>

          <FormField label="Available from" htmlFor="availableFrom">
            <input
              id="availableFrom"
              name="availableFrom"
              type="date"
              value={form.availableFrom}
              onChange={handleChange}
              className={inputClasses}
            />
          </FormField>

          <FormField label="Available till" htmlFor="availableTill">
            <input
              id="availableTill"
              name="availableTill"
              type="date"
              value={form.availableTill}
              onChange={handleChange}
              className={inputClasses}
            />
          </FormField>
        </div>
      </form>
    </Sheet>
  );
};
