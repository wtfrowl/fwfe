"use client";

import { useEffect, useRef, useState } from "react";
import { Document } from "../types/docs";
import { useNavigate, useParams } from "react-router-dom";
import { LoadingSpinner } from "../../trips/components/loading-spinner";
import { 
  FaCalendarAlt, FaDownload, FaFileAlt, FaIdCard, 
  FaTruck, FaUser, FaWhatsapp, FaHistory, FaExternalLinkAlt, 
  FaCheck
} from "react-icons/fa";
import { getDocumentById, getDocumentHistory } from "../../../api";
import { Button } from "../../../components/ui/Button";
import { InlineMessage } from "../../../components/ui/InlineMessage";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import {
  DetailPage,
  DetailHeader,
  BackButton,
} from "../../../components/ui/DetailPage";

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
      const res = await getDocumentById(id);
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
      const res = await getDocumentHistory(id, historyPage, ITEMS_PER_PAGE);
      
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
    const text = `🛻 Truck ID: ${document.truckId}\nDocument: ${document.type}\n📅 Expiry: ${expiry}\n🔗 ${document.viewUrl}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  const handleDownload = async () => {
    if (!document) return;

    /* Cloudinary serves a download-flagged URL directly; anything else is
       fetched as a blob so the file saves instead of navigating away. */
    if (document.downloadUrl.includes("cloudinary.com")) {
      window.open(getDownloadUrl(document.downloadUrl, downloadName), "_blank", "noopener,noreferrer");
      return;
    }

    try {
      const response = await fetch(document.downloadUrl);
      if (!response.ok) throw new Error("Network response was not ok");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      /* `globalThis.document` on purpose: the component's own `document`
         state shadows the DOM one, and the original code relied on that
         shadowing by accident. */
      const link = globalThis.document.createElement("a");
      link.href = url;
      link.download = downloadName;
      globalThis.document.body.appendChild(link);
      link.click();
      globalThis.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Blob download failed, falling back to a new tab:", err);
      window.open(document.downloadUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      loadHistoryDocs();
    }
  };

  if (loading) {
    return (
      <DetailPage>
        <header className="flex items-start gap-3">
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-ink/8" />
          <div className="space-y-2">
            <div className="h-8 w-56 animate-pulse rounded-chip bg-ink/8" />
            <div className="h-4 w-40 animate-pulse rounded-chip bg-ink/8" />
          </div>
        </header>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="h-[65vh] animate-pulse rounded-card bg-ink/6 lg:col-span-2" />
          <div className="h-64 animate-pulse rounded-card bg-ink/6" />
        </div>
      </DetailPage>
    );
  }

  if (error || !document) {
    return (
      <DetailPage>
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-2xl font-semibold text-ink">Document</h1>
        </div>
        <InlineMessage tone="error">{error || "We couldn't find that document."}</InlineMessage>
      </DetailPage>
    );
  }

  return (
    <DetailPage>
      <DetailHeader
        title={document.name}
        subtitle={document.type ? `${document.type} document` : undefined}
        badge={<StatusBadge tone="neutral">v{document.version}</StatusBadge>}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => window.open(getWhatsappShareUrl(), "_blank", "noopener,noreferrer")}
            >
              <FaWhatsapp className="h-3.5 w-3.5" />
              Share
            </Button>
            <Button onClick={handleDownload}>
              <FaDownload className="h-3.5 w-3.5" />
              Download
            </Button>
          </>
        }
      />

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 rounded-card border border-hairline bg-surface p-5 shadow-[var(--shadow-raised)] space-y-4">
            <div className="border rounded-card overflow-hidden h-[65vh] bg-ink/8 ">
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
              <div className="bg-canvas-sunken border rounded-control p-4">
                <h2 className="mb-2 font-semibold text-ink">Notes</h2>
                <pre className="text-sm text-ink-secondary whitespace-pre-wrap">
                  {document.notes}
                </pre>
              </div>
            )}
          </div>

          {/* Right: Metadata + Document History */}
          <div className="flex flex-col gap-4">

            {/* Document Status Section */}
            <div className={`rounded-card border border-hairline bg-surface p-4 shadow-[var(--shadow-raised)] flex items-center gap-4 border-l-4 
              ${new Date(document.expiryDate) < new Date() ? 'border-critical' 
                : new Date(document.expiryDate).getTime() - Date.now() <= 7 * 86400000 ? 'border-caution' 
                : 'border-positive'}`}>
              <div className={`p-3 rounded-full 
                ${new Date(document.expiryDate) < new Date() ? 'bg-critical-soft text-critical-ink' 
                  : new Date(document.expiryDate).getTime() - Date.now() <= 7 * 86400000 ? 'bg-caution-soft text-caution-ink' 
                  : 'bg-positive-soft text-positive-ink'}`}>
                <FaCalendarAlt className="text-xl" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-ink-tertiary">Document Status</p>
                <p className="text-base font-semibold text-ink">
                  {new Date(document.expiryDate) < new Date() ? '❌ Expired' 
                    : new Date(document.expiryDate).getTime() - Date.now() <= 7 * 86400000 ? '⚠️ Expiring Soon' 
                    : '✅ Valid'}
                </p>
                <p className="text-xs text-ink-tertiary">
                  {new Date(document.expiryDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-card border border-hairline bg-surface p-4 shadow-[var(--shadow-raised)] flex items-center gap-4">
                <div className="bg-accent-soft text-accent p-3 rounded-full">
                  <FaTruck className="text-xl" />
                </div>
                <div className="min-w-0 break-words">
                  <p className="text-sm text-ink-tertiary">Truck ID</p>
                  <p className="font-semibold text-ink break-words whitespace-normal">{document.truckId}</p>
                </div>
              </div>
              <div className="rounded-card border border-hairline bg-surface p-4 shadow-[var(--shadow-raised)] flex items-center gap-4">
                <div className="bg-accent-soft text-accent p-3 rounded-full">
                  <FaFileAlt className="text-xl" />
                </div>
                <div className="min-w-0 break-words">
                  <p className="text-sm text-ink-tertiary">Type</p>
                  <p className="font-semibold text-ink break-words whitespace-normal">{document.type}</p>
                </div>
              </div>
              <div className="rounded-card border border-hairline bg-surface p-4 shadow-[var(--shadow-raised)] flex items-center gap-4">
                <div className="bg-positive-soft text-positive-ink p-3 rounded-full">
                  <FaCalendarAlt className="text-xl" />
                </div>
                <div className="min-w-0 break-words">
                  <p className="text-sm text-ink-tertiary">Uploaded</p>
                  <p className="font-semibold text-ink break-words whitespace-normal">{new Date(document.uploadedAt).toLocaleString()}</p>
                </div>
              </div>
              {document.expiryDate && (
                <div className="rounded-card border border-hairline bg-surface p-4 shadow-[var(--shadow-raised)] flex items-center gap-4">
                  <div className="bg-critical-soft text-critical-ink p-3 rounded-full">
                    <FaCalendarAlt className="text-xl" />
                  </div>
                  <div className="min-w-0 break-words">
                    <p className="text-sm text-ink-tertiary">Expiry Date</p>
                    <p className="font-semibold text-ink break-words whitespace-normal">{new Date(document.expiryDate).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
              <div className="rounded-card border border-hairline bg-surface p-4 shadow-[var(--shadow-raised)] flex items-center gap-4">
                <div className="bg-ink/6 text-ink-secondary p-3 rounded-full">
                  <FaUser className="text-xl" />
                </div>
                <div className="min-w-0 break-words">
                  <p className="text-sm text-ink-tertiary">Uploaded By</p>
                  <p className="font-semibold text-ink break-words whitespace-normal">{document.uploadedBy}</p>
                </div>
              </div>
              <div className="rounded-card border border-hairline bg-surface p-4 shadow-[var(--shadow-raised)] flex items-center gap-4">
                <div className="bg-ink/6 text-ink-secondary p-3 rounded-full">
                  <FaIdCard className="text-xl" />
                </div>
                <div className="min-w-0 break-words">
                  <p className="text-sm text-ink-tertiary">Uploader ID</p>
                  <p className="font-semibold text-ink break-words whitespace-normal">{document.ownerId}</p>
                </div>
              </div>
            </div>

          {/* --- REVAMPED: DOCUMENT HISTORY SECTION --- */}
            <div
 className="rounded-card border border-hairline bg-surface shadow-[var(--shadow-raised)] max-h-[400px] overflow-y-auto flex flex-col"
              onScroll={handleScroll}
            >
              <div className="p-4 border-b border-hairline bg-canvas-sunken/50 sticky top-0 backdrop-blur-sm z-10">
                <h2 className="text-base font-semibold text-ink flex items-center gap-2">
                   <FaHistory className="text-accent"/> Version History
                   <span className="text-xs font-normal text-ink-tertiary bg-surface px-2 py-0.5 rounded-full border">
                     {historyDocs.length} Found
                   </span>
                </h2>
              </div>
              
              <div className="p-3">
                {historyDocs.length === 0 ? (
                  <div className="text-center py-8 flex flex-col items-center justify-center opacity-50">
                     <FaFileAlt className="text-4xl mb-2 text-ink-quaternary"/>
                     <p className="text-sm text-ink-tertiary">No other versions available.</p>
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
 className="group relative flex items-center gap-4 p-3 rounded-card border border-hairline bg-surface hover:border-accent/25 hover:shadow-[var(--shadow-raised)] transition-all duration-200 cursor-pointer"
                          onClick={() => navigate(`/owner-home/mydocs/documents/${doc._id}`)}
                        >
                          {/* Left: Version Box */}
                          <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-control border shadow-[var(--shadow-hairline)] flex-shrink-0 
                            ${isNewer 
                              ? 'bg-accent border-accent text-white' 
                              : 'bg-canvas-sunken border-hairline text-ink-secondary'
                            }`}
                          >
                             <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Ver</span>
                             <span className="text-base font-semibold leading-none">{doc.version}</span>
                          </div>

                          {/* Middle: Info */}
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-ink truncate">
                                   {new Date(doc.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                                {isNewer && (
                                  <span className="px-1.5 py-0.5 rounded-chip text-[10px] font-semibold bg-accent-soft text-accent-ink uppercase tracking-wide">
                                    Newest
                                  </span>
                                )}
                             </div>

                             {/* Expiry Row */}
                             <div className="flex items-center gap-2 mt-1">
                                {expiryDate ? (
                                  <div className={`flex items-center gap-1.5 text-xs font-medium ${isExpired ? 'text-critical' : 'text-positive-ink'}`}>
                                     {isExpired ? <FaCalendarAlt className="text-[10px]"/> : <FaCheck className="text-[10px]"/>}
                                     <span>{isExpired ? `Expired: ${expiryDate.toLocaleDateString()}` : `Valid: ${expiryDate.toLocaleDateString()}`}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-xs text-ink-quaternary">
                                     <FaCalendarAlt className="text-[10px]"/> No Expiry
                                  </div>
                                )}
                             </div>
                          </div>

                          {/* Right: Action Arrow */}
                          <div className="text-ink-quaternary group-hover:text-accent transition-colors transform group-hover:translate-x-1 duration-200">
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
                    <span className="text-xs text-ink-quaternary italic">Scroll for more history...</span>
                  </div>
                )}
              </div>
            </div>
            {/* --- END HISTORY SECTION --- */}

          </div>
        </div>
    </DetailPage>
  );
}
