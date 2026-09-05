import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaBoxOpen,
  FaCheckCircle,
  FaExchangeAlt,
  FaHistory,
  FaPencilAlt,
  FaRoad,
  FaSearchPlus,
  FaTruck,
} from "react-icons/fa";
import { getTyreById, getTrucks } from "../../../api";
import { toast } from "../../../store/notifications/toastStore";
import { InlineMessage } from "../../../components/ui/InlineMessage";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Button } from "../../../components/ui/Button";
import { DetailPage, DetailHeader, BackButton } from "../../../components/ui/DetailPage";
import { RevealGroup, RevealItem } from "../../../motion";
import { cn } from "../../../utils/cn";
import type { ITyre, ITyreHistory } from "../../../types/tyre";
import { TreadMeter } from "./TreadMeter";
import { InspectTyreSheet } from "../modals/InspectTyreSheet";
import { EditTyreSheet } from "../modals/EditTyreSheet";
import { FitTyreSheet, type FitTruck } from "../modals/FitTyreSheet";
import { RemoveTyreSheet } from "../modals/RemoveTyreSheet";
import { RetreadSheet } from "../modals/RetreadSheet";
import {
  TREAD,
  costPerKm,
  formatCurrency,
  formatKm,
  positionLabel,
  projectedKmRemaining,
  refId,
  refReg,
  statusLabel,
  statusTone,
  treadHealth,
  wearRate,
} from "../lib/tyre-standards";

/**
 * One casing, everything known about it.
 *
 * The page it replaces answered "how deep is the tread" and nothing else. It
 * could not say what the tyre had cost to run, how fast it was wearing, how
 * long it had left, or where it had been — even though the history to compute
 * all four was already in the record, rendered as a five-column table nobody
 * could read a sequence out of.
 */

const TyreDetailsSkeleton = () => (
  <DetailPage>
    <header className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-ink/8" />
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-48 animate-pulse rounded-chip bg-ink/8" />
            <div className="h-6 w-24 animate-pulse rounded-full bg-ink/8" />
          </div>
          <div className="h-4 w-40 animate-pulse rounded-chip bg-ink/8" />
        </div>
      </div>
      <div className="h-11 w-32 animate-pulse rounded-control bg-ink/8" />
    </header>

    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-44 animate-pulse rounded-card bg-ink/6" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-card bg-ink/6" />
    </div>
  </DetailPage>
);

