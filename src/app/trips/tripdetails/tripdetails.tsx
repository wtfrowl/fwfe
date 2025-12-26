import type React from "react"
import { useContext, useEffect, useState } from "react"
import axios from "axios"
import { useParams } from "react-router-dom"
import {  BiEdit } from "react-icons/bi"
import { LoadingSpinner } from "../components/loading-spinner"
import { 
  FaGasPump, 
  FaUtensils, 
  FaRoad, 
  FaQuestion, 
  FaWrench, 
  FaUserTie,
  FaTruckLoading,
  FaArrowLeft
} from "react-icons/fa"
import { api } from "../services/api"
import { AuthContext } from "../../../context/AuthContext"

// --- Interfaces ---
interface Expense {
  _id: string
  expenseType: string
  amount: number
  quantity?: number 
  description: string
  isApproved: boolean
  imageBase64?: string
}

interface Trip {
  _id: string;
  departureDateTime: string
  arrivalDateTime: string
  departureLocation: string
  arrivalLocation: string
  totalWeight: number
  registrationNumber: string
  driverContactNumber: string
  createdBy: string
  fare: number
  totalFare: number
  status: string
  tripExpenses: Expense[]
  transporterName?: string
  loadingDate?: string
  unloadingDate?: string
  paymentReceivedDate?: string
  
  // Settlement Fields
  commissionAmount?: number
  shortageAmount?: number
  cashAdvance?: number 
}

interface NewExpense {
  expenseType: string
  amount: string
  quantity: string 
  description: string
  tripId: string
  imageBase64: string
}

const ITEMS_PER_PAGE = 5

const TripInfo: React.FC = () => {
  const { role } = useContext(AuthContext)
  const userRole = role === "driver" ? "driver" : role === "owner" ? "owner" : null
  const { id } = useParams<{ id: string }>()
  
  const [trip, setTrip] = useState<Trip | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [error, setError] = useState<string | null>(null)
  const [totalExpenses, setTotalExpenses] = useState<number>(0)
  
  // Modals
  const [expenseModalOpen, setExpenseModalOpen] = useState<boolean>(false)
  const [settlementModalOpen, setSettlementModalOpen] = useState<boolean>(false)
  
  const [currentPage, setCurrentPage] = useState(1)
  const [isMarkingCompleted, setIsMarkingCompleted] = useState(false)
  const [isAddingExpense, setIsAddingExpense] = useState(false)
  const [isUpdatingSettlement, setIsUpdatingSettlement] = useState(false)

  // Settlement Form State
  const [settlementData, setSettlementData] = useState({
    cashAdvance: 0,
    commissionAmount: 0,
    shortageAmount: 0
  })

  const [newExpense, setNewExpense] = useState<NewExpense>({
    expenseType: "",
    amount: "",
    quantity: "",
    description: "",
    tripId: id || "",
    imageBase64: "",
  })

  // Pagination Logic
  const totalPages = Math.ceil(expenses?.length / ITEMS_PER_PAGE)
  const currentExpenses = expenses?.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  useEffect(() => {
    fetchTripDetails()
  }, [id])

  const fetchTripDetails = async () => {
    try {
      const response = await api.trips.getById(id || "");
      setTrip(response); 
      setExpenses(response.tripExpenses || [])
      
      // Initialize settlement form
      setSettlementData({
        cashAdvance: response.cashAdvance || 0,
        commissionAmount: response.commissionAmount || 0,
        shortageAmount: response.shortageAmount || 0
      })

      const total = response.tripExpenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0)
      setTotalExpenses(total)
    } catch (err) {
      setError("Error loading trip details");
    }
  }

