import { useMemo, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { InlineMessage } from "../../../components/ui/InlineMessage";
import { FormField } from "../../../components/ui/FormField";
import { inputClasses } from "../../../components/ui/inputStyles";
import { Sheet } from "../../../motion/Sheet";
import { BillingAPI, type Party, type UnbilledTrip } from "../../../api/billing.api";

/**
 * Trips that are finished and have never been billed.
 *
 * This is the panel that pays for the whole billing feature. A small fleet's
 * most common way of losing money is not bad debt — it is simply forgetting to
 * raise the bill on a trip that ran three weeks ago, and nothing in the
 * product previously made that visible.
 */

const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export function UnbilledPanel({
  trips,
  totalFreight,
  parties,
  onInvoiced,
}: {
  trips: UnbilledTrip[];
  totalFreight: number;
  parties: Party[];
  onInvoiced: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [partyId, setPartyId] = useState("");
  const [reverseCharge, setReverseCharge] = useState(true);
  const [gstRate, setGstRate] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectedTrips = useMemo(
    () => trips.filter((t) => selected.has(t._id)),
    [selected, trips]
  );

  const selectedTotal = selectedTrips.reduce((s, t) => s + (t.totalFare || 0), 0);

  /* Deductions already agreed on the road travel onto the invoice, so the
     preview matches what the customer will actually be asked for rather than
     the gross freight. */
  const deductions = selectedTrips.reduce(
    (s, t) => s + (t.commissionAmount || 0) + (t.shortageAmount || 0) + (t.cashAdvance || 0),
    0
  );

  const handleCreate = async () => {
    setSaving(true);
    setError(null);
    try {
      await BillingAPI.createInvoice({
        partyId,
        tripIds: [...selected],
        reverseCharge,
        gstRate: reverseCharge ? 0 : Number(gstRate),
      });
      setSelected(new Set());
      setSheetOpen(false);
      onInvoiced();
    } catch (err: any) {
      setError(err?.message ?? "Could not create that invoice.");
    } finally {
      setSaving(false);
    }
  };

  if (!trips.length) {
    return (
      <EmptyState
        title="Everything is billed"
        description="No completed trip is waiting for an invoice."
      />
    );
  }

  return (
    <div className="space-y-4">
      <InlineMessage tone="warning">
        {trips.length} completed trip{trips.length === 1 ? "" : "s"} worth{" "}
        {rupees(totalFreight)} {trips.length === 1 ? "has" : "have"} never been invoiced.
      </InlineMessage>

      <div className="overflow-hidden rounded-card border border-hairline bg-surface shadow-[var(--shadow-raised)]">
        <div className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-3">
          <div>
            <h2 className="text-base font-semibold text-ink">Unbilled trips</h2>
            <p className="text-sm text-ink-secondary">
              {selected.size
                ? `${selected.size} selected · ${rupees(selectedTotal)}`
                : "Select the trips to put on one invoice."}
            </p>
          </div>
          <Button disabled={!selected.size} onClick={() => setSheetOpen(true)}>
            Create invoice
          </Button>
        </div>

        <ul className="divide-y divide-hairline">
          {trips.map((trip) => {
            const isSelected = selected.has(trip._id);
            return (
              <li key={trip._id}>
                <label className="flex cursor-pointer items-start gap-3 px-5 py-3.5 hover:bg-ink/2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggle(trip._id)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-hairline-strong"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">
                      {trip.departureLocation} → {trip.arrivalLocation}
                    </p>
                    <p className="text-sm text-ink-secondary">
                      {trip.registrationNumber}
                      {trip.transporterName ? ` · ${trip.transporterName}` : ""}
                      {" · "}
                      {new Date(trip.arrivalDateTime || trip.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums text-ink">
                      {rupees(trip.totalFare || 0)}
                    </p>
                    <p className="text-xs text-ink-tertiary">
                      {trip.totalWeight} t × {rupees(trip.fare || 0)}
                    </p>
                  </div>
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Create invoice"
        description={`${selected.size} trip${selected.size === 1 ? "" : "s"} · ${rupees(selectedTotal)} gross freight`}
        size="md"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setSheetOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={saving} disabled={!partyId}>
              Create draft
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {error && <InlineMessage tone="error">{error}</InlineMessage>}

          {!parties.length && (
            <InlineMessage tone="warning">
              Add a customer on the Customers tab first — an invoice has to be addressed to
              somebody.
            </InlineMessage>
          )}

          <FormField label="Bill to" htmlFor="inv-party" required>
            <select
              id="inv-party"
              value={partyId}
              onChange={(e) => setPartyId(e.target.value)}
              className={inputClasses}
            >
              <option value="">Select a customer</option>
              {parties.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                  {p.gstin ? ` — ${p.gstin}` : ""}
                </option>
              ))}
            </select>
          </FormField>

          {/* Reverse charge is the norm for road freight in India: the customer
              accounts for the GST directly, so the invoice carries no tax
              lines. Defaulted on, because getting it wrong the other way puts
              tax on a bill that should not have it. */}
          <label className="flex items-start gap-2.5 text-sm text-ink-secondary">
            <input
              type="checkbox"
              checked={reverseCharge}
              onChange={(e) => setReverseCharge(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-hairline-strong"
            />
            <span>
              GST payable by the customer under reverse charge
              <span className="block text-xs text-ink-tertiary">
                Usual for goods transport. Leave this on unless you charge GST forward.
              </span>
            </span>
          </label>

          {!reverseCharge && (
            <FormField label="GST rate" htmlFor="inv-gst" hint="Percent">
              <select
                id="inv-gst"
                value={gstRate}
                onChange={(e) => setGstRate(e.target.value)}
                className={inputClasses}
              >
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
              </select>
            </FormField>
          )}

          <div className="rounded-card border border-hairline bg-canvas-sunken p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-secondary">Gross freight</span>
              <span className="tabular-nums text-ink">{rupees(selectedTotal)}</span>
            </div>
            {deductions > 0 && (
              <div className="mt-1 flex justify-between">
                <span className="text-ink-secondary">Commission, shortage and advances</span>
                <span className="tabular-nums text-ink">− {rupees(deductions)}</span>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t border-hairline pt-2 font-semibold">
              <span className="text-ink">Invoice value</span>
              <span className="tabular-nums text-ink">
                {rupees(Math.max(0, selectedTotal - deductions))}
              </span>
            </div>
          </div>

          <p className="text-xs text-ink-tertiary">
            This creates a draft you can edit. Nothing appears in receivables until you issue it.
          </p>
        </div>
      </Sheet>
    </div>
  );
}
