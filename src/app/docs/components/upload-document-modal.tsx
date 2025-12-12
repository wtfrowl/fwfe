"use client"

import { useEffect, useState } from "react"
import { Truck } from "../types/docs"
import { api } from "../services/api"
import Tesseract from "tesseract.js"
import { FaCloudUploadAlt, FaSpinner, FaTimes } from "react-icons/fa"

export const UploadDocumentModal = ({
  isOpen,
  onClose,
  onUpload,
}: {
  isOpen: boolean
  onClose: () => void
  onUpload: () => void
}) => {
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [formData, setFormData] = useState({
    name: "",
    truckId: "",
    viewUrl: "",
    downloadUrl: "",
    type: "",
    expiryDate: "",
    notes: "",
    // version: 1,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)
  const [ocrStatus, setOcrStatus] = useState<string>("")

  useEffect(() => {
    if (isOpen) fetchTrucks()
  }, [isOpen])

  const fetchTrucks = async () => {
    try {
      const data = await api.trucks.getMyTrucks()
      setTrucks(data)
    } catch (err) {
      console.error("Failed to fetch trucks:", err)
      setError("Failed to load trucks")
    }
  }

  const extractDataFromText = (text: string) => {
    const result: any = {
      notes: text.substring(0, 200),
      version: 1,
    }

    const lower = text.toLowerCase()

    if (lower.includes("insurance")) result.type = "Insurance"
    else if (lower.includes("rc")) result.type = "RC"
    else if (lower.includes("permit")) result.type = "Permit"
    else if (lower.includes("fitness")) result.type = "Fitness"
    else if (lower.includes("pollution")) result.type = "Pollution"
    else result.type = "Other"

    const nameMatch = text.match(/(Permit|Insurance|RC|Fitness|Pollution)[^\n]{0,30}/i)
    if (nameMatch) result.name = nameMatch[0].trim()

    const expiryMatch = text.match(
      /(expire|expiry|valid.*?(till| up to|upto|on|date))\s*(?:\w+\s*)*[:\s-]*([0-9]{1,2}(?:[\/\-\s][A-Za-z]{3,9}|[\/\-][0-9]{1,2})[\/\-\s][0-9]{2,4})/i
    )

    if (expiryMatch && expiryMatch[3]) {
      const dateStr = expiryMatch[3].trim()

      const wordDateMatch = dateStr.match(/([0-9]{1,2})[\s\-\/]?([a-zA-Z]{3,9})[\s\-\/]?([0-9]{2,4})/)
      if (wordDateMatch) {
        const [_, dayStr, monthStr, yearStr] = wordDateMatch
        const monthMap: Record<string, number> = {
          january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
          july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
          jan: 0, feb: 1, mar: 2, apr: 3, jun: 5,
          jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
        }
        const month = monthMap[monthStr.toLowerCase()]
        const year = parseInt(yearStr.length === 2 ? `20${yearStr}` : yearStr)
        const day = parseInt(dayStr)
        const date = new Date(Date.UTC(year, month, day))

        if (!isNaN(date.getTime())) {
          result.expiryDate = date.toISOString().split("T")[0]
        }
      } else {
        const parts = dateStr.split(/[\/\-]/)
        if (parts.length === 3) {
          const [day, month, year] = parts.map(Number)
          const fullYear = year < 100 ? 2000 + year : year
          const date = new Date(Date.UTC(fullYear, month - 1, day))
          if (!isNaN(date.getTime())) {
            result.expiryDate = date.toISOString().split("T")[0]
          }
        }
      }
    }

    let cleanedText = text.replace(/[\n\r]+/g, " ").replace(/\s+/g, " ").toUpperCase()
    const rawMatch = cleanedText.match(
      /([A-Z]{2})[\s\-]*([0-9]{2})[\s\-]*([A-Z]{2})[\s\-]*([A-Z0-9]{4})/
    )

    if (rawMatch) {
      let [_, state, district, series, numberRaw] = rawMatch
      const fixNumber = (numStr: string) =>
        numStr
          .replace(/S/g, "5")
          .replace(/O/g, "0")
          .replace(/I/g, "1")
          .replace(/L/g, "1")
          .replace(/Z/g, "2")
          .replace(/B/g, "8")

      const fixedNumber = fixNumber(numberRaw)
      result.truckId = `${state}${district}${series}${fixedNumber}`
    }

    return result
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setOcrStatus("Uploading...")
    
    const formDataUpload = new FormData()
    formDataUpload.append("file", file)
    formDataUpload.append("upload_preset", "testing")

    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/dewedem6y/auto/upload", {
        method: "POST",
        body: formDataUpload,
      })
      const data = await res.json()

      if (data.secure_url) {
        setOcrStatus("Reading document text...")
        const imageText = await Tesseract.recognize(data.secure_url, "eng")
        const extracted = extractDataFromText(imageText.data.text)

        const matchedTruck = trucks.find(
          t => t.registrationNumber === extracted.truckId
        )

        setFormData(prev => ({
          ...prev,
          viewUrl: data.secure_url,
          downloadUrl: data.secure_url,
          ...extracted,
          truckId: matchedTruck?.registrationNumber || prev.truckId,
        }))
        setOcrStatus("Data extracted!")
      }
    } catch (err) {
      console.error("Cloudinary upload failed:", err)
      setError("Upload failed.")
    } finally {
      setUploading(false)
      setTimeout(() => setOcrStatus(""), 3000)
    }
  }

  const handleSubmit = async () => {
    const { name, truckId, viewUrl, downloadUrl, type } = formData
    if (!name || !truckId || !viewUrl || !downloadUrl || !type) {
      alert("Please fill in all required fields.")
      return
    }
    try {
      setLoading(true)
      await api.documents.addDoc(formData)
      onClose()
      onUpload()
      // Reset form
      setFormData({
        name: "", truckId: "", viewUrl: "", downloadUrl: "",
        type: "", expiryDate: "", notes: "", // version: 1,
      })
    } catch (err) {
      console.error("Upload error:", err)
      alert("Failed to submit document.")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Upload Document</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

          {/* File Upload Area */}
          <div className="border-2 border-dashed border-blue-200 rounded-lg p-6 text-center bg-blue-50 transition hover:bg-blue-100">
            <input
              type="file"
              id="file-upload"
              accept="application/pdf,image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
              {uploading ? (
                <>
                  <FaSpinner className="animate-spin text-blue-600 text-2xl" />
                  <span className="text-blue-600 font-medium">{ocrStatus}</span>
                </>
              ) : (
                <>
                  <FaCloudUploadAlt className="text-blue-500 text-4xl" />
                  <span className="text-gray-700 font-medium">Click to upload file</span>
                  <span className="text-xs text-gray-500">Supports PDF, JPG, PNG (Auto-fills data)</span>
                </>
              )}
            </label>
          </div>
          
          {ocrStatus === "Data extracted!" && (
             <p className="text-xs text-green-600 font-medium text-center">
                ✓ AI has attempted to fill the details below. Please verify.
             </p>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Document Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Document Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="e.g. National Permit"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Document Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Document Type <span className="text-red-500">*</span></label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="">Select Type</option>
                <option value="Insurance">Insurance</option>
                <option value="RC">RC</option>
                <option value="Permit">Permit</option>
                <option value="Fitness">Fitness</option>
                <option value="Pollution">Pollution</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Truck Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Select Truck <span className="text-red-500">*</span></label>
              <select
                value={formData.truckId}
                onChange={(e) => setFormData({ ...formData, truckId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="">-- Choose Truck --</option>
                {trucks.map((truck) => (
                  <option key={truck.id} value={truck.registrationNumber}>
                    {truck.registrationNumber}
                  </option>
                ))}
              </select>
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Expiry Date</label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Check this carefully if auto-filled.
              </p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Notes / Extracted Text</label>
            <textarea
              placeholder="Any additional details..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
            />
          </div>

          {/* Hidden/Advanced Fields (Version & URLs) */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
             <div className="flex gap-4">
                {/* <div className="flex-1">
                   <label className="block text-xs font-semibold text-gray-500 mb-1">Version</label>
                   <input
                    type="number"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded p-1.5 text-sm"
                  />
                </div> */}
                <div className="flex-[3]">
                   <label className="block text-xs font-semibold text-gray-500 mb-1">File URL (Read-only)</label>
                   <input
                    type="text"
                    value={formData.viewUrl}
                    disabled
                    className="w-full border border-gray-200 bg-gray-100 rounded p-1.5 text-sm text-gray-500 truncate"
                  />
                </div>
             </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || uploading}
            className="px-6 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <FaSpinner className="animate-spin" />}
            {loading ? "Saving..." : "Save Document"}
          </button>
        </div>
      </div>
    </div>
  )
}