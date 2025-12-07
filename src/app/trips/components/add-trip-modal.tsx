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
  load?: any | null
}

export function AddTripModal({ isOpen, onClose, onAdd, trucks, drivers, load }: AddTripModalProps) {
  const { user, role } = useContext(AuthContext)
  const isDriver = role === "driver"

  const currentDriver = isDriver ? drivers.find(d => d._id === user._id) : null
  const isDriverAvailable = currentDriver?.availability !== false
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    departureDateTime: "",
    arrivalDateTime: "",
    loadingDate: "",
    departureLocation: "",
    arrivalLocation: "",
    totalWeight: "",
    driverContactNumber: "",
    fare: "",
    registrationNumber: "",
    transporterName: "",
    cashAdvance: "",
    tyreDetails: "",
    tyreNumber: "",
    loadId: "",
    truckId: ""
  })

  // Pre-fill driver info
  useEffect(() => {
    if (isDriver && isDriverAvailable) {
      setFormData((prev) => ({
        ...prev,
        driverContactNumber: String(currentDriver?.contactNumber) || ""
      }))
    }
  }, [isDriver, isDriverAvailable, currentDriver])

  // Pre-fill load info
  useEffect(() => {
    if (load) {
      setFormData((prev) => ({
        ...prev,
        departureLocation: load.source,
        arrivalLocation: load.destination,
        totalWeight: String(load.weight),
        fare: String(load.price),
        loadId: load._id,
        truckId: load.truckId,
        registrationNumber: load.truckReg,
        departureDateTime: load.pickupDate ? new Date(load.pickupDate).toISOString().slice(0, 16) : "",
        loadingDate: load.pickupDate ? new Date(load.pickupDate).toISOString().slice(0, 16) : ""
      }))
    }
  }, [load])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAdding(true);
    try {
      await onAdd(formData)
      // Reset form
      setFormData({
        departureDateTime: "",
        arrivalDateTime: "",
        loadingDate: "",
        departureLocation: "",
        arrivalLocation: "",
        totalWeight: "",
        driverContactNumber: "",
        fare: "",
        registrationNumber: "",
        transporterName: "",
        cashAdvance: "",
        tyreDetails: "",
        tyreNumber: "",
        loadId: "",
        truckId: ""
      })
      onClose()
    } catch (error) {
      console.error("Failed to add trip:", error);
    } finally {
      setIsAdding(false);
    }
  }

  if (!isOpen) return null

  // Unavailable State
  if (isDriver && !isDriverAvailable) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Driver Unavailable</h2>
          <p className="text-gray-600 mb-8">You are currently marked as unavailable. Please complete your current assignment before creating a new trip.</p>
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      {/* Responsive Width:
         - Mobile: w-full (max-w-lg)
         - Desktop: max-w-4xl (Wider to accommodate 2 columns)
      */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg md:max-w-4xl my-4 flex flex-col max-h-[90vh]">
        
        {/* Header (Fixed) */}
        <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white rounded-t-xl z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Create New Trip</h2>
            <p className="text-sm text-gray-500">Enter logistics and settlement details</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="overflow-y-auto p-6">
          <form id="add-trip-form" onSubmit={handleSubmit}>
            
            {/* Grid Layout: 
               - 1 Column on Mobile
               - 2 Columns on Desktop (md+)
               - Gap to separate the sections
            */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* --- LEFT COLUMN: LOGISTICS --- */}
              <div className="space-y-6">
                
                {/* 1. Vehicle & Driver */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                   <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Vehicle & Driver</h3>
                   <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Truck <span className="text-red-500">*</span></label>
                        <select
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                          value={formData.registrationNumber}
                          onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                          required
                        >
                          <option value="">-- Choose Truck --</option>
                          {trucks
                            .filter((truck) => truck.status === "Available" && truck.available === true)
                            .map((truck) => (
                              <option key={truck._id} value={truck.registrationNumber}>
                                {truck.registrationNumber}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Driver <span className="text-red-500">*</span></label>
                        <select
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                          value={formData.driverContactNumber}
                          onChange={(e) => setFormData({ ...formData, driverContactNumber: e.target.value })}
                          required
                          disabled={isDriver}
                        >
                          <option value="">-- Choose Driver --</option>
                          {drivers
                            .filter((driver) => driver.availability !== false)
                            .map((driver) => (
                              <option key={driver._id} value={driver.contactNumber}>
                                {driver.firstName + " " + driver.lastName}
                              </option>
                            ))}
                        </select>
                      </div>
                   </div>
                </div>

                {/* 2. Route Info */}
                <div>
                   <h3 className="text-sm font-semibold text-gray-800 mb-3 border-b pb-1">Route Information</h3>
                   <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Transporter / Client Name</label>
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                          value={formData.transporterName}
                          onChange={(e) => setFormData({ ...formData, transporterName: e.target.value })}
                          placeholder="e.g. ABC Logistics Pvt Ltd"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
                           <input
                            type="text"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.departureLocation}
                            onChange={(e) => setFormData({ ...formData, departureLocation: e.target.value })}
                            required
                            placeholder="City"
                           />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                           <input
                            type="text"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.arrivalLocation}
                            onChange={(e) => setFormData({ ...formData, arrivalLocation: e.target.value })}
                            required
                            placeholder="City"
                           />
                        </div>
                      </div>
                   </div>
                </div>

              </div>

              {/* --- RIGHT COLUMN: DATES & FINANCIALS --- */}
              <div className="space-y-6">
                
                {/* 3. Dates */}
                <div>
                   <h3 className="text-sm font-semibold text-gray-800 mb-3 border-b pb-1">Schedule</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Loading Date</label>
                        <input
                          type="datetime-local"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                          value={formData.loadingDate}
                          onChange={(e) => setFormData({ ...formData, loadingDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Departure Date <span className="text-red-500">*</span></label>
                        <input
                          type="datetime-local"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                          value={formData.departureDateTime}
                          onChange={(e) => setFormData({ ...formData, departureDateTime: e.target.value })}
                          required
                        />
                      </div>
                   </div>
                </div>

                {/* 4. Financials & Cargo */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">Cargo & Payment</h3>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (Tons) <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.totalWeight}
                                    onChange={(e) => setFormData({ ...formData, totalWeight: e.target.value })}
                                    required
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Trip Fare (₹) <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.fare}
                                    onChange={(e) => setFormData({ ...formData, fare: e.target.value })}
                                    required
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cash Advance (₹)</label>
                            <input
                                type="number"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.cashAdvance}
                                onChange={(e) => setFormData({ ...formData, cashAdvance: e.target.value })}
                                placeholder="Amount received at start"
                            />
                            <p className="text-xs text-gray-500 mt-1">This will be deducted from final settlement.</p>
                        </div>
                    </div>
                </div>

                {/* 5. Extras (Tyres) */}
                <div>
                   <h3 className="text-sm font-semibold text-gray-800 mb-3 border-b pb-1">Additional Info</h3>
                   <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tyre No. (Opt)</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.tyreNumber}
                                onChange={(e) => setFormData({ ...formData, tyreNumber: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tyre Details</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.tyreDetails}
                                onChange={(e) => setFormData({ ...formData, tyreDetails: e.target.value })}
                            />
                        </div>
                   </div>
                </div>

              </div>
            </div>
          </form>
        </div>

        {/* Footer (Fixed) */}
        <div className="p-5 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            form="add-trip-form"
            type="submit"
            disabled={isAdding}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center"
          >
            {isAdding ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              "Create Trip"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}