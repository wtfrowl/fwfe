import { useState } from "react";
import { FiSave, FiEye, FiEyeOff } from "react-icons/fi";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { inputClasses } from "../../../components/ui/inputStyles";
import { cn } from "../../../utils/cn";

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordFormProps {
  onSubmit: (data: PasswordData) => Promise<void>;
  saving?: boolean;
}

const MIN_LENGTH = 6;

type Field = "current" | "new" | "confirm";

/**
 * Defined at module scope, not inside `PasswordForm`.
 *
 * A component declared inside another component's body is a brand-new type on
 * every render, so React unmounts and remounts it — which in a text input
 * means losing focus after every single keystroke.
 */
function PasswordInput({
  id,
  label,
  value,
  visible,
  onChange,
  onToggle,
  onBlur,
  error,
  hint,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggle: () => void;
  onBlur?: () => void;
  error?: string;
  hint?: string;
  autoComplete: string;
}) {
  return (
    <FormField label={label} htmlFor={id} error={error} hint={hint} required>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          autoComplete={autoComplete}
          className={cn(inputClasses, "pr-11", error && "border-critical")}
          required
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-chip p-2 text-ink-tertiary transition-colors duration-150 hover:bg-ink/6 hover:text-ink"
        >
          {visible ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>
    </FormField>
  );
}

export function PasswordForm({ onSubmit, saving = false }: PasswordFormProps) {
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [shown, setShown] = useState<Record<Field, boolean>>({
    current: false,
    new: false,
    confirm: false,
  });
  const [touchedConfirm, setTouchedConfirm] = useState(false);

  const set = (key: keyof PasswordData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setPasswordData((prev) => ({ ...prev, [key]: e.target.value }));

  const toggle = (field: Field) => () => setShown((prev) => ({ ...prev, [field]: !prev[field] }));

  /* Validate inline and live, instead of with an `alert()` after submit.
     Telling someone their passwords do not match only once they have already
     committed is the least useful moment to tell them. */
  const mismatch =
    touchedConfirm &&
    passwordData.confirmPassword.length > 0 &&
    passwordData.newPassword !== passwordData.confirmPassword;

  const tooShort =
    passwordData.newPassword.length > 0 && passwordData.newPassword.length < MIN_LENGTH;

  const canSubmit =
    passwordData.currentPassword.length > 0 &&
    passwordData.newPassword.length >= MIN_LENGTH &&
    passwordData.newPassword === passwordData.confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(passwordData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PasswordInput
        id="currentPassword"
        label="Current password"
        value={passwordData.currentPassword}
        visible={shown.current}
        onChange={set("currentPassword")}
        onToggle={toggle("current")}
        autoComplete="current-password"
      />

      <PasswordInput
        id="newPassword"
        label="New password"
        value={passwordData.newPassword}
        visible={shown.new}
        onChange={set("newPassword")}
        onToggle={toggle("new")}
        hint={`At least ${MIN_LENGTH} characters`}
        error={tooShort ? `Use at least ${MIN_LENGTH} characters` : undefined}
        autoComplete="new-password"
      />

      <PasswordInput
        id="confirmPassword"
        label="Confirm new password"
        value={passwordData.confirmPassword}
        visible={shown.confirm}
        onChange={set("confirmPassword")}
        onToggle={toggle("confirm")}
        onBlur={() => setTouchedConfirm(true)}
        error={mismatch ? "These two don't match" : undefined}
        autoComplete="new-password"
      />

      <Button type="submit" loading={saving} disabled={!canSubmit} className="w-full sm:w-auto">
        {!saving && <FiSave className="h-4 w-4" />}
        Update password
      </Button>
    </form>
  );
}
