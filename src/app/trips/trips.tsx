"use client";

import { useState, useEffect } from "react";
import { StatusTab } from "./components/status-tab";
import { TripsTable } from "./components/trips-table";
import { AddTripModal } from "./components/add-trip-modal";
import { LoadingSpinner } from "./components/loading-spinner";
import type { Trip, Driver, Truck } from "./types/api";
import { FaPlus } from "react-icons/fa";
import { useEventStore } from "../../store/trips/store";
import { createTrip, deleteTrip, getDrivers, getTrips, getTrucks } from "../../api";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";

export default function Trips() {
  const tripRefreshKey = useEventStore((s) => s.tripRefreshKey);
  const [activeStatus, setActiveStatus] = useState<Trip["status"] | "ALL" | "Running">("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [tripsData, driversData, trucksData] = (await Promise.all([getTrips(), getDrivers(), getTrucks()])) as unknown as [Trip[], Driver[], { trucks: Truck[] }];

      setTrips(tripsData);
      setDrivers(driversData);
      setTrucks(trucksData?.trucks);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tripRefreshKey]);

  const filteredTrips = trips?.length
    ? trips.filter(
        (trip) =>
          activeStatus === "ALL" ||
          (activeStatus === "Running" && trip.status === "Running") ||
          (activeStatus === "Completed" && trip.status === "Completed") ||
          (activeStatus === "Cancelled" && trip.status === "Cancelled")
      )
    : [];

  const handleAddTrip = async (tripData: Record<string, unknown>) => {
    try {
      await createTrip(tripData);
      await fetchData();
    } catch (error) {
      console.error("Error adding trip:", error);
    }
  };

  const handleDeleteTrip = async () => {
    if (!tripToDelete) return;
    try {
      await deleteTrip(tripToDelete._id);
      setTripToDelete(null);
      await fetchData();
    } catch (error) {
      console.error("Error deleting trip:", error);
    }
  };

  const handleEditTrip = async (trip: Trip) => {
    console.log("Edit trip:", trip);
  };

  const handleCopyTrip = async (trip: Trip) => {
    console.log("Copy trip:", trip);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold">Trips</h1>
              <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2">
                <FaPlus className="w-4 h-4" />
                Add Trip
              </button>
            </div>
          </div>

          <div className="border-b border-gray-200">
            <div className="flex">
              <StatusTab label="View All" active={activeStatus === "ALL"} onClick={() => setActiveStatus("ALL")} />
              <StatusTab label="Running" active={activeStatus === "Running"} onClick={() => setActiveStatus("Running")} />
              <StatusTab label="Completed" active={activeStatus === "Completed"} onClick={() => setActiveStatus("Completed")} />
            </div>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              {filteredTrips.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <p className="text-gray-500">No trips found</p>
                </div>
              ) : (
                <TripsTable
                  trips={filteredTrips}
                  onDelete={async (id) => {
                    const selectedTrip = trips.find((trip) => trip._id === id) ?? null;
                    setTripToDelete(selectedTrip);
                  }}
                  onEdit={handleEditTrip}
                  onCopy={handleCopyTrip}
                />
              )}
            </>
          )}
        </div>
      </div>

      {!isLoading && (
        <AddTripModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddTrip} trucks={trucks} drivers={drivers} />
      )}

      <ConfirmDialog
        open={Boolean(tripToDelete)}
        title="Delete trip?"
        description={`Trip ${tripToDelete?.registrationNumber ?? ""} will be deleted.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={handleDeleteTrip}
        onCancel={() => setTripToDelete(null)}
      />
    </div>
  );
}
