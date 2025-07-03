"use client";

import { useEffect, useMemo, useState } from "react";
import { FaEye, FaDownload, FaPlus } from "react-icons/fa";
import { api } from "./services/api";
import type { Document, Truck } from "./types/docs";
import { LoadingSpinner } from "../trips/components/loading-spinner";
import { UploadDocumentModal } from "./components/upload-document-modal";
import { useNavigate } from "react-router-dom";
const ITEMS_PER_PAGE = 6;

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [selectedTruckId, setSelectedTruckId] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
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
      setDocuments(response.documents as unknown as Document[]);
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
      return true;
    });
  }, [documents, selectedTruckId, selectedType]);

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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-4 border-b border-gray-200 flex justify-between items-center flex-wrap gap-3">
            <h1 className="text-xl md:text-2xl font-semibold">My Documents</h1>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <FaPlus className="w-4 h-4" /> Upload Document
            </button>
          </div>

          <div className="p-4 border-b border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={selectedTruckId}
              onChange={(e) => setSelectedTruckId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2"
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
              className="w-full border border-gray-300 rounded-lg p-2"
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

          {error && <p className="text-red-500 text-center">{error}</p>}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
            </div>
          ) : paginatedDocs.length === 0 ? (
            <div className="text-center text-gray-500 py-12">No documents found.</div>
          ) : (
            <div className="grid grid-cols-1 md:table w-full">
              <div className="hidden md:table-header-group bg-gray-100 border-b text-gray-600">
                <div className="table-row">
                  <div className="table-cell py-2 px-4">Name</div>
                  <div className="table-cell py-2 px-4">Truck ID</div>
                  <div className="table-cell py-2 px-4">Type</div>
                  <div className="table-cell py-2 px-4">Uploaded</div>
                  <div className="table-cell py-2 px-4 text-right">Actions</div>
                </div>
              </div>
              {paginatedDocs.map((doc) => (
                <div    key={doc._id}
    onClick={() => navigate(`documents/${doc._id}`)} className="grid md:table-row grid-cols-1 md:table-row-group border-b hover:bg-gray-50">
                  <div className="table-cell py-2 px-4">
                    <strong>Name:</strong> {doc.name}
                  </div>
                  <div className="table-cell py-2 px-4">
                    <strong>Truck ID:</strong> {doc.truckId}
                  </div>
                  <div className="table-cell py-2 px-4">
                    <strong>Type:</strong> {doc.type || "—"}
                  </div>
                  <div className="table-cell py-2 px-4">
                    <strong>Uploaded:</strong> {new Date(doc.uploadedAt).toLocaleDateString()}
                  </div>
                  <div className="table-cell py-2 px-4 text-right">
                    <a href={doc.viewUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline mr-3">
                      <FaEye className="inline-block" title="View" />
                    </a>
                    <a href={doc.downloadUrl} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline">
                      <FaDownload className="inline-block" title="Download" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="px-4 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> -
                <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredDocs.length)}</span> of
                <span className="font-medium">{filteredDocs.length}</span>
              </p>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  &larr;
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    className={`px-3 py-1 text-sm border rounded hover:bg-gray-50 ${currentPage === i + 1 ? "bg-blue-50 text-blue-600" : ""}`}
                    onClick={() => handlePageChange(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={() => fetchDocuments()}
      />
    </div>
  );
}