export default function TyreDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tyre, setTyre] = useState<ITyre | null>(null);
  const [trucks, setTrucks] = useState<FitTruck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [inspecting, setInspecting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [fitting, setFitting] = useState(false);
  const [removing, setRemoving] = useState(false);
  /* null when closed; otherwise which half of the retread cycle is open. */
  const [retreading, setRetreading] = useState<"send" | "return" | null>(null);

  const fetchTyreDetails = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await getTyreById(id);
      setTyre(response);
    } catch (err) {
      console.error("Error fetching tyre details:", err);
      setError("Failed to load tyre details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTyreDetails();
  }, [fetchTyreDetails]);

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

  const truckId = refId(tyre?.currentTruckId);
  const currentTruck = useMemo(
    () => trucks.find((t) => t._id === truckId) ?? trucks[0] ?? null,
    [trucks, truckId]
  );

  if (loading) return <TyreDetailsSkeleton />;

  if (error || !tyre) {
    return (
      <DetailPage>
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-2xl font-semibold text-ink">Tyre</h1>
        </div>
        <InlineMessage tone="error">{error || "We couldn't find that tyre."}</InlineMessage>
      </DetailPage>
    );
  }

  const health = treadHealth(tyre.currentTreadDepth, tyre.initialTreadDepth);
  const cpk = costPerKm(tyre.purchasePrice, tyre.totalKmRun);
  const rate = wearRate(tyre.initialTreadDepth, tyre.currentTreadDepth, tyre.totalKmRun);
  const projected = projectedKmRemaining(
    tyre.initialTreadDepth,
    tyre.currentTreadDepth,
    tyre.totalKmRun
  );

  const fitted = tyre.status === "Mounted";
  const retired = tyre.status === "Scrapped";
  const reg = refReg(tyre.currentTruckId);

  return (
    <DetailPage>
      <DetailHeader
        title={tyre.tyreNumber}
        badge={<StatusBadge tone={statusTone(tyre.status)}>{statusLabel(tyre.status)}</StatusBadge>}
        subtitle={`${tyre.brand}${tyre.model ? ` ${tyre.model}` : ""} · ${tyre.size}${
          tyre.axleApplication && tyre.axleApplication !== "All"
            ? ` · ${tyre.axleApplication} axle`
            : ""
        }`}
        actions={
          retired ? (
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <FaPencilAlt className="h-3.5 w-3.5" />
              Edit details
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setEditing(true)}>
                <FaPencilAlt className="h-3.5 w-3.5" />
                Edit
              </Button>
              {fitted && (
                <Button variant="secondary" onClick={() => setRemoving(true)}>
                  <FaBoxOpen className="h-3.5 w-3.5" />
                  Take off
                </Button>
              )}
              {trucks.length > 0 && tyre.status !== "SentForRetreading" && (
                <Button variant="secondary" onClick={() => setFitting(true)}>
                  <FaExchangeAlt className="h-3.5 w-3.5" />
                  {fitted ? "Move" : "Fit to truck"}
                </Button>
              )}
              {/* A casing is only sendable when it is off the truck, and only
                  returnable when it is actually away — so the two never appear
                  together and neither shows when it cannot apply. */}
              {tyre.status === "Spare" && (
                <Button variant="secondary" onClick={() => setRetreading("send")}>
                  Send for retread
                </Button>
              )}
              {tyre.status === "SentForRetreading" && (
                <Button onClick={() => setRetreading("return")}>Back from retread</Button>
              )}
              <Button onClick={() => setInspecting(true)}>
                <FaSearchPlus className="h-3.5 w-3.5" />
                Log inspection
              </Button>
            </>
          )
        }
      />

      {health.verdict === "illegal" && (
        <InlineMessage tone="error">
          At {tyre.currentTreadDepth} mm this tyre is below the {TREAD.legalMin} mm legal minimum
          for a transport vehicle. Take it off the road.
        </InlineMessage>
      )}
      {health.verdict === "replaceNow" && (
        <InlineMessage tone="warning">
          At the {TREAD.pullPoint} mm pull point. Change it out now while the casing is still worth
          retreading.
        </InlineMessage>
      )}

      <RevealGroup className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* --- Tread --- */}
        <RevealItem>
          <Card
            icon={<FaRoad />}
            iconTone="accent"
            label="Tread"
            action={
              !retired ? (
                <button
                  type="button"
                  onClick={() => setInspecting(true)}
                  className="text-xs font-semibold text-accent transition-colors duration-150 hover:text-accent-ink"
                >
                  Measure
                </button>
              ) : null
            }
          >
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold text-ink tabular-nums">
                {tyre.currentTreadDepth}
              </span>
              <span className="text-base text-ink-tertiary">mm</span>
              <StatusBadge tone={health.tone} className="ml-auto">
                {health.label}
              </StatusBadge>
            </div>

            <TreadMeter
              className="mt-3"
              current={tyre.currentTreadDepth}
              initial={tyre.initialTreadDepth}
              showLabel={false}
            />

            <dl className="mt-3 space-y-1.5 text-xs">
              <Row term="New depth" detail={`${tyre.initialTreadDepth} mm`} />
              <Row term="Pull point" detail={`${TREAD.pullPoint} mm`} />
              <Row
                term="Wear rate"
                detail={rate ? `${rate.toFixed(2)} mm / 1,000 km` : "Not enough distance yet"}
              />
            </dl>
          </Card>
        </RevealItem>

        {/* --- Where it is --- */}
        <RevealItem>
          <Card icon={<FaTruck />} iconTone="accent" label="Where it is">
            {fitted && reg ? (
              <>
                <p className="text-lg font-semibold text-ink">{reg}</p>
                <p className="mt-1 text-sm text-ink-secondary">{positionLabel(tyre.position)}</p>
                <button
                  type="button"
                  onClick={() => navigate(`/owner-home/mytrucks/${reg}`)}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-accent transition-colors duration-150 hover:text-accent-ink"
                >
                  Open truck
                  <FaArrowRight className="h-2.5 w-2.5" />
                </button>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold text-ink-secondary">
                  {statusLabel(tyre.status)}
                </p>
                <p className="mt-1 text-sm text-ink-tertiary">
                  {tyre.status === "Spare"
                    ? "On the shelf, ready to fit."
                    : tyre.status === "SentForRetreading"
                      ? "With the retreader."
                      : "Out of the fleet."}
                </p>
                {tyre.status === "Spare" && trucks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFitting(true)}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-accent transition-colors duration-150 hover:text-accent-ink"
                  >
                    Fit it to a truck
                    <FaArrowRight className="h-2.5 w-2.5" />
                  </button>
                )}
              </>
            )}

            {tyre.retreadCount ? (
              <p className="mt-3 text-xs text-ink-tertiary">
                Retreaded {tyre.retreadCount} {tyre.retreadCount === 1 ? "time" : "times"}
              </p>
            ) : null}
          </Card>
        </RevealItem>

        {/* --- What it costs --- */}
        <RevealItem>
          <Card icon={<FaCheckCircle />} iconTone="positive" label="Life & cost">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold text-ink tabular-nums">
                {cpk == null ? "—" : `₹${cpk.toFixed(2)}`}
              </span>
              <span className="text-base text-ink-tertiary">per km</span>
            </div>

            <dl className="mt-3 space-y-1.5 text-xs">
              <Row term="Distance run" detail={formatKm(tyre.totalKmRun)} />
              <Row
                term="Estimated life left"
                detail={projected == null ? "Not enough distance yet" : formatKm(projected)}
              />
              <Row term="Paid" detail={formatCurrency(tyre.purchasePrice)} />
              <Row term="Vendor" detail={tyre.vendorName || "—"} />
              <Row
                term="Bought"
                detail={
                  tyre.purchaseDate ? new Date(tyre.purchaseDate).toLocaleDateString() : "—"
                }
              />
            </dl>
          </Card>
        </RevealItem>
      </RevealGroup>

      <TyreTimeline history={tyre.history ?? []} />

      {/* ---- Sheets ---- */}
      <InspectTyreSheet
        open={inspecting}
        onClose={() => setInspecting(false)}
        tyre={tyre}
        onDone={(updated) => {
          setTyre(updated);
          setInspecting(false);
          toast.success("Inspection logged", `${updated.tyreNumber} is at ${updated.currentTreadDepth} mm.`);
        }}
      />

      <EditTyreSheet
        open={editing}
        onClose={() => setEditing(false)}
        tyre={tyre}
        onDone={(updated) => {
          setTyre(updated);
          setEditing(false);
          toast.success("Details updated");
        }}
      />

      {currentTruck && (
        <FitTyreSheet
          open={fitting}
          onClose={() => setFitting(false)}
          onDone={(updated) => {
            setTyre(updated);
            setFitting(false);
            toast.success(fitted ? "Tyre moved" : "Tyre fitted");
          }}
          tyres={[tyre]}
          truck={currentTruck}
          otherTrucks={trucks}
          subject={tyre}
        />
      )}

      <RetreadSheet
        open={retreading !== null}
        mode={retreading ?? "send"}
        tyre={tyre}
        onClose={() => setRetreading(null)}
        onDone={(updated) => {
          setTyre(updated);
          setRetreading(null);
        }}
      />

      <RemoveTyreSheet
        open={removing}
        onClose={() => setRemoving(false)}
        tyre={tyre}
        odometer={currentTruck?.totalKm ?? null}
        onDone={(updated) => {
          setTyre(updated);
          setRemoving(false);
          toast.success("Tyre taken off", `${updated.tyreNumber} is off the vehicle.`);
        }}
      />
    </DetailPage>
  );
}

