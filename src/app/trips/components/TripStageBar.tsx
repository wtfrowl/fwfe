import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Button } from "../../../components/ui/Button";

/**
 * Where a trip is, and what can happen to it next.
 *
 * The lifecycle used to be four values — Running, ApprovalRequested, Completed,
 * Settled — so a truck waiting to be loaded, a truck loading and a truck on
 * the highway were all "Running". The bar makes the stages visible; the
 * buttons are generated from what the server says this role may do, rather
 * than from a chain of conditionals here that would drift from the server's
 * rules the first time either changed.
 */

/** The happy path, in order. Cancelled sits outside it, by design. */
const STAGES = ["Assigned", "Loading", "Running", "Unloading", "Completed", "Settled"] as const;

const STAGE_LABEL: Record<string, string> = {
  Assigned: "Assigned",
  Loading: "Loading",
  Running: "On the road",
  Unloading: "Unloading",
  ApprovalRequested: "Awaiting sign-off",
  Completed: "Completed",
  Settled: "Settled",
  Cancelled: "Cancelled",
};

/* Mirrors the server's transition table. Duplicated deliberately and kept
   small: the client needs to know which buttons to draw before it makes a
   request, and the server re-checks every move anyway — so a disagreement
   here is a cosmetic bug, never a permissions hole. */
const TRANSITIONS: Record<string, { to: string; roles: string[]; label: string }[]> = {
  Assigned: [
    { to: "Loading", roles: ["owner", "driver"], label: "Start loading" },
    { to: "Running", roles: ["owner", "driver"], label: "Start trip" },
    { to: "Cancelled", roles: ["owner"], label: "Cancel trip" },
  ],
  Loading: [
    { to: "Running", roles: ["owner", "driver"], label: "Loaded — start trip" },
    { to: "Cancelled", roles: ["owner"], label: "Cancel trip" },
  ],
  Running: [
    { to: "Unloading", roles: ["owner", "driver"], label: "Reached — start unloading" },
    { to: "ApprovalRequested", roles: ["driver"], label: "Request sign-off" },
    { to: "Completed", roles: ["owner"], label: "Mark completed" },
    { to: "Cancelled", roles: ["owner"], label: "Cancel trip" },
  ],
  Unloading: [
    { to: "ApprovalRequested", roles: ["driver"], label: "Request sign-off" },
    { to: "Completed", roles: ["owner"], label: "Mark completed" },
    { to: "Cancelled", roles: ["owner"], label: "Cancel trip" },
  ],
  ApprovalRequested: [{ to: "Completed", roles: ["owner"], label: "Approve completion" }],
  Completed: [{ to: "Settled", roles: ["owner"], label: "Finalise settlement" }],
  Settled: [],
  Cancelled: [],
};

export function availableMoves(status: string, role: string | null) {
  return (TRANSITIONS[status] ?? []).filter((t) => role && t.roles.includes(role));
}

export function TripStageBar({
  status,
  role,
  busy,
  onMove,
}: {
  status: string;
  role: string | null;
  busy?: boolean;
  onMove: (to: string, label: string) => void;
}) {
  const cancelled = status === "Cancelled";
  /* Awaiting sign-off sits between Unloading and Completed on the timeline,
     so the bar advances to that point rather than falling back to the start. */
  const timelineStatus = status === "ApprovalRequested" ? "Unloading" : status;
  const currentIndex = STAGES.indexOf(timelineStatus as (typeof STAGES)[number]);

  const moves = availableMoves(status, role);

  return (
    <div className="space-y-4 rounded-card border border-hairline bg-surface p-5 shadow-[var(--shadow-raised)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-caption text-sm text-ink-secondary">Stage</p>
          <p className="text-lg font-semibold text-ink">{STAGE_LABEL[status] ?? status}</p>
        </div>
        <StatusBadge
          tone={
            cancelled
              ? "danger"
              : status === "Settled"
                ? "success"
                : status === "Completed"
                  ? "success"
                  : status === "ApprovalRequested"
                    ? "warning"
                    : "info"
          }
        >
          {STAGE_LABEL[status] ?? status}
        </StatusBadge>
      </div>

      {cancelled ? (
        <p className="text-sm text-critical-ink">
          This trip was cancelled. Its record is kept, and its truck and drivers were released.
        </p>
      ) : (
        <ol className="flex items-center gap-1">
          {STAGES.map((stage, index) => {
            const done = currentIndex >= 0 && index < currentIndex;
            const here = index === currentIndex;
            return (
              <li key={stage} className="flex flex-1 flex-col gap-1.5">
                <span
                  className={`h-1.5 rounded-full ${
                    done ? "bg-positive" : here ? "bg-accent" : "bg-ink/10"
                  }`}
                />
                <span
                  className={`truncate text-[0.6875rem] ${
                    here ? "font-semibold text-ink" : "text-ink-tertiary"
                  }`}
                >
                  {STAGE_LABEL[stage]}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {moves.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-hairline pt-4">
          {moves.map((move) => (
            <Button
              key={move.to}
              /* Cancelling is destructive and sits apart from the forward
                 moves, so it never reads as the next step. */
              variant={move.to === "Cancelled" ? "secondary" : "primary"}
              disabled={busy}
              onClick={() => onMove(move.to, move.label)}
            >
              {move.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
