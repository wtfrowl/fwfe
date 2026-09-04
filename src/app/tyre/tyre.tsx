import { useState, useMemo, useEffect, useContext, useCallback } from "react";
import { FaPlus } from "react-icons/fa";
import { GiTyre } from "react-icons/gi";
import { TyreTable } from "./components/tyre-table";
import { AddTyreModal } from "./modals/AddTyreModal";
import { AuthContext } from "../../context/AuthContext";
import { getTyres } from "../../api";
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

export interface Tyre {
  _id: string;
  tyreNumber: string;
  brand: string;
  model: string;
  size: string;
  status: "Spare" | "Mounted" | "Scrapped" | "SentForRetreading";
  currentTreadDepth: number;
  purchaseDate?: string;
  currentTruckId?: { _id: string; registrationNumber: string } | null;
}

type StatusFilter = "ALL" | Tyre["status"];

const ITEMS_PER_PAGE = 8;

export default function TyrePage() {
  const { role } = useContext(AuthContext);
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [tyres, setTyres] = useState<Tyre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const isOwner = role === "owner";

  const fetchTyres = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = (await getTyres()) as unknown as Tyre[];
      setTyres(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error("Error fetching tyres:", err);
      setError("Could not load your tyre inventory. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTyres();
  }, [fetchTyres]);

  const statusCounts = useMemo(
    () => ({
      ALL: tyres.length,
      Mounted: tyres.filter((t) => t.status === "Mounted").length,
      Spare: tyres.filter((t) => t.status === "Spare").length,
      Scrapped: tyres.filter((t) => t.status === "Scrapped").length,
      SentForRetreading: tyres.filter((t) => t.status === "SentForRetreading").length,
    }),
    [tyres]
  );

  const segments: Segment<StatusFilter>[] = [
    { label: "All", value: "ALL", count: statusCounts.ALL },
    { label: "Mounted", value: "Mounted", count: statusCounts.Mounted },
    { label: "Spare", value: "Spare", count: statusCounts.Spare },
    { label: "Retreading", value: "SentForRetreading", count: statusCounts.SentForRetreading },
    { label: "Scrapped", value: "Scrapped", count: statusCounts.Scrapped },
  ];

  const filteredTyres = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tyres.filter((tyre) => {
      if (activeStatus !== "ALL" && tyre.status !== activeStatus) return false;
      if (!q) return true;
      return (
        tyre.tyreNumber?.toLowerCase().includes(q) ||
        tyre.brand?.toLowerCase().includes(q) ||
        tyre.model?.toLowerCase().includes(q) ||
        tyre.size?.toLowerCase().includes(q)
      );
    });
  }, [activeStatus, searchQuery, tyres]);

  const totalPages = Math.max(1, Math.ceil(filteredTyres.length / ITEMS_PER_PAGE));

  /* This reset ran inside a `useMemo`, using a memo hook purely for its side
     effect. It happened to work, but it is a render-phase state update. */
  useEffect(() => {
    setCurrentPage(1);
  }, [activeStatus, searchQuery]);

  const paginatedTyres = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTyres.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTyres, currentPage]);

  const handleRefresh = () => {
    setAddOpen(false);
    fetchTyres();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader
        title="Tyres"
        description="Your tyre inventory — what's mounted, what's spare, and what needs replacing."
        actions={
          isOwner ? (
            <Button onClick={() => setAddOpen(true)}>
              <FaPlus className="h-3.5 w-3.5" />
              Add tyre
            </Button>
          ) : null
        }
      />

      <InlineMessage tone="error">{error}</InlineMessage>

      <FilterBar>
        <SegmentedControl segments={segments} value={activeStatus} onChange={setActiveStatus} />
        <SearchField
          placeholder="Search number, brand, model or size"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search tyres"
        />
      </FilterBar>

      {loading ? (
        <LoadingState label="Loading tyre inventory" />
      ) : paginatedTyres.length > 0 ? (
        <TableCard>
          <TyreTable tyres={paginatedTyres} userRole={role} />
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
          title="No tyres match those filters"
          description="Try a different status, or clear the search to see your whole inventory."
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
          description="Add tyres to your inventory to track tread depth, mounting and retreading."
          action={
            isOwner ? (
              <Button onClick={() => setAddOpen(true)}>
                <FaPlus className="h-3.5 w-3.5" />
                Add tyre
              </Button>
            ) : null
          }
        />
      )}

      {isOwner && (
        <AddTyreModal isOpen={addOpen} onClose={() => setAddOpen(false)} onTyreAdded={handleRefresh} />
      )}
    </div>
  );
}
