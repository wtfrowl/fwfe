import React from "react";
import { useNavigate } from "react-router-dom"; // Ensure you have react-router-dom installed
import type { Driver } from "../Drivers"; // Adjust path if needed

interface DriverTableProps {
  drivers: Driver[];
  userRole: "owner" | "driver" | null;
}

export const DriverTable: React.FC<DriverTableProps> = ({ drivers }) => {
  const navigate = useNavigate();

  const handleRowClick = (driverId: string) => {
    // Navigate to the dynamic detail route
    navigate(`${driverId}`);
  };

  return (
    <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact / License
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Location
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Trips
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            {/* REMOVED: Actions Column Header */}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {drivers.map((driver) => (
            <tr 
              key={driver.id} 
              onClick={() => handleRowClick(driver.id)}
              className="hover:bg-blue-50 transition-colors cursor-pointer group"
            >
              {/* Name */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-10 w-10 flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold group-hover:bg-blue-200 transition-colors">
                      {driver.firstName[0]}
                      {driver.lastName[0]}
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                      {driver.firstName} {driver.lastName}
                    </div>
                  </div>
                </div>
              </td>

              {/* Contact Info */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{driver.contactNumber}</div>
                <div className="text-xs text-gray-500">Lic: {driver.license}</div>
              </td>

              {/* Location */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{driver.city}</div>
                <div className="text-xs text-gray-500">{driver.state}</div>
              </td>

              {/* Trips */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {driver.totalTrips}
              </td>

              {/* Status Badge */}
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    driver.status === "Available"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {driver.status}
                </span>
              </td>

              {/* REMOVED: Actions Column Data */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};