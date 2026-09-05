import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { InlineMessage } from "../../components/ui/InlineMessage";
import { SegmentedControl, type Segment } from "../../components/ui/SegmentedControl";
import {
  BillingAPI,
  type Invoice,
  type Party,
  type Receivables,
  type UnbilledTrip,
} from "../../api/billing.api";
import { ReceivablesPanel } from "./components/ReceivablesPanel";
import { UnbilledPanel } from "./components/UnbilledPanel";
import { InvoiceList } from "./components/InvoiceList";
import { PartyList } from "./components/PartyList";

/**
 * Billing.
 *
 * Ordered by what an owner actually opens this for. "Who owes me money" is the
 * first tab because it is the question; "what have I forgotten to bill" is the
 * second because it is the most expensive oversight; the invoice list and the
 * customer master are the machinery behind both.
 */

type Tab = "receivables" | "unbilled" | "invoices" | "parties";

export default function Billing() {
  const location = useLocation();
  const navigate = useNavigate();

  const [receivables, setReceivables] = useState<Receivables | null>(null);
  const [unbilled, setUnbilled] = useState<{ trips: UnbilledTrip[]; totalFreight: number }>({
    trips: [],
    totalFreight: 0,
  });
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [rec, unb, inv, par] = await Promise.all([
        BillingAPI.getReceivables(),
        BillingAPI.getUnbilled(),
        BillingAPI.getInvoices({ limit: 100 }),
        BillingAPI.getParties(),
      ]);

      setReceivables(rec);
      setUnbilled({ trips: unb.trips ?? [], totalFreight: unb.totalFreight ?? 0 });
      setInvoices(inv.invoices ?? []);
      setParties(par.parties ?? []);
    } catch (err) {
      console.error("Failed to load billing:", err);
      setError("Billing could not be loaded right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const active = (location.hash.replace("#", "") || "receivables") as Tab;

  const tabs: Segment<Tab>[] = [
    { label: "Receivables", value: "receivables" },
    /* The count is in the label because it is a to-do list, and a to-do list
       with a hidden length gets opened once and forgotten. */
    {
      label: unbilled.trips.length ? `Unbilled (${unbilled.trips.length})` : "Unbilled",
      value: "unbilled",
    },
    { label: "Invoices", value: "invoices" },
    { label: "Customers", value: "parties" },
  ];

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="h-9 w-48 animate-pulse rounded-chip bg-ink/8" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-card bg-ink/6" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-card bg-ink/6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl space-y-5">
        <PageHeader title="Billing" />
        <InlineMessage tone="error">{error}</InlineMessage>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Billing"
        description="What you are owed, what you have not billed yet, and who you bill it to."
      />

      <div className="sticky top-16 z-10 -mx-1 px-1 py-2">
        <SegmentedControl
          segments={tabs}
          value={active}
          onChange={(id) => navigate({ hash: `#${id}` })}
          className="material-thin shadow-[var(--shadow-hairline)] ring-1 ring-hairline"
        />
      </div>

      {active === "receivables" && receivables && <ReceivablesPanel data={receivables} />}

      {active === "unbilled" && (
        <UnbilledPanel
          trips={unbilled.trips}
          totalFreight={unbilled.totalFreight}
          parties={parties}
          onInvoiced={load}
        />
      )}

      {active === "invoices" && <InvoiceList invoices={invoices} onChanged={load} />}

      {active === "parties" && <PartyList parties={parties} onChanged={load} />}
    </div>
  );
}
