import { StatusBadge } from "./components/status-badge";
import { MetricCard } from "./components/metric-card";
import { TripsTable } from "./components/trips-table";
import { CurrentTripCard } from "./components/current-trip-card";
import { FaArrowLeft, FaTimes } from "react-icons/fa"; 
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

export default function TruckDetails() {
  const { regNo } = useParams();
  const [truckDetails, setTruckDetails] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [drivers, setDrivers] = useState<unknown[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>("");

  // --- Tyre State ---
  const [allTyres, setAllTyres] = useState<Tyre[]>([]);
  const [mountedTyres, setMountedTyres] = useState<Tyre[]>([]);
  const [spareTyres, setSpareTyres] = useState<Tyre[]>([]);
  const [isMountModalOpen, setIsMountModalOpen] = useState(false);
  const [isMounting, setIsMounting] = useState(false);
   
  // Mount Form State
  const [mountForm, setMountForm] = useState({
    tyreId: "",
    position: "Front-Left",
    currentKm: 0,
    notes: ""
  });

   const navigate = useNavigate();

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

  const fetchDriver = async () => {
    try {
      const driversData = await api.drivers.list();
      setDrivers(driversData);
    } catch (error) {
      console.error("Error fetching drivers:", error);
    }
  };

  useEffect(() => {
    fetchDriver();
  }, [])

  const assignDriver = async ( driverId: string) => {
    try {
      await api.trucks.assignDriver(truckDetails._id, driverId);
      console.log("Driver assigned successfully");
      fetchTruckDetails();
    } catch (error) {
      console.error("Error assigning driver:", error);
    }
  };

  // ---------------------------------------------------------
  // 1. FETCH TYRES (Matches TyreController.getAllByOwner)
  // ---------------------------------------------------------
  const fetchTyres = async () => {
    try {
      const config = getAuthConfig();
      // Using POST because controller reads req.body.decryptedPayload
      // Make sure your route is defined as router.post('/get-all', TyreController.getAllByOwner)
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/tyre/list`, 
        config
      );
      setAllTyres(response.data);
    } catch (error) {
      console.error("Error fetching tyres:", error);
    }
  };

  // Filter Tyres Logic
  useEffect(() => {
    if (truckDetails._id && allTyres.length > 0) {
      // Filter Mounted
      const mounted = allTyres.filter((t: any) => {
        const tTruckId = t.currentTruckId?._id || t.currentTruckId;
        return tTruckId === truckDetails._id && t.status === "Mounted";
      });
      setMountedTyres(mounted);

      // Filter Spares
      const spares = allTyres.filter(t => t.status === "Spare");
      setSpareTyres(spares);
    }
  }, [allTyres, truckDetails]);

  // ---------------------------------------------------------
  // 2. MOUNT TYRE (Matches TyreController.mountTyre)
  // ---------------------------------------------------------
  const handleMountSubmit = async () => {
    // 1. Start Loading
  setIsMounting(true);
    if (!mountForm.tyreId) return alert("Please select a tyre");

    try {
      const config = getAuthConfig();
      
      // Payload matching: const { tyreId, truckId, position, currentKm, notes } = req.body;
      const payload = {
        tyreId: mountForm.tyreId,
        truckId: truckDetails._id, // Explicitly sending truckId
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
      // Reset form but keep currentKm
      setMountForm({ 
        tyreId: "", 
        position: "Front-Left", 
        currentKm: truckDetails.totalKm || 0, 
        notes: "" 
      });
      
      // Refresh Data
      fetchTyres(); 
      fetchTruckDetails(); // Update truck to reflect activeTyres changes
    } catch (error: any) {
      alert(error.response?.data?.message || "Mount failed");
    }
    finally {
    // 2. Stop Loading (Runs whether success or failure)
    setIsMounting(false);
    }
  };

  // ---------------------------------------------------------
  // 3. DISMOUNT TYRE (Matches TyreController.dismountTyre)
  // ---------------------------------------------------------
  const handleDismount = async (tyreId: string) => {
    if (!confirm("Are you sure you want to dismount this tyre?")) return;
    
    // Simple prompt for reason. In a real app, use a modal or dropdown.
    // Controller accepts: "Puncture", "Rotation", "Retread", "Scrap", or defaults to "Spare" logic
    const reason = prompt("Enter Reason (Rotation, Puncture, Retread, Scrap):", "Rotation");
    if (!reason) return; 

    try {
      const config = getAuthConfig();

      // Payload matching: const { tyreId, currentKm, reason, notes } = req.body;
      const payload = {
        tyreId,
        currentKm: truckDetails.totalKm || 0, // Sending Truck KM
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


  const fetchTruckDetails = async () => {
    const config = getAuthConfig();
    try {
      console.log(`Fetching data from: ${import.meta.env.VITE_API_BASE_URL}/api/trucks/${regNo}`);
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/trucks/${regNo}`,
        config
      );

      console.log("Response data:", response.data);
      setTruckDetails(response.data);
      
      // Update mount form default KM
      if (response.data.totalKm) {
        setMountForm(prev => ({ ...prev, currentKm: response.data.totalKm }));
      }

    } catch (err:any) {
      console.error("Truck details fetch failed:", err.response || err.message || err);
      setError("Failed to fetch truck details.");
    } finally {
      setLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    if (regNo) {
      fetchTruckDetails().then(() => {
        // Fetch tyres after we start loading truck details
        fetchTyres();
      });
    }
  }, [regNo]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Truck #{truckDetails.id}</h1>
              <p className="text-sm text-gray-500">Get all Details of Truck</p>
            </div>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"  onClick={() => window.history.back()} >
              <FaArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {error && <p className="text-red-500">{error}</p>} 



        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{truckDetails._id}</h2>
                  <p className="text-sm text-gray-500">{truckDetails.lastUpdated}</p>
                  <p className="text-sm text-gray-600 mt-2">{truckDetails.location}</p>
                </div>
                <div className="flex-shrink-0">
                  <StatusBadge status="Stopped" duration={truckDetails.stoppedDuration} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <MetricCard
                  label="Ignition"
                  value={truckDetails.ignition}
                  valueColor={truckDetails.ignition === "ON" ? "text-green-600" : "text-red-600"}
                />
                <MetricCard label="Speed" value={`${truckDetails.currentSpeed} km/h`} />
                <MetricCard label="Travelled Today" value={`${truckDetails.travelledToday} km`} />
              </div>
            </div>
          </div>
          {loading ? (<>
<LoadingSpinner/>
</>):(
  <>       
      { <CurrentTripCard trip={truckDetails.currentTrip} />}
  </>)
  }
       
        </div>

                {/* --- TYRE MANAGEMENT SECTION --- */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Tyre Configuration</h3>
            <button 
              onClick={() => setIsMountModalOpen(true)}
              className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100 font-medium border border-blue-200"
            >
              + Mount Tyre
            </button>
          </div>

        {mountedTyres.length > 0 ? (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {mountedTyres.map((tyre) => (
      <div 
        key={tyre._id} 
        // 1. Added cursor-pointer and hover effects for better UX
        className="border rounded-lg p-4 hover:shadow-md transition-shadow relative group bg-white cursor-pointer hover:border-blue-300"
        // 2. Add Navigation Event here
        onClick={() => navigate(`/owner-home/tyre/${tyre._id}`)}
      >
        <div className="flex justify-between items-start mb-2">
          <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded font-semibold">
            {tyre.position || "Pos N/A"}
          </span>
          <span className={`text-xs font-bold ${tyre.currentTreadDepth > 5 ? "text-green-600" : "text-red-500"}`}>
            {tyre.currentTreadDepth}mm
          </span>
        </div>
        
        <h4 className="font-bold text-gray-800 text-sm">{tyre.brand}</h4>
        <p className="text-xs text-gray-500 font-medium">{tyre.model}</p>
        <p className="text-xs text-gray-400 mb-2">{tyre.tyreNumber}</p>
        
        <div className="mt-3 pt-2 border-t flex justify-end">
          <button 
            className="text-red-500 text-xs hover:text-red-700 font-medium border border-red-200 px-2 py-1 rounded hover:bg-red-50 transition-colors z-10"
            // 3. STOP PROPAGATION so clicking 'Dismount' doesn't open the details page
            onClick={(e) => {
              e.stopPropagation(); 
              handleDismount(tyre._id);
            }}
          >
            Dismount
          </button>
        </div>
      </div>
    ))}
  </div>
) : (
  <div className="text-center py-6 bg-gray-50 rounded-lg border-dashed border-2 border-gray-200">
    <p className="text-gray-500">No tyres currently mounted on this truck.</p>
  </div>
)}
        </div>
        {/* --- END TYRE SECTION --- */}

        <div className="bg-white rounded-lg shadow p-6 md:mt-2 mb-6">
  <h3 className="text-lg font-semibold mb-4">Driver Attachment</h3>

  {truckDetails.driverId && truckDetails.driverId.length > 0 ? (
    <div className="mb-6">
      <p className="text-green-600 font-medium mb-2">Assigned Drivers:</p>
      <div className="flex flex-wrap gap-2">
        {truckDetails.driverNames.map((name: string, idx: number) => (
          <span
            key={idx}
            className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm leading-relaxed break-words"
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  ) : (
    <p className="text-red-500 mb-4">No driver assigned yet.</p>
  )}

  <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
    <div className="flex-1">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Select Driver
      </label>
      <select
        className="border w-full px-3 py-2 rounded-lg text-sm"
        value={selectedDriver}
        onChange={(e) => setSelectedDriver(e.target.value)}
      >
        <option value="">Select Driver</option>
        {drivers.map((d: any) => (
          <option key={d._id} value={d._id}>
            {d.firstName} {d.lastName} ({d.contactNumber})
          </option>
        ))}
      </select>
    </div>

    <div className="sm:w-auto">
      <label className="invisible block text-sm font-medium mb-1">Attach</label>
      <button
        className="bg-blue-500 text-white px-5 py-2 rounded-lg hover:bg-blue-600 w-full sm:w-auto"
        onClick={() => assignDriver(selectedDriver)}
        disabled={!selectedDriver}
      >
        Attach Driver
      </button>
    </div>
  </div>
</div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Recently Completed Trips</h2>
          <div className="bg-white rounded-lg shadow">
            

{loading ? (<>
<LoadingSpinner/>
</>):(
  <>       
      {truckDetails.trips   &&   <TripsTable trips={truckDetails.trips} />}
  </>)
  }
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
              {/* Dropdown for Spares */}
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
    // Disable if no tyre selected OR if currently mounting
    disabled={!mountForm.tyreId || isMounting} 
    className={`w-full py-2 rounded font-medium text-white transition-colors
      ${(!mountForm.tyreId || isMounting) 
        ? "bg-gray-300 cursor-not-allowed" 
        : "bg-blue-600 hover:bg-blue-700"
      }`}
  >
    {isMounting ? (
      <span className="flex items-center justify-center gap-2">
        <LoadingSpinner /> Mounting... {/* Or just "Processing..." */}
      </span>
    ) : (
      "Confirm Mount"
    )}
  </button>
</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}