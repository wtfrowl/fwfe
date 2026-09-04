import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTruck, FaCar, FaShuttleVan } from "react-icons/fa";
import type { IconType } from "react-icons";
import type { Vehicle, VehicleStatus } from "../types/vehicle";
import { HealthBar } from "./health-bar";
import { AlertBadge } from "./alert-badge";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Button } from "../../../components/ui/Button";
import { Sheet } from "../../../motion/Sheet";
import { FormField } from "../../../components/ui/FormField";
import { inputClasses } from "../../../components/ui/inputStyles";
import { InlineMessage } from "../../../components/ui/InlineMessage";
import { updateTruck } from "../../../api";

interface VehicleTableProps {
  vehicles: Vehicle[];
  userRole: "owner" | "driver" | null;
  /** Lets the page refetch after an edit — the old table saved and then left
      the list showing the stale row until a manual reload. */
  onUpdated?: () => void;
}

const iconFor: Record<string, IconType> = {
  Truck: FaTruck,
  Van: FaShuttleVan,
  Car: FaCar,
};

const statusTone: Record<VehicleStatus, "success" | "info" | "danger" | "neutral"> = {
  ALL: "neutral",
  Available: "info",
  "En Route": "success",
  "Out of Service": "danger",
};

export function VehicleTable({ vehicles, userRole, onUpdated }: VehicleTableProps) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState({
    registrationNumber: "",
    model: "",
    available: false,
    capacity: "",
  });

  const openEdit = (vehicle: Vehicle) => {
    setSaveError(null);
    setEditing(vehicle);
    setForm({
      registrationNumber: vehicle.registrationNumber,
      model: vehicle.model,
      available: vehicle.available,
      capacity: vehicle.capacity,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;

    setSaving(true);
    setSaveError(null);
    try {
      await updateTruck(editing.id, form);
      setEditing(null);
      onUpdated?.();
    } catch (err) {
      console.error("Failed to update the truck:", err);
      /* The old handler swallowed the failure into console.error and closed
         the dialog anyway, so a failed save looked exactly like a successful
         one. */
      setSaveError("Could not save those changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* --- Desktop --- */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-hairline">
              {["Vehicle", "Type", "Status", "Health", "Alert"].map((h) => (
                <th
                  key={h}
                  className="text-caption px-4 py-3 text-left text-xs font-semibold uppercase text-ink-tertiary"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => {
              const Icon = iconFor[vehicle.type] ?? FaCar;
              return (
                <tr
                  key={vehicle.id}
                  onClick={() => navigate(`${vehicle.registrationNumber}`)}
                  className="cursor-pointer border-b border-hairline/70 transition-colors duration-150 last:border-0 hover:bg-ink/3"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink/6 text-ink-secondary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-semibold text-ink">{vehicle.registrationNumber}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-ink-secondary">{vehicle.type}</td>
                  <td className="px-4 py-3.5">
                    <StatusBadge tone={statusTone[vehicle.status] ?? "neutral"}>
                      {vehicle.status}
                    </StatusBadge>
                  </td>
                  <td className="w-56 px-4 py-3.5">
                    <HealthBar value={vehicle.healthRate} />
                  </td>
                  <td className="px-4 py-3.5">
                    <AlertBadge type={vehicle.alertType} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* --- Mobile --- */}
      <div className="space-y-3 p-3 md:hidden">
        {vehicles.map((vehicle) => {
          const Icon = iconFor[vehicle.type] ?? FaCar;
          return (
            <div
              key={vehicle.id}
              className="rounded-card border border-hairline bg-surface p-4 shadow-[var(--shadow-hairline)]"
            >
              <button
                type="button"
                onClick={() => navigate(`${vehicle.registrationNumber}`)}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink/6 text-ink-secondary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="truncate font-semibold text-ink">
                    {vehicle.registrationNumber}
                  </span>
                </div>
                <StatusBadge tone={statusTone[vehicle.status] ?? "neutral"}>
                  {vehicle.status}
                </StatusBadge>
              </button>

              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-tertiary">Type</dt>
                  <dd className="font-medium text-ink-secondary">{vehicle.type}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-tertiary">Capacity</dt>
                  <dd className="font-medium text-ink-secondary">{vehicle.capacity}</dd>
                </div>
              </dl>

              <div className="mt-3 space-y-2">
                <HealthBar value={vehicle.healthRate} />
                <AlertBadge type={vehicle.alertType} />
              </div>

              {userRole === "owner" && (
                <div className="mt-3 flex gap-2 border-t border-hairline pt-3">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(vehicle)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`${vehicle.registrationNumber}`)}
                  >
                    View details
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Sheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Edit truck"
        description={editing?.registrationNumber}
        size="md"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="edit-truck-form" loading={saving}>
              Save changes
            </Button>
          </div>
        }
      >
        <form id="edit-truck-form" onSubmit={handleSubmit} className="space-y-4">
          <InlineMessage tone="error">{saveError}</InlineMessage>

          <FormField label="Registration number" htmlFor="edit-reg" required>
            <input
              id="edit-reg"
              name="registrationNumber"
              value={form.registrationNumber}
              onChange={handleChange}
              className={inputClasses}
              required
            />
          </FormField>

          <FormField label="Model" htmlFor="edit-model" required>
            <input
              id="edit-model"
              name="model"
              value={form.model}
              onChange={handleChange}
              className={inputClasses}
              required
            />
          </FormField>

          <FormField label="Capacity" htmlFor="edit-capacity" required>
            <input
              id="edit-capacity"
              name="capacity"
              value={form.capacity}
              onChange={handleChange}
              className={inputClasses}
              required
            />
          </FormField>

          <label className="flex cursor-pointer items-center gap-3 rounded-control border border-hairline p-3">
            <input
              type="checkbox"
              name="available"
              checked={form.available}
              onChange={handleChange}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
            <span className="text-sm font-medium text-ink">
              {form.available ? "Available for dispatch" : "Not available"}
            </span>
          </label>
        </form>
      </Sheet>
    </>
  );
}
