import { useState, useMemo, useEffect, useContext, useCallback } from "react";
import { FaPlus } from "react-icons/fa";
import { GiTyre } from "react-icons/gi";
import { TyreTable } from "./components/tyre-table";
import { AddTyreModal } from "./modals/AddTyreModal";
import { FitTyreSheet, type FitTruck } from "./modals/FitTyreSheet";
import { RemoveTyreSheet } from "./modals/RemoveTyreSheet";
import { AuthContext } from "../../context/AuthContext";
import { getTyres, getTrucks } from "../../api";
import { toast } from "../../store/notifications/toastStore";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { SearchField } from "../../components/ui/SearchField";
import { FilterBar } from "../../components/ui/FilterBar";
import { TableCard } from "../../components/ui/TableCard";
import { TablePagination } from "../../components/ui/TablePagination";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingState } from "../../components/ui/LoadingState";
import { InlineMessage } from "../../components/ui/InlineMessage";
import { SegmentedControl, type Segment } from "../../components/ui/SegmentedControl";
import { RevealGroup, RevealItem } from "../../motion";
import { inputClasses } from "../../components/ui/inputStyles";
import { cn } from "../../utils/cn";
import type { ITyre } from "../../types/tyre";
import {
  costPerKm,
  formatCurrency,
  formatKm,
  needsAttention,
  refId,
  treadHealth,
  TREAD,
} from "./lib/tyre-standards";

/** Re-exported so older imports of `Tyre` from this module keep resolving. */
export type Tyre = ITyre;

type StatusFilter = "ALL" | "ATTENTION" | ITyre["status"];
type SortKey = "recent" | "treadAsc" | "cpkDesc" | "kmDesc";

const ITEMS_PER_PAGE = 10;

const SORTS: Array<{ value: SortKey; label: string }> = [
  { value: "recent", label: "Newest first" },
  { value: "treadAsc", label: "Least tread left" },
  { value: "cpkDesc", label: "Costliest per km" },
  { value: "kmDesc", label: "Most kilometres" },
];

