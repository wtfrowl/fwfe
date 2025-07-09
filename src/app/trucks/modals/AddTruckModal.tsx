import { useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";

export const AddTruckModal = ({
  isOpen,
  onClose,
  onTruckAdded,
}: {
  isOpen: boolean;
  onClose: () => void;
  onTruckAdded: () => void;
}) => {
  const [form, setForm] = useState({
    registrationNumber: "",
    model: "",
    capacity: "",
    lastMaintenance: "",
    status: "Available",
    currentLat: "",
    currentLng: "",
    availableFrom: "",
    availableTill: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = Cookies.get("ownerToken");
      const parsedToken = token ? JSON.parse(token) : null;

      const config = {
        headers: {
          "Content-Type": "application/json",
          authorization: parsedToken?.accessToken || "",
        },
      };

      const payload = {
        registrationNumber: form.registrationNumber,
        model: form.model,
        capacity: parseFloat(form.capacity),
        lastMaintenance: form.lastMaintenance,
        status: "Available", // <-- Forced here
        currentLocation: {
          lat: parseFloat(form.currentLat),
          lng: parseFloat(form.currentLng),
        },
        availableFrom: form.availableFrom,
        availableTill: form.availableTill,
      };

      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/trucks`, payload, config);

      onTruckAdded();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to add truck. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div className="bg-white p-6 rounded-lg w-full max-w-4xl shadow-lg">
  <h2 className="text-xl font-semibold mb-4">Add Truck</h2>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Registration Number */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
      <input
        type="text"
        name="registrationNumber"
        value={form.registrationNumber}
        onChange={handleChange}
        className="w-full px-3 py-2 border rounded"
        placeholder="E.g., RJ14GA1234"
      />
    </div>

    {/* Truck Model */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Truck Model</label>
      <input
        type="text"
        name="model"
        value={form.model}
        onChange={handleChange}
        className="w-full px-3 py-2 border rounded"
        placeholder="E.g., Tata 4018"
      />
    </div>

    {/* Capacity */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (in tons)</label>
      <input
        type="number"
        name="capacity"
        value={form.capacity}
        onChange={handleChange}
        className="w-full px-3 py-2 border rounded"
        placeholder="E.g., 14"
      />
    </div>

    {/* Last Maintenance */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Last Maintenance Date</label>
      <input
        type="date"
        name="lastMaintenance"
        value={form.lastMaintenance}
        onChange={handleChange}
        className="w-full px-3 py-2 border rounded"
      />
    </div>

    {/* Latitude */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Current Latitude</label>
      <input
        type="number"
        name="currentLat"
        value={form.currentLat}
        onChange={handleChange}
        className="w-full px-3 py-2 border rounded"
        placeholder="E.g., 26.9124"
      />
    </div>

    {/* Longitude */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Current Longitude</label>
      <input
        type="number"
        name="currentLng"
        value={form.currentLng}
        onChange={handleChange}
        className="w-full px-3 py-2 border rounded"
        placeholder="E.g., 75.7873"
      />
    </div>

    {/* Available From */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Available From</label>
      <input
        type="date"
        name="availableFrom"
        value={form.availableFrom}
        onChange={handleChange}
        className="w-full px-3 py-2 border rounded"
      />
    </div>

    {/* Available Till */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Available Till</label>
      <input
        type="date"
        name="availableTill"
        value={form.availableTill}
        onChange={handleChange}
        className="w-full px-3 py-2 border rounded"
      />
    </div>
  </div>

  {/* Error Message */}
  {error && <p className="text-red-500 mt-4">{error}</p>}

  {/* Actions */}
  <div className="flex justify-end gap-2 mt-6">
    <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
    <button
      onClick={handleSubmit}
      disabled={loading}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      {loading ? "Adding..." : "Add Truck"}
    </button>
  </div>
</div>

    </div>
  );
};
