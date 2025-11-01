import type React from "react"
import { useContext, useEffect, useState } from "react"
import axios from "axios"
import { useParams } from "react-router-dom"
import { BiUpload, BiTrash } from "react-icons/bi"
import { LoadingSpinner } from "../components/loading-spinner"
import { FaGasPump, FaUtensils, FaRoad, FaQuestion } from "react-icons/fa"
import { api } from "../services/api"
import { AuthContext } from "../../../context/AuthContext"
import { useEventStore} from "../../../store/trips/store"
// import { getCurrentLocation } from "../../services/location"
interface Expense {
  _id: string
  expenseType: string
  amount: number
  description: string
  isApproved: boolean
  imageBase64?: string
}

interface Trip {
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
  createdAt: string
  updatedAt: string
  status: string
  tripExpenses: Expense[]
}

interface NewExpense {
  expenseType: string
  amount: string
  description: string
  tripId: string
  imageBase64: string
}

const ITEMS_PER_PAGE = 3

const TripInfo: React.FC = () => {
    const {  role } = useContext(AuthContext)
  const userRole = role === "driver" ? "driver" : role === "owner" ? "owner" : null
  const expenseRefreshKey = useEventStore((state) => state.expenseRefreshKey)
  const tripRefreshKey = useEventStore((state) => state.tripRefreshKey)
  const { id } = useParams<{ id: string }>()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [error, setError] = useState<string | null>(null)
  const [totalAmount, setTotalAmount] = useState<number>(0)
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [newExpense, setNewExpense] = useState<NewExpense>({
    expenseType: "",
    amount: "",
    description: "",
    tripId: id || "",
    imageBase64: "",
  })
const [isMarkingCompleted, setIsMarkingCompleted] = useState(false)

  // Calculate pagination
  const totalPages = Math.ceil(expenses?.length / ITEMS_PER_PAGE)
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE
  const currentExpenses = expenses?.slice(indexOfFirstItem, indexOfLastItem)

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]

    if (file) {
      const reader = new FileReader()

      reader.onloadend = () => {
        const img = new Image()
        img.src = reader.result as string

        img.onload = () => {
          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")
          const maxWidth = 800
          const maxHeight = 800
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height
              height = maxHeight
            }
          }

          canvas.width = width
          canvas.height = height
          ctx?.drawImage(img, 0, 0, width, height)

          const resizedImageBase64 = canvas.toDataURL("image/jpeg", 0.8)
          setNewExpense((prevExpense) => ({
            ...prevExpense,
            imageBase64: resizedImageBase64,
          }))
        }
      }

      reader.readAsDataURL(file)
    }
  }

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
       const response = await api.trips.getById(id || "");
        // setTrip(response)
        setTrip({ ...response }); 

        setExpenses(response.tripExpenses || [])
        setExpenses(response.tripExpenses)
        const total = response.tripExpenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0)
       setTotalAmount(total)
      } catch (err) {
        setError("xs");
        console.error("Error fetching trip:", err)
      }
    }

    fetchTripDetails()
  }, [id,expenseRefreshKey,tripRefreshKey])

  const handleApproveExpense = async (expenseId: string) => {
    const token = localStorage.getItem("ownerToken") || localStorage.getItem("driverToken")
    let parsedToken:any = ""
    if (token) {
      parsedToken = JSON.parse(token)
    }

    const config = {
      headers: {
        "Content-Type": "application/json",
        authorization: parsedToken ? parsedToken.accessToken : "",
      },
    }

    try {
      await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/api/tripexpense/${expenseId}/approve`, {}, config)
      setExpenses((prevExpenses) =>
        prevExpenses.map((expense) => (expense._id === expenseId ? { ...expense, isApproved: true } : expense)),
      )
    } catch (err) {
      console.error("Error approving expense:", err)
    }
  }

  const handleAddExpense = async () => {

    try {
   //   await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/tripexpense`, newExpense, config)
       await api.trips.createExpense(newExpense)

      // Fetch updated trip details
     const response = await api.trips.getById(id || "");
      setTrip(response)
      console.log("Updated trip:", response)
      setExpenses(response.tripExpenses)
      const total = response.tripExpenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0)
      setTotalAmount(total)

      setModalOpen(false)
      setNewExpense({
        expenseType: "",
        amount: "",
        description: "",
        tripId: id || "",
        imageBase64: "",
      })
    } catch (err) {
      console.error("Error adding expense:", err)
    }
  }

