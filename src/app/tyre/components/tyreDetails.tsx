"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  FaArrowLeft, FaTruck, FaTools, FaHistory, FaCheckCircle, 
  FaEdit, FaSave, FaTimes, FaPencilAlt, FaCheck 
} from "react-icons/fa";
import { LoadingSpinner } from "../../trips/components/loading-spinner"; 

// --- Types ---
interface TyreHistory {
  action: string;
  date: string;
  truckId?: { _id: string; registrationNumber: string };
  kmAtAction?: number;
  notes?: string;
}

interface TyreDetail {
  _id: string;
  tyreNumber: string;
  brand: string;
  model: string;
  size: string;
  status: "Spare" | "Mounted" | "Scrapped" | "SentForRetreading";
  currentTreadDepth: number;
  initialTreadDepth: number;
  purchaseDate: string;
  purchasePrice: number;
  vendorName: string;
  position?: string;
  currentTruckId?: { _id: string; registrationNumber: string; model: string };
  history: TyreHistory[];
}

export default function TyreDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [tyre, setTyre] = useState<TyreDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --- EDIT MODE STATES (Details) ---
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<TyreDetail>>({});
  const [isSaving, setIsSaving] = useState(false);

  // --- NEW: INSPECTION STATE (Health) ---
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectDepth, setInspectDepth] = useState<string | number>("");
  const [inspectSaving, setInspectSaving] = useState(false);

  // --- Helper: Get Token ---
  const getAuthConfig = () => {
    const token = localStorage.getItem("ownerToken") || localStorage.getItem("driverToken");
    let parsedToken: any = "";
    if (token) parsedToken = JSON.parse(token);
    return {
      headers: {
        "Content-Type": "application/json",
        authorization: parsedToken ? parsedToken?.accessToken : "",
      },
    };
  };

  const fetchTyreDetails = async () => {
    try {
      setLoading(true);
      const config = getAuthConfig();
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/tyre/${id}`, 
        config
      );
      setTyre(response.data);
      setEditForm(response.data);
    } catch (err: any) {
      console.error("Error fetching tyre details:", err);
      setError("Failed to load tyre details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchTyreDetails();
  }, [id]);

  // --- INSPECTION HANDLER (Inline Update) ---
  const handleSaveInspection = async () => {
    if (!inspectDepth || !tyre) return;
    setInspectSaving(true);
    
    try {
      const config = getAuthConfig();
      // Hits your provided 'inspect' controller method
      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/api/tyre/${id}/inspect`,
        {
          currentTreadDepth: Number(inspectDepth),
          notes: "Updated via Details Page Inspection" 
        },
        config
      );

      // Update local state immediately
      setTyre(response.data); 
      setIsInspecting(false);
    } catch (err: any) {
      alert("Failed to update tread depth");
      console.error(err);
    } finally {
      setInspectSaving(false);
    }
  };

  const startInspection = () => {
    if (tyre) {
      setInspectDepth(tyre.currentTreadDepth);
      setIsInspecting(true);
    }
  };

  // --- SAVE HANDLER (Details) ---
  const handleSaveDetails = async () => {
    setIsSaving(true);
    try {
      const config = getAuthConfig();
      const payload = {
        tyreNumber: editForm.tyreNumber,
        brand: editForm.brand,
        model: editForm.model,
        size: editForm.size,
        purchasePrice: editForm.purchasePrice,
        vendorName: editForm.vendorName,
        purchaseDate: editForm.purchaseDate,
        initialTreadDepth: editForm.initialTreadDepth
      };

      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/api/tyre/${id}`,
        payload,
        config
      );

      setTyre(response.data);
      setIsEditing(false);
    } catch (err: any) {
      alert("Failed to update tyre details");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Helper: Status Color ---
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Mounted": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Spare": return "bg-green-100 text-green-800 border-green-200";
      case "Scrapped": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><LoadingSpinner /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-500">{error}</div>;
  if (!tyre) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Tyre not found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      
    {/* --- HEADER (Non-Sticky) --- */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            
            {/* Title Section */}
            <div>
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <input 
                    className="text-2xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none w-48 bg-transparent"
                    value={editForm.tyreNumber}
                    onChange={(e) => setEditForm({...editForm, tyreNumber: e.target.value})}
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-gray-900">{tyre.tyreNumber}</h1>
                )}
                
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeColor(tyre.status)}`}>
                  {tyre.status.toUpperCase()}
                </span>
              </div>
              
              <div className="text-sm text-gray-500 mt-1 flex gap-2 items-center">
                {isEditing ? (
                  <>
                    <input 
                      className="border rounded px-2 py-1 w-28 text-sm" placeholder="Brand"
                      value={editForm.brand} onChange={e => setEditForm({...editForm, brand: e.target.value})} 
                    />
                    <input 
                      className="border rounded px-2 py-1 w-28 text-sm" placeholder="Model"
                      value={editForm.model} onChange={e => setEditForm({...editForm, model: e.target.value})} 
                    />
                    <span>-</span>
                    <input 
                      className="border rounded px-2 py-1 w-28 text-sm" placeholder="Size"
                      value={editForm.size} onChange={e => setEditForm({...editForm, size: e.target.value})} 
                    />
                  </>
                ) : (
                  <p>{tyre.brand} {tyre.model} - {tyre.size}</p>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <button 
                    onClick={() => { setEditForm(tyre || {}); setIsEditing(false); }}
                    disabled={isSaving}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 transition-colors"
                  >
                    <FaTimes /> Cancel
                  </button>
                  <button 
                    onClick={handleSaveDetails}
                    disabled={isSaving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors shadow-sm"
                  >
                    {isSaving ? <LoadingSpinner /> : <><FaSave /> Save Changes</>}
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <FaArrowLeft />
                  </button>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-colors"
                  >
                    <FaEdit /> Edit Details
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* --- DETAILS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 1. Tread Health Card (INLINE INSPECTION) */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 relative group">
             <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><FaTools /></div>
                <div className="flex flex-col items-end">
                   <span className="text-xs font-medium text-gray-400 uppercase">Health</span>
                   {!isInspecting && (
                     <button 
                       onClick={startInspection} 
                       className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                     >
                       <FaPencilAlt size={10} /> Inspect
                     </button>
                   )}
                </div>
             </div>
             
             {/* --- INLINE EDIT AREA --- */}
             {isInspecting ? (
                <div className="flex items-center gap-2 mb-2 animate-in fade-in zoom-in duration-200">
                   <input 
                      type="number" 
                      autoFocus
                      className="text-3xl font-bold text-gray-900 border-b-2 border-blue-500 w-24 focus:outline-none"
                      value={inspectDepth}
                      onChange={(e) => setInspectDepth(e.target.value)}
                      onKeyDown={(e) => {
                         if(e.key === 'Enter') handleSaveInspection();
                         if(e.key === 'Escape') setIsInspecting(false);
                      }}
                   />
                   <span className="text-base font-normal text-gray-500">mm</span>
                   
                   <div className="flex gap-1 ml-2">
                      <button 
                        onClick={handleSaveInspection} 
                        disabled={inspectSaving}
                        className="p-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
                        title="Save Inspection"
                      >
                         {inspectSaving ? <LoadingSpinner/> : <FaCheck />}
                      </button>
                      <button 
                        onClick={() => setIsInspecting(false)} 
                        disabled={inspectSaving}
                        className="p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                        title="Cancel"
                      >
                         <FaTimes />
                      </button>
                   </div>
                </div>
             ) : (
                <div className="flex items-baseline gap-2 cursor-pointer group/value" onClick={startInspection} title="Click to inspect">
                  <h3 className="text-3xl font-bold text-gray-900 group-hover/value:text-blue-600 transition-colors">
                     {tyre.currentTreadDepth} 
                  </h3>
                  <span className="text-base font-normal text-gray-500">mm</span>
                  <FaPencilAlt className="text-gray-300 w-3 h-3 group-hover/value:text-blue-400" />
                </div>
             )}
             
             {/* Visual Progress Bar */}
             <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
                <div 
                  className={`h-2.5 rounded-full transition-all duration-500 ${tyre.currentTreadDepth < 3 ? 'bg-red-500' : tyre.currentTreadDepth < 8 ? 'bg-yellow-400' : 'bg-green-500'}`} 
                  style={{ width: `${Math.min((tyre.currentTreadDepth / tyre.initialTreadDepth) * 100, 100)}%` }}
                ></div>
             </div>
             
             <div className="text-xs text-gray-500 mt-3 flex items-center gap-2">
                <span>Original Depth:</span>
                <span className="font-medium">{tyre.initialTreadDepth}mm</span>
             </div>
          </div>

          {/* 2. Current Location */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
             <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><FaTruck /></div>
                <span className="text-xs font-medium text-gray-400 uppercase">Current Location</span>
             </div>
             
             {tyre.status === "Mounted" && tyre.currentTruckId ? (
               <div>
                 <h3 className="text-xl font-bold text-gray-900">{tyre.currentTruckId.registrationNumber}</h3>
                 <p className="text-sm text-gray-600 mt-1">Position: <span className="font-semibold">{tyre.position}</span></p>
                 <button 
                    onClick={() => navigate(`/owner-home/mytrucks/${tyre.currentTruckId?.registrationNumber}`)}
                    className="text-xs text-blue-600 hover:text-blue-800 mt-3 font-medium flex items-center gap-1"
                 >
                    View Truck Details &rarr;
                 </button>
               </div>
             ) : (
               <div>
                 <h3 className="text-xl font-bold text-gray-700">Inventory</h3>
                 <p className="text-sm text-gray-500 mt-1">Ready for mounting</p>
               </div>
             )}
          </div>

          {/* 3. Purchase Info */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
             <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-green-50 rounded-lg text-green-600"><FaCheckCircle /></div>
                <span className="text-xs font-medium text-gray-400 uppercase">Purchase Info</span>
             </div>
             
             <div className="space-y-3">
                <div className="flex justify-between text-sm items-center">
                   <span className="text-gray-500">Vendor:</span>
                   {isEditing ? (
                     <input 
                       className="border rounded px-2 py-1 w-32 text-right text-sm"
                       value={editForm.vendorName}
                       onChange={(e) => setEditForm({...editForm, vendorName: e.target.value})}
                     />
                   ) : (
                     <span className="font-medium text-gray-900">{tyre.vendorName || "N/A"}</span>
                   )}
                </div>

                <div className="flex justify-between text-sm items-center">
                   <span className="text-gray-500">Date:</span>
                   {isEditing ? (
                     <input 
                       type="date"
                       className="border rounded px-2 py-1 w-32 text-right text-sm"
                       value={editForm.purchaseDate ? new Date(editForm.purchaseDate).toISOString().split('T')[0] : ''}
                       onChange={(e) => setEditForm({...editForm, purchaseDate: e.target.value})}
                     />
                   ) : (
                     <span className="font-medium text-gray-900">{new Date(tyre.purchaseDate).toLocaleDateString()}</span>
                   )}
                </div>

                <div className="flex justify-between text-sm items-center">
                   <span className="text-gray-500">Price:</span>
                   {isEditing ? (
                     <input 
                       type="number"
                       className="border rounded px-2 py-1 w-32 text-right text-sm"
                       value={editForm.purchasePrice}
                       onChange={(e) => setEditForm({...editForm, purchasePrice: Number(e.target.value)})}
                     />
                   ) : (
                     <span className="font-medium text-gray-900">₹{tyre.purchasePrice?.toLocaleString()}</span>
                   )}
                </div>
             </div>
          </div>
        </div>

        {/* --- HISTORY LOG --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
             <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
               <FaHistory className="text-gray-400" /> Activity Log
             </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Related Truck</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Odometer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tyre.history && tyre.history.length > 0 ? (
                  [...tyre.history].reverse().map((log, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(log.date).toLocaleDateString()}
                        <div className="text-xs text-gray-400">{new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${log.action === 'Installed' ? 'bg-blue-100 text-blue-800' : 
                              log.action === 'Dismounted' ? 'bg-orange-100 text-orange-800' : 
                              log.action === 'Inspection' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'}`}>
                           {log.action}
                         </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.truckId ? 
                          (typeof log.truckId === 'object' ? log.truckId.registrationNumber : "Truck ID: " + log.truckId) 
                          : "-"
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {log.kmAtAction ? `${log.kmAtAction.toLocaleString()} km` : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={log.notes}>
                        {log.notes || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                      No history available for this tyre.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}