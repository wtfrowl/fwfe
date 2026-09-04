import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBoxOpen, FaExchangeAlt, FaPlus } from "react-icons/fa";
import { getTrucks, getTyres } from "../../../api";
import { toast } from "../../../store/notifications/toastStore";
import { Button } from "../../../components/ui/Button";
import { InlineMessage } from "../../../components/ui/InlineMessage";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { inputClasses } from "../../../components/ui/inputStyles";
import { cn } from "../../../utils/cn";
import type { ITyre } from "../../../types/tyre";
import { AxleDiagram } from "./AxleDiagram";
import { TreadMeter } from "./TreadMeter";
import { FitTyreSheet, type FitTruck } from "../modals/FitTyreSheet";
import { RemoveTyreSheet } from "../modals/RemoveTyreSheet";
import {
  AXLE_LAYOUTS,
  TREAD,
  type WheelPosition,
  inferLayoutId,
  layoutById,
  wheelCount,
  needsAttention,
  positionCode,
  positionLabel,
  refId,
  treadHealth,
} from "../lib/tyre-standards";

/**
 * The tyres on one truck.
 *
 * What this replaces was a grid of cards headed "Tyre Config" that listed
 * whatever happened to be mounted, in no particular order, with no sense of
 * where on the vehicle anything was. Fitting meant a dropdown of seven prose
 * positions; removing meant `confirm()` then `prompt("Enter Reason")`.
 *
 * Here the vehicle is the interface. Tap an empty hub to fit something to it;
 * tap a fitted one to move it or take it off. The position is chosen by
 * pointing at it, which is both faster than a dropdown and impossible to get
 * wrong in the way a dropdown is.
 */

interface TruckTyrePanelProps {
  truck: FitTruck;
  /** Somewhere else on the page shows a tyre count worth refreshing. */
  onChanged?: () => void;
  /** Layout changes are saved by the parent, which owns the truck record. */
  onLayoutChange?: (layout: string) => void;
  canManage?: boolean;
}

