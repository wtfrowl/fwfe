import { useEffect, useState, useContext } from "react"
import { FaTimes } from "react-icons/fa"
import type { Driver, Truck } from "../types/api"
import { AuthContext } from "../../../context/AuthContext"

interface AddTripModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (tripData: any) => Promise<void>
  trucks: Truck[]
  drivers: Driver[]
}

export function AddTripModal({ isOpen, onClose, onAdd, trucks, drivers }: AddTripModalProps) {
  const { user, role } = useContext(AuthContext)
  const isDriver = role === "driver"

  const currentDriver = isDriver ? drivers.find(d => d._id === user._id) : null
  const isDriverAvailable = currentDriver?.availability !== false

  const [formData, setFormData] = useState({
    departureDateTime: "",
    arrivalDateTime: "",
    departureLocation: "",
    arrivalLocation: "",
    totalWeight: "",
    driverContactNumber: "",
    fare: "",
    registrationNumber: "",
  })

  // useEffect(() => {
  //   if (isDriver && isDriverAvailable) {
  //     setFormData((prev) => ({
  //       ...prev,
  //       driverContactNumber: currentDriver?.contactNumber || "",
  //     }))
  //   }
  // }, [isDriver, isDriverAvailable, currentDriver])
  
useEffect(() => {
  if (isDriver && isDriverAvailable) {
    setFormData((prev) => ({
      ...prev,
      driverContactNumber: String(currentDriver?.contactNumber) || "",
    }))
  }
}, [isDriver, isDriverAvailable, currentDriver])
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onAdd(formData)
    setFormData({
      departureDateTime: "",
      arrivalDateTime: "",
      departureLocation: "",
      arrivalLocation: "",
      totalWeight: "",
      driverContactNumber: "",
      fare: "",
      registrationNumber: "",
    })
    onClose()
  }

  if (!isOpen) return null

  // If driver is not available, disable the modal visually
  if (isDriver && !isDriverAvailable) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Not Available</h2>
          <p className="text-gray-600">You cannot create a trip while you're unavailable.</p>
          <button
            onClick={onClose}
            className="mt-6 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 transition"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Add Trip</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Truck Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Truck</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={formData.registrationNumber}
              onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
              required
            >
              <option value="">--Select a Truck--</option>
              {trucks
                .filter((truck) => truck.status === "Available" && truck.available === true)
                .map((truck) => (
                  <option key={truck._id} value={truck.registrationNumber}>
                    {truck.registrationNumber}
                  </option>
                ))}
            </select>
          </div>

          {/* Date Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="datetime-local"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={formData.departureDateTime}
                onChange={(e) => setFormData({ ...formData, departureDateTime: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="datetime-local"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={formData.arrivalDateTime}
                onChange={(e) => setFormData({ ...formData, arrivalDateTime: e.target.value })}
              />
            </div>
          </div>

          {/* Location Inputs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Departure Location</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={formData.departureLocation}
              onChange={(e) => setFormData({ ...formData, departureLocation: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Location</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={formData.arrivalLocation}
              onChange={(e) => setFormData({ ...formData, arrivalLocation: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Weight (kg)</label>
            <input
              type="number"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={formData.totalWeight}
              onChange={(e) => setFormData({ ...formData, totalWeight: e.target.value })}
              required
            />
          </div>

          {/* Driver Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Driver</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={formData.driverContactNumber}
              onChange={(e) => setFormData({ ...formData, driverContactNumber: e.target.value })}
              required
              disabled={isDriver} // disable if role is driver
            >
              <option value="">Select Driver</option>
              {drivers
                .filter((driver) => driver.availability !== false)
                .map((driver) => (
                  <option key={driver._id} value={driver.contactNumber}>
                    {driver.firstName + " " + driver.lastName}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trip Fare</label>
            <input
              type="number"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={formData.fare}
              onChange={(e) => setFormData({ ...formData, fare: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add Trip
          </button>
        </form>
      </div>
    </div>
  )
}