// --- Inline Date Update State ---
// --- Inline Date Update State ---
  const [editingField, setEditingField] = useState<"loadingDate" | "unloadingDate" | null>(null);
  const [tempDate, setTempDate] = useState<string>("");
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);

  const isSettled = trip?.status === "Settled";

  const startEditing = (field: "loadingDate" | "unloadingDate", currentVal?: string) => {
    if (isSettled) return; // Guard clause
    setEditingField(field);
    setTempDate(currentVal ? new Date(currentVal).toISOString().split('T')[0] : "");
  };

  const handleDateSave = async () => {
    if (!tempDate || !editingField) return;
    setIsUpdatingDate(true);
    try {
      await api.trips.updateTripDates(id || "", { [editingField]: tempDate });
      await fetchTripDetails();
      setEditingField(null);
    } catch (err) {
      console.error(`Error updating date:`, err);
    } finally {
      setIsUpdatingDate(false);
    }
  };

  // --- Handlers ---
  const handleUpdateSettlement = async () => {
    setIsUpdatingSettlement(true)
    try {
        const token = localStorage.getItem("ownerToken") || localStorage.getItem("driverToken");
        let parsedToken: any = "";
        if (token) parsedToken = JSON.parse(token);

        // NOTE: Ensure your backend Route for Update Trip matches this URL
        await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/api/trips/trip/${id}`, settlementData, {
            headers: {
                "Content-Type": "application/json",
                Authorization: parsedToken ? parsedToken.accessToken : "",
            }
        });
      
      await fetchTripDetails()
      setSettlementModalOpen(false)
    } catch (err) {
      console.error("Error updating settlement:", err)
    } finally {
      setIsUpdatingSettlement(false)
    }
  }

  const handleAddExpense = async () => {
    setIsAddingExpense(true)
    try {
      await api.trips.createExpense(newExpense)
      await fetchTripDetails()
      setExpenseModalOpen(false)
      setNewExpense({ ...newExpense, expenseType: "", amount: "", quantity: "", description: "", imageBase64: "" })
    } catch (err) {
      console.error("Error adding expense:", err)
    } finally {
      setIsAddingExpense(false)
    }
  }

  const handleApproveExpense = async (expenseId: string) => {
    const token = localStorage.getItem("ownerToken") || localStorage.getItem("driverToken")
    let parsedToken: any = ""
    if (token) parsedToken = JSON.parse(token)

    try {
      await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/api/tripexpense/${expenseId}/approve`, {}, {
        headers: { "Content-Type": "application/json", authorization: parsedToken ? parsedToken.accessToken : "" }
      })
      setExpenses((prev) => prev.map((ex) => (ex._id === expenseId ? { ...ex, isApproved: true } : ex)))
    } catch (err) {
      console.error("Error approving expense:", err)
    }
  }

  const handleMarkAsCompleted = async () => {
    try {
      setIsMarkingCompleted(true)
      const payload = { unloadingDate: new Date() };
      await api.trips.updateStatus(id || "", payload);
      await fetchTripDetails();
    } catch (err) {
      console.error("Error updating trip status:", err)
    } finally {
      setIsMarkingCompleted(false)
    }
  }

  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1) }
  const handlePreviousPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1) }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewExpense((prev) => ({ ...prev, imageBase64: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleInputChange = (e: any) => {
    const { name, value } = e.target
    setNewExpense((prev) => ({ ...prev, [name]: value }))
  }

  const getExpenseIcon = (type: string) => {
    switch(type) {
      case 'diesel': return <FaGasPump className="mr-2 text-blue-600" />;
      case 'urea': return <FaGasPump className="mr-2 text-cyan-500" />;
      case 'food': return <FaUtensils className="mr-2 text-green-500" />;
      case 'toll': return <FaRoad className="mr-2 text-yellow-500" />;
      case 'repairing': return <FaWrench className="mr-2 text-gray-700" />;
      case 'driver_allowance': return <FaUserTie className="mr-2 text-purple-500" />;
      case 'loading_charge': 
      case 'unloading_charge': return <FaTruckLoading className="mr-2 text-orange-500" />;
      default: return <FaQuestion className="mr-2 text-gray-400" />;
    }
  }
  const handleFinalizeSettlement = async () => {
    try {
      // 1. Call API to update status to 'Settled'
      await api.trips.updateStatus(id || "", { paymentReceivedDate: new Date() });
      
      // 2. Fetch the updated trip data to trigger a re-render
      await fetchTripDetails(); 
      
    } catch (err) {
      console.error("Error finalizing settlement:", err);
    }
  }

  if (error) return <div className="text-red-500 text-center">{error}</div>
  if (!trip) return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>

  // --- Financial Calculations ---
  // 1. Total Gross Freight
  const totalFreight = trip.totalFare || 0;
  
  // 2. Deductions (Money Owner doesn't get at the end)
  const totalDeductions = (trip.cashAdvance || 0) + (trip.commissionAmount || 0) + (trip.shortageAmount || 0);
  
  // 3. Balance Due (What Transporter must pay Owner now)
  const balanceDue = totalFreight - totalDeductions;
  
  // 4. Net Profit (Owner's actual earning)
  // Formula: Freight - (Expenses + Commission + Shortage)
  // Cash Advance is NOT an expense, it is just pre-paid freight.
  const netProfit = totalFreight - totalExpenses - (trip.commissionAmount || 0) - (trip.shortageAmount || 0);

  return (
    <div className="mx-auto sm:px-8 bg-gray-50 space-y-6">
  <div className="bg-white border-b">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            
            {/* Title Section */}
            <div>
              <h1 className="text-2xl font-semibold">Trip Details</h1>
              <p className="text-sm text-gray-500">View trip status, expenses, and timeline</p>
            </div>

            {/* Back Button */}
            <button 
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2" 
              onClick={() => window.history.back()} 
            >
              <FaArrowLeft className="w-4 h-4" />
              Go Back
            </button>

          </div>
        </div>
      </div>

   {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* 1. Departure Card */}
        <div className={`bg-white p-4 border rounded-lg shadow-sm transition-all ${editingField === "loadingDate" ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200"}`}>
          <div className="flex justify-between items-start">
            <h2 className="font-medium mb-2 text-gray-700">Departure</h2>
            {/* Hide edit button if settled OR if currently editing */}
            {editingField !== "loadingDate" && (
              <button 
                onClick={() => startEditing("loadingDate", trip.loadingDate)}
                disabled={isSettled}
                className={`p-1 transition-colors ${isSettled ? "text-gray-200 cursor-not-allowed" : "text-gray-400 hover:text-blue-600"}`}
                title={isSettled ? "Cannot edit settled trip" : "Edit loading date"}
              >
                <BiEdit size={16} />
              </button>
            )}
          </div>
          <p className="font-semibold text-lg">{trip.departureLocation}</p>
          
          <div className="mt-2 space-y-2">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Departed:</span> {new Date(trip.departureDateTime).toLocaleDateString()}
            </p>

            {editingField === "loadingDate" && !isSettled ? (
              <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-100">
                <label className="text-[10px] font-bold text-blue-600 uppercase block mb-1">Editing Loading Date</label>
                <input 
                  type="date" 
                  className="w-full text-sm border rounded px-2 py-1 mb-2 outline-none focus:border-blue-400"
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  disabled={isUpdatingDate}
                />
                <div className="flex gap-2">
                  <button 
                    onClick={handleDateSave}
                    className="flex-1 bg-blue-600 text-white text-[10px] font-bold py-1 rounded hover:bg-blue-700"
                  >
                    {isUpdatingDate ? "..." : "SAVE"}
                  </button>
                  <button 
                    onClick={() => setEditingField(null)}
                    className="flex-1 bg-white border border-gray-300 text-gray-600 text-[10px] font-bold py-1 rounded"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-600 bg-gray-50 border border-gray-100 inline-block px-2 py-1 rounded">
                <span className="font-medium">Loaded:</span>{" "}
                {trip.loadingDate ? (
                  <span>{new Date(trip.loadingDate).toLocaleDateString()}</span>
                ) : (
                  <span className="text-orange-500 font-bold text-[10px] uppercase">Pending</span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* 2. Arrival Card */}
        <div className={`bg-white p-4 border rounded-lg shadow-sm transition-all ${editingField === "unloadingDate" ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200"}`}>
          <div className="flex justify-between items-start">
            <h2 className="font-medium mb-2 text-gray-700">Arrival</h2>
            {editingField !== "unloadingDate" && (
              <button 
                onClick={() => startEditing("unloadingDate", trip.unloadingDate)}
                disabled={isSettled}
                className={`p-1 transition-colors ${isSettled ? "text-gray-200 cursor-not-allowed" : "text-gray-400 hover:text-blue-600"}`}
                title={isSettled ? "Cannot edit settled trip" : "Edit unloading date"}
              >
                <BiEdit size={16} />
              </button>
            )}
          </div>
          <p className="font-semibold text-lg">{trip.arrivalLocation}</p>
          
          <div className="mt-2 space-y-2">
            <p className="text-sm text-gray-600">
              {trip.arrivalDateTime ? (
                <>
                  <span className="font-medium">Arrived:</span> {new Date(trip.arrivalDateTime).toLocaleDateString()}
                </>
              ) : (
                <span className="text-orange-500 font-medium text-sm">In Transit</span>
              )}
            </p>

            {editingField === "unloadingDate" && !isSettled ? (
              <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-100">
                <label className="text-[10px] font-bold text-blue-600 uppercase block mb-1">Editing Unloading Date</label>
                <input 
                  type="date" 
                  className="w-full text-sm border rounded px-2 py-1 mb-2 outline-none focus:border-blue-400"
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  disabled={isUpdatingDate}
                />
                <div className="flex gap-2">
                  <button 
                    onClick={handleDateSave}
                    className="flex-1 bg-blue-600 text-white text-[10px] font-bold py-1 rounded hover:bg-blue-700"
                  >
                    {isUpdatingDate ? "..." : "SAVE"}
                  </button>
                  <button 
                    onClick={() => setEditingField(null)}
                    className="flex-1 bg-white border border-gray-300 text-gray-600 text-[10px] font-bold py-1 rounded"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-600 bg-gray-50 border border-gray-100 inline-block px-2 py-1 rounded">
                <span className="font-medium">Unloaded:</span>{" "}
                {trip.unloadingDate ? (
                  <span>{new Date(trip.unloadingDate).toLocaleDateString()}</span>
                ) : (
                  <span className="text-orange-500 font-bold text-[10px] uppercase">Pending</span>
                )}
              </p>
            )}
          </div>
        </div>
        </div>


      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <div className="flex gap-2">
            <button
            onClick={() => setExpenseModalOpen(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            disabled={trip.status === "Settled"}
            >
            Add Expense
            </button>
            
            <button
            onClick={() => setSettlementModalOpen(true)}
            className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900 flex items-center gap-2 disabled:bg-gray-400"
            disabled={trip.status === "Settled"}
            >
            <BiEdit /> Edit Settlement
            </button>
        </div>
        
        {trip.status === "Settled" ? (
             <button disabled className="bg-gray-100 text-gray-500 border border-gray-300 px-6 py-2 rounded-lg font-medium cursor-not-allowed">Trip Settled</button>
        ) : trip.status === "Completed" ? (
             userRole === "owner" ? (
                <button 
                  onClick={handleFinalizeSettlement}
                  className="bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-800"
                >
                   Finalize Settlement
                </button>
             ) : (
                <button disabled className="bg-gray-100 text-gray-500 px-6 py-2 rounded-lg">Completed</button>
             )
        ) : trip.status === "ApprovalRequested" ? (
             userRole === "owner" ? (
                <button onClick={handleMarkAsCompleted} disabled={isMarkingCompleted} className="bg-green-600 text-white px-6 py-2 rounded-lg">Approve Completion</button>
             ) : (
                <button disabled className="bg-yellow-100 text-yellow-700 px-6 py-2 rounded-lg">Pending Approval</button>
             )
        ) : (
             <button onClick={handleMarkAsCompleted} disabled={isMarkingCompleted} className="bg-indigo-600 text-white px-6 py-2 rounded-lg">Mark Completed</button>
        )}
      </div>

      {/* --- Financial Summary Section --- */}
      <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
        <h2 className="font-medium text-lg mb-4 text-gray-800 border-b pb-2">Financial Overview & Settlement</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
           
           {/* Column 1: Revenue */}
           <div className="space-y-3">
              <h3 className="font-semibold text-gray-500 uppercase text-xs">Gross Revenue</h3>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Freight (Fare)</span>
                <span className="font-medium text-lg">₹{totalFreight}</span>
              </div>
              <p className="text-xs text-gray-400">Rate: ₹{trip.fare} x {trip.totalWeight} tons</p>
           </div>

           {/* Column 2: Transporter Account */}
           <div className="space-y-3 bg-gray-50 p-3 rounded">
              <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-500 uppercase text-xs">Transporter Deductions</h3>
                  <button onClick={() => setSettlementModalOpen(true)} className="text-blue-600 text-xs hover:underline">Edit</button>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Cash Advance</span>
                <span>- ₹{trip.cashAdvance || 0}</span>
              </div>
              <div className="flex justify-between text-red-500">
                <span>Commission</span>
                <span>- ₹{trip.commissionAmount || 0}</span>
              </div>
              <div className="flex justify-between text-red-500">
                <span>Shortage</span>
                <span>- ₹{trip.shortageAmount || 0}</span>
              </div>
              <div className="border-t border-gray-300 pt-2 flex justify-between font-bold">
                <span>Balance Due</span>
                <span className="text-blue-700">₹{balanceDue}</span>
              </div>
           </div>

           {/* Column 3: Net Profit */}
           <div className="space-y-3">
              <h3 className="font-semibold text-gray-500 uppercase text-xs">Owner Net Profit</h3>
              <div className="flex justify-between">
                <span>Total Freight</span>
                <span>₹{totalFreight}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Op. Expenses</span>
                <span>- ₹{totalExpenses}</span>
              </div>
               <div className="flex justify-between text-red-600">
                <span>Comm/Shortage</span>
                <span>- ₹{(trip.commissionAmount || 0) + (trip.shortageAmount || 0)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-base">
                <span>Net Saving</span>
                <span className={netProfit >= 0 ? "text-green-600" : "text-red-600"}>
                   ₹{netProfit}
                </span>
              </div>
           </div>
        </div>
      </div>

      {/* --- Expenses Table --- */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <h2 className="font-medium p-4 border-b bg-gray-50 text-gray-700">Operating Expenses</h2>
        <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left p-4">Type</th>
                <th className="text-left p-4">Amount</th>
                <th className="text-left p-4">Qty</th>
                <th className="text-left p-4">Description</th>
                <th className="text-left p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentExpenses.map((expense) => (
                <tr key={expense._id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-4 flex items-center font-medium capitalize">
                    {getExpenseIcon(expense.expenseType)} {expense.expenseType.replace(/_/g, ' ')}
                  </td>
                  <td className="p-4 font-semibold">₹{expense.amount}</td>
                  <td className="p-4 text-gray-500">{expense.quantity ? `${expense.quantity} L` : "-"}</td>
                  <td className="p-4 text-gray-600 truncate max-w-xs">{expense.description || "-"}</td>
                  <td className="p-4">
                     <button
                      onClick={() => { if (userRole === "owner" && !expense.isApproved) handleApproveExpense(expense._id) }}
                      disabled={(userRole === "owner" && expense.isApproved) || userRole !== "owner"}
                      className={`px-3 py-1 rounded text-xs border ${expense.isApproved ? "bg-gray-50 text-gray-400" : "bg-white text-blue-600 border-blue-200"}`}
                    >
                      {expense.isApproved ? "Approved" : "Approve"}
                    </button>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">No expenses recorded yet.</td></tr>}
            </tbody>
          </table>
          
          {/* Pagination */}
          {expenses.length > 0 && (
            <div className="flex justify-between items-center p-4 border-t bg-gray-50">
                <button onClick={handlePreviousPage} disabled={currentPage === 1} className="px-3 py-1 bg-white border rounded">Prev</button>
                <span>{currentPage} of {totalPages}</span>
                <button onClick={handleNextPage} disabled={currentPage === totalPages} className="px-3 py-1 bg-white border rounded">Next</button>
            </div>
          )}
      </div>

      {/* --- Modal: Add Expense --- */}
      {expenseModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add Operating Expense</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Expense Type</label>
                <select name="expenseType" value={newExpense.expenseType} onChange={handleInputChange} className="block w-full border rounded-lg p-2.5">
                  <option value="">Select Category</option>
                  <option value="diesel">Diesel (Fuel)</option>
                  <option value="urea">Urea (DEF)</option>
                  <option value="food">Food / Meal</option>
                  <option value="toll">Toll Tax</option>
                  <option value="repairing">Repairing</option>
                  <option value="driver_allowance">Driver Allowance</option>
                  <option value="loading_charge">Loading Charge</option>
                  <option value="unloading_charge">Unloading Charge</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {(newExpense.expenseType === 'diesel' || newExpense.expenseType === 'urea') && (
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity (Liters)</label>
                  <input type="number" name="quantity" value={newExpense.quantity} onChange={handleInputChange} className="block w-full border rounded-lg p-2.5" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Amount (₹)</label>
                <input type="number" name="amount" value={newExpense.amount} onChange={handleInputChange} className="block w-full border rounded-lg p-2.5" />
              </div>
              
               <div>
                <label className="block text-sm font-medium mb-1">Receipt</label>
                <input type="file" onChange={handleImageUpload} className="block w-full text-sm text-gray-500" />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setExpenseModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="button" onClick={handleAddExpense} disabled={isAddingExpense} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Modal: Edit Settlement --- */}
      {settlementModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Edit Settlement Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cash Advance (Received)</label>
                <input type="number" value={settlementData.cashAdvance} onChange={(e) => setSettlementData({...settlementData, cashAdvance: parseFloat(e.target.value)})} className="block w-full border rounded-lg p-2.5" />
                <p className="text-xs text-gray-500 mt-1">Amount received from transporter at start.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commission</label>
                <input type="number" value={settlementData.commissionAmount} onChange={(e) => setSettlementData({...settlementData, commissionAmount: parseFloat(e.target.value)})} className="block w-full border rounded-lg p-2.5" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shortage / Damage Deduction</label>
                <input type="number" value={settlementData.shortageAmount} onChange={(e) => setSettlementData({...settlementData, shortageAmount: parseFloat(e.target.value)})} className="block w-full border rounded-lg p-2.5" />
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button onClick={() => setSettlementModalOpen(false)} className="px-4 py-2 text-sm border rounded-lg">Cancel</button>
                <button onClick={handleUpdateSettlement} disabled={isUpdatingSettlement} className="px-4 py-2 text-sm text-white bg-gray-800 rounded-lg">Update</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default TripInfo