"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import { Document } from "../types/docs";
import { useNavigate, useParams } from "react-router-dom";
import { FaDownload } from "react-icons/fa";
import { LoadingSpinner } from "../../trips/components/loading-spinner";


export default function DocumentPreviewPage() {
  const { id } = useParams() as { id: string };
  const ITEMS_PER_PAGE = 5;

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [olderVersions, setOlderVersions] = useState<Document[]>([]);
  const [olderPage, setOlderPage] = useState(1);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const loadingMoreRef = useRef(false);
  const navigate = useNavigate();
 useEffect(() => {
  if (id) {
    setOlderVersions([]);
    setOlderPage(1);
    setHasMoreOlder(true);
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (document) loadOlderVersions();
  }, [document]);

  const loadOlderVersions = async () => {
    if (loadingMoreRef.current || !hasMoreOlder) return;
    loadingMoreRef.current = true;

    try {
      const res = await api.documents.fetchOlderDocs(id, olderPage, ITEMS_PER_PAGE);
      if (res?.length < ITEMS_PER_PAGE) setHasMoreOlder(false);
      setOlderVersions((prev) => [...prev, ...res as unknown as Document[]]);
      setOlderPage((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to fetch older versions:", err);
    } finally {
      loadingMoreRef.current = false;
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      loadOlderVersions();
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
 <div className="p-4 md:p-8 lg:p-10 bg-gray-100 min-h-screen">
  <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
    
    {/* Left – Main Document (always on left for desktop, on top for mobile) */}
    <div className="w-full lg:w-2/3 bg-white rounded-xl shadow-md p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-800">{document.name}</h1>
          <div className="text-sm text-gray-600 space-y-0.5">
            <p><strong>Type:</strong> {document.type}</p>
            <p><strong>Truck ID:</strong> {document.truckId}</p>
            <p><strong>Uploaded On:</strong> {new Date(document.uploadedAt).toLocaleString()}</p>
            {document.expiryDate && (
              <p><strong>Expiry Date:</strong> {new Date(document.expiryDate).toLocaleDateString()}</p>
            )}
            <p><strong>Uploaded By:</strong> {document.uploadedBy}</p>
            <p><strong>Uploader ID:</strong> {document.ownerId}</p>
            <p><strong>Version:</strong> {document.version}</p>
          </div>
        </div>
        <a
          href={document.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
        >
          <FaDownload /> Download
        </a>
      </div>

      {document.notes && (
        <div className="bg-gray-50 border rounded-lg p-4">
          <h2 className="text-gray-700 font-semibold mb-2">Notes</h2>
          <pre className="text-sm text-gray-600 whitespace-pre-wrap">{document.notes}</pre>
        </div>
      )}

      <div className="w-full border rounded-lg shadow-inner overflow-hidden h-[60vh] bg-gray-100">
        <iframe
          src={document.viewUrl}
          title="Document Preview"
          className="w-full h-full rounded-lg"
        />
      </div>
    </div>

    {/* Right Sidebar (mobile: below, desktop: right) */}
    <div
      className="w-full lg:w-1/3 bg-yellow-50 border border-yellow-200 rounded-xl shadow-sm p-4 max-h-[60vh] overflow-y-auto"
      onScroll={handleScroll}
    >
      <h2 className="text-lg font-semibold text-yellow-800 mb-3">Older Versions</h2>

      {olderVersions.length === 0 ? (
        <p className="text-sm text-yellow-700">No older versions found.</p>
      ) : (
        <>
          <ul className="space-y-3">
            {olderVersions.map((doc) => (
              <li key={doc._id} className="flex justify-between items-center border-b pb-2">
                <div className="text-sm text-yellow-700">
                  Version <strong>{doc.version}</strong><br />
                  <span className="text-xs text-gray-500">
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
                <a
            className="text-cyan-600 font-bold cursor-pointer"

                 onClick={() => navigate(`/owner-home/mydocs/documents/${doc._id}`)}
                 
                > go
                </a>
                  
              </li>
            ))}
          </ul>

          {hasMoreOlder && (
            <p className="text-center text-xs text-yellow-600 mt-3 animate-pulse">
              Scroll to load more...
            </p>
          )}
        </>
      )}
    </div>
  </div>
</div>


  );
}