function Card({
  icon,
  iconTone,
  label,
  action,
  children,
}: {
  icon: React.ReactNode;
  iconTone: "accent" | "positive";
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="h-full rounded-card border border-hairline bg-surface p-5 shadow-[var(--shadow-raised)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <span
          className={cn(
            "grid h-8 w-8 place-items-center rounded-control text-sm",
            iconTone === "accent" ? "bg-accent-soft text-accent" : "bg-positive-soft text-positive-ink"
          )}
          aria-hidden
        >
          {icon}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-caption text-xs font-semibold tracking-wide text-ink-quaternary uppercase">
            {label}
          </span>
          {action}
        </div>
      </div>
      {children}
    </div>
  );
}

function Row({ term, detail }: { term: string; detail: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink-tertiary">{term}</dt>
      <dd className="text-right font-medium text-ink tabular-nums">{detail}</dd>
    </div>
  );
}

/**
 * The tyre's life, newest first.
 *
 * A table sorted by a date column is a list of rows; a timeline is a sequence.
 * The difference matters here because the question people bring to this
 * section is "what happened to it, in what order" — not "show me a grid".
 */
function TyreTimeline({ history }: { history: ITyreHistory[] }) {
  const entries = useMemo(() => [...history].reverse(), [history]);

  return (
    <div className="overflow-hidden rounded-card border border-hairline bg-surface shadow-[var(--shadow-raised)]">
      <div className="flex items-center gap-2 border-b border-hairline px-6 py-4">
        <FaHistory className="h-3.5 w-3.5 text-ink-quaternary" aria-hidden />
        <h2 className="text-base font-semibold text-ink">Life story</h2>
        <span className="ml-auto text-xs text-ink-tertiary tabular-nums">
          {entries.length} {entries.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      {entries.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-ink-tertiary">
          Nothing logged for this tyre yet.
        </p>
      ) : (
        <ol className="relative px-6 py-5">
          {/* One continuous rail behind the markers, so the entries read as a
              single thread rather than as detached rows. */}
          <span
            className="absolute top-7 bottom-7 left-[1.9375rem] w-px bg-hairline"
            aria-hidden
          />

          {entries.map((entry, index) => (
            <li key={index} className="relative flex gap-4 pb-5 last:pb-0">
              <span
                className={cn(
                  "z-10 mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full ring-4 ring-surface",
                  actionTone(entry.action)
                )}
                aria-hidden
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <span className="text-sm font-semibold text-ink">
                    {actionLabel(entry.action)}
                  </span>
                  {entry.position ? (
                    <span className="rounded-chip bg-ink/6 px-1.5 py-0.5 text-[0.625rem] font-bold text-ink-secondary">
                      {entry.position}
                    </span>
                  ) : null}
                  {typeof entry.truckId === "object" && entry.truckId?.registrationNumber ? (
                    <span className="text-xs text-ink-secondary">
                      {entry.truckId.registrationNumber}
                    </span>
                  ) : null}
                  <span className="ml-auto text-xs text-ink-tertiary tabular-nums">
                    {new Date(entry.date).toLocaleDateString()}
                  </span>
                </div>

                {entry.notes ? (
                  <p className="mt-0.5 text-sm leading-relaxed text-ink-secondary">{entry.notes}</p>
                ) : null}

                {entry.kmAtAction ? (
                  <p className="mt-0.5 text-xs text-ink-tertiary tabular-nums">
                    Odometer {formatKm(entry.kmAtAction)}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

const ACTION_LABELS: Record<string, string> = {
  Bought: "Added to inventory",
  Installed: "Fitted",
  Dismounted: "Taken off",
  Moved: "Moved",
  Rotation: "Rotated",
  PunctureRepair: "Puncture repaired",
  Inspection: "Inspected",
  Retread: "Retreaded",
};

const actionLabel = (action: string) => ACTION_LABELS[action] ?? action;

function actionTone(action: string): string {
  switch (action) {
    case "Installed":
    case "Moved":
      return "bg-accent";
    case "Dismounted":
      return "bg-caution";
    case "Retread":
      return "bg-caution";
    case "Inspection":
      return "bg-ink-quaternary";
    default:
      return "bg-ink/20";
  }
}