const handleMarkAsCompleted = async () => {
  try {
    //GET LOCATION to be used when we change arrival location into lat,lon
//     getCurrentLocation()
//   .then(({ latitude, longitude }) => {
//     console.log("Lat:", latitude, "Long:", longitude);
//   })
//   .catch((err) => {
//     console.error("Location error:", err.message);
//   });
// return

    setIsMarkingCompleted(true) // Start loading
    const response = await api.trips.updateStatus(id || "");
    const updatedTripResponse =  await api.trips.getById(id || "");
    setTrip({ ...updatedTripResponse });
    setExpenses(updatedTripResponse.tripExpenses)
    const total = updatedTripResponse.tripExpenses.reduce(
      (sum: number, expense: Expense) => sum + expense.amount,
      0
    )
    setTotalAmount(total)

    console.log("Trip status updated:", response.message)
  } catch (err) {
    console.error("Error updating trip status:", err)
  } finally {
    setIsMarkingCompleted(false) // End loading
  }
}


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNewExpense((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>
  }

  if (!trip) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="mx-auto p-6 sm:px-8 bg-gray-50 space-y-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
      <h1 className="text-2xl font-boldinline-block px-4 py-2">Trip Details</h1>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Go Back
        </button>
       
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <h2 className="font-medium mb-2">Departure</h2>
          <p>{trip.departureLocation}</p>
          <p className="text-sm text-gray-500">{new Date(trip.departureDateTime).toLocaleString()}</p>
        </div>

        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <h2 className="font-medium mb-2">Arrival</h2>
          <p>{trip.arrivalLocation}</p>
          <p className="text-sm text-gray-500">{new Date(trip.arrivalDateTime).toLocaleString()}</p>
        </div>

        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <h2 className="font-medium mb-2">Driver & Truck Info</h2>
          <p>Truck No: {trip.registrationNumber}</p>
          <p>{trip.driverContactNumber}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Trip Summary */}
        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <h2 className="font-medium mb-4">Trip Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Distance</span>
              <span>380 miles</span>
            </div>
            <div className="flex justify-between">
              <span>Duration</span>
              <span>
                {Math.round(
                  (new Date(trip.arrivalDateTime).getTime() - new Date(trip.departureDateTime).getTime()) /
                    (1000 * 60 * 60),
                )}{" "}
                hours
              </span>
            </div>
            <div className="flex justify-between">
              <span>Weight</span>
              <span>{trip.totalWeight} tons</span>
            </div>
            <div className="flex justify-between">
              <span>Fare</span>
              <span>₹{trip.fare}</span>
            </div>
          </div>
        </div>

        {/* Trip Receipt */}
        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-medium">Trip Receipt</h2>
            <div className="flex gap-2">
              <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                <BiUpload size={20} />
              </button>
              <button className="p-2 text-red-600 hover:bg-red-50 rounded">
                <BiTrash size={20} />
              </button>
            </div>
          </div>
          <div className="border-2 border-dashed p-4 text-center">
            <p className="text-gray-500">Upload receipt image</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <button
          onClick={() => setModalOpen(true)}
          className="w-full sm:w-auto bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={trip.status === "Completed"}
        >
          Add Expense
        </button>
     {trip.status === "Completed" ? (
  <button
    disabled
    className="w-full sm:w-auto bg-gray-400 text-white px-6 py-2 rounded-lg cursor-not-allowed"
  >
    Completed
  </button>
) : trip.status === "ApprovalRequested" ? (
  userRole === "owner" ? (
    <button
      onClick={handleMarkAsCompleted}
      disabled={isMarkingCompleted}
      className="w-full sm:w-auto bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {isMarkingCompleted ? "Approving..." : "Approve Trip Completion"}
    </button>
  ) : (
    <button
      disabled
      className="w-full sm:w-auto bg-yellow-500 text-white px-6 py-2 rounded-lg cursor-not-allowed"
    >
      Approval Requested
    </button>
  )
) : (
  <button
    onClick={handleMarkAsCompleted}
    disabled={isMarkingCompleted}
    className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
  >
    {isMarkingCompleted ? "Marking..." : "Mark as Completed"}
  </button>
)}



      </div>

      {/* Expenses */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <h2 className="font-medium p-4 border-b">Expenses</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-4 font-medium">Expense Type</th>
                <th className="text-left p-4 font-medium">Amount</th>
                <th className="text-left p-4 font-medium">Description</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Approve</th>
              </tr>
            </thead>
            <tbody>
              {currentExpenses.map((expense) => (
                <tr key={expense._id} className="border-t">
                  <td className="p-4 flex items-center">
                    {expense.expenseType === "fuel" && <FaGasPump className="mr-2 text-blue-500" />}
                    {expense.expenseType === "food" && <FaUtensils className="mr-2 text-green-500" />}
                    {expense.expenseType === "toll" && <FaRoad className="mr-2 text-yellow-500" />}
                    {expense.expenseType === "other" && <FaQuestion className="mr-2 text-gray-500" />}
                    {expense.expenseType}
                  </td>
                  <td className="p-4">₹{expense.amount}</td>
                  <td className="p-4">{expense.description}</td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        expense.isApproved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {expense.isApproved ? "Approved" : "Pending"}
                    </span>
                  </td>
                  <td className="p-4">
                  <button
  onClick={() => {
    if (userRole === "owner" && !expense.isApproved) {
      handleApproveExpense(expense._id);
    }
  }}
  disabled={
    (userRole === "owner" && expense.isApproved) ||
    userRole !== "owner"
  }
  className={`px-3 py-1 rounded font-medium transition-all duration-200
    ${
      expense.isApproved
        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
        : userRole === "owner"
        ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
        : "bg-yellow-50 text-yellow-600 cursor-not-allowed"
    }`}
>
  {expense.isApproved
    ? "Approved"
    : userRole === "owner"
    ? "Approve"
    : "Approval Pending"}
</button>

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center p-4 border-t">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-200 rounded-lg disabled:bg-gray-100 disabled:text-gray-400 hover:bg-blue-50 transition-colors"
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-200 rounded-lg disabled:bg-gray-100 disabled:text-gray-400 hover:bg-blue-50 transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      {/* Summary of Earnings */}
      <div className="bg-white p-4 border border-gray-200 rounded-lg">
        <h2 className="font-medium mb-4">Summary of Earnings</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Total Earnings</span>
            <span>₹{trip.totalFare}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Expenses</span>
            <span>₹{totalAmount}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Net Earnings</span>
            <span>₹{trip.totalFare - totalAmount}</span>
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Add Expense</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Expense Type</label>
                <select
                  name="expenseType"
                  value={newExpense.expenseType}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border rounded p-2"
                >
                  <option value="">Select type</option>
                  <option value="fuel">
                    <FaGasPump className="inline-block mr-2" /> Fuel
                  </option>
                  <option value="food">
                    <FaUtensils className="inline-block mr-2" /> Food
                  </option>
                  <option value="toll">
                    <FaRoad className="inline-block mr-2" /> Toll
                  </option>
                  <option value="other">
                    <FaQuestion className="inline-block mr-2" /> Other
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={newExpense.amount}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={newExpense.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Receipt Image</label>
                <input type="file" onChange={handleImageUpload} className="mt-1 block w-full" />
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddExpense}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TripInfo

