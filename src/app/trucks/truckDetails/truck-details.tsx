import { MetricCard } from "./components/metric-card";
import { TripsTable } from "./components/trips-table";
import { CurrentTripCard } from "./components/current-trip-card";
import { 
  FaTimes, FaCheck, FaTruck, 
  FaEdit, FaCalendarAlt, FaWeightHanging 
} from "react-icons/fa";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { LoadingSpinner } from "../../trips/components/loading-spinner";
import { removeDriver, assignDriver, getDrivers, getTruckByRegNo, updateTruck } from "../../../api";
import { TruckTyrePanel } from "../../tyre/components/TruckTyrePanel";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { InlineMessage } from "../../../components/ui/InlineMessage";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import {
  DetailPage,
  DetailHeader,
} from "../../../components/ui/DetailPage";
import { inputClassesCompact } from "../../../components/ui/inputStyles";

// Matches your Mongoose Schema
interface TruckProfile {
  _id: string;
  registrationNumber: string;
  model: string;
  capacity: number;
  status: "En Route" | "Available" | "Out of Service";
  lastMaintenance: string; // ISO Date string
  currentSpeed?: number;
  travelledToday?: number;
  ignition?: string;
  lastUpdated?: string;
  location?: string;
  currentTrip?: any;
  trips?: any[];
  driverNames?: string[];
  driverId?: string[];
  totalKm?: number;
  available?: boolean;
  /** Which wheel positions this vehicle has. Drives the fitting diagram. */
  axleLayout?: string | null;
}

// --- NEW: SKELETON LOADER COMPONENT ---
const TruckDetailsSkeleton = () => {
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

      <div className="space-y-5">
        
        {/* 2. Truck Profile Skeleton (4 Columns) */}
        <div className="rounded-card border border-hairline bg-surface shadow-[var(--shadow-raised)] p-6">
          <div className="h-5 w-32 bg-ink/8 rounded-chip mb-6"></div> {/* Title */}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-16 bg-ink/8 rounded-chip"></div> {/* Label */}
                <div className="h-5 w-24 bg-ink/12 rounded-chip"></div> {/* Value */}
              </div>
            ))}
          </div>
        </div>

        {/* 3. Telemetry & Current Trip (Split View) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left: Telemetry */}
          <div className="rounded-card border border-hairline bg-surface shadow-[var(--shadow-raised)] p-6 flex flex-col justify-between h-48">
            <div className="h-5 w-32 bg-ink/8 rounded-chip mb-4"></div>
            
            {/* 3 Metrics Row */}
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-12 bg-ink/8 rounded-chip"></div>
                  <div className="h-6 w-16 bg-ink/12 rounded-chip"></div>
                </div>
              ))}
            </div>
            
            {/* Footer Line */}
            <div className="mt-4 pt-4 border-t border-hairline flex justify-between">
              <div className="h-3 w-24 bg-ink/8 rounded-chip"></div>
              <div className="h-3 w-32 bg-ink/8 rounded-chip"></div>
            </div>
          </div>

          {/* Right: Current Trip (Large Box) */}
          <div className="rounded-card border border-hairline bg-surface shadow-[var(--shadow-raised)] p-6 h-48 flex items-center justify-center border-2 border-dashed border-hairline">
             <div className="h-4 w-32 bg-ink/8 rounded-chip"></div>
          </div>
        </div>

        {/* 4. Tyre Config Skeleton */}
        <div className="rounded-card border border-hairline bg-surface shadow-[var(--shadow-raised)] p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="h-6 w-32 bg-ink/8 rounded-chip"></div> {/* Title */}
            <div className="h-8 w-24 bg-ink/8 rounded-chip"></div> {/* Mount Button */}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-control p-4 h-32 flex flex-col justify-between">
                <div className="flex justify-between">
                  <div className="h-4 w-20 bg-ink/8 rounded-chip"></div>
                  <div className="h-4 w-10 bg-ink/8 rounded-chip"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-24 bg-ink/8 rounded-chip"></div>
                  <div className="h-3 w-16 bg-ink/8 rounded-chip"></div>
                </div>
                <div className="self-end h-6 w-20 bg-ink/8 rounded-chip"></div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Driver & Recent Trips (Split View 1:2) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Driver Assignment (Left) */}
          <div className="lg:col-span-1 rounded-card border border-hairline bg-surface shadow-[var(--shadow-raised)] p-6 h-64">
            <div className="h-5 w-40 bg-ink/8 rounded-chip mb-4"></div>
            {/* Tags */}
            <div className="flex gap-2 mb-6">
              <div className="h-6 w-20 bg-ink/8 rounded-full"></div>
              <div className="h-6 w-24 bg-ink/8 rounded-full"></div>
            </div>
            {/* Input & Button */}
            <div className="flex gap-2 mt-auto">
              <div className="h-10 flex-1 bg-ink/8 rounded-chip"></div>
              <div className="h-10 w-16 bg-ink/8 rounded-chip"></div>
            </div>
          </div>

          {/* Recent Trips Table (Right) */}
          <div className="lg:col-span-2 rounded-card border border-hairline bg-surface shadow-[var(--shadow-raised)] overflow-hidden h-64">
            <div className="p-4 border-b">
              <div className="h-5 w-32 bg-ink/8 rounded-chip"></div>
            </div>
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="h-8 w-8 bg-ink/8 rounded-full"></div> {/* Icon */}
                  <div className="h-3 w-24 bg-ink/8 rounded-chip"></div>
                  <div className="h-3 w-20 bg-ink/8 rounded-chip hidden sm:block"></div>
                  <div className="h-3 w-16 bg-ink/8 rounded-chip hidden sm:block"></div>
                  <div className="h-6 w-6 bg-ink/8 rounded-chip"></div> {/* Action Icon */}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </DetailPage>
  );
};

