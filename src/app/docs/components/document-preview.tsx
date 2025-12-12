"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import { Document } from "../types/docs";
import { useNavigate, useParams } from "react-router-dom";
import { LoadingSpinner } from "../../trips/components/loading-spinner";
import { 
  FaCalendarAlt, FaDownload, FaFileAlt, FaIdCard, 
  FaTruck, FaUser, FaWhatsapp, FaHistory, FaExternalLinkAlt, 
  FaCheck
} from "react-icons/fa";

export default function DocumentPreviewPage() {
  const { id } = useParams() as { id: string };
  const ITEMS_PER_PAGE = 5;
  const navigate = useNavigate();

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // --- UPDATED STATE FOR HISTORY ---
  const [historyDocs, setHistoryDocs] = useState<Document[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const loadingMoreRef = useRef(false);

  const downloadName = `${document?.truckId}_${document?.type}_${document?.expiryDate}`;

  // Helper to force download with specific name via Cloudinary
  const getDownloadUrl = (url: string, fileName: string) => {
    if (!url) return "";
    const cleanName = fileName.replace(/[^a-zA-Z0-9-_]/g, "_");
    if (url.includes("cloudinary.com") && url.includes("/upload/")) {
      return url.replace("/upload/", `/upload/fl_attachment:${cleanName}/`);
    }
    return url;
  };

  useEffect(() => {
    if (id) {
      // Reset history when the main document ID changes
      setHistoryDocs([]);
      setHistoryPage(1);
      setHasMoreHistory(true);
      fetchDocument();
    }
  }, [id]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const res = await api.documents.getById(id);
      setDocument(res as unknown as Document);
    } catch (err) {
      setError("Failed to load document.");
    } finally {
      setLoading(false);
    }
  };

  // --- UPDATED: Fetch History instead of just "Older" ---
  useEffect(() => {
    if (document) loadHistoryDocs();
  }, [document]);

  const loadHistoryDocs = async () => {
    if (loadingMoreRef.current || !hasMoreHistory) return;
    loadingMoreRef.current = true;
    setLoadingHistory(true);

    try {
      // Assuming api.documents.fetchDocsHistory calls your new controller method
      const res = await api.documents.fetchDocsHistory(id, historyPage, ITEMS_PER_PAGE);
      
      if (res?.length < ITEMS_PER_PAGE) setHasMoreHistory(false);
      
      // Filter out current document just in case, though API should handle it
      const newDocs = (res as unknown as Document[]).filter(d => d._id !== id);
      
      setHistoryDocs((prev) => [...prev, ...newDocs]);
      setHistoryPage((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to fetch document history:", err);
    } finally {
      loadingMoreRef.current = false;
      setLoadingHistory(false);
    }
  };

  const getWhatsappShareUrl = () => {
    if (!document) return "#";
    const expiry = document.expiryDate
      ? new Date(document.expiryDate).toLocaleDateString()
      : "N/A";
    const text = `🛻 Truck ID: ${document.truckId}\n📄 Document: ${document.type}\n📅 Expiry: ${expiry}\n🔗 ${document.viewUrl}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      loadHistoryDocs();
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="h-screen flex justify-center items-center text-red-500">
        {error || "Document not found."}
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen py-6 px-4 md:px-10">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">
            📄 {document.name} <span className="text-sm font-normal text-gray-500 ml-2">(v{document.version})</span>
          </h1>
          <div className="flex flex-wrap gap-3">
            <a
              href={getDownloadUrl(document.downloadUrl, downloadName)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm cursor-pointer"
              onClick={async (e) => {
                if (!document.downloadUrl.includes("cloudinary.com")) {
                    e.preventDefault();
                    try {
                        const response = await fetch(document.downloadUrl);
                        if (!response.ok) throw new Error("Network response was not ok");
                        
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const link: any = document.createElement('a');
                        link.href = url;
                        link.download = downloadName; 
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                    } catch (error) {
                        console.error("Blob download failed, falling back to new tab:", error);
                        window.open(document.downloadUrl, "_blank");
                    }
                }
              }}
            >
              <FaDownload /> Download Now
            </a>
            <a
              href={getWhatsappShareUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
            >
              <FaWhatsapp /> Share
            </a>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow p-4 md:p-6 space-y-4">
            <div className="border rounded-xl overflow-hidden h-[65vh] bg-gray-200 shadow-inner">
              {document.viewUrl?.endsWith(".pdf") ? (
                <iframe
                  src={document.viewUrl}
                  className="w-full h-full"
                  title="PDF Preview"
                />
              ) : (
                <img
                  src={document.viewUrl}
                  alt="Document"
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            {document.notes && (
              <div className="bg-gray-50 border rounded-lg p-4">
                <h2 className="text-gray-700 font-semibold mb-2">📝 Notes</h2>
                <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                  {document.notes}
                </pre>
              </div>
            )}
          </div>

          {/* Right: Metadata + Document History */}
          <div className="flex flex-col gap-4">

            {/* Document Status Section */}
            <div className={`bg-white rounded-xl shadow p-4 flex items-center gap-4 border-l-4 
              ${new Date(document.expiryDate) < new Date() ? 'border-red-500' 
                : new Date(document.expiryDate).getTime() - Date.now() <= 7 * 86400000 ? 'border-yellow-500' 
                : 'border-green-500'}`}>
              <div className={`p-3 rounded-full 
                ${new Date(document.expiryDate) < new Date() ? 'bg-red-100 text-red-600' 
                  : new Date(document.expiryDate).getTime() - Date.now() <= 7 * 86400000 ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-green-100 text-green-600'}`}>
                <FaCalendarAlt className="text-xl" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-500">Document Status</p>
                <p className="text-base font-semibold text-gray-800">
                  {new Date(document.expiryDate) < new Date() ? '❌ Expired' 
                    : new Date(document.expiryDate).getTime() - Date.now() <= 7 * 86400000 ? '⚠️ Expiring Soon' 
                    : '✅ Valid'}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(document.expiryDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow p-4 flex items-center gap-4">
                <div className="bg-blue-100 text-blue-600 p-3 rounded-full">
                  <FaTruck className="text-xl" />
                </div>
                <div className="min-w-0 break-words">
                  <p className="text-sm text-gray-500">Truck ID</p>
                  <p className="font-semibold text-gray-800 break-words whitespace-normal">{document.truckId}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow p-4 flex items-center gap-4">
                <div className="bg-indigo-100 text-indigo-600 p-3 rounded-full">
                  <FaFileAlt className="text-xl" />
                </div>
                <div className="min-w-0 break-words">
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-semibold text-gray-800 break-words whitespace-normal">{document.type}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow p-4 flex items-center gap-4">
                <div className="bg-green-100 text-green-600 p-3 rounded-full">
                  <FaCalendarAlt className="text-xl" />
                </div>
                <div className="min-w-0 break-words">
                  <p className="text-sm text-gray-500">Uploaded</p>
                  <p className="font-semibold text-gray-800 break-words whitespace-normal">{new Date(document.uploadedAt).toLocaleString()}</p>
                </div>
              </div>
              {document.expiryDate && (
                <div className="bg-white rounded-xl shadow p-4 flex items-center gap-4">
                  <div className="bg-red-100 text-red-600 p-3 rounded-full">
                    <FaCalendarAlt className="text-xl" />
                  </div>
                  <div className="min-w-0 break-words">
                    <p className="text-sm text-gray-500">Expiry Date</p>
                    <p className="font-semibold text-gray-800 break-words whitespace-normal">{new Date(document.expiryDate).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
              <div className="bg-white rounded-xl shadow p-4 flex items-center gap-4">
                <div className="bg-purple-100 text-purple-600 p-3 rounded-full">
                  <FaUser className="text-xl" />
                </div>
                <div className="min-w-0 break-words">
                  <p className="text-sm text-gray-500">Uploaded By</p>
                  <p className="font-semibold text-gray-800 break-words whitespace-normal">{document.uploadedBy}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow p-4 flex items-center gap-4">
                <div className="bg-pink-100 text-pink-600 p-3 rounded-full">
                  <FaIdCard className="text-xl" />
                </div>
                <div className="min-w-0 break-words">
                  <p className="text-sm text-gray-500">Uploader ID</p>
                  <p className="font-semibold text-gray-800 break-words whitespace-normal">{document.ownerId}</p>
                </div>
              </div>
            </div>

          {/* --- REVAMPED: DOCUMENT HISTORY SECTION --- */}
            <div
              className="bg-white rounded-2xl shadow-sm border border-gray-100 max-h-[400px] overflow-y-auto flex flex-col"
              onScroll={handleScroll}
            >
              <div className="p-4 border-b border-gray-100 bg-gray-50/50 sticky top-0 backdrop-blur-sm z-10">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                   <FaHistory className="text-blue-500"/> Version History
                   <span className="text-xs font-normal text-gray-500 bg-white px-2 py-0.5 rounded-full border">
                     {historyDocs.length} Found
                   </span>
                </h2>
              </div>
              
              <div className="p-3">
                {historyDocs.length === 0 ? (
                  <div className="text-center py-8 flex flex-col items-center justify-center opacity-50">
                     <FaFileAlt className="text-4xl mb-2 text-gray-300"/>
                     <p className="text-sm text-gray-500">No other versions available.</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {historyDocs.map((doc) => {
                      const isNewer = doc.version > document.version;
                      
                      // Logic to check expiry for this specific history doc
                      const expiryDate = doc.expiryDate ? new Date(doc.expiryDate) : null;
                      const isExpired = expiryDate && expiryDate < new Date();
                      
                      return (
                        <li
                          key={doc._id}
                          className="group relative flex items-center gap-4 p-3 rounded-xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                          onClick={() => navigate(`/owner-home/mydocs/documents/${doc._id}`)}
                        >
                          {/* Left: Version Box */}
                          <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg border shadow-sm flex-shrink-0 
                            ${isNewer 
                              ? 'bg-blue-600 border-blue-600 text-white' 
                              : 'bg-gray-50 border-gray-200 text-gray-600'
                            }`}
                          >
                             <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Ver</span>
                             <span className="text-lg font-bold leading-none">{doc.version}</span>
                          </div>

                          {/* Middle: Info */}
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-gray-800 truncate">
                                   {new Date(doc.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                                {isNewer && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wide">
                                    Newest
                                  </span>
                                )}
                             </div>

                             {/* Expiry Row */}
                             <div className="flex items-center gap-2 mt-1">
                                {expiryDate ? (
                                  <div className={`flex items-center gap-1.5 text-xs font-medium ${isExpired ? 'text-red-500' : 'text-green-600'}`}>
                                     {isExpired ? <FaCalendarAlt className="text-[10px]"/> : <FaCheck className="text-[10px]"/>}
                                     <span>{isExpired ? `Expired: ${expiryDate.toLocaleDateString()}` : `Valid: ${expiryDate.toLocaleDateString()}`}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                     <FaCalendarAlt className="text-[10px]"/> No Expiry
                                  </div>
                                )}
                             </div>
                          </div>

                          {/* Right: Action Arrow */}
                          <div className="text-gray-300 group-hover:text-blue-600 transition-colors transform group-hover:translate-x-1 duration-200">
                             <FaExternalLinkAlt />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                
                {loadingHistory ? (
                  <div className="flex justify-center py-4">
                    <LoadingSpinner  />
                  </div>
                ) : hasMoreHistory && historyDocs.length > 0 && (
                  <div className="text-center mt-2">
                    <span className="text-xs text-gray-400 italic">Scroll for more history...</span>
                  </div>
                )}
              </div>
            </div>
            {/* --- END HISTORY SECTION --- */}

          </div>
        </div>
      </div>
    </div>
  );
}