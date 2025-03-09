import type { Vehicle } from "../types/vehicle";
import { HealthBar } from "./health-bar";
import { AlertBadge } from "./alert-badge";
import { FaCog, FaInfoCircle, FaTruck, FaCar, FaShuttleVan } from "react-icons/fa";
import { useState } from "react";
import axios from "axios";
import Cookies from 'js-cookie';
;
import { useNavigate } from "react-router-dom";

interface VehicleTableProps {
  vehicles: Vehicle[];
}

export function VehicleTable({ vehicles }: VehicleTableProps) {
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [editTruckDetails, setEditTruckDetails] = useState({
    registrationNumber: "",
    model: "",
    available: false,
    capacity: "",
  });

  const navigate = useNavigate();

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setEditTruckDetails((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEditFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const token = Cookies.get("ownerToken");
      const parsedToken = token ? JSON.parse(token) : null;

      if (!parsedToken?.accessToken) {
        console.error("No valid token found!");
        return;
      }

      const config = {
        headers: {
          "Content-Type": "application/json",
          authorization: parsedToken?.accessToken || "",
        },
      };

      await axios.patch(
        `https://fwfe.vercel.app/api/trucks/${selectedVehicle?.id}`,
        editTruckDetails,
        config
      );

      setIsEditPopupOpen(false);
    } catch (error) {
      console.error("Failed to update the truck:", error);
    }
  };

  const handleEditButtonClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setEditTruckDetails({
      registrationNumber: vehicle.registrationNumber,
      model: vehicle.model,
      available: vehicle.available,
      capacity: vehicle.capacity,
    });
    setIsEditPopupOpen(true);
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case "Truck":
        return FaTruck;
      case "Van":
        return FaShuttleVan;
      case "Car":
        return FaCar;
      default:
        return FaCar;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "text-blue-600";
      case "En Route":
        return "text-green-600";
      case "Out of Service":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="overflow-x-auto">
      {/* Desktop Table */}
      <table className="w-full hidden md:table">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">VEHICLE</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">TYPE</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">STATUS</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">HEALTH RATE</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ALERT TYPE</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ACTIONS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {vehicles.map((vehicle) => {
            const VehicleIcon = getVehicleIcon(vehicle.type);
            const statusColor = getStatusColor(vehicle.status);

            return (
              <tr key={vehicle.id} className="bg-white hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-4 flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-full">
                    <VehicleIcon className="w-5 h-5 text-gray-600" />
                  </div>
                  <span className="font-medium">{vehicle.registrationNumber}</span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">{vehicle.type}</td>
                <td className="px-4 py-4">
                  <span className={`text-sm font-medium ${statusColor}`}>{vehicle.status}</span>
                </td>
                <td className="px-4 py-4 w-64">
                  <HealthBar value={vehicle.healthRate} />
                </td>
                <td className="px-4 py-4">
                  <AlertBadge type={vehicle.alertType} />
                </td>
                <td className="px-4 py-4 flex gap-2">
                  <button
                    className="text-sm text-gray-600 hover:text-gray-900"
                    onClick={() => handleEditButtonClick(vehicle)}
                  >
                    <FaCog className="w-5 h-5 inline-block" /> Edit
                  </button>
                  <button
                    className="text-sm text-gray-600 hover:text-gray-900"
                    onClick={() => navigate(`${vehicle.registrationNumber}`)}
                  >
                    <FaInfoCircle className="w-5 h-5 inline-block" /> View
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
 {/* Edit Truck Popup */}
 {isEditPopupOpen && (
  <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded-lg shadow-lg w-[400px]">
      <h2 className="text-lg font-medium mb-4">Edit Truck</h2>
      <form onSubmit={handleEditFormSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Registration Number
          </label>
          <input
            type="text"
            name="registrationNumber"
            value={editTruckDetails.registrationNumber}
            onChange={handleEditFormChange}
            className="w-full border rounded-md p-2"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Model</label>
          <input
            type="text"
            name="model"
            value={editTruckDetails.model}
            onChange={handleEditFormChange}
            className="w-full border rounded-md p-2"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Capacity</label>
          <input
            type="text"
            name="capacity"
            value={editTruckDetails.capacity}
            onChange={handleEditFormChange}
            className="w-full border rounded-md p-2"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Availability</label>
          <input
            type="checkbox"
            name="Available"
            checked={editTruckDetails.available}
            onChange={handleEditFormChange}
          />
          {editTruckDetails.available?"Available":"Not Available"}  
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="px-4 py-2 bg-gray-500 text-white rounded-md"
            onClick={() => setIsEditPopupOpen(false)}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  </div>
)}
      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {vehicles.map((vehicle) => (
          <div key={vehicle.id} className="p-4 border rounded-lg bg-white shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gray-100 rounded-full">
                  <FaTruck className="w-5 h-5 text-gray-600" />
                </div>
                <span className="font-medium">{vehicle.registrationNumber}</span>
              </div>
              <span className={`text-sm font-medium ${getStatusColor(vehicle.status)}`}>
                {vehicle.status}
              </span>
            </div>
            <p className="text-gray-600 text-sm">Type: {vehicle.type}</p>
            <p className="text-gray-600 text-sm">Capacity: {vehicle.capacity}</p>
            <p className="text-gray-600 text-sm">Health Rate:</p>
            <HealthBar value={vehicle.healthRate} />
            <p className="text-gray-600 text-sm">Alert Type:</p>
            <AlertBadge type={vehicle.alertType} />
            <div className="flex gap-3 mt-2">
              <button
                className="text-sm text-blue-600 font-medium"
                onClick={() => handleEditButtonClick(vehicle)}
              >
                Edit
              </button>
              <button
                className="text-sm text-gray-600 font-medium"
                onClick={() => navigate(`${vehicle.registrationNumber}`)}
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
