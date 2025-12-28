import React, { useState } from "react";
import axios from "axios";
import { FaTimes } from "react-icons/fa";

interface AddDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDriverAdded: () => void;
}

export const AddDriverModal: React.FC<AddDriverModalProps> = ({
  isOpen,
  onClose,
  onDriverAdded,
}) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: "",
    contactNumber: "",
    aadharNumber: "",
    license: "",
    password: "",
    street: "",
    city: "",
    state: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const tokenObj = JSON.parse(localStorage.getItem("ownerToken") || "{}");
      const token = tokenObj.accessToken;

      if (!token) throw new Error("Unauthorized");

      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/register-driver`, // Assuming this is your create route
        {
            ...formData,
            age: Number(formData.age), // Ensure number type
        },
        { headers: { Authorization: token } }
      );

      onDriverAdded(); // Refresh parent list
      onClose(); // Close modal
      setFormData({
        firstName: "", lastName: "", age: "", contactNumber: "",
        aadharNumber: "", license: "", password: "", street: "", city: "", state: ""
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add driver");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Add New Driver</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Personal Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input name="firstName" required value={formData.firstName} onChange={handleChange} className="mt-1 w-full border rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input name="lastName" required value={formData.lastName} onChange={handleChange} className="mt-1 w-full border rounded-md p-2" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Age</label>
              <input name="age" type="number" min="18" required value={formData.age} onChange={handleChange} className="mt-1 w-full border rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
              <input name="contactNumber" required pattern="\d{10}" title="10 digit number" value={formData.contactNumber} onChange={handleChange} className="mt-1 w-full border rounded-md p-2" />
            </div>
          </div>

          {/* Credentials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">License Number</label>
              <input name="license" required value={formData.license} onChange={handleChange} className="mt-1 w-full border rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Aadhar Number</label>
              <input name="aadharNumber" required value={formData.aadharNumber} onChange={handleChange} className="mt-1 w-full border rounded-md p-2" />
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700">Password</label>
             <input name="password" type="password" minLength={6} required value={formData.password} onChange={handleChange} className="mt-1 w-full border rounded-md p-2" />
          </div>

          {/* Address */}
          <h3 className="text-md font-medium text-gray-900 border-b pb-1 pt-2">Address</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700">Street</label>
            <input name="street" required value={formData.street} onChange={handleChange} className="mt-1 w-full border rounded-md p-2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input name="city" required value={formData.city} onChange={handleChange} className="mt-1 w-full border rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">State</label>
              <input name="state" required value={formData.state} onChange={handleChange} className="mt-1 w-full border rounded-md p-2" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Driver"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};