import { useState } from "react";
import { FaPlus } from "react-icons/fa6";
import { DataTable } from "../../../reuse/DataTable/DataTable";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { inputClasses } from "../../../components/ui/inputStyles";
import { InlineMessage } from "../../../components/ui/InlineMessage";
import { Sheet } from "../../../motion/Sheet";
import { BillingAPI, type Party } from "../../../api/billing.api";

const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

const EMPTY = {
  name: "",
  type: "Transporter",
  gstin: "",
  contactName: "",
  contactNumber: "",
  city: "",
  state: "",
  creditDays: "30",
  openingBalance: "",
};

/**
 * The customer master.
 *
 * Trips carried a free-text `transporterName`, so "Sharma Logistics", "sharma
 * logistics" and "Sharma Log." were three different customers as far as any
 * total was concerned — which is why no receivables figure could exist. One
 * row per real business is the whole point.
 */
export function PartyList({
  parties,
  onChanged,
}: {
  parties: Party[];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await BillingAPI.createParty({
        ...form,
        creditDays: Number(form.creditDays) || 30,
        openingBalance: Number(form.openingBalance) || 0,
        gstin: form.gstin.trim().toUpperCase() || undefined,
      });
      setForm(EMPTY);
      setOpen(false);
      onChanged();
    } catch (err: any) {
      setError(err?.message ?? "Could not save that customer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <FaPlus className="mr-2 h-3 w-3" />
          Add customer
        </Button>
      </div>

      <DataTable<Party>
        title="Customers and brokers"
        subtitle="One row per business. Invoices and payments hang off these."
        data={parties}
        emptyMessage="No customers yet. Add the transporters and brokers you work with."
        columns={[
          {
            key: "name",
            header: "Name",
            render: (p) => (
              <div>
                <div className="font-medium text-ink">{p.name}</div>
                <div className="text-xs text-ink-tertiary">
                  {p.type}
                  {p.city ? ` · ${p.city}` : ""}
                </div>
              </div>
            ),
          },
          {
            key: "gstin",
            header: "GSTIN",
            render: (p) => (
              <span className="font-mono text-xs text-ink-secondary">{p.gstin || "—"}</span>
            ),
          },
          {
            key: "contactNumber",
            header: "Contact",
            render: (p) =>
              p.contactNumber ? (
                <a href={`tel:${p.contactNumber}`} className="text-accent-ink hover:underline">
                  {p.contactNumber}
                </a>
              ) : (
                <span className="text-ink-quaternary">—</span>
              ),
          },
          {
            key: "creditDays",
            header: "Credit",
            align: "center",
            render: (p) => <span className="tabular-nums">{p.creditDays}d</span>,
          },
          {
            key: "outstanding",
            header: "Outstanding",
            align: "right",
            render: (p) => (
              <span
                className={`font-semibold tabular-nums ${
                  p.outstanding > 0 ? "text-ink" : "text-ink-tertiary"
                }`}
              >
                {rupees(p.outstanding)}
              </span>
            ),
          },
        ]}
      />

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Add customer"
        description="A transporter, broker or consignor you bill."
        size="md"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving} disabled={!form.name.trim()}>
              Add customer
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {error && <InlineMessage tone="error">{error}</InlineMessage>}

          <FormField label="Business name" htmlFor="party-name" required>
            <input
              id="party-name"
              name="name"
              value={form.name}
              onChange={change}
              className={inputClasses}
              placeholder="Sharma Logistics"
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Type" htmlFor="party-type">
              <select
                id="party-type"
                name="type"
                value={form.type}
                onChange={change}
                className={inputClasses}
              >
                {["Transporter", "Broker", "Consignor", "Consignee", "Vendor"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="GSTIN"
              htmlFor="party-gstin"
              hint="Optional — checked for format"
            >
              <input
                id="party-gstin"
                name="gstin"
                value={form.gstin}
                onChange={change}
                className={`${inputClasses} font-mono uppercase`}
                placeholder="08ABCDE1234F1Z5"
                maxLength={15}
              />
            </FormField>

            <FormField label="Contact person" htmlFor="party-contact-name">
              <input
                id="party-contact-name"
                name="contactName"
                value={form.contactName}
                onChange={change}
                className={inputClasses}
              />
            </FormField>

            <FormField label="Phone" htmlFor="party-contact">
              <input
                id="party-contact"
                name="contactNumber"
                type="tel"
                value={form.contactNumber}
                onChange={change}
                className={inputClasses}
              />
            </FormField>

            <FormField label="City" htmlFor="party-city">
              <input
                id="party-city"
                name="city"
                value={form.city}
                onChange={change}
                className={inputClasses}
              />
            </FormField>

            <FormField
              label="Credit period"
              htmlFor="party-credit"
              hint="Days — sets when an invoice is overdue"
            >
              <input
                id="party-credit"
                name="creditDays"
                type="number"
                min="0"
                value={form.creditDays}
                onChange={change}
                className={inputClasses}
              />
            </FormField>
          </div>

          {/* Without this, a fleet that migrates mid-year shows every
              historical debt as already settled. */}
          <FormField
            label="Opening balance"
            htmlFor="party-opening"
            hint="What they already owed you before FleetWise. Leave blank if none."
          >
            <input
              id="party-opening"
              name="openingBalance"
              type="number"
              value={form.openingBalance}
              onChange={change}
              className={inputClasses}
              placeholder="0"
            />
          </FormField>
        </div>
      </Sheet>
    </div>
  );
}
