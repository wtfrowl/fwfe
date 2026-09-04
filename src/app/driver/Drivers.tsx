import { useState, useMemo, useEffect, useContext, useCallback } from "react";
import { FaPlus } from "react-icons/fa";
import { RiSteering2Fill } from "react-icons/ri";
import { AuthContext } from "../../context/AuthContext";
import { DriverTable } from "./components/Driver-Table";
import { AddDriverModal } from "./components/AddDriverModal";
import DriverTableSkeleton from "./components/Driver-Table-Skeleton";
import { getDrivers } from "../../api";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { SearchField } from "../../components/ui/SearchField";
import { FilterBar } from "../../components/ui/FilterBar";
import { TableCard } from "../../components/ui/TableCard";
import { TablePagination } from "../../components/ui/TablePagination";
import { EmptyState } from "../../components/ui/EmptyState";
import { InlineMessage } from "../../components/ui/InlineMessage";
import { SegmentedControl, type Segment } from "../../components/ui/SegmentedControl";

const ITEMS_PER_PAGE = 6;

export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
  license: string;
  totalTrips: number;
  availability: boolean;
  city: string;
  state: string;
  status: "Available" | "Unavailable";
}

type StatusFilter = "ALL" | "Available" | "Unavailable";

export default function DriversPage() {
  const { role } = useContext(AuthContext);
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const isOwner = role === "owner";

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = (await getDrivers()) as
        | Array<Record<string, unknown>>
        | { drivers?: Array<Record<string, unknown>> };
      const rawData = Array.isArray(response) ? response : response?.drivers || [];

      setDrivers(
        rawData.map((d) => ({
          id: String(d._id || d.id),
          firstName: String(d.firstName || ""),
          lastName: String(d.lastName || ""),
          contactNumber: String(d.contactNumber || ""),
          license: String(d.license || ""),
          totalTrips: Number(d.totalTrips || 0),
          availability: Boolean(d.availability),
          city: String(d.city || "N/A"),
          state: String(d.state || "N/A"),
          status: d.availability ? "Available" : "Unavailable",
        }))
      );
    } catch (err) {
      console.error("Error fetching drivers:", err);
      setError("Could not load your drivers. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const statusCounts = useMemo(
    () => ({
      ALL: drivers.length,
      Available: drivers.filter((d) => d.status === "Available").length,
      Unavailable: drivers.filter((d) => d.status === "Unavailable").length,
    }),
    [drivers]
  );

  const segments: Segment<StatusFilter>[] = [
    { label: "All", value: "ALL", count: statusCounts.ALL },
    { label: "Available", value: "Available", count: statusCounts.Available },
    { label: "Unavailable", value: "Unavailable", count: statusCounts.Unavailable },
  ];

  const filteredDrivers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return drivers.filter((driver) => {
      if (activeStatus !== "ALL" && driver.status !== activeStatus) return false;
      if (!query) return true;
      const fullName = `${driver.firstName} ${driver.lastName}`.toLowerCase();
      return (
        fullName.includes(query) ||
        driver.contactNumber.includes(query) ||
        driver.license.toLowerCase().includes(query)
      );
    });
  }, [activeStatus, searchQuery, drivers]);

  const totalPages = Math.max(1, Math.ceil(filteredDrivers.length / ITEMS_PER_PAGE));

  useEffect(() => {
    setCurrentPage(1);
  }, [activeStatus, searchQuery]);

  const paginatedDrivers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDrivers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDrivers, currentPage]);

  const handleRefresh = async () => {
    setAddOpen(false);
    await fetchDrivers();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader
        title="Drivers"
        description="Everyone who can be assigned to a trip, and whether they're free right now."
        actions={
          isOwner ? (
            <Button onClick={() => setAddOpen(true)}>
              <FaPlus className="h-3.5 w-3.5" />
              Add driver
            </Button>
          ) : null
        }
      />

      <InlineMessage tone="error">{error}</InlineMessage>

      <FilterBar>
        <SegmentedControl segments={segments} value={activeStatus} onChange={setActiveStatus} />
        <SearchField
          placeholder="Search name, phone or licence"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search drivers"
        />
      </FilterBar>

      {loading ? (
        <TableCard>
          <DriverTableSkeleton />
        </TableCard>
      ) : paginatedDrivers.length > 0 ? (
        <TableCard>
          <DriverTable drivers={paginatedDrivers} role={role} />
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredDrivers.length}
            pageSize={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </TableCard>
      ) : drivers.length > 0 ? (
        <EmptyState
          icon={<RiSteering2Fill />}
          title="No drivers match those filters"
          description="Try a different status, or clear the search to see everyone."
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
          icon={<RiSteering2Fill />}
          title="No drivers yet"
          description="Add a driver so you can assign them to trips and track their activity."
          action={
            isOwner ? (
              <Button onClick={() => setAddOpen(true)}>
                <FaPlus className="h-3.5 w-3.5" />
                Add driver
              </Button>
            ) : null
          }
        />
      )}

      {isOwner && (
        <AddDriverModal
          isOpen={addOpen}
          onClose={() => setAddOpen(false)}
          onDriverAdded={handleRefresh}
        />
      )}
    </div>
  );
}
