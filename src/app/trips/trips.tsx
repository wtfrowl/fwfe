"use client"

import { useState, useEffect } from "react"
import { StatusTab } from "./components/status-tab"
import { TripsTable } from "./components/trips-table"
import { AddTripModal } from "./components/add-trip-modal"
import { LoadingSpinner } from "./components/loading-spinner"
import type { Trip, Driver, Truck } from "./types/api"
import { api } from "./services/api"
import { FaPlus } from "react-icons/fa"
import { useEventStore} from "../../store/trips/store"

export default function Trips() {
  const tripRefreshKey = useEventStore((s) => s.tripRefreshKey);
  const [activeStatus, setActiveStatus] = useState<Trip["status"] | "ALL" | "Running">("ALL")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [trips, setTrips] = useState<Trip[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [tripsData, driversData, trucksData] = await Promise.all([
        api.trips.list(),
        api.drivers.list(),
        api.trucks.list(),
      ])
      setTrips(tripsData)
      setDrivers(driversData)
      setTrucks(trucksData)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      console.log("Fetched trip");
        setIsLoading(false);
    }
  }

 

  useEffect(() => {
   fetchData()
  }, [activeStatus,tripRefreshKey])
  const filteredTrips = trips?.length 
  ? trips.filter(trip =>
      activeStatus === "ALL" ||
      (activeStatus === "Running" && trip.status === "Running") ||
      (activeStatus === "Completed" && trip.status === "Completed") ||
      (activeStatus === "Cancelled" && trip.status === "Cancelled")
    )
  : [];


  const handleAddTrip = async (tripData: any) => {
    try {
      // Add truckId and registrationNumber to tripData
    await api.trips.create(tripData)
      await fetchData()
    } catch (error) {
      console.error("Error adding trip:", error)
    }
  }

  const handleDeleteTrip = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this trip?")) {
      try {
        await api.trips.delete(id)
        await fetchData()
      } catch (error) {
        console.error("Error deleting trip:", error)
      }
    }
  }

  const handleEditTrip = async (trip: Trip) => {
    // Implement edit functionality
    console.log("Edit trip:", trip)
  }

  const handleCopyTrip = async (trip: Trip) => {
    // Implement copy functionality
    console.log("Copy trip:", trip)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold">Trips</h1>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
              >
                <FaPlus className="w-4 h-4" />
                Add Trip
              </button>
            </div>
          </div>

      
              {/* Status Tabs */}
              <div className="border-b border-gray-200">
                <div className="flex">
                  <StatusTab label="View All" active={activeStatus === "ALL"} onClick={() => setActiveStatus("ALL")} />
                  <StatusTab
                    label="Running"
                    active={activeStatus === "Running"}
                    onClick={() => setActiveStatus("Running")}
                  />
                  <StatusTab
                    label="Completed"
                    active={activeStatus === "Completed"}
                    onClick={() => setActiveStatus("Completed")}
                  />
                  
                </div>
              </div>
    {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              {/* Trips Table or NO dATA*/}
              {filteredTrips.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <p className="text-gray-500">No trips found</p>
                </div>
              ) : 
              <TripsTable
                  trips={filteredTrips}
                  onDelete={handleDeleteTrip}
                  onEdit={handleEditTrip}
                  onCopy={handleCopyTrip} isLoading={false}              />
                  }
            </>
          )}
        </div>
      </div>

      {/* Add Trip Modal */}
      {!isLoading &&  (
        <AddTripModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddTrip}
          trucks={trucks}
          drivers={drivers}
        />
      )}


    </div>
  )
}

