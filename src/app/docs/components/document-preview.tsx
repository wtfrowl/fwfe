"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import { Document } from "../types/docs";
import { useNavigate, useParams } from "react-router-dom";
import { LoadingSpinner } from "../../trips/components/loading-spinner";
import { FaCalendarAlt, FaDownload, FaFileAlt, FaIdCard, FaTruck, FaUser, FaWhatsapp } from "react-icons/fa";

export default function DocumentPreviewPage() {
  const { id } = useParams() as { id: string };
  const ITEMS_PER_PAGE = 5;
  const navigate = useNavigate();

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [olderVersions, setOlderVersions] = useState<Document[]>([]);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [olderPage, setOlderPage] = useState(1);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const loadingMoreRef = useRef(false);

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
    setLoadingOlder(true);

    try {
      const res = await api.documents.fetchOlderDocs(id, olderPage, ITEMS_PER_PAGE);
      if (res?.length < ITEMS_PER_PAGE) setHasMoreOlder(false);
      setOlderVersions((prev) => [...prev, ...(res as unknown as Document[])]);
      setOlderPage((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to fetch older versions:", err);
    } finally {
      loadingMoreRef.current = false;
      setLoadingOlder(false);
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
    <div className="bg-gray-100 min-h-screen py-6 px-4 md:px-10">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">
            📄 {document.name}
          </h1>
          <div className="flex flex-wrap gap-3">
            <a
              href={document.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
            >
              <FaDownload /> Download
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

          {/* Right: Metadata + Older Versions */}
          <div className="flex flex-col gap-4">

            {/* Document Status Section */}
            <div className="bg-white rounded-xl shadow p-4 flex items-center gap-4 border-l-4 
  ${
    new Date(document.expiryDate) < new Date()
      ? 'border-red-500'
      : new Date(document.expiryDate).getTime() - Date.now() <= 7 * 86400000
      ? 'border-yellow-500'
      : 'border-green-500'
  }">
              <div className={`p-3 rounded-full 
    ${new Date(document.expiryDate) < new Date()
                  ? 'bg-red-100 text-red-600'
                  : new Date(document.expiryDate).getTime() - Date.now() <= 7 * 86400000
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-600'
                }`}>
                <FaCalendarAlt className="text-xl" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-500">Document Status</p>
                <p className="text-base font-semibold text-gray-800">
                  {
                    new Date(document.expiryDate) < new Date()
                      ? '❌ Expired'
                      : new Date(document.expiryDate).getTime() - Date.now() <= 7 * 86400000
                        ? '⚠️ Expiring Soon'
                        : '✅ Valid'
                  }
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(document.expiryDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            {/* Updated Premium Info Section */}
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


            {/* Older Versions */}
            <div
              className="bg-white rounded-2xl shadow p-4 max-h-[250px] overflow-y-auto"
              onScroll={handleScroll}
            >
              <h2 className="text-lg font-semibold text-yellow-800 mb-3">📚 Older Versions</h2>
              {olderVersions.length === 0 ? (
                <p className="text-sm text-yellow-700">No older versions found.</p>
              ) : (
                <ul className="space-y-3">
                  {olderVersions.map((doc) => (
                    <li
                      key={doc._id}
                      className="flex justify-between items-center border-b pb-2"
                    >
                      <div>
                        <p className="text-sm text-gray-700 font-medium">
                          Version {doc.version}
                        </p>
                        <span className="text-xs text-gray-500">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        className="text-blue-600 text-sm font-semibold hover:underline"
                        onClick={() => navigate(`/owner-home/mydocs/documents/${doc._id}`)}
                      >
                        View
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {loadingOlder ? (
                <div className="flex justify-center py-3">
                  <LoadingSpinner />
                </div>
              ) : hasMoreOlder && (
                <p className="text-center text-xs text-yellow-600 mt-3 animate-pulse">
                  Scroll to load more...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
