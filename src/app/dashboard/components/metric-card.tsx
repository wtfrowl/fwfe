import type { IconType } from "react-icons";
import { BsFuelPumpDiesel, BsHandbag, BsTriangle } from "react-icons/bs";
import { FiDollarSign, FiTruck } from "react-icons/fi";
import { HiOutlineArrowDown } from "react-icons/hi";
import { MdOutlineAccessTime } from "react-icons/md";
import { cn } from "../../../utils/cn";

interface MetricCardProps {
  title: string;
  value: string;
  loading?: boolean;
  icon: "expenses" | "profit" | "revenue" | "labour" | "distance" | "trip" | "fuel";
}

const iconMap: Record<MetricCardProps["icon"], IconType> = {
  expenses: BsHandbag,
  profit: FiDollarSign,
  revenue: HiOutlineArrowDown,
  labour: MdOutlineAccessTime,
  distance: FiTruck,
  trip: BsTriangle,
  fuel: BsFuelPumpDiesel,
};

/* Every icon previously fell back to grey because colorMap only covered four
   of the seven cases. All seven are defined now, and they use the app's
   semantic tones instead of raw Tailwind hues. */
const toneMap: Record<MetricCardProps["icon"], string> = {
  expenses: "bg-caution-soft text-caution-ink",
  profit: "bg-positive-soft text-positive-ink",
  revenue: "bg-accent-soft text-accent-ink",
  labour: "bg-critical-soft text-critical-ink",
  distance: "bg-accent-soft text-accent-ink",
  trip: "bg-ink/6 text-ink-secondary",
  fuel: "bg-ink/6 text-ink-secondary",
};

/**
 * A stat tile, not a chart. The number is the whole point, so it gets the
 * largest type on the card and tabular figures — proportional digits make a
 * row of currency values visibly ragged, and a fleet owner scans this column
 * vertically.
 */
export function MetricCard({ title, value, icon, loading = false }: MetricCardProps) {
  const Icon = iconMap[icon];

  return (
    <div className="rounded-card border border-hairline bg-surface p-5 shadow-[var(--shadow-raised)]">
      <div className="flex items-center gap-4">
        <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-chip", toneMap[icon])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-caption text-sm text-ink-secondary">{title}</p>
          {loading ? (
            <div className="mt-1.5 h-7 w-24 animate-pulse rounded-chip bg-ink/8" />
          ) : (
            <p className="truncate text-2xl font-semibold tabular-nums tracking-[-0.02em] text-ink">
              {value}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
