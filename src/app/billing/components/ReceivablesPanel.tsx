import { DataTable } from "../../../reuse/DataTable/DataTable";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { EmptyState } from "../../../components/ui/EmptyState";
import type { Receivables } from "../../../api/billing.api";

/**
 * Who owes what, and how old it is.
 *
 * Ageing buckets rather than one total, because the total on its own is not
 * an answer: ₹4 lakh outstanding is a healthy business if it is all inside the
 * credit period and a crisis if most of it is past ninety days. The buckets
 * are the ones a CA actually uses, so the screen matches the conversation the
 * owner is going to have about it.
 */

const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

const BUCKETS: { key: keyof Receivables["buckets"]; label: string; tone: string }[] = [
  { key: "current", label: "Not yet due", tone: "text-ink" },
  { key: "d1_30", label: "1–30 days", tone: "text-ink" },
  { key: "d31_60", label: "31–60 days", tone: "text-caution-ink" },
  { key: "d61_90", label: "61–90 days", tone: "text-caution-ink" },
  { key: "d90_plus", label: "90+ days", tone: "text-critical-ink" },
];

export function ReceivablesPanel({ data }: { data: Receivables }) {
  if (!data.total) {
    return (
      <EmptyState
        title="Nothing outstanding"
        description="Every invoice you have issued has been paid. Raise one from the Unbilled tab when a trip is done."
      />
    );
  }

  const overdue = data.total - data.buckets.current;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className="rounded-card border border-hairline bg-surface p-5 shadow-[var(--shadow-raised)]">
          <p className="text-caption text-sm text-ink-secondary">Total outstanding</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-[-0.02em] text-ink">
            {rupees(data.total)}
          </p>
          <p className="mt-1 text-xs text-ink-tertiary">
            across {data.invoices.length} invoice{data.invoices.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="rounded-card border border-hairline bg-surface p-5 shadow-[var(--shadow-raised)]">
          <p className="text-caption text-sm text-ink-secondary">Past due</p>
          <p
            className={`mt-1 text-2xl font-semibold tabular-nums tracking-[-0.02em] ${
              overdue > 0 ? "text-critical-ink" : "text-ink"
            }`}
          >
            {rupees(overdue)}
          </p>
          <p className="mt-1 text-xs text-ink-tertiary">
            {data.total > 0 ? `${Math.round((overdue / data.total) * 100)}% of the book` : "—"}
          </p>
        </div>

        <div className="rounded-card border border-hairline bg-surface p-5 shadow-[var(--shadow-raised)]">
          <p className="text-caption text-sm text-ink-secondary">Over 90 days</p>
          <p
            className={`mt-1 text-2xl font-semibold tabular-nums tracking-[-0.02em] ${
              data.buckets.d90_plus > 0 ? "text-critical-ink" : "text-ink"
            }`}
          >
            {rupees(data.buckets.d90_plus)}
          </p>
          {/* Named plainly. Debt this old is rarely collected in full, and a
              screen that presents it identically to last week's invoice is
              hiding the only thing worth saying about it. */}
          <p className="mt-1 text-xs text-ink-tertiary">Hardest money to collect</p>
        </div>
      </div>

      {/* The ageing bar. One row, proportional, so the shape of the book is
          legible before any number is read. */}
      <div className="rounded-card border border-hairline bg-surface p-5 shadow-[var(--shadow-raised)]">
        <p className="text-caption mb-3 text-sm text-ink-secondary">Ageing</p>
        <div className="flex h-2.5 overflow-hidden rounded-full bg-ink/8">
          {BUCKETS.map(({ key }) => {
            const value = data.buckets[key];
            if (!value) return null;
            const pct = (value / data.total) * 100;
            return (
              <div
                key={key}
                style={{ width: `${pct}%` }}
                className={
                  key === "current"
                    ? "bg-positive"
                    : key === "d90_plus"
                      ? "bg-critical"
                      : key === "d1_30"
                        ? "bg-accent"
                        : "bg-caution"
                }
              />
            );
          })}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {BUCKETS.map(({ key, label, tone }) => (
            <div key={key}>
              <p className="text-xs text-ink-tertiary">{label}</p>
              <p className={`text-sm font-semibold tabular-nums ${tone}`}>
                {rupees(data.buckets[key])}
              </p>
            </div>
          ))}
        </div>
      </div>

      <DataTable
        title="Who owes you"
        subtitle="Largest first — this is the order to make the calls in."
        data={data.parties}
        emptyMessage="Nothing outstanding."
        columns={[
          {
            key: "name",
            header: "Customer",
            render: (p: any) => (
              <div>
                <div className="font-medium text-ink">{p.name}</div>
                {p.contactNumber && (
                  <a
                    href={`tel:${p.contactNumber}`}
                    className="text-xs text-accent-ink hover:underline"
                  >
                    {p.contactNumber}
                  </a>
                )}
              </div>
            ),
          },
          {
            key: "outstanding",
            header: "Outstanding",
            align: "right",
            render: (p: any) => (
              <span className="font-semibold tabular-nums text-ink">{rupees(p.outstanding)}</span>
            ),
          },
          { key: "invoiceCount", header: "Invoices", align: "center" },
          {
            key: "overdueCount",
            header: "Overdue",
            align: "center",
            render: (p: any) =>
              p.overdueCount ? (
                <StatusBadge tone="danger">{p.overdueCount}</StatusBadge>
              ) : (
                <span className="text-ink-quaternary">—</span>
              ),
          },
          {
            key: "oldestDueDate",
            header: "Oldest due",
            align: "right",
            render: (p: any) => (
              <span className="text-ink-secondary">
                {new Date(p.oldestDueDate).toLocaleDateString()}
              </span>
            ),
          },
        ]}
      />
    </div>
  );
}
