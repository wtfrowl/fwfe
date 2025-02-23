import { useState } from "react"
import { FaTimes } from "react-icons/fa"
import type { Driver, Truck } from "../types/api"

interface AddTripModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (tripData: any) => Promise<void>
  trucks: Truck[]
  drivers: Driver[]
}

export function AddTripModal({ isOpen, onClose, onAdd, trucks, drivers }: AddTripModalProps) {
  const [formData, setFormData] = useState({
    departureDateTime: "",
    arrivalDateTime: "",
    departureLocation: "",
    arrivalLocation: "",
    totalWeight: "",
    driverContactNumber: "",
    fare: "",
    registrationNumber:"",
  })

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
      registrationNumber:"",
    })
    onClose()
  }

  if (!isOpen) return null

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
  .map((filteredTruck) => (
    <option key={filteredTruck._id} value={filteredTruck.registrationNumber}>
      {filteredTruck.registrationNumber}
    </option>
  ))}

            </select>
          </div>

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Departure Location</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Enter departure location"
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
              placeholder="Enter arrival location"
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
              placeholder="Enter total weight"
              value={formData.totalWeight}
              onChange={(e) => setFormData({ ...formData, totalWeight: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Driver</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={formData.driverContactNumber}
              onChange={(e) => setFormData({ ...formData, driverContactNumber: e.target.value } )}
              required
            >
              <option value="">Select Driver</option>
              {drivers
  .filter((driver) => driver.availability !== false) // Filter out unavailable drivers
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
              placeholder="Enter trip fare"
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

