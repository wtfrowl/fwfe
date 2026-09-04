import { useState, useEffect, useCallback, useMemo } from "react";
import { FaPlus, FaRoute } from "react-icons/fa";
import { TripsTable } from "./components/trips-table";
import { AddTripModal } from "./components/add-trip-modal";
import type { Trip, Driver, Truck } from "./types/api";
import { useEventStore } from "../../store/trips/store";
import { createTrip, deleteTrip, getDrivers, getTrips, getTrucks } from "../../api";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { FilterBar } from "../../components/ui/FilterBar";
import { TableCard } from "../../components/ui/TableCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingState } from "../../components/ui/LoadingState";
import { InlineMessage } from "../../components/ui/InlineMessage";
import { SegmentedControl, type Segment } from "../../components/ui/SegmentedControl";

type StatusFilter = "ALL" | "Running" | "Completed" | "Cancelled";

export default function Trips() {
  const tripRefreshKey = useEventStore((s) => s.tripRefreshKey);
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [tripsData, driversData, trucksData] = (await Promise.all([
        getTrips(),
        getDrivers(),
        getTrucks(),
      ])) as unknown as [Trip[], Driver[], { trucks: Truck[] }];

      setTrips(tripsData ?? []);
      setDrivers(driversData ?? []);
      setTrucks(trucksData?.trucks ?? []);
    } catch (err) {
      console.error("Error fetching data:", err);
      /* This failure used to be swallowed into console.error, leaving the page
         showing a permanent "No trips found" that looked like an empty fleet
         rather than a broken request. */
      setError("Could not load your trips. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, tripRefreshKey]);

  const statusCounts = useMemo(
    () => ({
      ALL: trips.length,
      Running: trips.filter((t) => t.status === "Running").length,
      Completed: trips.filter((t) => t.status === "Completed").length,
      Cancelled: trips.filter((t) => t.status === "Cancelled").length,
    }),
    [trips]
  );

  /* The filter already handled "Cancelled" but no tab ever offered it, so
     cancelled trips were only reachable through "All". */
  const segments: Segment<StatusFilter>[] = [
    { label: "All", value: "ALL", count: statusCounts.ALL },
    { label: "Running", value: "Running", count: statusCounts.Running },
    { label: "Completed", value: "Completed", count: statusCounts.Completed },
    { label: "Cancelled", value: "Cancelled", count: statusCounts.Cancelled },
  ];

  const filteredTrips = useMemo(
    () => (activeStatus === "ALL" ? trips : trips.filter((t) => t.status === activeStatus)),
    [trips, activeStatus]
  );

  const handleAddTrip = async (tripData: Record<string, unknown>) => {
    await createTrip(tripData);
    await fetchData();
  };

  const handleDeleteTrip = async () => {
    if (!tripToDelete) return;
    setDeleting(true);
    try {
      await deleteTrip(tripToDelete._id);
      setTripToDelete(null);
      await fetchData();
    } catch (err) {
      console.error("Error deleting trip:", err);
      setError("Could not delete that trip. Please try again.");
      setTripToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader
        title="Trips"
        description="Every journey your fleet has run, is running, or has cancelled."
        actions={
          <Button onClick={() => setIsAddModalOpen(true)}>
            <FaPlus className="h-3.5 w-3.5" />
            Add trip
          </Button>
        }
      />

      <InlineMessage tone="error">{error}</InlineMessage>

      <FilterBar>
        <SegmentedControl segments={segments} value={activeStatus} onChange={setActiveStatus} />
      </FilterBar>

      {isLoading ? (
        <LoadingState label="Loading trips" />
      ) : filteredTrips.length > 0 ? (
        <TableCard>
          <TripsTable
            trips={filteredTrips}
            onDelete={async (id) => setTripToDelete(trips.find((t) => t._id === id) ?? null)}
          />
        </TableCard>
      ) : trips.length > 0 ? (
        <EmptyState
          icon={<FaRoute />}
          title={`No ${activeStatus.toLowerCase()} trips`}
          description="Nothing in your fleet currently matches this status."
          action={
            <Button variant="secondary" onClick={() => setActiveStatus("ALL")}>
              Show all trips
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={<FaRoute />}
          title="No trips yet"
          description="Create your first trip to start tracking routes, fares and running costs."
          action={
            <Button onClick={() => setIsAddModalOpen(true)}>
              <FaPlus className="h-3.5 w-3.5" />
              Add trip
            </Button>
          }
        />
      )}

      <AddTripModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddTrip}
        trucks={trucks}
        drivers={drivers}
      />

      <ConfirmDialog
        open={Boolean(tripToDelete)}
        title="Delete this trip?"
        description={`Trip ${tripToDelete?.registrationNumber ?? ""} from ${tripToDelete?.departureLocation ?? ""} to ${tripToDelete?.arrivalLocation ?? ""} will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete trip"
        cancelLabel="Keep it"
        tone="danger"
        loading={deleting}
        onConfirm={handleDeleteTrip}
        onCancel={() => setTripToDelete(null)}
      />
    </div>
  );
}
