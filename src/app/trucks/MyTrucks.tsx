import { useState, useMemo, useEffect, useContext, useCallback } from "react";
import { FaPlus, FaTruck } from "react-icons/fa";
import { VehicleTable } from "./components/vehicle-table";
import type { Vehicle, VehicleStatus } from "./types/vehicle";
import { AddTruckModal } from "./modals/AddTruckModal";
import { AuthContext } from "../../context/AuthContext";
import VehicleTableSkeleton from "./components/vehicle-table-skeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { SearchField } from "../../components/ui/SearchField";
import { FilterBar } from "../../components/ui/FilterBar";
import { TableCard } from "../../components/ui/TableCard";
import { TablePagination } from "../../components/ui/TablePagination";
import { EmptyState } from "../../components/ui/EmptyState";
import { InlineMessage } from "../../components/ui/InlineMessage";
import { SegmentedControl, type Segment } from "../../components/ui/SegmentedControl";
import { getTrucks } from "../../api";

const ITEMS_PER_PAGE = 6;

export default function TrucksPage() {
  const { role } = useContext(AuthContext);
  const [activeStatus, setActiveStatus] = useState<VehicleStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const isOwner = role === "owner";

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = (await getTrucks()) as unknown as {
        trucks: Array<Partial<Vehicle> & { _id?: string }>;
      };
      const sanitized = response.trucks.map((vehicle) => ({
        id: vehicle._id,
        registrationNumber: vehicle.registrationNumber || undefined,
        type: vehicle.model || "Truck",
        status: vehicle.status || undefined,
        healthRate: vehicle.healthRate || "80",
        alertType: vehicle.alertType || "All Good",
        available: vehicle.available ?? false,
        model: vehicle.model || "Truck",
        capacity: vehicle.capacity || "NA",
      })) as Vehicle[];

      setVehicles(sanitized);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      setError("Could not load your trucks. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const statusCounts = useMemo(
    () => ({
      ALL: vehicles.length,
      "En Route": vehicles.filter((v) => v.status === "En Route").length,
      Available: vehicles.filter((v) => v.status === "Available").length,
      "Out of Service": vehicles.filter((v) => v.status === "Out of Service").length,
    }),
    [vehicles]
  );

  /* Labels are sentence case, not shouted. "ALL STATUSES" in caps reads as a
     warning; these are just filters. */
  const segments: Segment<VehicleStatus>[] = [
    { label: "All", value: "ALL", count: statusCounts.ALL },
    { label: "En route", value: "En Route", count: statusCounts["En Route"] },
    { label: "Available", value: "Available", count: statusCounts.Available },
    { label: "Out of service", value: "Out of Service", count: statusCounts["Out of Service"] },
  ];

  const filteredVehicles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return vehicles.filter((vehicle) => {
      if (activeStatus !== "ALL" && vehicle.status !== activeStatus) return false;
      if (!query) return true;
      /* The placeholder promised search by vehicle OR alert, but the filter
         only ever matched the registration number. */
      return (
        vehicle.registrationNumber?.toLowerCase().includes(query) ||
        vehicle.alertType?.toLowerCase().includes(query) ||
        vehicle.model?.toLowerCase().includes(query)
      );
    });
  }, [activeStatus, searchQuery, vehicles]);

  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / ITEMS_PER_PAGE));

  useEffect(() => {
    setCurrentPage(1);
  }, [activeStatus, searchQuery]);

  const paginatedVehicles = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredVehicles.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredVehicles, currentPage]);

  const handleRefresh = async () => {
    setAddOpen(false);
    await fetchVehicles();
  };

  const hasVehicles = vehicles.length > 0;

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader
        title="My trucks"
        description="Every vehicle in your fleet, with its current status and health."
        actions={
          isOwner ? (
            <Button onClick={() => setAddOpen(true)}>
              <FaPlus className="h-3.5 w-3.5" />
              Add truck
            </Button>
          ) : null
        }
      />

      <InlineMessage tone="error">{error}</InlineMessage>

      <FilterBar>
        <SegmentedControl segments={segments} value={activeStatus} onChange={setActiveStatus} />
        <SearchField
          placeholder="Search registration, model or alert"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search trucks"
        />
      </FilterBar>

      {loading ? (
        <TableCard>
          <VehicleTableSkeleton />
        </TableCard>
      ) : paginatedVehicles.length > 0 ? (
        <TableCard>
          <VehicleTable
            vehicles={paginatedVehicles}
            userRole={role}
            onUpdated={fetchVehicles}
          />
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredVehicles.length}
            pageSize={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </TableCard>
      ) : hasVehicles ? (
        /* Filtered to nothing is a different situation from owning nothing,
           and it needs a different way out. */
        <EmptyState
          icon={<FaTruck />}
          title="No trucks match those filters"
          description="Try a different status, or clear the search to see your whole fleet."
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
          icon={<FaTruck />}
          title="No trucks yet"
          description="Add your first vehicle to start tracking its trips, health and running costs."
          action={
            isOwner ? (
              <Button onClick={() => setAddOpen(true)}>
                <FaPlus className="h-3.5 w-3.5" />
                Add truck
              </Button>
            ) : null
          }
        />
      )}

      {isOwner && (
        <AddTruckModal
          isOpen={addOpen}
          onClose={() => setAddOpen(false)}
          onTruckAdded={handleRefresh}
        />
      )}
    </div>
  );
}
