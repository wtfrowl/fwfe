import { useEffect, useState, useContext } from "react";
import type { Driver, Truck } from "../types/api";
import { AuthContext } from "../../../context/AuthContext";
import { Sheet } from "../../../motion/Sheet";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { inputClasses } from "../../../components/ui/inputStyles";
import { InlineMessage } from "../../../components/ui/InlineMessage";

interface AddTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (tripData: Record<string, unknown>) => Promise<void>;
  trucks: Truck[];
  drivers: Driver[];
  load?: { _id: string; source: string; destination: string; weight: number; price: number; truckId: string; truckReg: string; pickupDate: string; distance?: number } | null;
}

const EMPTY_FORM = {
  departureDateTime: "",
  arrivalDateTime: "",
  loadingDate: "",
  departureLocation: "",
  arrivalLocation: "",
  totalWeight: "",
  driverIds: [] as string[],
  fare: "",
  registrationNumber: "",
  transporterName: "",
  cashAdvance: "",
  tyreDetails: "",
  tyreNumber: "",
  loadId: "",
  truckId: "",
  distance: "",
  driverContactNumber: "",
};

/** A labelled group of fields. Proximity is what says these belong together. */
function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-caption mb-2 w-full border-b border-hairline pb-1.5 text-xs font-semibold uppercase text-ink-tertiary">
        {legend}
      </legend>
      {children}
    </fieldset>
  );
}

