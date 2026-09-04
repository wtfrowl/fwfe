import React, { useState } from "react";
import { createDriver } from "../../../api";
import { Sheet } from "../../../motion/Sheet";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { inputClasses } from "../../../components/ui/inputStyles";
import { InlineMessage } from "../../../components/ui/InlineMessage";

interface AddDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDriverAdded: () => void;
}

const EMPTY = {
  firstName: "",
  lastName: "",
  age: "",
  contactNumber: "",
  aadharNumber: "",
  license: "",
  password: "",
  street: "",
  city: "",
  state: "",
};

export const AddDriverModal: React.FC<AddDriverModalProps> = ({
  isOpen,
  onClose,
  onDriverAdded,
}) => {
  const [formData, setFormData] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createDriver({ ...formData, age: Number(formData.age) });
      setFormData(EMPTY);
      onDriverAdded();
      onClose();
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message ===
          "string"
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(message || "Could not add that driver. Check the details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet
      open={isOpen}
      onClose={handleClose}
      title="Add driver"
      description="They'll be able to sign in and be assigned to trips."
      size="lg"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button form="add-driver-form" type="submit" loading={loading}>
            Add driver
          </Button>
        </div>
      }
    >
      <form id="add-driver-form" onSubmit={handleSubmit} className="space-y-4">
        <InlineMessage tone="error">{error}</InlineMessage>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="First name" htmlFor="d-first" required>
            <input
              id="d-first"
              name="firstName"
              required
              value={formData.firstName}
              onChange={handleChange}
              className={inputClasses}
            />
          </FormField>
          <FormField label="Last name" htmlFor="d-last" required>
            <input
              id="d-last"
              name="lastName"
              required
              value={formData.lastName}
              onChange={handleChange}
              className={inputClasses}
            />
          </FormField>

          <FormField label="Age" htmlFor="d-age" required>
            <input
              id="d-age"
              name="age"
              type="number"
              min="18"
              required
              value={formData.age}
              onChange={handleChange}
              className={inputClasses}
            />
          </FormField>
          <FormField label="Mobile number" htmlFor="d-phone" hint="10 digits" required>
            <input
              id="d-phone"
              name="contactNumber"
              inputMode="numeric"
              required
              pattern="\d{10}"
              title="10 digit number"
              value={formData.contactNumber}
              onChange={handleChange}
              className={inputClasses}
            />
          </FormField>

          <FormField label="Licence number" htmlFor="d-licence" required>
            <input
              id="d-licence"
              name="license"
              required
              value={formData.license}
              onChange={handleChange}
              className={inputClasses}
            />
          </FormField>
          <FormField label="Aadhaar number" htmlFor="d-aadhaar" required>
            <input
              id="d-aadhaar"
              name="aadharNumber"
              inputMode="numeric"
              required
              value={formData.aadharNumber}
              onChange={handleChange}
              className={inputClasses}
            />
          </FormField>
        </div>

        <FormField
          label="Password"
          htmlFor="d-password"
          hint="At least 6 characters. They'll use this to sign in."
          required
        >
          <input
            id="d-password"
            name="password"
            type="password"
            minLength={6}
            required
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            className={inputClasses}
          />
        </FormField>

        <fieldset className="space-y-4">
          <legend className="text-caption w-full border-b border-hairline pb-1.5 text-xs font-semibold uppercase text-ink-tertiary">
            Address
          </legend>

          <FormField label="Street" htmlFor="d-street" required>
            <input
              id="d-street"
              name="street"
              required
              value={formData.street}
              onChange={handleChange}
              className={inputClasses}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="City" htmlFor="d-city" required>
              <input
                id="d-city"
                name="city"
                required
                value={formData.city}
                onChange={handleChange}
                className={inputClasses}
              />
            </FormField>
            <FormField label="State" htmlFor="d-state" required>
              <input
                id="d-state"
                name="state"
                required
                value={formData.state}
                onChange={handleChange}
                className={inputClasses}
              />
            </FormField>
          </div>
        </fieldset>
      </form>
    </Sheet>
  );
};
