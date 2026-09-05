import { useState, useEffect } from "react";
import { FiSave } from "react-icons/fi";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { inputClasses } from "../../../components/ui/inputStyles";

interface ProfileData {
  _id?: string;
  firstName: string;
  lastName: string;
  age: number;
  contactNumber: string;
  street: string;
  city: string;
  state: string;
  role?: string;
  totalTrucks?: number;

  /* Driver compliance. Optional on the type because an owner's profile has
     none of it, and the fields are only rendered for drivers. */
  license?: string;
  licenseType?: string;
  licenseExpiryDate?: string;
  badgeNumber?: string;
  badgeExpiryDate?: string;
  medicalExpiryDate?: string;
}

const LICENCE_TYPES = ["LMV", "MGV", "HMV", "HGV", "HTV", "Other"];

/* A date input needs "YYYY-MM-DD"; the API returns a full ISO timestamp, and
   feeding that straight into the input silently blanks it. */
const toDateInput = (value?: string) => (value ? String(value).slice(0, 10) : "");

interface ProfileFormProps {
  initialData: ProfileData | null;
  onSubmit: (data: ProfileData) => Promise<void>;
  saving?: boolean;
}

export function ProfileForm({ initialData, onSubmit, saving = false }: ProfileFormProps) {
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    age: 0,
    contactNumber: "",
    street: "",
    city: "",
    state: "",
  });

  useEffect(() => {
    if (initialData) setProfileData(initialData);
  }, [initialData]);

  const isDriver = profileData.role === "driver";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    /* `parseInt("")` is NaN, which React renders as an empty controlled input
       that can never be typed into again. */
    const parsed = name === "age" ? (value === "" ? 0 : Number.parseInt(value, 10) || 0) : value;
    setProfileData((prev) => ({ ...prev, [name]: parsed }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(profileData);
  };

  const initials =
    `${profileData.firstName?.[0] ?? ""}${profileData.lastName?.[0] ?? ""}`.toUpperCase() || "?";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* The avatar block used to show a hardcoded stock photograph of a
          stranger from a Vercel blob URL, with Upload / Delete / camera
          buttons wired to nothing. Initials are honest and always correct. */}
      <div className="flex items-center gap-4 border-b border-hairline pb-6">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-accent-soft text-xl font-semibold text-accent-ink">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-ink">
            {profileData.firstName} {profileData.lastName}
          </p>
          <p className="text-sm text-ink-secondary">
            {profileData.role === "driver" ? "Driver" : "Fleet owner"}
            {profileData.totalTrucks !== undefined ? ` · ${profileData.totalTrucks} trucks` : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="First name" htmlFor="firstName" required>
          <input
            id="firstName"
            name="firstName"
            value={profileData.firstName}
            onChange={handleChange}
            className={inputClasses}
            required
          />
        </FormField>

        <FormField label="Last name" htmlFor="lastName" required>
          <input
            id="lastName"
            name="lastName"
            value={profileData.lastName}
            onChange={handleChange}
            className={inputClasses}
            required
          />
        </FormField>

        <FormField label="Age" htmlFor="age">
          <input
            id="age"
            type="number"
            name="age"
            min="18"
            value={profileData.age || ""}
            onChange={handleChange}
            className={inputClasses}
          />
        </FormField>

        {/* Disabled without explanation reads as broken; saying why reads as
            deliberate. */}
        <FormField
          label="Contact number"
          htmlFor="contactNumber"
          hint="Contact support to change this"
        >
          <input
            id="contactNumber"
            type="tel"
            name="contactNumber"
            value={profileData.contactNumber}
            disabled
            className={inputClasses}
          />
        </FormField>
      </div>

      <FormField label="Street address" htmlFor="street">
        <input
          id="street"
          name="street"
          value={profileData.street}
          onChange={handleChange}
          className={inputClasses}
        />
      </FormField>

      {/* Licence and certificates.
          Only asked of drivers, and only here — this is their own profile, and
          they are the only person who can actually renew any of it. Recording
          the dates is what lets the compliance sweep warn before a licence
          lapses instead of a checkpoint finding it first. */}
      {isDriver && (
        <div className="space-y-4 border-t border-hairline pt-6">
          <div>
            <p className="font-semibold text-ink">Licence &amp; certificates</p>
            <p className="text-sm text-ink-secondary">
              Add the expiry dates and you will be reminded 30, 7 and 1 days before each lapses.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Licence type" htmlFor="licenseType">
              <select
                id="licenseType"
                name="licenseType"
                value={profileData.licenseType ?? "HMV"}
                onChange={handleChange}
                className={inputClasses}
              >
                {LICENCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Licence expires" htmlFor="licenseExpiryDate">
              <input
                id="licenseExpiryDate"
                type="date"
                name="licenseExpiryDate"
                value={toDateInput(profileData.licenseExpiryDate)}
                onChange={handleChange}
                className={inputClasses}
              />
            </FormField>

            <FormField label="Badge number" htmlFor="badgeNumber" hint="If your state requires one">
              <input
                id="badgeNumber"
                name="badgeNumber"
                value={profileData.badgeNumber ?? ""}
                onChange={handleChange}
                className={inputClasses}
              />
            </FormField>

            <FormField label="Badge expires" htmlFor="badgeExpiryDate">
              <input
                id="badgeExpiryDate"
                type="date"
                name="badgeExpiryDate"
                value={toDateInput(profileData.badgeExpiryDate)}
                onChange={handleChange}
                className={inputClasses}
              />
            </FormField>

            <FormField label="Medical certificate expires" htmlFor="medicalExpiryDate">
              <input
                id="medicalExpiryDate"
                type="date"
                name="medicalExpiryDate"
                value={toDateInput(profileData.medicalExpiryDate)}
                onChange={handleChange}
                className={inputClasses}
              />
            </FormField>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="City" htmlFor="city">
          <input
            id="city"
            name="city"
            value={profileData.city}
            onChange={handleChange}
            className={inputClasses}
          />
        </FormField>

        <FormField label="State" htmlFor="state">
          <input
            id="state"
            name="state"
            value={profileData.state}
            onChange={handleChange}
            className={inputClasses}
          />
        </FormField>
      </div>

      <Button type="submit" loading={saving} className="w-full sm:w-auto">
        {!saving && <FiSave className="h-4 w-4" />}
        Save changes
      </Button>
    </form>
  );
}
