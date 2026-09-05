import { useState } from "react";
import { DataTable } from "../../../reuse/DataTable/DataTable";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { inputClasses } from "../../../components/ui/inputStyles";
import { InlineMessage } from "../../../components/ui/InlineMessage";
import { Sheet } from "../../../motion/Sheet";
import { BillingAPI, type Invoice } from "../../../api/billing.api";

const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

const TONE = {
  Draft: "neutral",
  Sent: "info",
  PartPaid: "warning",
  Paid: "success",
  Cancelled: "neutral",
} as const;

/**
 * Invoices, and the two things you do with one: issue it, and record what came
 * in against it.
 *
 * A draft is deliberately not shown as money owed anywhere else in the app —
 * it is a working document. Issuing is the moment it becomes a claim, and it
 * is the point at which the ledger entry is written.
 */
export function InvoiceList({
  invoices,
  onChanged,
}: {
  invoices: Invoice[];
  onChanged: () => void;
}) {
  const [payFor, setPayFor] = useState<Invoice | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("NEFT");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openPayment = (invoice: Invoice) => {
    /* Prefilled with the full balance, which is what most payments are.
       Typing the amount again from scratch is where transposition errors get
       in, and an overpayment is refused by the server anyway. */
    setAmount(String(invoice.balance));
    setMethod("NEFT");
    setReference("");
    setError(null);
    setPayFor(invoice);
  };

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      setPayFor(null);
      onChanged();
    } catch (err: any) {
      setError(err?.message ?? "That did not work.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && !payFor && <InlineMessage tone="error">{error}</InlineMessage>}

      <DataTable<Invoice>
        title="Invoices"
        subtitle="Drafts are not counted as receivables until they are issued."
        data={invoices}
        emptyMessage="No invoices yet. Raise one from the Unbilled tab."
        columns={[
          {
            key: "number",
            header: "Invoice",
            render: (i) => (
              <div>
                <div className="font-medium text-ink">{i.number}</div>
                <div className="text-xs text-ink-tertiary">
                  {typeof i.party === "object" ? i.party.name : "—"}
                </div>
              </div>
            ),
          },
          {
            key: "issueDate",
            header: "Issued",
            render: (i) => (
              <span className="text-ink-secondary">
                {new Date(i.issueDate).toLocaleDateString()}
              </span>
            ),
          },
          {
            key: "dueDate",
            header: "Due",
            render: (i) => {
              const overdue =
                new Date(i.dueDate) < new Date() && ["Sent", "PartPaid"].includes(i.status);
              return (
                <span className={overdue ? "font-medium text-critical-ink" : "text-ink-secondary"}>
                  {new Date(i.dueDate).toLocaleDateString()}
                </span>
              );
            },
          },
          {
            key: "total",
            header: "Total",
            align: "right",
            render: (i) => <span className="tabular-nums text-ink">{rupees(i.total)}</span>,
          },
          {
            key: "balance",
            header: "Outstanding",
            align: "right",
            render: (i) => (
              <span
                className={`font-semibold tabular-nums ${
                  i.balance > 0 ? "text-ink" : "text-positive-ink"
                }`}
              >
                {rupees(i.balance)}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            align: "right",
            render: (i) => <StatusBadge tone={TONE[i.status]}>{i.status}</StatusBadge>,
          },
          {
            key: "payments",
            header: "",
            align: "right",
            render: (i) =>
              i.status === "Draft" ? (
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => act(() => BillingAPI.issueInvoice(i._id))}
                >
                  Issue
                </Button>
              ) : ["Sent", "PartPaid"].includes(i.status) ? (
                <Button variant="secondary" onClick={() => openPayment(i)}>
                  Record payment
                </Button>
              ) : null,
          },
        ]}
      />

      <Sheet
        open={Boolean(payFor)}
        onClose={() => setPayFor(null)}
        title="Record payment"
        description={
          payFor
            ? `${payFor.number} — ${rupees(payFor.balance)} outstanding`
            : undefined
        }
        size="md"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setPayFor(null)} disabled={busy}>
              Cancel
            </Button>
            <Button
              loading={busy}
              onClick={() =>
                payFor &&
                act(() =>
                  BillingAPI.recordPayment(payFor._id, {
                    amount: Number(amount),
                    method,
                    reference: reference.trim() || undefined,
                  })
                )
              }
            >
              Record
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {error && <InlineMessage tone="error">{error}</InlineMessage>}

          <FormField label="Amount received" htmlFor="pay-amount" required>
            <input
              id="pay-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputClasses}
            />
          </FormField>

          {payFor && Number(amount) > payFor.balance && (
            <InlineMessage tone="warning">
              That is more than the {rupees(payFor.balance)} outstanding. Check the invoice — an
              overpayment will be refused.
            </InlineMessage>
          )}

          <FormField label="Method" htmlFor="pay-method">
            <select
              id="pay-method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className={inputClasses}
            >
              {["NEFT", "RTGS", "IMPS", "UPI", "Cash", "Cheque", "Adjustment"].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Reference" htmlFor="pay-ref" hint="UTR or cheque number, optional">
            <input
              id="pay-ref"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className={inputClasses}
            />
          </FormField>

          <p className="text-xs text-ink-tertiary">
            Paying an invoice in full also marks its trips as settled.
          </p>
        </div>
      </Sheet>
    </div>
  );
}
