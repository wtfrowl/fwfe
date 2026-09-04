"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  FaTruck, FaTools, FaHistory, FaCheckCircle, 
  FaEdit, FaSave, FaTimes, FaPencilAlt, FaCheck 
} from "react-icons/fa";
import { LoadingSpinner } from "../../trips/components/loading-spinner"; 
import { getTyreById, inspectTyre, updateTyreDetails } from "../../../api";
import { InlineMessage } from "../../../components/ui/InlineMessage";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Button } from "../../../components/ui/Button";
import { inputClasses, inputClassesCompact } from "../../../components/ui/inputStyles";
import {
  DetailPage,
  DetailHeader,
  BackButton,
} from "../../../components/ui/DetailPage";

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

// --- NEW: SKELETON LOADER COMPONENT ---
// This mimics the exact layout of your page but with pulsating gray boxes
const TyreDetailsSkeleton = () => {
  return (
    <DetailPage>
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-ink/8" />
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-48 animate-pulse rounded-chip bg-ink/8" />
              <div className="h-6 w-24 animate-pulse rounded-full bg-ink/8" />
            </div>
            <div className="h-4 w-40 animate-pulse rounded-chip bg-ink/8" />
          </div>
        </div>
        <div className="h-11 w-32 animate-pulse rounded-control bg-ink/8" />
      </header>

      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-card bg-ink/6" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-card bg-ink/6" />
      </div>
    </DetailPage>
  );
};

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
  /* Replaces two native alert() dialogs — see the note in truck-details. */
  const [banner, setBanner] = useState<string | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectDepth, setInspectDepth] = useState<string | number>("");
  const [inspectSaving, setInspectSaving] = useState(false);

  // --- Helper: Get Token ---


  const fetchTyreDetails = async () => {
    // Artificial delay check (remove in production if you want instant)
    // await new Promise(r => setTimeout(r, 500)); 
    try {
      setLoading(true);
    
      const response:any= await getTyreById(id!);
      setTyre(response);
      setEditForm(response);
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
      const response:any= await inspectTyre(id!, { currentTreadDepth: Number(inspectDepth), notes: "Updated via Details Page Inspection" });

      setTyre(response); 
      setIsInspecting(false);
    } catch (err: any) {
      setBanner("Could not save that tread depth. Please try again.");
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
     const payload :any= {
        tyreNumber: editForm.tyreNumber,
        brand: editForm.brand,
        model: editForm.model,
        size: editForm.size,
        purchasePrice: editForm.purchasePrice,
        vendorName: editForm.vendorName,
        purchaseDate: editForm.purchaseDate,
        initialTreadDepth: editForm.initialTreadDepth
      };

      const response:any = await updateTyreDetails(id!, payload);

      setTyre(response);
      setIsEditing(false);
    } catch (err: any) {
      setBanner("Could not save those tyre details. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Helper: Status Color ---
  const statusTone = (status: string) => {
    switch (status) {
      case "Mounted": return "info" as const;
      case "Spare": return "success" as const;
      case "Scrapped": return "danger" as const;
      case "SentForRetreading": return "warning" as const;
      default: return "neutral" as const;
    }
  };

  /* "SentForRetreading" is a database value, not a label for a person. */
  const statusLabel = (status: string) =>
    status === "SentForRetreading" ? "Retreading" : status;

  // --- RENDER LOADING STATE ---
  if (loading) return <TyreDetailsSkeleton />;

  // --- RENDER ERROR STATE ---
  if (error) return (
    <DetailPage>
      <div className="flex items-center gap-3">
        <BackButton />
        <h1 className="text-2xl font-semibold text-ink">Tyre</h1>
      </div>
      <InlineMessage tone="error">{error}</InlineMessage>
    </DetailPage>
  );

  if (!tyre)
    return (
      <DetailPage>
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-2xl font-semibold text-ink">Tyre</h1>
        </div>
        <InlineMessage tone="error">We couldn't find that tyre.</InlineMessage>
      </DetailPage>
    );

  return (
    <DetailPage>
      <DetailHeader
        title={
          isEditing ? (
            <input
              className="w-48 border-b-2 border-accent bg-transparent text-2xl font-semibold text-ink focus:outline-none"
              value={editForm.tyreNumber}
              onChange={(e) => setEditForm({ ...editForm, tyreNumber: e.target.value })}
              aria-label="Tyre number"
            />
          ) : (
            <h1 className="text-2xl font-semibold break-all text-ink">{tyre.tyreNumber}</h1>
          )
        }
        badge={
          <StatusBadge tone={statusTone(tyre.status)}>{statusLabel(tyre.status)}</StatusBadge>
        }
        subtitle={
          isEditing ? (
            <div className="mt-1 flex flex-wrap gap-2">
              <input
                className={`${inputClasses} h-9 w-32`}
                placeholder="Brand"
                value={editForm.brand}
                onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                aria-label="Brand"
              />
              <input
                className={`${inputClasses} h-9 w-32`}
                placeholder="Model"
                value={editForm.model}
                onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                aria-label="Model"
              />
              <input
                className={`${inputClasses} h-9 w-32`}
                placeholder="Size"
                value={editForm.size}
                onChange={(e) => setEditForm({ ...editForm, size: e.target.value })}
                aria-label="Size"
              />
            </div>
          ) : (
            `${tyre.brand} ${tyre.model} · ${tyre.size}`
          )
        }
        actions={
          isEditing ? (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setEditForm(tyre || {});
                  setIsEditing(false);
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveDetails} loading={isSaving}>
                <FaSave className="h-3.5 w-3.5" />
                Save changes
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setIsEditing(true)}>
              <FaEdit className="h-3.5 w-3.5" />
              Edit details
            </Button>
          )
        }
      />

      <InlineMessage tone="error">{banner}</InlineMessage>

      <div className="space-y-5">
        
        {/* --- DETAILS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 1. Tread Health Card (INLINE INSPECTION) */}
          <div className="rounded-card border border-hairline bg-surface p-5 shadow-[var(--shadow-raised)] relative group">
             <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-accent-soft rounded-control text-accent"><FaTools /></div>
                <div className="flex flex-col items-end">
                   <span className="text-xs font-medium text-ink-quaternary uppercase">Health</span>
                   {!isInspecting && (
                     <button 
                       onClick={startInspection} 
                       className="text-xs text-accent hover:text-accent-ink flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
                      className="text-3xl font-semibold text-ink border-b-2 border-accent w-24 focus:outline-none"
                      value={inspectDepth}
                      onChange={(e) => setInspectDepth(e.target.value)}
                      onKeyDown={(e) => {
                         if(e.key === 'Enter') handleSaveInspection();
                         if(e.key === 'Escape') setIsInspecting(false);
                      }}
                   />
                   <span className="text-base font-normal text-ink-tertiary">mm</span>
                   
                   <div className="flex gap-1 ml-2">
                      <button 
                        onClick={handleSaveInspection} 
                        disabled={inspectSaving}
                        className="p-2 bg-positive-soft text-positive-ink rounded-chip hover:bg-positive-soft"
                        title="Save Inspection"
                      >
                         {inspectSaving ? <LoadingSpinner /> : <FaCheck />}
                      </button>
                      <button 
                        onClick={() => setIsInspecting(false)} 
                        disabled={inspectSaving}
                        className="p-2 bg-ink/6 text-ink-secondary rounded-chip hover:bg-ink/8"
                        title="Cancel"
                      >
                         <FaTimes />
                      </button>
                   </div>
                </div>
             ) : (
                <div className="flex items-baseline gap-2 cursor-pointer group/value" onClick={startInspection} title="Click to inspect">
                  <h3 className="text-3xl font-semibold text-ink group-hover/value:text-accent transition-colors">
                     {tyre.currentTreadDepth} 
                  </h3>
                  <span className="text-base font-normal text-ink-tertiary">mm</span>
                  <FaPencilAlt className="text-ink-quaternary w-3 h-3 group-hover/value:text-accent" />
                </div>
             )}
             
             {/* Visual Progress Bar */}
             <div className="w-full bg-ink/8 rounded-full h-2.5 mt-3">
                <div 
                  className={`h-2.5 rounded-full transition-all duration-500 ${tyre.currentTreadDepth < 3 ? 'bg-critical' : tyre.currentTreadDepth < 8 ? 'bg-caution' : 'bg-positive'}`} 
                  style={{ width: `${Math.min((tyre.currentTreadDepth / tyre.initialTreadDepth) * 100, 100)}%` }}
                ></div>
             </div>
             
             <div className="text-xs text-ink-tertiary mt-3 flex items-center gap-2">
                <span>Original Depth:</span>
                <span className="font-medium">{tyre.initialTreadDepth}mm</span>
             </div>
          </div>

          {/* 2. Current Location */}
          <div className="rounded-card border border-hairline bg-surface p-5 shadow-[var(--shadow-raised)]">
             <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-accent-soft rounded-control text-accent"><FaTruck /></div>
                <span className="text-xs font-medium text-ink-quaternary uppercase">Current Location</span>
             </div>
             
             {tyre.status === "Mounted" && tyre.currentTruckId ? (
               <div>
                 <h3 className="text-base font-semibold text-ink">{tyre.currentTruckId.registrationNumber}</h3>
                 <p className="text-sm text-ink-secondary mt-1">Position: <span className="font-semibold">{tyre.position}</span></p>
                 <button 
                    onClick={() => navigate(`/owner-home/mytrucks/${tyre.currentTruckId?.registrationNumber}`)}
                    className="text-xs text-accent hover:text-accent-ink mt-3 font-medium flex items-center gap-1"
                 >
                    View Truck Details &rarr;
                 </button>
               </div>
             ) : (
               <div>
                 <h3 className="text-base font-semibold text-ink-secondary">Inventory</h3>
                 <p className="text-sm text-ink-tertiary mt-1">Ready for mounting</p>
               </div>
             )}
          </div>

          {/* 3. Purchase Info */}
          <div className="rounded-card border border-hairline bg-surface p-5 shadow-[var(--shadow-raised)]">
             <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-positive-soft rounded-control text-positive-ink"><FaCheckCircle /></div>
                <span className="text-xs font-medium text-ink-quaternary uppercase">Purchase Info</span>
             </div>
             
             <div className="space-y-3">
                <div className="flex justify-between text-sm items-center">
                   <span className="text-ink-tertiary">Vendor:</span>
                   {isEditing ? (
                     <input 
                       className={`${inputClassesCompact} w-32 text-right`}
                       value={editForm.vendorName}
                       onChange={(e) => setEditForm({...editForm, vendorName: e.target.value})}
                     />
                   ) : (
                     <span className="font-medium text-ink">{tyre.vendorName || "N/A"}</span>
                   )}
                </div>

                <div className="flex justify-between text-sm items-center">
                   <span className="text-ink-tertiary">Date:</span>
                   {isEditing ? (
                     <input 
                       type="date"
                       className={`${inputClassesCompact} w-32 text-right`}
                       value={editForm.purchaseDate ? new Date(editForm.purchaseDate).toISOString().split('T')[0] : ''}
                       onChange={(e) => setEditForm({...editForm, purchaseDate: e.target.value})}
                     />
                   ) : (
                     <span className="font-medium text-ink">{new Date(tyre.purchaseDate).toLocaleDateString()}</span>
                   )}
                </div>

                <div className="flex justify-between text-sm items-center">
                   <span className="text-ink-tertiary">Price:</span>
                   {isEditing ? (
                     <input 
                       type="number"
                       className={`${inputClassesCompact} w-32 text-right`}
                       value={editForm.purchasePrice}
                       onChange={(e) => setEditForm({...editForm, purchasePrice: Number(e.target.value)})}
                     />
                   ) : (
                     <span className="font-medium text-ink">₹{tyre.purchasePrice?.toLocaleString()}</span>
                   )}
                </div>
             </div>
          </div>
        </div>

        {/* --- HISTORY LOG --- */}
        <div className="rounded-card border border-hairline bg-surface shadow-[var(--shadow-raised)] overflow-hidden">
          <div className="px-6 py-4 border-b border-hairline flex justify-between items-center">
             <h3 className="text-lg font-semibold text-ink flex items-center gap-2">
               <FaHistory className="text-ink-quaternary" /> Activity Log
             </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-hairline">
              <thead className="bg-canvas-sunken">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ink-tertiary uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ink-tertiary uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ink-tertiary uppercase tracking-wider">Related Truck</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ink-tertiary uppercase tracking-wider">Odometer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ink-tertiary uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-hairline">
                {tyre.history && tyre.history.length > 0 ? (
                  [...tyre.history].reverse().map((log, idx) => (
                    <tr key={idx} className="hover:bg-canvas-sunken transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-secondary">
                        {new Date(log.date).toLocaleDateString()}
                        <div className="text-xs text-ink-quaternary">{new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${log.action === 'Installed' ? 'bg-accent-soft text-accent-ink' : 
                              log.action === 'Dismounted' ? 'bg-caution-soft text-caution-ink' : 
                              log.action === 'Inspection' ? 'bg-ink/6 text-ink' :
                              'bg-ink/6 text-ink'}`}>
                           {log.action}
                         </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ink">
                        {log.truckId ? 
                          (typeof log.truckId === 'object' ? log.truckId.registrationNumber : "Truck ID: " + log.truckId) 
                          : "-"
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-secondary">
                        {log.kmAtAction ? `${log.kmAtAction.toLocaleString()} km` : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-ink-tertiary max-w-xs truncate" title={log.notes}>
                        {log.notes || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-ink-tertiary">
                      No history available for this tyre.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DetailPage>
  );
}
