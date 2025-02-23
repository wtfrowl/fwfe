import { useState } from "react";
import type { Trip } from "../types/api";
import { FaEdit, FaCopy, FaTrash } from "react-icons/fa";
import { LoadingSpinner } from "../components/loading-spinner";
import { useNavigate } from "react-router-dom";

interface TripsTableProps {
  trips: Trip[];
  isLoading: boolean;
  onDelete: (id: string) => Promise<void>;
  onEdit: (trip: Trip) => void;
  onCopy: (trip: Trip) => void;
}

const ITEMS_PER_PAGE = 5;

export function TripsTable({ trips, isLoading, onDelete, onEdit, onCopy }: TripsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(trips.length / ITEMS_PER_PAGE);
  const navigate = useNavigate();
  const paginatedTrips = trips.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="hidden md:block">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Trip</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Fare</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedTrips.map((trip) => (
                <tr key={trip._id} className="bg-white">
                  <td className="px-4 py-4 cursor-pointer" onClick={() => navigate(`${trip._id}`)}>
                    <span className="font-medium flex flex-col">
                      <p>{trip.registrationNumber}</p>
                      <p className="text-gray-500">{trip.departureLocation} → {trip.arrivalLocation}</p>
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex px-2 py-1 text-sm font-medium rounded-full ${trip.status === "Running" ? "bg-green-100 text-green-600" : trip.status === "Completed" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"}`}>
                      {trip.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-medium">${trip.fare}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => onEdit(trip)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button onClick={() => onCopy(trip)} className="p-1.5 text-gray-600 hover:bg-gray-50 rounded">
                        <FaCopy className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(trip._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-4">
          {paginatedTrips.map((trip) => (
            <div key={trip._id} className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{trip.registrationNumber}</p>
                  <p className="text-gray-500 text-sm">{trip.departureLocation} → {trip.arrivalLocation}</p>
                </div>
                <span className={`px-2 py-1 text-sm font-medium rounded-full ${trip.status === "Running" ? "bg-green-100 text-green-600" : trip.status === "Completed" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"}`}>
                  {trip.status}
                </span>
              </div>
              <div className="mt-2 flex justify-between items-center">
                <span className="font-medium">${trip.fare}</span>
                <div className="flex gap-2">
                  <button onClick={() => onEdit(trip)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                    <FaEdit className="w-4 h-4" />
                  </button>
                  <button onClick={() => onCopy(trip)} className="p-1.5 text-gray-600 hover:bg-gray-50 rounded">
                    <FaCopy className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(trip._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* Pagination */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
              Previous
            </button>
            <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
