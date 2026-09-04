import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { spring } from "../../../motion/springs";
import { cn } from "../../../utils/cn";
import type { ITyre } from "../../../types/tyre";
import { TreadMeter } from "./TreadMeter";
import {
  costPerKm,
  formatCpk,
  formatKm,
  positionLabel,
  refId,
  refReg,
  statusLabel,
  statusTone,
  treadHealth,
} from "../lib/tyre-standards";

interface Props {
  tyres: ITyre[];
  /** Offered on stock and fitted tyres alike — fit it, or move it. */
  onFit?: (tyre: ITyre) => void;
  onRemove?: (tyre: ITyre) => void;
  canManage?: boolean;
}

const COLUMNS = ["Tyre", "Fitment", "Status", "On", "Tread", "Cost/km", ""];

export function TyreTable({ tyres, onFit, onRemove, canManage = false }: Props) {
  const navigate = useNavigate();

  return (
    <>
      {/* --- Desktop --- */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-hairline">
              {COLUMNS.map((h, i) => (
                <th
                  key={h || `actions-${i}`}
                  scope="col"
                  className={cn(
                    "text-caption px-5 py-3 text-left text-xs font-semibold text-ink-tertiary uppercase",
                    !h && "sr-only"
                  )}
                >
                  {h || "Actions"}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tyres.map((tyre) => {
              const cpk = costPerKm(tyre.purchasePrice, tyre.totalKmRun);

              return (
                <tr
                  key={tyre._id}
                  onClick={() => navigate(`${tyre._id}`)}
                  className="cursor-pointer border-b border-hairline/70 transition-colors duration-150 last:border-0 hover:bg-ink/3"
                >
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-ink">{tyre.tyreNumber}</div>
                    <div className="text-xs text-ink-tertiary">
                      {tyre.brand} {tyre.model}
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="text-sm text-ink">{tyre.size}</div>
                    <div className="text-xs text-ink-tertiary">
                      {tyre.axleApplication && tyre.axleApplication !== "All"
                        ? `${tyre.axleApplication} axle`
                        : "All position"}
                      {tyre.retreadCount ? ` · retread ×${tyre.retreadCount}` : ""}
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    <StatusBadge tone={statusTone(tyre.status)}>
                      {statusLabel(tyre.status)}
                    </StatusBadge>
                  </td>

                  <td className="px-5 py-3.5 text-sm">
                    <Location tyre={tyre} />
                  </td>

                  <td className="w-40 px-5 py-3.5">
                    <TreadMeter
                      current={tyre.currentTreadDepth}
                      initial={tyre.initialTreadDepth}
                    />
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="text-sm font-medium text-ink tabular-nums">
                      {formatCpk(cpk)}
                    </div>
                    <div className="text-xs text-ink-tertiary tabular-nums">
                      {formatKm(tyre.totalKmRun)}
                    </div>
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    {canManage ? (
                      <RowActions tyre={tyre} onFit={onFit} onRemove={onRemove} />
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* --- Mobile --- */}
      <div className="space-y-3 p-3 md:hidden">
        {tyres.map((tyre) => (
          <div
            key={tyre._id}
            className="rounded-card border border-hairline bg-surface p-4 shadow-[var(--shadow-hairline)]"
          >
            <button
              type="button"
              onClick={() => navigate(`${tyre._id}`)}
              className="flex w-full items-start justify-between gap-3 text-left"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{tyre.tyreNumber}</p>
                <p className="truncate text-sm text-ink-secondary">
                  {tyre.brand} {tyre.model}
                </p>
                <p className="text-xs text-ink-tertiary">{tyre.size}</p>
              </div>
              <StatusBadge tone={statusTone(tyre.status)}>{statusLabel(tyre.status)}</StatusBadge>
            </button>

            <TreadMeter
              className="mt-3"
              current={tyre.currentTreadDepth}
              initial={tyre.initialTreadDepth}
            />

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-hairline pt-3 text-sm">
              <Location tyre={tyre} />
              {canManage ? <RowActions tyre={tyre} onFit={onFit} onRemove={onRemove} /> : null}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Location({ tyre }: { tyre: ITyre }) {
  const navigate = useNavigate();
  const reg = refReg(tyre.currentTruckId);

  if (tyre.status !== "Mounted" || !refId(tyre.currentTruckId)) {
    return (
      <span className="text-ink-tertiary">
        {tyre.status === "Spare" ? "In stock" : statusLabel(tyre.status)}
      </span>
    );
  }

  return (
    <span className="min-w-0">
      <button
        type="button"
        className="truncate font-medium text-accent hover:underline"
        onClick={(e) => {
          e.stopPropagation();
          if (reg) navigate(`/owner-home/mytrucks/${reg}`);
        }}
      >
        {reg || "Fitted"}
      </button>
      <span className="block text-xs text-ink-tertiary">{positionLabel(tyre.position)}</span>
    </span>
  );
}

/**
 * One verb per row, chosen from the tyre's own state. A stock tyre can be
 * fitted; a fitted one can be moved or taken off; a scrapped one can do
 * neither. Rendering all three and disabling two is just noise the eye has to
 * filter on every row.
 */
function RowActions({
  tyre,
  onFit,
  onRemove,
}: {
  tyre: ITyre;
  onFit?: (tyre: ITyre) => void;
  onRemove?: (tyre: ITyre) => void;
}) {
  if (tyre.status === "Scrapped" || tyre.status === "SentForRetreading") return null;

  const fitted = tyre.status === "Mounted";
  const health = treadHealth(tyre.currentTreadDepth, tyre.initialTreadDepth);

  return (
    <div className="flex items-center justify-end gap-1.5">
      {fitted && onRemove ? (
        <MiniAction
          label="Take off"
          tone={health.verdict === "illegal" ? "danger" : "quiet"}
          onClick={() => onRemove(tyre)}
        />
      ) : null}
      {onFit ? (
        <MiniAction label={fitted ? "Move" : "Fit"} tone="accent" onClick={() => onFit(tyre)} />
      ) : null}
    </div>
  );
}

function MiniAction({
  label,
  tone,
  onClick,
}: {
  label: string;
  tone: "accent" | "quiet" | "danger";
  onClick: () => void;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={(e) => {
        /* The whole row navigates. An action inside it must not. */
        e.stopPropagation();
        onClick();
      }}
      whileTap={reduced ? { opacity: 0.7 } : { scale: 0.95 }}
      transition={spring.snappy}
      className={cn(
        "rounded-chip px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap",
        "transition-colors duration-150 ease-[var(--ease-out-quart)]",
        tone === "accent" && "bg-accent-soft text-accent-ink ring-1 ring-inset ring-accent/20 hover:bg-accent-soft/70",
        tone === "quiet" && "text-ink-secondary ring-1 ring-inset ring-hairline hover:bg-ink/6 hover:text-ink",
        tone === "danger" && "bg-critical-soft text-critical-ink ring-1 ring-inset ring-critical/25 hover:bg-critical-soft/70"
      )}
    >
      {label}
    </motion.button>
  );
}
