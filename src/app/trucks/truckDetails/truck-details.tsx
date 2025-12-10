import { MetricCard } from "./components/metric-card";
import { TripsTable } from "./components/trips-table";
import { CurrentTripCard } from "./components/current-trip-card";
import { 
  FaArrowLeft, FaTimes, FaCheck, FaTruck, 
  FaEdit, FaCalendarAlt, FaWeightHanging 
} from "react-icons/fa";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { LoadingSpinner } from "../../trips/components/loading-spinner";
import { api } from "../../trips/services/api";

// --- Types ---
interface Tyre {
  _id: string;
  tyreNumber: string;
  brand: string;
  model: string;
  size: string;
  currentTreadDepth: number;
  status: string;
  position?: string;
  currentTruckId?: string | { _id: string }; 
}

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
}

// --- NEW: SKELETON LOADER COMPONENT ---
const TruckDetailsSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse pb-20">
      
      {/* 1. Header Skeleton */}
      <div className="bg-white border-b sticky top-[64px] z-30">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-start">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {/* Truck Number */}
                <div className="h-8 w-48 bg-gray-200 rounded"></div>
                {/* Status Badge */}
                <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
              </div>
              {/* Subtitle */}
              <div className="h-4 w-64 bg-gray-200 rounded"></div>
            </div>
            {/* Back Button */}
            <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* 2. Truck Profile Skeleton (4 Columns) */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-5 w-32 bg-gray-200 rounded mb-6"></div> {/* Title */}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-16 bg-gray-200 rounded"></div> {/* Label */}
                <div className="h-5 w-24 bg-gray-300 rounded"></div> {/* Value */}
              </div>
            ))}
          </div>
        </div>

        {/* 3. Telemetry & Current Trip (Split View) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left: Telemetry */}
          <div className="bg-white rounded-lg shadow p-6 flex flex-col justify-between h-48">
            <div className="h-5 w-32 bg-gray-200 rounded mb-4"></div>
            
            {/* 3 Metrics Row */}
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-12 bg-gray-200 rounded"></div>
                  <div className="h-6 w-16 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
            
            {/* Footer Line */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
              <div className="h-3 w-24 bg-gray-200 rounded"></div>
              <div className="h-3 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>

          {/* Right: Current Trip (Large Box) */}
          <div className="bg-white rounded-lg shadow p-6 h-48 flex items-center justify-center border-2 border-dashed border-gray-100">
             <div className="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
        </div>

        {/* 4. Tyre Config Skeleton */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="h-6 w-32 bg-gray-200 rounded"></div> {/* Title */}
            <div className="h-8 w-24 bg-gray-200 rounded"></div> {/* Mount Button */}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4 h-32 flex flex-col justify-between">
                <div className="flex justify-between">
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                  <div className="h-4 w-10 bg-gray-200 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-24 bg-gray-200 rounded"></div>
                  <div className="h-3 w-16 bg-gray-200 rounded"></div>
                </div>
                <div className="self-end h-6 w-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Driver & Recent Trips (Split View 1:2) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Driver Assignment (Left) */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow p-6 h-64">
            <div className="h-5 w-40 bg-gray-200 rounded mb-4"></div>
            {/* Tags */}
            <div className="flex gap-2 mb-6">
              <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
              <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
            </div>
            {/* Input & Button */}
            <div className="flex gap-2 mt-auto">
              <div className="h-10 flex-1 bg-gray-200 rounded"></div>
              <div className="h-10 w-16 bg-gray-200 rounded"></div>
            </div>
          </div>

          {/* Recent Trips Table (Right) */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden h-64">
            <div className="p-4 border-b">
              <div className="h-5 w-32 bg-gray-200 rounded"></div>
            </div>
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div> {/* Icon */}
                  <div className="h-3 w-24 bg-gray-200 rounded"></div>
                  <div className="h-3 w-20 bg-gray-200 rounded hidden sm:block"></div>
                  <div className="h-3 w-16 bg-gray-200 rounded hidden sm:block"></div>
                  <div className="h-6 w-6 bg-gray-200 rounded"></div> {/* Action Icon */}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default function TruckDetails() {
  const { regNo } = useParams();
  const navigate = useNavigate();

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
  const [allTyres, setAllTyres] = useState<Tyre[]>([]);
  const [mountedTyres, setMountedTyres] = useState<Tyre[]>([]);
  const [spareTyres, setSpareTyres] = useState<Tyre[]>([]);
  
  // --- Modal/Action State ---
  const [isMountModalOpen, setIsMountModalOpen] = useState(false);
  const [isMounting, setIsMounting] = useState(false);

  const [mountForm, setMountForm] = useState({
    tyreId: "",
    position: "Front-Left",
    currentKm: 0,
    notes: ""
  });

  // --- Helper: Get Token Config ---
  const getAuthConfig = () => {
    const token = localStorage.getItem("ownerToken");
    let parsedToken: any = "";
    if (token) parsedToken = JSON.parse(token);
    return {
      headers: {
        "Content-Type": "application/json",
        authorization: parsedToken ? parsedToken?.accessToken : "",
      },
    };
  };

  // --- FETCH DATA ---
  useEffect(() => {
    fetchDriver();
  }, []);

  useEffect(() => {
    if (regNo) {
      fetchTruckDetails().then(() => fetchTyres());
    }
  }, [regNo]);

  // Filter Tyres Logic
  useEffect(() => {
    if (truckDetails._id && allTyres.length > 0) {
      const mounted = allTyres.filter((t: any) => {
        const tTruckId = t.currentTruckId?._id || t.currentTruckId;
        return tTruckId === truckDetails._id && t.status === "Mounted";
      });
      setMountedTyres(mounted);
      const spares = allTyres.filter(t => t.status === "Spare");
      setSpareTyres(spares);
    }
  }, [allTyres, truckDetails]);


  const fetchDriver = async () => {
    try {
      const driversData = await api.drivers.list();
      setDrivers(driversData as any[]);
    } catch (error) { console.error(error); }
  };

  const fetchTyres = async () => {
    try {
      const config = getAuthConfig();
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/tyre/list`, config);
      setAllTyres(response.data);
    } catch (error) { console.error(error); }
  };

  const fetchTruckDetails = async () => {
    const config = getAuthConfig();
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/trucks/${regNo}`, config);
      setTruckDetails(response.data);
      setTruckForm(response.data); // Initialize edit form
      
      if (response.data.totalKm) {
        setMountForm(prev => ({ ...prev, currentKm: response.data.totalKm }));
      }
    } catch (err: any) {
      console.error("Truck details fetch failed:", err);
      setError("Failed to fetch truck details.");
    } finally {
      setLoading(false);
    }
  };

  const assignDriver = async ( driverId: string) => {
    try {
      await api.trucks.assignDriver(truckDetails._id!, driverId);
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
      const config = getAuthConfig();
      
      const payload = {
        // Send the boolean directly
        available: truckForm.available,
        // Optional: Sync status string if backend requires it
        status: truckForm.available ? "Available" : "Out of Service", 
        lastMaintenance: truckForm.lastMaintenance,
      };

      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/api/trucks/${truckDetails._id}`, 
        payload,
        config
      );

      setTruckDetails({ ...truckDetails, ...response.data });
      setIsEditingTruck(false);
    } catch (error) {
      console.error(error);
      alert("Failed to update truck details");
    } finally {
      setIsSavingTruck(false);
    }
  };

  // --- TYRE ACTIONS ---
  const handleMountSubmit = async () => {
    setIsMounting(true);
    if (!mountForm.tyreId) return alert("Please select a tyre");

    try {
      const config = getAuthConfig();
      const payload = {
        tyreId: mountForm.tyreId,
        truckId: truckDetails._id,
        position: mountForm.position,
        currentKm: mountForm.currentKm,
        notes: mountForm.notes
      };

      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/tyre/mount`,
        payload,
        config
      );

      setIsMountModalOpen(false);
      setMountForm({ 
        tyreId: "", 
        position: "Front-Left", 
        currentKm: truckDetails.totalKm || 0, 
        notes: "" 
      });
      
      fetchTyres(); 
      fetchTruckDetails(); 
    } catch (error: any) {
      alert(error.response?.data?.message || "Mount failed");
    } finally {
      setIsMounting(false);
    }
  };

  const handleDismount = async (tyreId: string) => {
    if (!confirm("Are you sure you want to dismount this tyre?")) return;
    const reason = prompt("Enter Reason (Rotation, Puncture, Retread, Scrap):", "Rotation");
    if (!reason) return; 

    try {
      const config = getAuthConfig();
      const payload = {
        tyreId,
        currentKm: truckDetails.totalKm || 0,
        reason: reason, 
        notes: "Dismounted via Truck Dashboard"
      };

      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/tyre/dismount`,
        payload,
        config
      );

      fetchTyres();
      fetchTruckDetails();
    } catch (error: any) {
      alert(error.response?.data?.message || "Dismount failed");
    }
  };
  
  // --- RENDER HELPERS ---
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available": return "bg-green-100 text-green-800";
      case "En Route": return "bg-blue-100 text-blue-800";
      case "Out of Service": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // --- RENDER LOADING STATE ---
  if (loading) return <TruckDetailsSkeleton />;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* --- HEADER --- */}
      <div className="bg-white border-b">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 break-all">
                  {truckDetails.registrationNumber || "Truck Details"}
                </h1>
                {truckDetails.status && (
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase whitespace-nowrap ${getStatusColor(truckDetails.status)}`}>
                    {truckDetails.status}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">Manage specifications, maintenance, and drivers</p>
            </div>
            <button 
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm w-full sm:w-auto justify-center" 
              onClick={() => window.history.back()} 
            >
              <FaArrowLeft className="w-3 h-3" /> Back
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {error && <p className="text-red-500">{error}</p>} 

        {/* --- 1. TRUCK PROFILE CARD (Inline Edit) --- */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 relative group">
          <div className="flex justify-between items-start mb-4 border-b pb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <FaTruck className="text-blue-600" /> <span className="hidden sm:inline">Truck</span> Profile
            </h3>
            
            {/* MOBILE FIX: Removed 'opacity-0 group-hover:opacity-100'
                Now uses 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
                This means it is always visible on mobile, and hover-only on desktop.
            */}
            {!isEditingTruck ? (
              <button 
                onClick={() => setIsEditingTruck(true)}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-medium opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-1"
              >
                <FaEdit /> <span className="sm:inline">Edit Details</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsEditingTruck(false)}
                  className="text-gray-500 hover:text-gray-700 p-2 bg-gray-100 rounded-full"
                  title="Cancel"
                >
                  <FaTimes size={14}/>
                </button>
                <button 
                  onClick={handleSaveTruck}
                  disabled={isSavingTruck}
                  className="text-green-600 hover:text-green-800 p-2 bg-green-100 rounded-full"
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
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Model</label>
              {isEditingTruck ? (
                <input 
                  className="w-full border rounded p-2 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={truckForm.model || ""}
                  onChange={(e) => setTruckForm({...truckForm, model: e.target.value})}
                />
              ) : (
                <p className="text-gray-900 font-medium">{truckDetails.model || "N/A"}</p>
              )}
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Capacity</label>
              {isEditingTruck ? (
                <input 
                  type="number"
                  className="w-full border rounded p-2 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={truckForm.capacity || ""}
                  onChange={(e) => setTruckForm({...truckForm, capacity: Number(e.target.value)})}
                />
              ) : (
                <p className="text-gray-900 font-medium flex items-center gap-1">
                  <FaWeightHanging className="text-gray-400" /> {truckDetails.capacity || 0} Tons
                </p>
              )}
            </div>

          {/* Availability (Boolean Edit) */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Availability</label>
              {isEditingTruck ? (
                <select 
                  className="w-full border border-blue-500 rounded p-2 text-sm bg-white focus:ring-2 focus:ring-blue-200 outline-none"
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
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                    truckDetails.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    {truckDetails.available ? "Available" : "Unavailable"}
                  </span>
                </div>
              )}
            </div>

            {/* Maintenance Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Maintenance</label>
              {isEditingTruck ? (
                <input 
                  type="date"
                  className="w-full border rounded p-2 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={truckForm.lastMaintenance ? new Date(truckForm.lastMaintenance).toISOString().split('T')[0] : ""}
                  onChange={(e) => setTruckForm({...truckForm, lastMaintenance: e.target.value})}
                />
              ) : (
                <p className="text-gray-900 font-medium flex items-center gap-1">
                  <FaCalendarAlt className="text-gray-400" /> 
                  {truckDetails.lastMaintenance ? new Date(truckDetails.lastMaintenance).toLocaleDateString() : "N/A"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* --- 2. TELEMETRY & TRIP CARDS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Telemetry Card */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">Live Telemetry</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard
                label="Ignition"
                value={truckDetails.ignition || "OFF"}
                valueColor={truckDetails.ignition === "ON" ? "text-green-600" : "text-red-600"}
              />
              <MetricCard label="Speed" value={`${truckDetails.currentSpeed || 0} km/h`} />
              <MetricCard label="Travelled Today" value={`${truckDetails.travelledToday || 0} km`} />
            </div>
            <div className="mt-4 pt-4 border-t text-xs sm:text-sm text-gray-500 flex flex-col sm:flex-row justify-between gap-2">
               <span>Updated: {truckDetails.lastUpdated ? new Date(truckDetails.lastUpdated).toLocaleTimeString() : "-"}</span>
               <span className="truncate">{truckDetails.location || "Location unknown"}</span>
            </div>
          </div>

          {/* Current Trip Card */}
          {loading ? <LoadingSpinner/> : <CurrentTripCard trip={truckDetails.currentTrip} />}
        </div>

        {/* --- 3. TYRE MANAGEMENT --- */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 relative">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
               <span className="p-1 bg-gray-100 rounded text-gray-600">🛞</span> Tyre Config
            </h3>
            <button 
              onClick={() => setIsMountModalOpen(true)}
              className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-100 font-medium border border-blue-200"
            >
              + Mount
            </button>
          </div>

          {mountedTyres.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mountedTyres.map((tyre) => (
                <div 
                  key={tyre._id} 
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow relative group bg-white cursor-pointer hover:border-blue-300"
                  onClick={() => navigate(`/owner-home/tyre/${tyre._id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded font-semibold truncate max-w-[60%]">
                      {tyre.position || "Pos N/A"}
                    </span>
                    
                    <span className={`text-xs font-bold ${tyre.currentTreadDepth > 5 ? "text-green-600" : "text-red-500"}`}>
                        {tyre.currentTreadDepth}mm
                    </span>
                  </div>
                  
                  <h4 className="font-bold text-gray-800 text-sm truncate">{tyre.brand}</h4>
                  <p className="text-xs text-gray-500 font-medium truncate">{tyre.model}</p>
                  <p className="text-xs text-gray-400 mb-2 truncate">{tyre.tyreNumber}</p>
                  
                  <div className="mt-3 pt-2 border-t flex justify-end">
                    <button 
                      className="text-red-500 text-xs hover:text-red-700 font-medium border border-red-200 px-2 py-1 rounded hover:bg-red-50 transition-colors z-10"
                      onClick={(e) => { e.stopPropagation(); handleDismount(tyre._id); }}
                    >
                      Dismount
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <p className="text-gray-500 text-sm">No tyres currently mounted.</p>
            </div>
          )}
        </div>

        {/* --- 4. DRIVER & HISTORY --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Driver Assignment */}
           <div className="lg:col-span-1 bg-white rounded-lg shadow p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-4">Driver Assignment</h3>
              {truckDetails.driverNames && truckDetails.driverNames.length > 0 ? (
                <div className="mb-4 flex flex-wrap gap-2">
                  {truckDetails.driverNames.map((name: string, i: number) => (
                    <span key={i} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      {name}
                    </span>
                  ))}
                </div>
              ) : <p className="text-red-500 mb-4 text-sm">No driver assigned.</p>}
              
              <div className="flex flex-col sm:flex-row gap-2">
                 <select 
                   className="flex-1 border rounded text-sm p-2 outline-none w-full"
                   value={selectedDriver}
                   onChange={(e) => setSelectedDriver(e.target.value)}
                 >
                    <option value="">Select Driver</option>
                    {drivers.map((d: any) => (
                      <option key={d._id} value={d._id}>{d.firstName} {d.lastName}</option>
                    ))}
                 </select>
                 <button 
                   onClick={() => assignDriver(selectedDriver)}
                   disabled={!selectedDriver}
                   className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm w-full sm:w-auto disabled:bg-gray-300"
                 >
                   Assign
                 </button>
              </div>
           </div>

           {/* Trips History */}
           <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
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
      
      {/* --- MOUNT MODAL --- */}
      {isMountModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-lg font-bold text-gray-800">Mount Tyre</h3>
              <button onClick={() => setIsMountModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <FaTimes />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Select Spare Tyre</label>
                <select 
                  className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={mountForm.tyreId}
                  onChange={(e) => setMountForm({...mountForm, tyreId: e.target.value})}
                >
                  <option value="">-- Select Tyre --</option>
                  {spareTyres.map(tyre => (
                    <option key={tyre._id} value={tyre._id}>
                      {tyre.tyreNumber} - {tyre.brand} ({tyre.size})
                    </option>
                  ))}
                </select>
                {spareTyres.length === 0 && <p className="text-xs text-red-500 mt-1">No spare tyres available.</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Position</label>
                <select 
                  className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={mountForm.position}
                  onChange={(e) => setMountForm({...mountForm, position: e.target.value})}
                >
                  <option value="Front-Left">Front-Left</option>
                  <option value="Front-Right">Front-Right</option>
                  <option value="Rear-Left-Outer">Rear-Left-Outer</option>
                  <option value="Rear-Left-Inner">Rear-Left-Inner</option>
                  <option value="Rear-Right-Outer">Rear-Right-Outer</option>
                  <option value="Rear-Right-Inner">Rear-Right-Inner</option>
                  <option value="Stepney">Stepney</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Current Odometer (KM)</label>
                <input 
                  type="number"
                  className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={mountForm.currentKm}
                  onChange={(e) => setMountForm({...mountForm, currentKm: Number(e.target.value)})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Notes</label>
                <input 
                  type="text"
                  className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. New purchase mount"
                  value={mountForm.notes}
                  onChange={(e) => setMountForm({...mountForm, notes: e.target.value})}
                />
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleMountSubmit}
                  disabled={!mountForm.tyreId || isMounting} 
                  className={`w-full py-2 rounded font-medium text-white transition-colors
                    ${(!mountForm.tyreId || isMounting) ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
                >
                  {isMounting ? <span className="flex items-center justify-center gap-2"><LoadingSpinner /> Mounting...</span> : "Confirm Mount"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}