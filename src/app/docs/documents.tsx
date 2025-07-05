"use client";

import { useEffect, useMemo, useState } from "react";
import { FaEye, FaDownload, FaPlus } from "react-icons/fa";
import { api } from "./services/api";
import type { Document, Truck } from "./types/docs";
import { LoadingSpinner } from "../trips/components/loading-spinner";
import { UploadDocumentModal } from "./components/upload-document-modal";
import { useNavigate } from "react-router-dom";
import {
  FaCar,
  FaShieldAlt,
  FaFileAlt,
  FaTools,
  FaCloud,
  FaPaperclip,
} from "react-icons/fa";

const typeIcons: Record<string, JSX.Element> = {
  RC: <FaCar className="text-blue-600" />,
  Insurance: <FaShieldAlt className="text-red-600" />,
  Permit: <FaFileAlt className="text-green-600" />,
  Fitness: <FaTools className="text-yellow-600" />,
  Pollution: <FaCloud className="text-purple-600" />,
  Other: <FaPaperclip className="text-gray-600" />,
};

const ITEMS_PER_PAGE = 6;
const TABS = ["All", "Permits", "Expiring Soon", "Missing"];

export default function DocumentsDashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [selectedTruckId, setSelectedTruckId] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedTab, setSelectedTab] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
    fetchTrucks();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.documents.list(1, 100);
      setDocuments(response.documents as Document[]);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError("Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTrucks = async () => {
    try {
      const data = await api.trucks.getMyTrucks();
      setTrucks(data);
    } catch (err) {
      console.error("Error fetching trucks:", err);
    }
  };

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      if (selectedTruckId && doc.truckId !== selectedTruckId) return false;
      if (selectedType && doc.type !== selectedType) return false;

      if (selectedTab === "Permits") return doc.type === "Permit";
      if (selectedTab === "Expiring Soon")
        return new Date(doc.expiryDate || "") < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      if (selectedTab === "Missing") return !doc.viewUrl;

      return true;
    });
  }, [documents, selectedTruckId, selectedType, selectedTab]);

  const totalPages = Math.ceil(filteredDocs.length / ITEMS_PER_PAGE);

  const paginatedDocs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDocs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredDocs, currentPage]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Truck Documents</h1>
          <p className="text-gray-500">Manage, view, and filter documents by truck and type.</p>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          <FaPlus /> Upload Document
        </button>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded shadow p-4">
          <p className="text-sm text-gray-500">Total Documents</p>
          <p className="text-xl font-semibold">{documents.length}</p>
        </div>
        <div className="bg-white rounded shadow p-4">
          <p className="text-sm text-gray-500">Expiring Soon</p>
          <p className="text-xl font-semibold">
            {
              documents.filter((doc) =>
                doc.expiryDate ? new Date(doc.expiryDate) < new Date(Date.now() + 7 * 86400000) : false
              ).length
            }
          </p>
        </div>
        <div className="bg-white rounded shadow p-4">
          <p className="text-sm text-gray-500">Last Uploaded</p>
          <p className="text-sm">
            {documents.length
              ? new Date(documents[0].uploadedAt).toLocaleDateString()
              : "N/A"}
          </p>
        </div>
      </div>

      {/* Filters + Tabs */}
      <div className="bg-white rounded shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <select
            value={selectedTruckId}
            onChange={(e) => setSelectedTruckId(e.target.value)}
            className="w-full md:w-1/2 border border-gray-300 rounded-lg p-2"
          >
            <option value="">All Trucks</option>
            {trucks.map((truck) => (
              <option key={truck.id} value={truck.id}>
                {truck.registrationNumber}
              </option>
            ))}
          </select>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full md:w-1/2 border border-gray-300 rounded-lg p-2"
          >
            <option value="">All Types</option>
            <option value="Insurance">Insurance</option>
            <option value="RC">RC</option>
            <option value="Permit">Permit</option>
            <option value="Fitness">Fitness</option>
            <option value="Pollution">Pollution</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="flex gap-4 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${selectedTab === tab
                  ? "bg-blue-100 text-blue-700 font-medium"
                  : "bg-gray-100 text-gray-500"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded shadow">
        {error && <p className="text-red-500 p-4">{error}</p>}
        {loading ? (
          <div className="h-40 flex justify-center items-center">
            <LoadingSpinner />
          </div>
        ) : paginatedDocs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No documents found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-200 text-gray-700 text-left md:text-md text-sm">
                <tr>
                  <th className="px-4 py-4">Name</th>
                  <th className="px-4 py-4">Truck</th> 
                  <th className="px-4 py-4">Type</th>
                  <th className="px-4 py-4">Uploaded</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDocs.map((doc) => (
                  <tr
                    key={doc._id}
                    className="hover:bg-gray-50 cursor-pointer border-b border-gray-400"
                    onClick={() => navigate(`documents/${doc._id}`)}
                  >
                   <td className="px-6 py-4 flex items-center gap-2">
  {typeIcons[doc.type] || <FaPaperclip className="text-gray-600" />}
  <span>{doc.name}</span>
</td>

                    <td className="px-4 py-2">{doc.truckId}</td>
                    <td className="px-4 py-2">{doc.type}</td>
                    <td className="px-4 py-2">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      <div
                        className="flex justify-end items-center gap-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <a
                          href={doc.viewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700"
                          title="View Document"
                        >
                          <FaEye className="w-5 h-5" />
                        </a>
                        <a
                          href={doc.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-500 hover:text-green-700"
                          title="Download Document"
                        >
                          <FaDownload className="w-5 h-5" />
                        </a>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex justify-between items-center text-sm">
          <p>
            Showing{" "}
            <span className="font-medium">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}
            </span>{" "}
            -{" "}
            <span className="font-medium">
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredDocs.length)}
            </span>{" "}
            of <span className="font-medium">{filteredDocs.length}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              &larr;
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`px-3 py-1 border rounded ${currentPage === i + 1 ? "bg-blue-100 text-blue-600" : ""
                  }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              &rarr;
            </button>
          </div>
        </div>
      </div>

      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={fetchDocuments}
      />
    </div>
  );
}