export default function TyrePage() {
  const { role } = useContext(AuthContext);
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const [tyres, setTyres] = useState<ITyre[]>([]);
  const [trucks, setTrucks] = useState<FitTruck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [fitting, setFitting] = useState<ITyre | null>(null);
  const [removing, setRemoving] = useState<ITyre | null>(null);

  const isOwner = role === "owner";

  const fetchTyres = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getTyres();
      setTyres(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error("Error fetching tyres:", err);
      setError("Could not load your tyre inventory. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  /* Trucks are only needed to fit a tyre, so a failure here must not block the
     inventory from rendering — it just means the fitting sheet has no
     destinations to offer. */
  const fetchTrucks = useCallback(async () => {
    try {
      const response = await getTrucks();
      const list = Array.isArray(response) ? response : (response?.trucks ?? []);
      setTrucks(
        (list as Array<Record<string, unknown>>).map((t) => ({
          _id: String(t._id),
          registrationNumber: String(t.registrationNumber ?? t.regNo ?? ""),
          axleLayout: (t.axleLayout as string) ?? null,
          totalKm: (t.totalKm as number) ?? null,
        }))
      );
    } catch (err) {
      console.error("Error fetching trucks:", err);
    }
  }, []);

  useEffect(() => {
    fetchTyres();
    fetchTrucks();
  }, [fetchTyres, fetchTrucks]);

  /* Every mutation returns the updated tyre, so the row is patched in place
     rather than the whole list being refetched. The change lands on the row
     the user is looking at, in the position they left it. */
  const applyUpdate = useCallback((updated: ITyre) => {
    setTyres((prev) => prev.map((t) => (t._id === updated._id ? { ...t, ...updated } : t)));
  }, []);

  const counts = useMemo(
    () => ({
      ALL: tyres.length,
      Mounted: tyres.filter((t) => t.status === "Mounted").length,
      Spare: tyres.filter((t) => t.status === "Spare").length,
      SentForRetreading: tyres.filter((t) => t.status === "SentForRetreading").length,
      Scrapped: tyres.filter((t) => t.status === "Scrapped").length,
      ATTENTION: tyres.filter(
        (t) =>
          t.status !== "Scrapped" && needsAttention(t.currentTreadDepth, t.initialTreadDepth)
      ).length,
    }),
    [tyres]
  );

  const segments: Segment<StatusFilter>[] = [
    { label: "All", value: "ALL", count: counts.ALL },
    { label: "Needs attention", value: "ATTENTION", count: counts.ATTENTION },
    { label: "Fitted", value: "Mounted", count: counts.Mounted },
    { label: "In stock", value: "Spare", count: counts.Spare },
    { label: "Retreading", value: "SentForRetreading", count: counts.SentForRetreading },
    { label: "Scrapped", value: "Scrapped", count: counts.Scrapped },
  ];

  const filteredTyres = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const matched = tyres.filter((tyre) => {
      if (activeStatus === "ATTENTION") {
        if (tyre.status === "Scrapped") return false;
        if (!needsAttention(tyre.currentTreadDepth, tyre.initialTreadDepth)) return false;
      } else if (activeStatus !== "ALL" && tyre.status !== activeStatus) {
        return false;
      }
      if (!q) return true;
      return (
        tyre.tyreNumber?.toLowerCase().includes(q) ||
        tyre.brand?.toLowerCase().includes(q) ||
        tyre.model?.toLowerCase().includes(q) ||
        tyre.size?.toLowerCase().includes(q)
      );
    });

    const sorted = [...matched];
    switch (sortKey) {
      case "treadAsc":
        sorted.sort(
          (a, b) =>
            treadHealth(a.currentTreadDepth, a.initialTreadDepth).remaining -
            treadHealth(b.currentTreadDepth, b.initialTreadDepth).remaining
        );
        break;
      case "cpkDesc":
        sorted.sort(
          (a, b) =>
            (costPerKm(b.purchasePrice, b.totalKmRun) ?? -1) -
            (costPerKm(a.purchasePrice, a.totalKmRun) ?? -1)
        );
        break;
      case "kmDesc":
        sorted.sort((a, b) => (b.totalKmRun ?? 0) - (a.totalKmRun ?? 0));
        break;
      default:
        sorted.sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
        );
    }
    return sorted;
  }, [activeStatus, searchQuery, sortKey, tyres]);

  const totalPages = Math.max(1, Math.ceil(filteredTyres.length / ITEMS_PER_PAGE));

  useEffect(() => {
    setCurrentPage(1);
  }, [activeStatus, searchQuery, sortKey]);

  const paginatedTyres = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTyres.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTyres, currentPage]);

  /* The truck a fitted tyre is already on is the sheet's starting point; for a
     stock tyre there is no such truck, so the first one stands in and the
     sheet's own selector takes it from there. */
  const fittingTruck = useMemo<FitTruck | null>(() => {
    if (!fitting) return null;
    const currentId = refId(fitting.currentTruckId);
    return trucks.find((t) => t._id === currentId) ?? trucks[0] ?? null;
  }, [fitting, trucks]);

  const handleAdded = () => {
    setAddOpen(false);
    fetchTyres();
    toast.success("Added to stock", "The tyres are in inventory and ready to fit.");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader
        title="Tyres"
        description="Every casing you own — what is on the road, what is on the shelf, and what is nearly finished."
        actions={
          isOwner ? (
            <Button onClick={() => setAddOpen(true)}>
              <FaPlus className="h-3.5 w-3.5" />
              Add tyres
            </Button>
          ) : null
        }
      />

      <InlineMessage tone="error">{error}</InlineMessage>

      {!loading && tyres.length > 0 && <FleetSummary tyres={tyres} attention={counts.ATTENTION} />}

      <FilterBar>
        <SegmentedControl segments={segments} value={activeStatus} onChange={setActiveStatus} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchField
            placeholder="Search number, brand, model or size"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search tyres"
          />
          <select
            className={cn(inputClasses, "h-11 sm:w-48")}
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            aria-label="Sort tyres"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </FilterBar>

      {loading ? (
        <LoadingState label="Loading tyre inventory" />
      ) : paginatedTyres.length > 0 ? (
        <TableCard>
          <TyreTable
            tyres={paginatedTyres}
            canManage={isOwner && trucks.length > 0}
            onFit={setFitting}
            onRemove={setRemoving}
          />
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredTyres.length}
            pageSize={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </TableCard>
      ) : tyres.length > 0 ? (
        <EmptyState
          icon={<GiTyre />}
          title={
            activeStatus === "ATTENTION"
              ? "Nothing needs attention"
              : "No tyres match those filters"
          }
          description={
            activeStatus === "ATTENTION"
              ? `Every tyre in the fleet is above the ${TREAD.pullPoint} mm pull point.`
              : "Try a different status, or clear the search to see your whole inventory."
          }
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setActiveStatus("ALL");
                setSearchQuery("");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={<GiTyre />}
          title="No tyres yet"
          description="Add a set to your inventory to track tread, fitting, kilometres and cost per km."
          action={
            isOwner ? (
              <Button onClick={() => setAddOpen(true)}>
                <FaPlus className="h-3.5 w-3.5" />
                Add tyres
              </Button>
            ) : null
          }
        />
      )}

      {isOwner && (
        <>
          <AddTyreModal
            isOpen={addOpen}
            onClose={() => setAddOpen(false)}
            onTyreAdded={handleAdded}
          />

          {fittingTruck && (
            <FitTyreSheet
              open={Boolean(fitting)}
              onClose={() => setFitting(null)}
              onDone={(updated) => {
                applyUpdate(updated);
                setFitting(null);
                toast.success("Tyre fitted", `${updated.tyreNumber} is on the road.`);
              }}
              tyres={tyres}
              truck={fittingTruck}
              otherTrucks={trucks}
              subject={fitting}
            />
          )}

          <RemoveTyreSheet
            open={Boolean(removing)}
            onClose={() => setRemoving(null)}
            onDone={(updated) => {
              applyUpdate(updated);
              setRemoving(null);
              toast.success("Tyre taken off", `${updated.tyreNumber} is off the vehicle.`);
            }}
            tyre={removing}
            odometer={
              trucks.find((t) => t._id === refId(removing?.currentTruckId))?.totalKm ?? null
            }
          />
        </>
      )}
    </div>
  );
}

