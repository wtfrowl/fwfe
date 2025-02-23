import { useState } from "react"
import type { TruckTrip } from "../types/truck"
import { FaTruck, FaEdit } from "react-icons/fa"

interface TripsTableProps {
  trips: TruckTrip[]
}

const ITEMS_PER_PAGE = 5

export function TripsTable({ trips }: TripsTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(trips.length / ITEMS_PER_PAGE)

  const paginatedTrips = trips.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-8 px-4 py-3">
                <input type="checkbox" className="rounded border-gray-300" />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">TRUCK</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">STATUS</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">MODEL</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">PROFIT</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
          {paginatedTrips.length === 0 ? (
  <tr>
    <td className="px-4 py-4 text-center text-gray-500 align-middle h-40" colSpan={3}>
      No Data Available
    </td>
  </tr>
) : (
  paginatedTrips.map((trip) => (
    <tr key={trip.id} className="bg-white">
      <td className="px-4 py-4">
        <input type="checkbox" className="rounded border-gray-300" />
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-full">
            <FaTruck className="w-5 h-5 text-gray-600" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium">{trip.truckId}</span>
            <span className="text-sm text-gray-500">Departure: {trip.departure}</span>
            <span className="text-sm text-gray-500">Arrival: {trip.arrival}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <span className="inline-flex px-2 py-1 text-sm font-medium bg-green-100 text-green-600 rounded-full">
          {trip.status}
        </span>
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-col">
          <span className="text-sm text-gray-900">Weight: {trip.weight} kg</span>
          <span className="text-sm text-gray-500">Fare: ${trip.fare}</span>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium">Expenses:</span>
          {trip.expenses.fuel && <span className="text-sm text-gray-500">fuel: ${trip.expenses.fuel}</span>}
        </div>
      </td>
      <td className="px-4 py-4">
        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
          <FaEdit className="w-5 h-5" />
        </button>
      </td>
    </tr>
  ))
)}

          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <button
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