export function TruckTyrePanel({
  truck,
  onChanged,
  onLayoutChange,
  canManage = true,
}: TruckTyrePanelProps) {
  const navigate = useNavigate();

  const [tyres, setTyres] = useState<ITyre[]>([]);
  const [trucks, setTrucks] = useState<FitTruck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<string | null>(null);
  const [fitting, setFitting] = useState<{ tyre: ITyre | null; position: string | null } | null>(
    null
  );
  const [removing, setRemoving] = useState<ITyre | null>(null);

  const fetchTyres = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getTyres();
      setTyres(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error("Error fetching tyres:", err);
      setError("Could not load the tyre inventory.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTyres();
  }, [fetchTyres]);

  /* The rest of the fleet, so a tyre can be sent straight to another truck
     rather than going to stock and being fitted again. A failure here only
     costs the cross-truck option, so it does not surface as an error. */
  useEffect(() => {
    getTrucks()
      .then((response) => {
        const list = Array.isArray(response) ? response : (response?.trucks ?? []);
        setTrucks(
          (list as Array<Record<string, unknown>>).map((t) => ({
            _id: String(t._id),
            registrationNumber: String(t.registrationNumber ?? t.regNo ?? ""),
            axleLayout: (t.axleLayout as string) ?? null,
            totalKm: (t.totalKm as number) ?? null,
          }))
        );
      })
      .catch((err) => console.error("Error fetching trucks:", err));
  }, []);

  const fitted = useMemo(
    () => tyres.filter((t) => t.status === "Mounted" && refId(t.currentTruckId) === truck._id),
    [tyres, truck._id]
  );

  const layout = useMemo(
    () => layoutById(truck.axleLayout || inferLayoutId(fitted.length)),
    [truck.axleLayout, fitted.length]
  );

  const selectedTyre = useMemo(
    () => fitted.find((t) => positionCode(t.position) === selected) ?? null,
    [fitted, selected]
  );

  const attention = fitted.filter((t) =>
    needsAttention(t.currentTreadDepth, t.initialTreadDepth)
  );

  const applyUpdate = (updated: ITyre) => {
    setTyres((prev) => {
      const exists = prev.some((t) => t._id === updated._id);
      return exists
        ? prev.map((t) => (t._id === updated._id ? { ...t, ...updated } : t))
        : [...prev, updated];
    });
    onChanged?.();
  };

  const handleSelect = (position: WheelPosition, tyre: ITyre | null) => {
    if (!canManage) return;
    /* Tapping an empty hub opens the fitting sheet on that hub — the tap has
       already said where, so asking again would be asking twice. */
    if (!tyre) {
      setSelected(position.code);
      setFitting({ tyre: null, position: position.code });
      return;
    }
    setSelected((prev) => (prev === position.code ? null : position.code));
  };

  return (
    <div className="rounded-card border border-hairline bg-surface p-4 shadow-[var(--shadow-raised)] sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">Tyres</h2>
          <p className="mt-0.5 text-sm text-ink-secondary">
            {layout.label} · {fitted.length} of {wheelCount(layout)} hubs filled
            {attention.length > 0 ? ` · ${attention.length} needing attention` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onLayoutChange && canManage && (
            <select
              className={cn(inputClasses, "h-9 w-auto text-xs")}
              value={layout.id}
              onChange={(e) => onLayoutChange(e.target.value)}
              aria-label="Axle configuration"
            >
              {AXLE_LAYOUTS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label} · {l.drive}
                </option>
              ))}
            </select>
          )}

          {canManage && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setFitting({ tyre: null, position: null })}
            >
              <FaPlus className="h-3 w-3" />
              Fit a tyre
            </Button>
          )}
        </div>
      </div>

      <InlineMessage tone="error">{error}</InlineMessage>

      {attention.length > 0 && (
        <div className="mb-5">
          <InlineMessage tone="warning">
            {attention.length === 1
              ? `${attention[0].tyreNumber} at ${positionLabel(attention[0].position)} is at ${attention[0].currentTreadDepth} mm.`
              : `${attention.length} tyres on this truck are at or near the ${TREAD.pullPoint} mm pull point.`}
          </InlineMessage>
        </div>
      )}

      {loading ? (
        <div className="h-64 animate-pulse rounded-card bg-ink/6" />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[auto_minmax(0,1fr)]">
          <div className="rounded-card border border-hairline bg-canvas-sunken/50 p-4">
            <AxleDiagram
              layout={layout}
              tyres={fitted}
              selected={selected}
              onSelect={handleSelect}
              interactive={canManage}
            />
          </div>

          {/* The panel beside the diagram: what is on the hub you tapped, and
              what you can do with it. Empty until something is selected —
              actions for a tyre you have not pointed at are just clutter. */}
          <div className="min-w-0">
            {selectedTyre ? (
              <div className="rounded-card border border-hairline bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => navigate(`/owner-home/tyre/${selectedTyre._id}`)}
                      className="truncate text-base font-semibold text-ink hover:text-accent"
                    >
                      {selectedTyre.tyreNumber}
                    </button>
                    <p className="truncate text-sm text-ink-secondary">
                      {selectedTyre.brand} {selectedTyre.model} · {selectedTyre.size}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-tertiary">
                      {positionLabel(selectedTyre.position)}
                    </p>
                  </div>
                  <StatusBadge
                    tone={
                      treadHealth(
                        selectedTyre.currentTreadDepth,
                        selectedTyre.initialTreadDepth
                      ).tone
                    }
                  >
                    {
                      treadHealth(
                        selectedTyre.currentTreadDepth,
                        selectedTyre.initialTreadDepth
                      ).label
                    }
                  </StatusBadge>
                </div>

                <TreadMeter
                  className="mt-4"
                  current={selectedTyre.currentTreadDepth}
                  initial={selectedTyre.initialTreadDepth}
                />

                {canManage && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setFitting({ tyre: selectedTyre, position: null })}
                    >
                      <FaExchangeAlt className="h-3 w-3" />
                      Move
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setRemoving(selectedTyre)}>
                      <FaBoxOpen className="h-3 w-3" />
                      Take off
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/owner-home/tyre/${selectedTyre._id}`)}
                    >
                      Full history
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 rounded-card border border-dashed border-hairline-strong bg-canvas-sunken/40 px-6 py-8 text-center">
                <p className="text-sm font-medium text-ink-secondary">
                  {fitted.length === 0 ? "Nothing fitted yet" : "Tap a wheel"}
                </p>
                <p className="max-w-xs text-xs leading-relaxed text-ink-tertiary">
                  {fitted.length === 0
                    ? "Tap any hub on the diagram to fit a tyre from stock to it."
                    : "Tap a filled hub to see the tyre on it, move it, or take it off. Tap an empty one to fit something."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {canManage && (
        <>
          <FitTyreSheet
            open={Boolean(fitting)}
            onClose={() => setFitting(null)}
            onDone={(updated) => {
              applyUpdate(updated);
              setFitting(null);
              setSelected(positionCode(updated.position));
              toast.success(
                fitting?.tyre ? "Tyre moved" : "Tyre fitted",
                `${updated.tyreNumber} at ${positionLabel(updated.position)}.`
              );
            }}
            tyres={tyres}
            truck={truck}
            otherTrucks={trucks}
            subject={fitting?.tyre ?? null}
            initialPosition={fitting?.position ?? null}
          />

          <RemoveTyreSheet
            open={Boolean(removing)}
            onClose={() => setRemoving(null)}
            tyre={removing}
            odometer={truck.totalKm ?? null}
            onDone={(updated) => {
              applyUpdate(updated);
              setRemoving(null);
              setSelected(null);
              toast.success("Tyre taken off", `${updated.tyreNumber} is off ${truck.registrationNumber}.`);
            }}
          />
        </>
      )}
    </div>
  );
}
