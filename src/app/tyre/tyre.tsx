"use client";

import { useState, useMemo, useEffect, useContext } from "react";
import { StatusTab } from "./components/status-tab";
// You will need to create these two components (code provided below)
import { TyreTable } from "./components/tyre-table"; 
import { AddTyreModal } from "./modals/AddTyreModal"; 

import { FaPlus, FaSearch } from "react-icons/fa";
import axios from "axios";
import { LoadingSpinner } from "../trips/components/loading-spinner";
import { AuthContext } from "../../context/AuthContext";

// --- Type Definition ---
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

const ITEMS_PER_PAGE = 8;

export default function Tyre() {
  const [activeStatus, setActiveStatus] = useState<string | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [tyres, setTyres] = useState<Tyre[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modals
  const [addTyreModalOpen, setAddTyreModalOpen] = useState(false);
  
  const { role } = useContext(AuthContext);
  const userRole = role; // Assuming role comes directly from context

  const statuses = [
    { label: "ALL TYRES", value: "ALL" },
    { label: "MOUNTED", value: "Mounted" },
    { label: "SPARES", value: "Spare" },
    { label: "SCRAPPED", value: "Scrapped" },
    { label: "RETREADING", value: "SentForRetreading" },
  ];

  const [dropdownOpen, setDropdownOpen] = useState(false);

  // --- Helper: Get Token ---
  const getAuthConfig = () => {
    const token = localStorage.getItem("ownerToken") || localStorage.getItem("driverToken");
    let parsedToken: any = "";
    if (token) parsedToken = JSON.parse(token);
    return {
      headers: {
        "Content-Type": "application/json",
        authorization: parsedToken ? parsedToken?.accessToken : "",
      },
    };
  };

  // --- Fetch Tyres ---
  const fetchTyres = async () => {
    setLoading(true);
    setError(null);
    try {
      const config = getAuthConfig();
      
      // Using POST as per your controller logic for 'getAllByOwner'
      // If your backend route is strictly GET, change this to axios.get
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/tyre/list`, 
        config
      );

      setTyres(response.data);
    } catch (err: any) {
      console.error("Error fetching tyres:", err);
      setError("Failed to fetch tyre inventory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTyres();
  }, []);

  const handleRefresh = () => {
    setAddTyreModalOpen(false);
    fetchTyres();
  };

  // --- Filtering & Searching ---
  const filteredTyres = useMemo(() => {
    return tyres.filter((tyre) => {
      // Status Filter
      if (activeStatus !== "ALL" && tyre.status !== activeStatus) return false;
      
      // Search Filter (Brand, Model, or Tyre Number)
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          tyre.tyreNumber.toLowerCase().includes(q) ||
          tyre.brand.toLowerCase().includes(q) ||
          tyre.model.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeStatus, searchQuery, tyres]);

  // --- Pagination ---
  const totalPages = Math.ceil(filteredTyres.length / ITEMS_PER_PAGE);

  useMemo(() => {
    setCurrentPage(1);
  }, [activeStatus, searchQuery]);

  const paginatedTyres = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTyres.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTyres, currentPage]);

  const statusCounts = useMemo(() => {
    return {
      ALL: tyres.length,
      Mounted: tyres.filter((t) => t.status === "Mounted").length,
      Spare: tyres.filter((t) => t.status === "Spare").length,
      Scrapped: tyres.filter((t) => t.status === "Scrapped").length,
      SentForRetreading: tyres.filter((t) => t.status === "SentForRetreading").length,
    };
  }, [tyres]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-gray-50 ">
      <div className="mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow">
          
          {/* Add Tyre Modal */}
          {userRole === "owner" && (
            <AddTyreModal
              isOpen={addTyreModalOpen}
              onClose={() => setAddTyreModalOpen(false)}
              onTyreAdded={handleRefresh}
            />
          )}

          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold">Tyre Inventory</h1>
                <p className="text-sm text-gray-500">Manage stock, track usage and tread health.</p>
              </div>
              
              {userRole === "owner" && (
  <button
    onClick={() => setAddTyreModalOpen(true)}
    className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
    title="Add New Tyre" // Tooltip for mobile users since text is hidden
  >
    <FaPlus className="w-4 h-4" />
    <span className="hidden sm:inline">Add New Tyre</span>
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
                  count={statusCounts[status.value as keyof typeof statusCounts] || 0}
                />
              ))}
            </div>

            {/* Mobile Dropdown */}
            <div className="md:hidden relative p-4">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full px-4 py-2 text-left bg-gray-100 border rounded-md font-medium text-gray-700"
              >
                {statuses.find((s) => s.value === activeStatus)?.label} 
                <span className="float-right">▼</span>
              </button>
              {dropdownOpen && (
                <div className="absolute left-4 right-4 mt-2 bg-white border rounded-md shadow-lg z-10">
                  {statuses.map((status) => (
                    <button
                      key={status.value}
                      onClick={() => {
                        setActiveStatus(status.value);
                        setDropdownOpen(false);
                      }}
                      className={`block w-full px-4 py-3 text-left border-b last:border-0 ${
                        activeStatus === status.value ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50"
                      }`}
                    >
                      {status.label} ({statusCounts[status.value as keyof typeof statusCounts] || 0})
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1 max-w-sm">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by ID, Brand or Model..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <FaSearch className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Table Content */}
          {error && <p className="text-red-500 text-center py-8">{error}</p>}
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              {paginatedTyres.length > 0 ? (
                <TyreTable tyres={paginatedTyres} userRole={userRole} />
              ) : (
                <div className="flex flex-col justify-center items-center h-64 text-gray-500">
                   <p>No tyres found matching your criteria.</p>
                </div>
              )}

              {/* Pagination */}
              {paginatedTyres.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
                      <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredTyres.length)}</span> of{" "}
                      <span className="font-medium">{filteredTyres.length}</span> results
                    </p>
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        &larr; Prev
                      </button>
                      
                      {/* Simple Pagination Numbers */}
                      <div className="hidden sm:flex gap-1">
                        {[...Array(totalPages)].map((_, i) => (
                           // Logic to show limited page numbers can be added here if needed
                           <button
                             key={i+1}
                             onClick={() => handlePageChange(i + 1)}
                             className={`px-3 py-1 text-sm border rounded ${currentPage === i+1 ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}`}
                           >
                             {i + 1}
                           </button>
                        ))}
                      </div>

                      <button
                        className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next &rarr;
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