export function AddTripModal({ isOpen, onClose, onAdd, trucks, drivers, load }: AddTripModalProps) {
  const { user, role } = useContext(AuthContext);
  const isDriver = role === "driver";

  const currentDriver = isDriver && user ? drivers.find((d) => d._id === user._id) : null;
  const isDriverAvailable = currentDriver?.availability !== false;

  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDriverValue, setSelectedDriverValue] = useState("");
  const [formData, setFormData] = useState(EMPTY_FORM);

  const set = <K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (isDriver && isDriverAvailable) {
      setFormData((prev) => ({
        ...prev,
        driverIds: [],
        driverContactNumber: currentDriver?.contactNumber ? String(currentDriver.contactNumber) : "",
      }));
    }
  }, [isDriver, isDriverAvailable, currentDriver]);

  useEffect(() => {
    if (!load) return;
    const pickup = load.pickupDate ? new Date(load.pickupDate).toISOString().slice(0, 16) : "";
    setFormData((prev) => ({
      ...prev,
      departureLocation: load.source,
      arrivalLocation: load.destination,
      totalWeight: String(load.weight),
      fare: String(load.price),
      loadId: load._id,
      truckId: load.truckId,
      registrationNumber: load.truckReg,
      departureDateTime: pickup,
      loadingDate: pickup,
      distance: load.distance ? String(load.distance) : "",
    }));
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    setError(null);
    try {
      await onAdd(formData);
      setFormData(EMPTY_FORM);
      setSelectedDriverValue("");
      onClose();
    } catch (err) {
      console.error("Failed to add trip:", err);
      /* Previously this only reached the console, so a failed submit left the
         dialog sitting open with no explanation and the user pressing the
         button again. */
      setError("Could not create that trip. Check the details and try again.");
    } finally {
      setIsAdding(false);
    }
  };

  /* A driver who cannot act needs an explanation, not a form. Same sheet, same
     motion — only the content changes. */
  if (isDriver && !isDriverAvailable) {
    return (
      <Sheet
        open={isOpen}
        onClose={onClose}
        title="You're marked unavailable"
        size="md"
        footer={
          <div className="flex justify-end">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-ink-vibrant-secondary">
          Finish your current assignment before creating a new trip. Once it is marked complete
          you'll be available again automatically.
        </p>
      </Sheet>
    );
  }

  const availableTrucks = trucks?.filter((t) => t.status === "Available" && t.available === true) ?? [];

  return (
    <Sheet
      open={isOpen}
      onClose={onClose}
      title="Create trip"
      description="Logistics and settlement details."
      size="xl"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={isAdding}>
            Cancel
          </Button>
          <Button form="add-trip-form" type="submit" loading={isAdding}>
            Create trip
          </Button>
        </div>
      }
    >
      <form id="add-trip-form" onSubmit={handleSubmit} className="space-y-6">
        <InlineMessage tone="error">{error}</InlineMessage>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          <div className="space-y-6">
            <Fieldset legend="Vehicle & driver">
              <FormField label="Truck" htmlFor="trip-truck" required>
                <select
                  id="trip-truck"
                  className={inputClasses}
                  value={formData.registrationNumber}
                  onChange={(e) => {
                    const registrationNumber = e.target.value;
                    const truck = trucks.find((t) => t.registrationNumber === registrationNumber) as
                      | (Truck & { driverId?: string[] })
                      | undefined;
                    setFormData((prev) => ({ ...prev, registrationNumber, driverIds: [] }));
                    setSelectedDriverValue(truck?.driverId?.length ? "current" : "");
                  }}
                  required
                >
                  <option value="">Choose a truck</option>
                  {availableTrucks.map((truck) => (
                    <option key={truck._id} value={truck.registrationNumber}>
                      {truck.registrationNumber}
                    </option>
                  ))}
                </select>
              </FormField>

              {/* An empty list is a state worth explaining. Silently rendering
                  a select with one placeholder option leaves the user
                  wondering whether the page failed. */}
              {availableTrucks.length === 0 && (
                <p className="text-xs text-ink-tertiary">
                  No trucks are currently marked available for dispatch.
                </p>
              )}

              <FormField label="Driver" htmlFor="trip-driver" required>
                <select
                  id="trip-driver"
                  className={inputClasses}
                  value={selectedDriverValue}
                  disabled={isDriver}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedDriverValue(value);

                    if (value === "current" || value === "") {
                      set("driverIds", []);
                      return;
                    }
                    const driver = drivers.find((d) => d._id === value);
                    if (driver) {
                      setFormData((prev) => ({
                        ...prev,
                        driverIds: [driver._id],
                        driverContactNumber: String(driver.contactNumber ?? ""),
                      }));
                    }
                  }}
                >
                  <option value="">Choose a driver</option>
                  <option value="current">Truck's current driver</option>
                  {drivers
                    .filter((driver) => driver.availability !== false)
                    .map((driver) => (
                      <option key={driver._id} value={driver._id}>
                        {driver.firstName} {driver.lastName}
                      </option>
                    ))}
                </select>
              </FormField>
            </Fieldset>

            <Fieldset legend="Route">
              <FormField label="Transporter or client" htmlFor="trip-transporter">
                <input
                  id="trip-transporter"
                  className={inputClasses}
                  value={formData.transporterName}
                  onChange={(e) => set("transporterName", e.target.value)}
                  placeholder="ABC Logistics Pvt Ltd"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Origin" htmlFor="trip-origin" required>
                  <input
                    id="trip-origin"
                    className={inputClasses}
                    value={formData.departureLocation}
                    onChange={(e) => set("departureLocation", e.target.value)}
                    placeholder="City"
                    required
                  />
                </FormField>
                <FormField label="Destination" htmlFor="trip-destination" required>
                  <input
                    id="trip-destination"
                    className={inputClasses}
                    value={formData.arrivalLocation}
                    onChange={(e) => set("arrivalLocation", e.target.value)}
                    placeholder="City"
                    required
                  />
                </FormField>
              </div>

              <FormField label="Estimated distance" htmlFor="trip-distance" hint="In kilometres">
                <input
                  id="trip-distance"
                  type="number"
                  min="0"
                  className={inputClasses}
                  value={formData.distance}
                  onChange={(e) => set("distance", e.target.value)}
                  placeholder="0"
                />
              </FormField>
            </Fieldset>
          </div>

          <div className="space-y-6">
            <Fieldset legend="Schedule">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="Loading date" htmlFor="trip-loading">
                  <input
                    id="trip-loading"
                    type="datetime-local"
                    className={inputClasses}
                    value={formData.loadingDate}
                    onChange={(e) => set("loadingDate", e.target.value)}
                  />
                </FormField>
                <FormField label="Departure" htmlFor="trip-departure" required>
                  <input
                    id="trip-departure"
                    type="datetime-local"
                    className={inputClasses}
                    value={formData.departureDateTime}
                    onChange={(e) => set("departureDateTime", e.target.value)}
                    required
                  />
                </FormField>
              </div>
            </Fieldset>

            <Fieldset legend="Cargo & payment">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Weight" htmlFor="trip-weight" hint="Tonnes" required>
                  <input
                    id="trip-weight"
                    type="number"
                    min="0"
                    step="0.1"
                    className={inputClasses}
                    value={formData.totalWeight}
                    onChange={(e) => set("totalWeight", e.target.value)}
                    placeholder="0"
                    required
                  />
                </FormField>
                <FormField label="Trip fare" htmlFor="trip-fare" hint="₹" required>
                  <input
                    id="trip-fare"
                    type="number"
                    min="0"
                    className={inputClasses}
                    value={formData.fare}
                    onChange={(e) => set("fare", e.target.value)}
                    placeholder="0"
                    required
                  />
                </FormField>
              </div>

              <FormField
                label="Cash advance"
                htmlFor="trip-advance"
                hint="Deducted from the final settlement"
              >
                <input
                  id="trip-advance"
                  type="number"
                  min="0"
                  className={inputClasses}
                  value={formData.cashAdvance}
                  onChange={(e) => set("cashAdvance", e.target.value)}
                  placeholder="Amount received at start"
                />
              </FormField>
            </Fieldset>

            <Fieldset legend="Additional">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Tyre number" htmlFor="trip-tyre-no">
                  <input
                    id="trip-tyre-no"
                    className={inputClasses}
                    value={formData.tyreNumber}
                    onChange={(e) => set("tyreNumber", e.target.value)}
                  />
                </FormField>
                <FormField label="Tyre details" htmlFor="trip-tyre-details">
                  <input
                    id="trip-tyre-details"
                    className={inputClasses}
                    value={formData.tyreDetails}
                    onChange={(e) => set("tyreDetails", e.target.value)}
                  />
                </FormField>
              </div>
            </Fieldset>
          </div>
        </div>
      </form>
    </Sheet>
  );
}
