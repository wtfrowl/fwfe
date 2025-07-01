import { useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";

export const AddTruckModal = ({ isOpen, onClose, onTruckAdded }: {
  isOpen: boolean;
  onClose: () => void;
  onTruckAdded: () => void;
}) => {
  const [form, setForm] = useState({
    registrationNumber: "",
    model: "",
    capacity: "",
    lastMaintenance: "",
    status: "Available"
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

      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/trucks`, form, config);
      onTruckAdded();
      onClose();
    } catch (err) {
      setError("Failed to add truck. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white p-6 rounded-lg w-full max-w-lg space-y-4 shadow-lg">
        <h2 className="text-xl font-semibold">Add Truck</h2>

        <input
          type="text"
          name="registrationNumber"
          placeholder="Registration Number"
          value={form.registrationNumber}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
        />

        <input
          type="text"
          name="model"
          placeholder="Model"
          value={form.model}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
        />

        <input
          type="text"
          name="capacity"
          placeholder="Capacity (e.g., 10 tons)"
          value={form.capacity}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
        />

        <input
          type="date"
          name="lastMaintenance"
          value={form.lastMaintenance}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
        />

        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="Available">Available</option>
          <option value="En Route">En Route</option>
          <option value="Out of Service">Out of Service</option>
        </select>

        {error && <p className="text-red-500">{error}</p>}

        <div className="flex justify-end gap-2">
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
