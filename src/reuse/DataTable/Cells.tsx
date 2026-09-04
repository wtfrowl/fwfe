import { StatusBadge } from "../../components/ui/StatusBadge";

/* "Rs 12000" becomes "₹12,000" — the real symbol, and Indian digit grouping,
   which is what every other number in this app now uses. */
const rupees = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export function MoneyCell({ value }: { value: number }) {
  return <span className="font-medium tabular-nums text-ink">{rupees(value)}</span>;
}

export function ProfitBadge({ value }: { value: number }) {
  const negative = value < 0;
  return (
    <StatusBadge tone={negative ? "danger" : "success"}>
      <span className="tabular-nums">
        {/* The sign is the signal, not just the colour — a loss and a profit
            of the same size read identically in greyscale otherwise. */}
        {negative ? "−" : "+"}
        {rupees(Math.abs(value))}
      </span>
    </StatusBadge>
  );
}
