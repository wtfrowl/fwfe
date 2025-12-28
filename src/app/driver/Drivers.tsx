"use client";

import { useState, useMemo, useEffect, useContext } from "react";
import { FaPlus, FaSearch } from "react-icons/fa";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
// You will need to create/import these similar to your Truck components
import { DriverTable } from "./components/Driver-Table"; 
import { AddDriverModal } from "./components/AddDriverModal"; 
import { StatusTab } from "../trucks/components/status-tab"; // Reusing your existing component
import DriverTableSkeleton from "./components/Driver-Table-Skeleton"; // Optional skeleton

const ITEMS_PER_PAGE = 6;

// Define the Driver Type based on your Schema
export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
  license: string;
  totalTrips: number;
  availability: boolean; // mapped from availability
  city: string;
  state: string;
  status: "Available" | "Unavailable"; // Derived helper for UI
}

export default function DriversPage() {
  const [activeStatus, setActiveStatus] = useState<"ALL" | "Available" | "Unavailable">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addDriverModalOpen, setAddDriverModalOpen] = useState(false);
  const [userRole, setUserRole] = useState<"owner" | "driver" | null>(null);
  const { role } = useContext(AuthContext);

  const statuses = [
    { label: "ALL DRIVERS", value: "ALL" },
    { label: "AVAILABLE", value: "Available" },
    { label: "UNAVAILABLE", value: "Unavailable" },
  ];

  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Fetch Drivers
  useEffect(() => {
    const fetchDrivers = async () => {
      setLoading(true);
      setError(null);
      try {
        const ownerToken = localStorage.getItem("ownerToken");
        let token = "";

        if (ownerToken) {
          const parsed = JSON.parse(ownerToken);
          token = parsed.accessToken;
          setUserRole("owner");
        } else {
           const driverToken = localStorage.getItem("driverToken");
           if(driverToken) {
             token = JSON.parse(driverToken).accessToken;
             setUserRole("driver");
           }
        }

        if (!token) throw new Error("No valid token found");

        const config = {
          headers: {
            "Content-Type": "application/json",
            authorization: token,
          },
        };

        // CORRECT ENDPOINT based on your snippet
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/driver/list`, config);

        // ⚠️ CRITICAL FIX HERE: 
        // Your API returns the array directly, so we map 'response.data', not 'response.data.drivers'
        const rawData = Array.isArray(response.data) ? response.data : response.data.drivers || [];

        const sanitizedDrivers: Driver[] = rawData.map((d: any) => ({
          id: d._id || d.id, // Handle both _id and id
          firstName: d.firstName,
          lastName: d.lastName,
          contactNumber: d.contactNumber,
          license: d.license,
          totalTrips: d.totalTrips || 0,
          availability: d.availability,
          city: d.city || "N/A",
          state: d.state || "N/A",
          // Derive status string for the UI badge
          status: d.availability ? "Available" : "Unavailable", 
        }));

        setDrivers(sanitizedDrivers);
      } catch (err) {
        console.error("Error fetching drivers:", err);
        setError("Failed to fetch drivers. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDrivers();
  }, []);
  const filteredDrivers = useMemo(() => {
    return drivers.filter((driver) => {
      // 1. Filter by Status Tab
      if (activeStatus !== "ALL" && driver.status !== activeStatus) return false;

      // 2. Filter by Search (Name OR Phone)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const fullName = `${driver.firstName} ${driver.lastName}`.toLowerCase();
        const matchesName = fullName.includes(query);
        const matchesPhone = driver.contactNumber.includes(query);
        
        if (!matchesName && !matchesPhone) return false;
      }
      return true;
    });
  }, [activeStatus, searchQuery, drivers]);

  const totalPages = Math.ceil(filteredDrivers.length / ITEMS_PER_PAGE);

  useMemo(() => {
    setCurrentPage(1);
  }, [activeStatus, searchQuery]);

  const handleRefresh = () => {
    // You might want to re-trigger the fetch here
    setAddDriverModalOpen(false);
    // simpler way: window.location.reload() or abstract fetchDrivers out
  };

  const paginatedDrivers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDrivers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredDrivers, currentPage]);

  const statusCounts :any= useMemo(() => {
    return {
      ALL: drivers.length,
      "Available": drivers.filter((d) => d.status === "Available").length,
      "Unavailable": drivers.filter((d) => d.status === "Unavailable").length,
    };
  }, [drivers]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow">
          
          {/* Add Driver Modal */}
          {userRole === "owner" && (
            <AddDriverModal
              isOpen={addDriverModalOpen}
              onClose={() => setAddDriverModalOpen(false)}
              onDriverAdded={handleRefresh}
            />
          )}

          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold">My Drivers</h1>
              {userRole === "owner" && (
                <button
                  onClick={() => setAddDriverModalOpen(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                >
                  <FaPlus className="w-4 h-4" />
                  Add Driver
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
                  onClick={() => setActiveStatus(status.value as any)}
                  count={statusCounts[status.value]}
                />
              ))}
            </div>

            {/* Mobile Dropdown */}
            <div className="md:hidden relative p-2">
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
                        setActiveStatus(status.value as any);
                        setDropdownOpen(false);
                      }}
                      className={`block w-full px-4 py-2 text-left ${
                        activeStatus === status.value ? "bg-gray-200" : "hover:bg-gray-100"
                      }`}
                    >
                      {status.label} ({statusCounts[status?.value]})
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
                    placeholder="Search by Name or Phone"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <FaSearch className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Error / Loading / Data */}
          {error && <p className="text-red-500 text-center py-4">{error}</p>}
          
          {loading ? (
             // You can reuse VehicleTableSkeleton or create DriverTableSkeleton
             <DriverTableSkeleton />
          ) : (
            <>
              {paginatedDrivers.length > 0 ? (
                <DriverTable drivers={paginatedDrivers} userRole={role} />
              ) : (
                <div className="flex justify-center items-center h-64">
                  <p className="text-gray-500">No Drivers Found. Add one to get started.</p>
                </div>
              )}

              {/* Pagination */}
              {paginatedDrivers.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> -{" "}
                      <span className="font-medium">
                        {Math.min(currentPage * ITEMS_PER_PAGE, filteredDrivers.length)}
                      </span>{" "}
                      of <span className="font-medium">{filteredDrivers.length}</span>
                    </p>
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        &larr;
                      </button>
                      
                      {/* Simplified Pagination for larger lists */}
                      {[...Array(totalPages)].map((_, i) => (
                         // Hiding pages if too many, logic can be improved
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
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}