/**
 * The four numbers a fleet actually runs tyres on.
 *
 * Cost per km is the one that decides which brand gets bought next, and it was
 * nowhere in the product — not because it is hard, but because `totalKmRun`
 * was never accrued, so it would have read zero for every tyre.
 */
function FleetSummary({ tyres, attention }: { tyres: ITyre[]; attention: number }) {
  const stats = useMemo(() => {
    const live = tyres.filter((t) => t.status !== "Scrapped");
    const invested = tyres.reduce((sum, t) => sum + (t.purchasePrice ?? 0), 0);
    const km = tyres.reduce((sum, t) => sum + (t.totalKmRun ?? 0), 0);

    const rated = tyres
      .map((t) => costPerKm(t.purchasePrice, t.totalKmRun))
      .filter((n): n is number => n != null);

    const fleetCpk = rated.length
      ? rated.reduce((a, b) => a + b, 0) / rated.length
      : null;

    return {
      fitted: live.filter((t) => t.status === "Mounted").length,
      stock: live.filter((t) => t.status === "Spare").length,
      invested,
      km,
      fleetCpk,
    };
  }, [tyres]);

  return (
    <RevealGroup className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Metric label="On the road" value={String(stats.fitted)} hint={`${stats.stock} in stock`} />
      <Metric
        label="Needs attention"
        value={String(attention)}
        hint={`At or below ${TREAD.pullPoint} mm`}
        tone={attention > 0 ? "critical" : "quiet"}
      />
      <Metric
        label="Distance covered"
        value={formatKm(stats.km)}
        hint="Across every casing"
      />
      <Metric
        label="Average cost per km"
        value={stats.fleetCpk == null ? "—" : `₹${stats.fleetCpk.toFixed(2)}`}
        hint={`${formatCurrency(stats.invested)} invested`}
      />
    </RevealGroup>
  );
}

function Metric({
  label,
  value,
  hint,
  tone = "quiet",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "quiet" | "critical";
}) {
  return (
    <RevealItem>
      <div className="h-full rounded-card border border-hairline bg-surface p-4 shadow-[var(--shadow-hairline)]">
        <p className="text-caption text-xs font-semibold tracking-wide text-ink-tertiary uppercase">
          {label}
        </p>
        <p
          className={cn(
            "mt-1.5 text-2xl font-semibold tabular-nums",
            tone === "critical" ? "text-critical-ink" : "text-ink"
          )}
        >
          {value}
        </p>
        <p className="mt-0.5 text-xs text-ink-tertiary">{hint}</p>
      </div>
    </RevealItem>
  );
}
