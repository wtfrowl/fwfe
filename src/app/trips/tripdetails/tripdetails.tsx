import type React from "react"
import { useContext, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import {  BiEdit } from "react-icons/bi"
import { 
  FaGasPump, 
  FaUtensils, 
  FaRoad, 
  FaQuestion, 
  FaWrench, 
  FaUserTie,
  FaTruckLoading
} from "react-icons/fa"
import { AuthContext } from "../../../context/AuthContext"
import { approveExpense, createExpense, getTripById, updateTrip, updateTripDates, updateTripStatus } from "../../../api"
import { Sheet } from "../../../motion/Sheet"
import { Button } from "../../../components/ui/Button"
import { FormField } from "../../../components/ui/FormField"
import { inputClasses, inputClassesCompact } from "../../../components/ui/inputStyles"
import { StatusBadge } from "../../../components/ui/StatusBadge"
import { DetailPage, DetailHeader } from "../../../components/ui/DetailPage"
import { InlineMessage } from "../../../components/ui/InlineMessage"
import { ACCEPTED_TYPES, uploadFile, validateFile } from "../../docs/lib/upload"
import { TripStageBar } from "../components/TripStageBar"
import { IncidentPanel } from "../components/IncidentPanel"
import { moveTripStatus } from "../../../api"

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

  /* Odometer either side of the trip. The closing reading is what advances the
     truck's own odometer, which every per-kilometre figure in the product —
     tyre cost-per-km, fuel economy, service intervals — is measured against. */
  startOdometer?: number
  endOdometer?: number
  distance?: number
  arrivedAt?: string
  cancelledAt?: string
  cancellationReason?: string
  incidents?: {
    _id: string
    type: string
    reportedAt: string
    resolvedAt?: string
    notes?: string
    reportedByRole?: string
  }[]

  /* The signed, stamped LR the consignee hands back. Without it a disputed
     shortage is one party's word against the other's, and the deduction lands
     on the owner by default. */
  proofOfDelivery?: {
    viewUrl?: string
    downloadUrl?: string
    uploadedAt?: string
    uploadedBy?: string
    referenceNumber?: string
  }
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
  /* Completion asks for the closing odometer before it commits. It is the one
     moment the number is actually in front of someone — the driver is at the
     unloading point looking at the dash — and nothing else in the product ever
     collects it. */
  const [odometerPromptOpen, setOdometerPromptOpen] = useState(false)
  const [closingOdometer, setClosingOdometer] = useState("")
  /* Proof of delivery, captured at the same moment. This is the only point in
     the workflow when someone is holding the signed paper; asking for it a
     week later at a desk gets it from nobody. */
  const [podFile, setPodFile] = useState<File | null>(null)
  const [podReference, setPodReference] = useState("")
  const [podError, setPodError] = useState<string | null>(null)
  /* The stage the user picked, carried into the completion sheet so one
     handler serves every forward move rather than one per button. */
  const [pendingMove, setPendingMove] = useState<{ to: string; label: string } | null>(null)
  const [cancelReason, setCancelReason] = useState("")
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
      const response:any= await getTripById(id || "");
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
      await updateTripDates(id || "", { [editingField]: tempDate });
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
        await updateTrip(id!,settlementData)
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
      await createExpense(newExpense)
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

    try {
      await approveExpense(expenseId);
      setExpenses((prev) => prev.map((ex) => (ex._id === expenseId ? { ...ex, isApproved: true } : ex)))
    } catch (err) {
      console.error("Error approving expense:", err)
    }
  }

  /**
   * A stage change.
   *
   * Only the move to Completed needs the odometer and the signed receipt, so
   * only that one opens the sheet; everything else is a single request. Asking
   * for a POD when a truck starts loading would train people to dismiss the
   * prompt, and then it would be dismissed at the one moment it mattered.
   */
  const handleMove = async (to: string, label: string) => {
    if (to === "Completed") {
      setPendingMove({ to, label })
      openCompletionPrompt()
      return
    }

    if (to === "Cancelled") {
      setPendingMove({ to, label })
      setCancelReason("")
      return
    }

    setIsMarkingCompleted(true)
    try {
      await moveTripStatus(id || "", { to })
      await fetchTripDetails()
    } catch (err: any) {
      console.error("Error moving trip:", err)
      setError(err?.message ?? "Could not update the trip.")
    } finally {
      setIsMarkingCompleted(false)
    }
  }

  const handleCancel = async () => {
    setIsMarkingCompleted(true)
    try {
      await moveTripStatus(id || "", { to: "Cancelled", reason: cancelReason.trim() || undefined })
      setPendingMove(null)
      await fetchTripDetails()
    } catch (err: any) {
      console.error("Error cancelling trip:", err)
      setError(err?.message ?? "Could not cancel the trip.")
    } finally {
      setIsMarkingCompleted(false)
    }
  }

  const openCompletionPrompt = () => {
    /* Prefilled with the opening reading, so the field starts at the smallest
       plausible answer rather than empty — the number can only have gone up. */
    setClosingOdometer(trip?.startOdometer != null ? String(trip.startOdometer) : "")
    setPodFile(null)
    setPodReference(trip?.proofOfDelivery?.referenceNumber ?? "")
    setPodError(null)
    setOdometerPromptOpen(true)
  }

  const handleMarkAsCompleted = async () => {
    try {
      setIsMarkingCompleted(true)
      const payload: any = { unloadingDate: new Date(), to: "Completed" }

      /* Optional on purpose. A trip that is over is over; refusing to close it
         because nobody read the dash would leave the truck marked En Route and
         unavailable for its next load, which is a far worse failure than a
         missing kilometre count. The server ignores a reading below the
         opening one. */
      const reading = Number(closingOdometer)
      if (closingOdometer !== "" && Number.isFinite(reading)) {
        payload.endOdometer = reading
      }

      /* Uploaded before the status call, so a failed upload does not leave a
         trip closed with its paperwork silently dropped. */
      if (podFile) {
        const uploaded = await uploadFile(podFile)
        payload.proofOfDelivery = {
          viewUrl: uploaded.viewUrl,
          downloadUrl: uploaded.downloadUrl,
          referenceNumber: podReference.trim() || undefined,
        }
      } else if (podReference.trim()) {
        payload.proofOfDelivery = { referenceNumber: podReference.trim() }
      }

      await updateTripStatus(id || "", payload);
      setOdometerPromptOpen(false)
      await fetchTripDetails();
    } catch (err: any) {
      console.error("Error updating trip status:", err)
      setPodError(err?.message ?? "Could not complete the trip. Please try again.")
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
      case 'diesel': return <FaGasPump className="mr-2 text-accent" />;
      case 'urea': return <FaGasPump className="mr-2 text-accent" />;
      case 'food': return <FaUtensils className="mr-2 text-positive" />;
      case 'toll': return <FaRoad className="mr-2 text-caution" />;
      case 'repairing': return <FaWrench className="mr-2 text-ink-secondary" />;
      case 'driver_allowance': return <FaUserTie className="mr-2 text-ink-tertiary" />;
      case 'loading_charge': 
      case 'unloading_charge': return <FaTruckLoading className="mr-2 text-caution" />;
      default: return <FaQuestion className="mr-2 text-ink-quaternary" />;
    }
  }


  if (error) return <div className="text-critical text-center">{error}</div>
  if (!trip)
    return (
      <DetailPage>
        <header className="flex items-start gap-3">
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-ink/8" />
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-48 animate-pulse rounded-chip bg-ink/8" />
              <div className="h-6 w-24 animate-pulse rounded-full bg-ink/8" />
            </div>
            <div className="h-4 w-64 animate-pulse rounded-chip bg-ink/8" />
          </div>
        </header>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-card bg-ink/6" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-card bg-ink/6" />
      </DetailPage>
    )

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

  const statusTone = (status: string) => {
    switch (status) {
      case "Running": return "success" as const
      case "Completed": return "info" as const
      case "Settled": return "neutral" as const
      case "ApprovalRequested": return "warning" as const
      case "Cancelled": return "danger" as const
      default: return "neutral" as const
    }
  }

  return (
    <DetailPage>
      <DetailHeader
        title={trip.registrationNumber || "Trip"}
        subtitle={
          trip.departureLocation && trip.arrivalLocation
            ? `${trip.departureLocation} → ${trip.arrivalLocation}`
            : "Trip status, expenses and timeline"
        }
        badge={trip.status ? <StatusBadge tone={statusTone(trip.status)}>{trip.status}</StatusBadge> : null}
      />

   {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* 1. Departure Card */}
        <div className={`rounded-card border border-hairline bg-surface p-4 shadow-[var(--shadow-raised)] transition-all ${editingField === "loadingDate" ? "border-accent ring-1 ring-accent" : "border-hairline"}`}>
          <div className="flex justify-between items-start">
            <h2 className="font-medium mb-2 text-ink-secondary">Departure</h2>
            {/* Hide edit button if settled OR if currently editing */}
            {editingField !== "loadingDate" && (
              <button 
                onClick={() => startEditing("loadingDate", trip.loadingDate)}
                disabled={isSettled}
                className={`p-1 transition-colors ${isSettled ? "text-ink-quaternary cursor-not-allowed" : "text-ink-quaternary hover:text-accent"}`}
                title={isSettled ? "Cannot edit settled trip" : "Edit loading date"}
              >
                <BiEdit size={16} />
              </button>
            )}
          </div>
          <p className="font-semibold text-lg">{trip.departureLocation}</p>
          
          <div className="mt-2 space-y-2">
            <p className="text-sm text-ink-secondary">
              <span className="font-medium">Departed:</span> {new Date(trip.departureDateTime).toLocaleDateString()}
            </p>

            {editingField === "loadingDate" && !isSettled ? (
              <div className="mt-2 p-2 bg-accent-soft rounded-md border border-accent/20">
                <label className="text-[10px] font-semibold text-accent uppercase block mb-1">Editing Loading Date</label>
                <input 
                  type="date" 
                  className={`${inputClassesCompact} mb-2`}
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  disabled={isUpdatingDate}
                />
                <div className="flex gap-2">
                  <button 
                    onClick={handleDateSave}
                    className="flex-1 bg-accent text-white text-[10px] font-semibold py-1 rounded-chip hover:bg-accent-hover"
                  >
                    {isUpdatingDate ? "..." : "SAVE"}
                  </button>
                  <button 
                    onClick={() => setEditingField(null)}
                    className="flex-1 bg-surface border border-hairline-strong text-ink-secondary text-[10px] font-semibold py-1 rounded-chip"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-ink-secondary bg-canvas-sunken border border-hairline inline-block px-2 py-1 rounded-chip">
                <span className="font-medium">Loaded:</span>{" "}
                {trip.loadingDate ? (
                  <span>{new Date(trip.loadingDate).toLocaleDateString()}</span>
                ) : (
                  <span className="text-caution font-semibold text-[10px] uppercase">Pending</span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* 2. Arrival Card */}
        <div className={`rounded-card border border-hairline bg-surface p-4 shadow-[var(--shadow-raised)] transition-all ${editingField === "unloadingDate" ? "border-accent ring-1 ring-accent" : "border-hairline"}`}>
          <div className="flex justify-between items-start">
            <h2 className="font-medium mb-2 text-ink-secondary">Arrival</h2>
            {editingField !== "unloadingDate" && (
              <button 
                onClick={() => startEditing("unloadingDate", trip.unloadingDate)}
                disabled={isSettled}
                className={`p-1 transition-colors ${isSettled ? "text-ink-quaternary cursor-not-allowed" : "text-ink-quaternary hover:text-accent"}`}
                title={isSettled ? "Cannot edit settled trip" : "Edit unloading date"}
              >
                <BiEdit size={16} />
              </button>
            )}
          </div>
          <p className="font-semibold text-lg">{trip.arrivalLocation}</p>
          
          <div className="mt-2 space-y-2">
            <p className="text-sm text-ink-secondary">
              {trip.arrivalDateTime ? (
                <>
                  <span className="font-medium">Arrived:</span> {new Date(trip.arrivalDateTime).toLocaleDateString()}
                </>
              ) : (
                <span className="text-caution font-medium text-sm">In Transit</span>
              )}
            </p>

            {editingField === "unloadingDate" && !isSettled ? (
              <div className="mt-2 p-2 bg-accent-soft rounded-md border border-accent/20">
                <label className="text-[10px] font-semibold text-accent uppercase block mb-1">Editing Unloading Date</label>
                <input 
                  type="date" 
                  className={`${inputClassesCompact} mb-2`}
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  disabled={isUpdatingDate}
                />
                <div className="flex gap-2">
                  <button 
                    onClick={handleDateSave}
                    className="flex-1 bg-accent text-white text-[10px] font-semibold py-1 rounded-chip hover:bg-accent-hover"
                  >
                    {isUpdatingDate ? "..." : "SAVE"}
                  </button>
                  <button 
                    onClick={() => setEditingField(null)}
                    className="flex-1 bg-surface border border-hairline-strong text-ink-secondary text-[10px] font-semibold py-1 rounded-chip"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-ink-secondary bg-canvas-sunken border border-hairline inline-block px-2 py-1 rounded-chip">
                <span className="font-medium">Unloaded:</span>{" "}
                {trip.unloadingDate ? (
                  <span>{new Date(trip.unloadingDate).toLocaleDateString()}</span>
                ) : (
                  <span className="text-caution font-semibold text-[10px] uppercase">Pending</span>
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
            className="bg-accent text-white px-6 py-2 rounded-control hover:bg-accent-hover disabled:bg-ink/20"
            disabled={trip.status === "Settled"}
            >
            Add Expense
            </button>
            
            <button
            onClick={() => setSettlementModalOpen(true)}
            className="bg-ink text-white px-6 py-2 rounded-control hover:bg-ink flex items-center gap-2 disabled:bg-ink/20"
            disabled={trip.status === "Settled"}
            >
            <BiEdit /> Edit Settlement
            </button>
        </div>
        
        {/* Stage control.
            This was a chain of conditionals producing one button per status,
            which is why Loading, Unloading and Cancelled had no way to be
            reached even after the server supported them. The bar renders every
            move this role is allowed to make. */}
      </div>

      <TripStageBar
        status={trip.status}
        role={userRole}
        busy={isMarkingCompleted}
        onMove={handleMove}
      />

      <IncidentPanel
        tripId={trip._id}
        incidents={trip.incidents ?? []}
        canReport={trip.status !== "Settled" && trip.status !== "Cancelled"}
        onChanged={fetchTripDetails}
      />

      {/* --- Financial Summary Section --- */}
      <div className="rounded-card border border-hairline bg-surface p-5 shadow-[var(--shadow-raised)]">
        <h2 className="font-medium text-lg mb-4 text-ink border-b pb-2">Financial Overview & Settlement</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
           
           {/* Column 1: Revenue */}
           <div className="space-y-3">
              <h3 className="font-semibold text-ink-tertiary uppercase text-xs">Gross Revenue</h3>
              <div className="flex justify-between">
                <span className="text-ink-secondary">Total Freight (Fare)</span>
                <span className="font-medium text-lg">₹{totalFreight}</span>
              </div>
              <p className="text-xs text-ink-quaternary">Rate: ₹{trip.fare} x {trip.totalWeight} tons</p>
           </div>

           {/* Column 2: Transporter Account */}
           <div className="space-y-3 bg-canvas-sunken p-3 rounded-chip">
              <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-ink-tertiary uppercase text-xs">Transporter Deductions</h3>
                  <button onClick={() => setSettlementModalOpen(true)} className="text-accent text-xs hover:underline">Edit</button>
              </div>
              <div className="flex justify-between text-ink-secondary">
                <span>Cash Advance</span>
                <span>- ₹{trip.cashAdvance || 0}</span>
              </div>
              <div className="flex justify-between text-critical">
                <span>Commission</span>
                <span>- ₹{trip.commissionAmount || 0}</span>
              </div>
              <div className="flex justify-between text-critical">
                <span>Shortage</span>
                <span>- ₹{trip.shortageAmount || 0}</span>
              </div>
              <div className="border-t border-hairline-strong pt-2 flex justify-between font-semibold">
                <span>Balance Due</span>
                <span className="text-accent-ink">₹{balanceDue}</span>
              </div>
           </div>

           {/* Column 3: Net Profit */}
           <div className="space-y-3">
              <h3 className="font-semibold text-ink-tertiary uppercase text-xs">Owner Net Profit</h3>
              <div className="flex justify-between">
                <span>Total Freight</span>
                <span>₹{totalFreight}</span>
              </div>
              <div className="flex justify-between text-critical-ink">
                <span>Op. Expenses</span>
                <span>- ₹{totalExpenses}</span>
              </div>
               <div className="flex justify-between text-critical-ink">
                <span>Comm/Shortage</span>
                <span>- ₹{(trip.commissionAmount || 0) + (trip.shortageAmount || 0)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold text-base">
                <span>Net Saving</span>
                <span className={netProfit >= 0 ? "text-positive-ink" : "text-critical-ink"}>
                   ₹{netProfit}
                </span>
              </div>
           </div>
        </div>
      </div>

      {/* --- Expenses Table --- */}
      <div className="overflow-hidden rounded-card border border-hairline bg-surface shadow-[var(--shadow-raised)]">
        <h2 className="font-medium p-4 border-b bg-canvas-sunken text-ink-secondary">Operating Expenses</h2>

        {/* --- Desktop --- */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-canvas-sunken border-b">
                <th className="text-left p-4">Type</th>
                <th className="text-left p-4">Amount</th>
                <th className="text-left p-4">Qty</th>
                <th className="text-left p-4">Description</th>
                <th className="text-left p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentExpenses.map((expense) => (
                <tr key={expense._id} className="border-b last:border-0 hover:bg-canvas-sunken">
                  {/* The icon+label flex lives in a span, not on the td: `display:flex`
                      on a cell drops it out of the table layout and breaks column sizing. */}
                  <td className="p-4 font-medium capitalize">
                    <span className="flex items-center whitespace-nowrap">
                      {getExpenseIcon(expense.expenseType)} {expense.expenseType.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-4 font-semibold tabular-nums">₹{expense.amount}</td>
                  <td className="p-4 text-ink-tertiary tabular-nums">{expense.quantity ? `${expense.quantity} L` : "-"}</td>
                  {/* max-width on a td is only a hint under auto table layout, so the
                      truncation has to happen on a block child instead. */}
                  <td className="p-4 text-ink-secondary">
                    <span className="block max-w-xs truncate">{expense.description || "-"}</span>
                  </td>
                  <td className="p-4">
                     <button
                      onClick={() => { if (userRole === "owner" && !expense.isApproved) handleApproveExpense(expense._id) }}
                      disabled={(userRole === "owner" && expense.isApproved) || userRole !== "owner"}
                      className={`px-3 py-1 rounded-chip text-xs border whitespace-nowrap ${expense.isApproved ? "bg-canvas-sunken text-ink-quaternary" : "bg-surface text-accent border-accent/25"}`}
                    >
                      {expense.isApproved ? "Approved" : "Approve"}
                    </button>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-ink-quaternary">No expenses recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* --- Mobile ---
            Five columns of p-4 cells cannot fit a phone: the row overflowed the
            card, which is `overflow-hidden`, so the Approve button was clipped
            away entirely and owners could not approve an expense on mobile. */}
        <div className="space-y-3 p-3 md:hidden">
          {currentExpenses.map((expense) => (
            <div
              key={expense._id}
              className="rounded-card border border-hairline bg-surface p-4 shadow-[var(--shadow-hairline)]"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex min-w-0 items-center font-medium capitalize text-ink">
                  {getExpenseIcon(expense.expenseType)}
                  <span className="truncate">{expense.expenseType.replace(/_/g, ' ')}</span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-ink">₹{expense.amount}</span>
              </div>

              {expense.quantity ? (
                <p className="mt-1 text-sm tabular-nums text-ink-tertiary">{expense.quantity} L</p>
              ) : null}

              {expense.description ? (
                <p className="mt-1 text-sm leading-snug text-ink-secondary">{expense.description}</p>
              ) : null}

              <div className="mt-3 flex justify-end border-t border-hairline pt-3">
                <button
                  onClick={() => { if (userRole === "owner" && !expense.isApproved) handleApproveExpense(expense._id) }}
                  disabled={(userRole === "owner" && expense.isApproved) || userRole !== "owner"}
                  className={`rounded-chip border px-3 py-1.5 text-xs ${expense.isApproved ? "bg-canvas-sunken text-ink-quaternary" : "bg-surface text-accent border-accent/25"}`}
                >
                  {expense.isApproved ? "Approved" : "Approve"}
                </button>
              </div>
            </div>
          ))}
          {expenses.length === 0 && (
            <p className="p-8 text-center text-ink-quaternary">No expenses recorded yet.</p>
          )}
        </div>

          {/* Pagination */}
          {expenses.length > 0 && (
            <div className="flex justify-between items-center p-4 border-t bg-canvas-sunken">
                <button onClick={handlePreviousPage} disabled={currentPage === 1} className="px-3 py-1 bg-surface border rounded-chip">Prev</button>
                <span>{currentPage} of {totalPages}</span>
                <button onClick={handleNextPage} disabled={currentPage === totalPages} className="px-3 py-1 bg-surface border rounded-chip">Next</button>
            </div>
          )}
      </div>

      {/* Cancelling a trip.
          A reason is asked for because a cancelled trip keeps its record — it
          is no longer deleted — and six weeks later the only useful thing
          about it is why it was called off. */}
      <Sheet
        open={pendingMove?.to === "Cancelled"}
        onClose={() => setPendingMove(null)}
        title="Cancel this trip"
        description="The truck and its drivers are released. The trip and its expenses are kept."
        size="md"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setPendingMove(null)} disabled={isMarkingCompleted}>
              Keep trip
            </Button>
            <Button variant="danger" onClick={handleCancel} loading={isMarkingCompleted}>
              Cancel trip
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Why" htmlFor="cancel-reason" hint="Optional, but worth a few words">
            <input
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className={inputClasses}
              placeholder="Load withdrawn by the transporter"
            />
          </FormField>
          <InlineMessage tone="warning">
            This cannot be undone. A cancelled trip cannot be reopened.
          </InlineMessage>
        </div>
      </Sheet>

      {/* Closing odometer.
          Deliberately a prompt rather than a field buried in the settlement
          form: this is the only point in the workflow where someone is
          standing in front of the vehicle, and a reading collected a week
          later at a desk is a guess. */}
      <Sheet
        open={odometerPromptOpen}
        onClose={() => setOdometerPromptOpen(false)}
        title="Close this trip"
        description="Enter the odometer reading now, so this trip's distance and every cost-per-km figure are real."
        size="md"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              onClick={() => setOdometerPromptOpen(false)}
              disabled={isMarkingCompleted}
            >
              Cancel
            </Button>
            <Button onClick={handleMarkAsCompleted} loading={isMarkingCompleted}>
              Complete trip
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField
            label="Closing odometer"
            htmlFor="closing-odometer"
            hint={
              trip?.startOdometer != null
                ? `Opened at ${trip.startOdometer.toLocaleString("en-IN")} km`
                : "Current reading in km"
            }
          >
            <input
              id="closing-odometer"
              type="number"
              min={trip?.startOdometer ?? 0}
              step="1"
              value={closingOdometer}
              onChange={(e) => setClosingOdometer(e.target.value)}
              className={inputClasses}
              placeholder="e.g. 428500"
            />
          </FormField>

          {/* Shows the consequence of the number as it is typed, which is the
              cheapest way to catch a transposed digit before it lands. */}
          {trip?.startOdometer != null &&
          closingOdometer !== "" &&
          Number(closingOdometer) >= trip.startOdometer ? (
            <p className="text-sm text-ink-secondary">
              This trip covered{" "}
              <span className="font-semibold text-ink tabular-nums">
                {(Number(closingOdometer) - trip.startOdometer).toLocaleString("en-IN")} km
              </span>
              .
            </p>
          ) : null}

          {trip?.startOdometer != null &&
          closingOdometer !== "" &&
          Number(closingOdometer) < trip.startOdometer ? (
            <p className="text-sm text-critical-ink">
              That is below the opening reading of{" "}
              {trip.startOdometer.toLocaleString("en-IN")} km, so it will be ignored.
            </p>
          ) : null}

          <p className="text-xs text-ink-tertiary">
            You can leave this blank — the trip will still close, but it will not
            contribute to distance or per-kilometre costs.
          </p>

          {/* Proof of delivery.
              Attached here rather than on a separate screen because this is the
              only moment the signed LR is physically in someone's hands. A
              shortage deduction argued three weeks later without it is a
              deduction the owner simply absorbs. */}
          <div className="space-y-4 border-t border-hairline pt-4">
            <div>
              <p className="font-medium text-ink">Proof of delivery</p>
              <p className="text-sm text-ink-secondary">
                Photograph the signed LR now. It is what settles a shortage claim later.
              </p>
            </div>

            {podError && <InlineMessage tone="error">{podError}</InlineMessage>}

            <FormField label="LR / consignment number" htmlFor="pod-ref" hint="Optional">
              <input
                id="pod-ref"
                value={podReference}
                onChange={(e) => setPodReference(e.target.value)}
                className={inputClasses}
                placeholder="As written on the receipt"
              />
            </FormField>

            <FormField label="Signed receipt" htmlFor="pod-file" hint="Photo or PDF, up to 10 MB">
              <input
                id="pod-file"
                type="file"
                accept={ACCEPTED_TYPES}
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null
                  /* Checked before the network is touched, so a 40 MB scan is
                     rejected instantly rather than after a spinner. */
                  const problem = file ? validateFile(file) : null
                  setPodError(problem)
                  setPodFile(problem ? null : file)
                }}
                className={inputClasses}
              />
            </FormField>

            {trip?.proofOfDelivery?.viewUrl && !podFile && (
              <p className="text-sm text-ink-secondary">
                A receipt is already on file.{" "}
                <a
                  href={trip.proofOfDelivery.viewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-accent-ink underline"
                >
                  View it
                </a>
                . Attaching a new one replaces it.
              </p>
            )}
          </div>
        </div>
      </Sheet>

      <Sheet
        open={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        title="Add expense"
        description="Record a cost against this trip."
        size="md"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setExpenseModalOpen(false)} disabled={isAddingExpense}>
              Cancel
            </Button>
            <Button onClick={handleAddExpense} loading={isAddingExpense}>
              Save expense
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Expense type" htmlFor="expense-type" required>
            <select
              id="expense-type"
              name="expenseType"
              value={newExpense.expenseType}
              onChange={handleInputChange}
              className={inputClasses}
            >
              <option value="">Select a category</option>
              <option value="diesel">Diesel (fuel)</option>
              <option value="urea">Urea (DEF)</option>
              <option value="food">Food / meal</option>
              <option value="toll">Toll tax</option>
              <option value="repairing">Repairing</option>
              <option value="driver_allowance">Driver allowance</option>
              <option value="loading_charge">Loading charge</option>
              <option value="unloading_charge">Unloading charge</option>
              <option value="other">Other</option>
            </select>
          </FormField>

          {(newExpense.expenseType === "diesel" || newExpense.expenseType === "urea") && (
            <FormField label="Quantity" htmlFor="expense-qty" hint="In litres">
              <input
                id="expense-qty"
                type="number"
                min="0"
                step="0.01"
                name="quantity"
                value={newExpense.quantity}
                onChange={handleInputChange}
                className={inputClasses}
              />
            </FormField>
          )}

          <FormField label="Amount" htmlFor="expense-amount" hint="₹" required>
            <input
              id="expense-amount"
              type="number"
              min="0"
              name="amount"
              value={newExpense.amount}
              onChange={handleInputChange}
              className={inputClasses}
            />
          </FormField>

          <FormField label="Receipt" htmlFor="expense-receipt" hint="Optional photo of the bill">
            <input
              id="expense-receipt"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-ink-secondary file:mr-3 file:rounded-control file:border-0 file:bg-ink/6 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-ink hover:file:bg-ink/10"
            />
          </FormField>
        </div>
      </Sheet>

      <Sheet
        open={settlementModalOpen}
        onClose={() => setSettlementModalOpen(false)}
        title="Edit settlement"
        description="Adjust what was advanced, deducted and commissioned on this trip."
        size="md"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setSettlementModalOpen(false)} disabled={isUpdatingSettlement}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSettlement} loading={isUpdatingSettlement}>
              Update settlement
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField
            label="Cash advance"
            htmlFor="settle-advance"
            hint="Received from the transporter at the start"
          >
            <input
              id="settle-advance"
              type="number"
              min="0"
              value={settlementData.cashAdvance}
              onChange={(e) =>
                setSettlementData({ ...settlementData, cashAdvance: parseFloat(e.target.value) || 0 })
              }
              className={inputClasses}
            />
          </FormField>

          <FormField label="Commission" htmlFor="settle-commission">
            <input
              id="settle-commission"
              type="number"
              min="0"
              value={settlementData.commissionAmount}
              onChange={(e) =>
                setSettlementData({
                  ...settlementData,
                  commissionAmount: parseFloat(e.target.value) || 0,
                })
              }
              className={inputClasses}
            />
          </FormField>

          <FormField label="Shortage or damage" htmlFor="settle-shortage" hint="Deducted from the final payout">
            <input
              id="settle-shortage"
              type="number"
              min="0"
              value={settlementData.shortageAmount}
              onChange={(e) =>
                setSettlementData({
                  ...settlementData,
                  shortageAmount: parseFloat(e.target.value) || 0,
                })
              }
              className={inputClasses}
            />
          </FormField>
        </div>
      </Sheet>

    </DetailPage>
  )
}

export default TripInfo
