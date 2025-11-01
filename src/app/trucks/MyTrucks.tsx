"use client";

import { useState, useMemo, useEffect, useContext } from "react";
import { StatusTab } from "./components/status-tab";
import { VehicleTable } from "./components/vehicle-table";
import type { Vehicle, VehicleStatus } from "./types/vehicle";
import { FaPlus, FaSearch } from "react-icons/fa";
import axios from "axios";
import { LoadingSpinner } from "../trips/components/loading-spinner";
import { AddTruckModal } from "./modals/AddTruckModal";
import { AuthContext } from "../../context/AuthContext";

const ITEMS_PER_PAGE = 6;

export default function TrucksPage() {
  const [activeStatus, setActiveStatus] = useState<VehicleStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addTruckModalOpen, setAddTruckModalOpen] = useState(false);
  const [userRole, setUserRole] = useState<"owner" | "driver" | null>(null);
  const { role } = useContext(AuthContext)
  const statuses: { label: string; value: VehicleStatus }[] = [
    { label: "ALL STATUSES", value: "ALL" },
    { label: "EN ROUTE", value: "En Route" },
    { label: "AVAILABLE", value: "Available" },
    { label: "OUT OF SERVICE", value: "Out of Service" },
  ];

  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Fetch vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true);
      setError(null);
      try {
        // Try owner token first, then fallback to driver token
        const ownerToken = localStorage.getItem("ownerToken");
        const driverToken = localStorage.getItem("driverToken");
        let tokenData = null;

        if (ownerToken) {
          tokenData = JSON.parse(ownerToken);
          setUserRole("owner");
        } else if (driverToken) {
          tokenData = JSON.parse(driverToken);
          setUserRole("driver");
        } else {
          throw new Error("No valid token found");
        }

        const config = {
          headers: {
            "Content-Type": "application/json",
            authorization: tokenData?.accessToken || "",
          },
        };

        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/trucks`, config);

        const sanitizedVehicles = response.data.trucks.map((vehicle: Partial<Vehicle>) => ({
          id: vehicle._id,
          registrationNumber: vehicle.registrationNumber || undefined,
          type: vehicle.model || "Truck",
          status: vehicle.status || undefined,
          healthRate: vehicle.healthRate || "80",
          alertType: vehicle.alertType || "All Good",
          available: vehicle.available ?? false,
          model: vehicle.model || "Truck",
          capacity: vehicle.capacity || "NA",
        }));

        setVehicles(sanitizedVehicles);
      } catch (err) {
        console.error("Error fetching vehicles:", err);
        setError("Failed to fetch vehicles. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      if (activeStatus !== "ALL" && vehicle.status !== activeStatus) return false;
      if (searchQuery && !vehicle.registrationNumber?.toLowerCase().includes(searchQuery.toLowerCase()))
        return false;
      return true;
    });
  }, [activeStatus, searchQuery, vehicles]);

  const totalPages = Math.ceil(filteredVehicles.length / ITEMS_PER_PAGE);

  useMemo(() => {
    setCurrentPage(1);
  }, [activeStatus, searchQuery]);

  const handleRefresh = () => {
    setAddTruckModalOpen(false);
  };

  const paginatedVehicles = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredVehicles.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredVehicles, currentPage]);

  const statusCounts = useMemo(() => {
    return {
      ALL: vehicles.length,
      "En Route": vehicles.filter((v) => v.status === "En Route").length,
      "Available": vehicles.filter((v) => v.status === "Available").length,
      "Out of Service": vehicles.filter((v) => v.status === "Out of Service").length,
    };
  }, [vehicles]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow">
          {/* Truck Add Modal */}
          {userRole === "owner" && (
            <AddTruckModal
              isOpen={addTruckModalOpen}
              onClose={() => setAddTruckModalOpen(false)}
              onTruckAdded={handleRefresh}
            />
          )}

          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold">My Trucks</h1>
              {userRole === "owner" && (
                <button
                  onClick={() => setAddTruckModalOpen(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                >
                  <FaPlus className="w-4 h-4" />
                  Add Trucks
                </button>
              )}
            </div>
          </div>

          {/* Status Tabs */}
          <div className="border-b border-gray-200">
            <div className="hidden md:flex">
              {statuses.map((status) => (
                <StatusTab
                  key={status.value}
                  label={status.label}
                  active={activeStatus === status.value}
                  onClick={() => setActiveStatus(status.value)}
                  count={statusCounts[status.value]}
                />
              ))}
            </div>

            <div className="md:hidden relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full px-4 py-2 text-left bg-gray-100 border rounded-md"
              >
                {statuses.find((s) => s.value === activeStatus)?.label}
              </button>

              {dropdownOpen && (
                <div className="absolute left-0 mt-2 w-full bg-white border rounded-md shadow-lg z-10">
                  {statuses.map((status) => (
                    <button
                      key={status.value}
                      onClick={() => {
                        setActiveStatus(status.value);
                        setDropdownOpen(false);
                      }}
                      className={`block w-full px-4 py-2 text-left ${
                        activeStatus === status.value ? "bg-gray-200" : "hover:bg-gray-100"
                      }`}
                    >
                      {status.label} ({statusCounts[status.value]})
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1 max-w-sm">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by Vehicle OR Alert"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <FaSearch className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Error / Loading */}
          {error && <p className="text-red-500 text-center">{error}</p>}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
            </div>
          ) : (
            <>
             { paginatedVehicles.length > 0 ? <VehicleTable vehicles={paginatedVehicles} userRole={role} />: <div className="flex justify-center items-center h-64">
                  <p className="text-gray-500">No Trucks, Add Now</p>
                </div> }

              {/* Pagination */}
                { paginatedVehicles.length > 0 && <div className="px-4 py-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> -{" "}
                    <span className="font-medium">
                      {Math.min(currentPage * ITEMS_PER_PAGE, filteredVehicles.length)}
                    </span>{" "}
                    of <span className="font-medium">{filteredVehicles.length}</span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      &larr;
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        className={`px-3 py-1 text-sm border rounded hover:bg-gray-50 ${
                          currentPage === i + 1 ? "bg-blue-50 text-blue-600" : ""
                        }`}
                        onClick={() => handlePageChange(i + 1)}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      &rarr;
                    </button>
                  </div>
                </div>
              </div>
}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
