import { FaFileContract, FaScrewdriverWrench, FaUserTie } from "react-icons/fa6";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { EmptyState } from "../../../components/ui/EmptyState";
import type { ComplianceItem } from "../../../api/fleetHealth.api";

/**
 * Everything that lapses, in one list.
 *
 * A table was the obvious shape and the wrong one: the three kinds of row
 * carry different measures — a permit expires on a date, an oil change is due
 * at a distance, and a licence is both a date and a person — so a shared
 * column set ends up two-thirds empty. A list of statements reads faster and
 * does not pretend the three are the same.
 */

const ICONS = {
  document: FaFileContract,
  driver: FaUserTie,
  maintenance: FaScrewdriverWrench,
} as const;

const TONE = {
  expired: "danger",
  critical: "danger",
  warning: "warning",
  ok: "neutral",
} as const;

/**
 * The deadline in words.
 *
 * "in 3 days" and "12 days ago" beat a date, because the reader's actual
 * question is how much time is left, not what the calendar says — and a date
 * makes them do the subtraction themselves.
 */
const deadline = (item: ComplianceItem) => {
  const parts: string[] = [];

  if (item.daysRemaining !== null) {
    const d = item.daysRemaining;
    parts.push(
      d < 0
        ? `${Math.abs(d)} day${Math.abs(d) === 1 ? "" : "s"} overdue`
        : d === 0
          ? "due today"
          : `in ${d} day${d === 1 ? "" : "s"}`
    );
  }

  if (item.kmRemaining !== null) {
    const km = Math.round(item.kmRemaining);
    parts.push(
      km < 0
        ? `${Math.abs(km).toLocaleString("en-IN")} km overdue`
        : `${km.toLocaleString("en-IN")} km to go`
    );
  }

  return parts.join(" · ") || "No deadline recorded";
};

export function ComplianceList({ items }: { items: ComplianceItem[] }) {
  if (!items.length) {
    return (
      <EmptyState
        title="Nothing lapsing"
        description="No documents, licences or services are due inside this window. Widen it to look further ahead."
      />
    );
  }

  return (
    <ul className="divide-y divide-hairline overflow-hidden rounded-card border border-hairline bg-surface shadow-[var(--shadow-raised)]">
      {items.map((item) => {
        const Icon = ICONS[item.kind];
        const expired = item.severity === "expired";

        return (
          <li
            key={`${item.kind}-${item.entityId}-${item.what}`}
            className="flex items-start gap-3 px-4 py-3.5 sm:px-5"
          >
            <span
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                expired ? "bg-critical-soft text-critical-ink" : "bg-ink/6 text-ink-tertiary"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink">
                {item.what}
                <span className="text-ink-tertiary"> · {item.subject}</span>
              </p>
              <p className="mt-0.5 text-sm text-ink-secondary">
                {deadline(item)}
                {item.dueDate ? (
                  <span className="text-ink-tertiary">
                    {" "}
                    ({new Date(item.dueDate).toLocaleDateString()})
                  </span>
                ) : null}
              </p>
            </div>

            <StatusBadge tone={TONE[item.severity]}>
              {expired ? "Expired" : item.severity === "critical" ? "Urgent" : "Soon"}
            </StatusBadge>
          </li>
        );
      })}
    </ul>
  );
}