export default function TruckDetails() {
  const { regNo } = useParams();

  // --- Main State ---
  const [truckDetails, setTruckDetails] = useState<Partial<TruckProfile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // --- Truck Edit State ---
  const [isEditingTruck, setIsEditingTruck] = useState(false);
  const [truckForm, setTruckForm] = useState<Partial<TruckProfile>>({});
  const [isSavingTruck, setIsSavingTruck] = useState(false);

  // --- Driver/Tyre State ---
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  // --- Modal/Action State ---
  /* Replaces five native alert() dialogs. A browser alert cannot be styled,
     blocks the whole tab, and drops the user out of the product's voice. */
  const [banner, setBanner] = useState<string | null>(null);
  const [isRemoveDriverModalOpen, setIsRemoveDriverModalOpen] = useState(false);
  const [driverToRemove, setDriverToRemove] = useState<{ id: string, name: string } | null>(null);
  const [isRemovingDriver, setIsRemovingDriver] = useState(false);



  // --- FETCH DATA ---
  useEffect(() => {
    fetchDriver();
  }, []);

  useEffect(() => {
    if (regNo) {
      fetchTruckDetails();
    }
  }, [regNo]);

  const fetchDriver = async () => {
    try {
      const driversData = await getDrivers()
      setDrivers(driversData as any[]);
    } catch (error) { console.error(error); }
  };

  const fetchTruckDetails = async () => {

    try {
 const response:any= await    getTruckByRegNo(regNo!);
      setTruckDetails(response);
      setTruckForm(response); // Initialize edit form
    } catch (err: any) {
      console.error("Truck details fetch failed:", err);
      setError("Failed to fetch truck details.");
    } finally {
      setLoading(false);
    }
  };

  const assignDriverToTruck = async ( driverId: string) => {
    try {
      await assignDriver(truckDetails._id!, driverId);
      console.log("Driver assigned successfully");
      fetchTruckDetails();
    } catch (error) {
      console.error("Error assigning driver:", error);
    }
  };

  // --- TRUCK UPDATE HANDLER ---
  const handleSaveTruck = async () => {
    setIsSavingTruck(true);
    try {
    
      
      const payload:any = {
        // Send the boolean directly
        available: truckForm.available,
        // Optional: Sync status string if backend requires it
        status: truckForm.available ? "Available" : "Out of Service", 
        lastMaintenance: truckForm.lastMaintenance,
      };

      const response:any= await updateTruck(truckDetails._id!, payload);

      setTruckDetails({ ...truckDetails, ...response });
      setIsEditingTruck(false);
    } catch (error) {
      console.error(error);
      setBanner("Could not save those truck details. Please try again.");
    } finally {
      setIsSavingTruck(false);
    }
  };

  /* The axle configuration decides which hubs exist, so it belongs to the
     truck rather than to any one tyre. Saved optimistically: the diagram
     redraws on the next paint, and a failed save puts the old value back. */
  const handleAxleLayoutChange = async (axleLayout: string) => {
    const previous = truckDetails.axleLayout;
    setTruckDetails((prev) => ({ ...prev, axleLayout }));
    try {
      await updateTruck(truckDetails._id!, { axleLayout });
    } catch (error) {
      console.error(error);
      setTruckDetails((prev) => ({ ...prev, axleLayout: previous }));
      setBanner("Could not save the axle configuration. Please try again.");
    }
  };

  const handleRemoveDriver = async () => {
    if (!driverToRemove) return;
    setIsRemovingDriver(true);
    try {
      await removeDriver(truckDetails._id!, driverToRemove.id);
      fetchTruckDetails(); 
    } catch (error) {
      console.error("Error removing driver:", error);
      setBanner("Could not remove that driver. Please try again.");
    } finally {
      setIsRemoveDriverModalOpen(false);
      setDriverToRemove(null);
      setIsRemovingDriver(false);
    }
  };

  // --- RENDER HELPERS ---
  const statusTone = (status: string) => {
    switch (status) {
      case "Available": return "info" as const;
      case "En Route": return "success" as const;
      case "Out of Service": return "danger" as const;
      default: return "neutral" as const;
    }
  };

  // --- RENDER LOADING STATE ---
  if (loading) return <TruckDetailsSkeleton />;

  return (
    <DetailPage>
      <DetailHeader
        title={truckDetails.registrationNumber || "Truck"}
        subtitle="Specifications, maintenance, tyres and drivers"
        badge={
          truckDetails.status ? (
            <StatusBadge tone={statusTone(truckDetails.status)}>{truckDetails.status}</StatusBadge>
          ) : null
        }
      />

      <InlineMessage tone="error">{banner}</InlineMessage>

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <InlineMessage tone="error">{error}</InlineMessage> 

        {/* --- 1. TRUCK PROFILE CARD (Inline Edit) --- */}
        <div className="rounded-card border border-hairline bg-surface shadow-[var(--shadow-raised)] p-4 sm:p-6 relative group">
          <div className="flex justify-between items-start mb-4 border-b pb-4">
            <h3 className="text-base font-semibold text-ink flex items-center gap-2">
              <FaTruck className="text-accent" /> <span className="hidden sm:inline">Truck</span> Profile
            </h3>
            
            {/* MOBILE FIX: Removed 'opacity-0 group-hover:opacity-100'
                Now uses 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
                This means it is always visible on mobile, and hover-only on desktop.
            */}
            {!isEditingTruck ? (
              <button 
                onClick={() => setIsEditingTruck(true)}
                className="text-accent hover:text-accent-ink flex items-center gap-1 text-sm font-medium opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-1"
              >
                <FaEdit /> <span className="sm:inline">Edit Details</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsEditingTruck(false)}
                  className="text-ink-tertiary hover:text-ink-secondary p-2 bg-ink/6 rounded-full"
                  title="Cancel"
                >
                  <FaTimes size={14}/>
                </button>
                <button 
                  onClick={handleSaveTruck}
                  disabled={isSavingTruck}
                  className="text-positive-ink hover:text-positive-ink p-2 bg-positive-soft rounded-full"
                  title="Save"
                >
                  {isSavingTruck ? <LoadingSpinner/> : <FaCheck size={14}/>}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {/* Model */}
            <div>
              <label className="block text-xs font-semibold text-ink-tertiary uppercase mb-1">Model</label>
              {isEditingTruck ? (
                <input 
                  className={inputClassesCompact}
                  value={truckForm.model || ""}
                  onChange={(e) => setTruckForm({...truckForm, model: e.target.value})}
                />
              ) : (
                <p className="text-ink font-medium">{truckDetails.model || "N/A"}</p>
              )}
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-xs font-semibold text-ink-tertiary uppercase mb-1">Capacity</label>
              {isEditingTruck ? (
                <input 
                  type="number"
                  className={inputClassesCompact}
                  value={truckForm.capacity || ""}
                  onChange={(e) => setTruckForm({...truckForm, capacity: Number(e.target.value)})}
                />
              ) : (
                <p className="text-ink font-medium flex items-center gap-1">
                  <FaWeightHanging className="text-ink-quaternary" /> {truckDetails.capacity || 0} Tons
                </p>
              )}
            </div>

          {/* Availability (Boolean Edit) */}
            <div>
              <label className="block text-xs font-semibold text-ink-tertiary uppercase mb-1">Availability</label>
              {isEditingTruck ? (
                <select 
                  className={inputClassesCompact}
                  // Convert boolean to string for the select input
                  value={truckForm.available ? "true" : "false"}
                  // Convert string back to boolean for state
                  onChange={(e) => setTruckForm({ ...truckForm, available: e.target.value === "true" })}
                >
                  <option value="true">Available</option>
                  <option value="false">Unavailable</option>
                </select>
              ) : (
                <div className="p-2">
                  <span className={`px-2 py-1 rounded-chip text-xs font-semibold uppercase ${
                    truckDetails.available ? "bg-positive-soft text-positive-ink" : "bg-critical-soft text-critical-ink"
                  }`}>
                    {truckDetails.available ? "Available" : "Unavailable"}
                  </span>
                </div>
              )}
            </div>

            {/* Maintenance Date */}
            <div>
              <label className="block text-xs font-semibold text-ink-tertiary uppercase mb-1">Maintenance</label>
              {isEditingTruck ? (
                <input 
                  type="date"
                  className={inputClassesCompact}
                  value={truckForm.lastMaintenance ? new Date(truckForm.lastMaintenance).toISOString().split('T')[0] : ""}
                  onChange={(e) => setTruckForm({...truckForm, lastMaintenance: e.target.value})}
                />
              ) : (
                <p className="text-ink font-medium flex items-center gap-1">
                  <FaCalendarAlt className="text-ink-quaternary" /> 
                  {truckDetails.lastMaintenance ? new Date(truckDetails.lastMaintenance).toLocaleDateString() : "N/A"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* --- 2. TELEMETRY & TRIP CARDS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Telemetry Card */}
          <div className="rounded-card border border-hairline bg-surface shadow-[var(--shadow-raised)] p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">Live Telemetry</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard
                label="Ignition"
                value={truckDetails.ignition || "OFF"}
                valueColor={truckDetails.ignition === "ON" ? "text-positive-ink" : "text-critical-ink"}
              />
              <MetricCard label="Speed" value={`${truckDetails.currentSpeed || 0} km/h`} />
              <MetricCard label="Travelled Today" value={`${truckDetails.travelledToday || 0} km`} />
            </div>
            <div className="mt-4 pt-4 border-t text-xs sm:text-sm text-ink-tertiary flex flex-col sm:flex-row justify-between gap-2">
               <span>Updated: {truckDetails.lastUpdated ? new Date(truckDetails.lastUpdated).toLocaleTimeString() : "-"}</span>
               <span className="truncate">{truckDetails.location || "Location unknown"}</span>
            </div>
          </div>

          {/* Current Trip Card */}
          {loading ? <LoadingSpinner/> : <CurrentTripCard trip={truckDetails.currentTrip} />}
        </div>

        {/* --- 3. TYRES ---
            The vehicle itself is the control: tap a hub to fit, move or take
            off the tyre on it. Everything about how that works lives in the
            tyre feature, not here. */}
        {truckDetails._id && (
          <TruckTyrePanel
            truck={{
              _id: truckDetails._id,
              registrationNumber: truckDetails.registrationNumber ?? regNo ?? "",
              axleLayout: truckDetails.axleLayout ?? null,
              totalKm: truckDetails.totalKm ?? null,
            }}
            onLayoutChange={handleAxleLayoutChange}
          />
        )}

        {/* --- 4. DRIVER & HISTORY --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Driver Assignment */}
           <div className="lg:col-span-1 rounded-card border border-hairline bg-surface shadow-[var(--shadow-raised)] p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-4">Driver Assignment</h3>
              {truckDetails.driverNames && truckDetails.driverNames.length > 0 ? (
                <div className="mb-4 flex flex-wrap gap-2">
                  {truckDetails.driverNames.map((name: string, i: number) => (
                    <span 
                      key={truckDetails.driverId![i]} 
                      onDoubleClick={() => {
                        setDriverToRemove({ id: truckDetails.driverId![i], name: name });
                        setIsRemoveDriverModalOpen(true);
                      }}
                      className="bg-positive-soft text-positive-ink px-3 py-1 rounded-full text-sm cursor-pointer"
                      title="Double-click to remove"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              ) : <p className="text-critical mb-4 text-sm">No driver assigned.</p>}
              
              <div className="flex flex-col sm:flex-row gap-2">
                 <select 
                   className={inputClassesCompact}
                   value={selectedDriver}
                   onChange={(e) => setSelectedDriver(e.target.value)}
                 >
                    <option value="">Select Driver</option>
                    {drivers.map((d: any) => (
                      <option key={d._id} value={d._id}>{d.firstName} {d.lastName}</option>
                    ))}
                 </select>
                 <button 
                   onClick={() => assignDriverToTruck(selectedDriver)}
                   disabled={!selectedDriver}
                   className="bg-accent text-white px-4 py-2 rounded-chip hover:bg-accent-hover text-sm w-full sm:w-auto disabled:bg-ink/12"
                 >
                   Assign
                 </button>
              </div>
           </div>

           {/* Trips History */}
           <div className="lg:col-span-2 rounded-card border border-hairline bg-surface shadow-[var(--shadow-raised)] overflow-hidden">
              <div className="p-4 border-b">
                 <h3 className="text-lg font-semibold">Recent Trips</h3>
              </div>
              <div className="p-4 overflow-x-auto">
                 {loading ? <LoadingSpinner/> : (
                    truckDetails.trips && <TripsTable trips={truckDetails.trips} />
                 )}
              </div>
           </div>
        </div>

      </div>
      
      <ConfirmDialog
        open={isRemoveDriverModalOpen}
        title="Remove this driver?"
        description={`${driverToRemove?.name ?? "This driver"} will be unassigned from this truck. You can assign them again at any time.`}
        confirmLabel="Remove driver"
        cancelLabel="Keep assigned"
        tone="danger"
        loading={isRemovingDriver}
        onConfirm={handleRemoveDriver}
        onCancel={() => setIsRemoveDriverModalOpen(false)}
      />
    </DetailPage>
  );
}
