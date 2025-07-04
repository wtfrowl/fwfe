"use client"

import { useEffect, useState } from "react"
import { Truck } from "../types/docs"
import { api } from "../services/api"
import Tesseract from "tesseract.js"

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
    version: 1,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)

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
  // ───────────────────────────────────────────┬───────────────────────────────────────┘
  //                                            │
)

if (expiryMatch && expiryMatch[3]) {
  const dateStr = expiryMatch[3].trim()

  // Match format: 1 July 2025 or 01-Jul-25
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
    const date = new Date(Date.UTC(year, month, day)) // Ensure UTC time

    if (!isNaN(date.getTime())) {
      result.expiryDate = result.expiryDate = date.toISOString().split("T")[0]  // ➜ "2025-07-01"

    }
  } else {
    // Fallback for purely numeric dates like 01/07/2025
    const parts = dateStr.split(/[\/\-]/)
    if (parts.length === 3) {
      const [day, month, year] = parts.map(Number)
      const fullYear = year < 100 ? 2000 + year : year
      const date = new Date(Date.UTC(fullYear, month - 1, day))
      if (!isNaN(date.getTime())) {
        result.expiryDate =result.expiryDate = date.toISOString().split("T")[0]  // ➜ "2025-07-01"

      }
    }
  }
}

// 👇 truck Number
// Step 1: Clean and normalize OCR text
let cleanedText = text.replace(/[\n\r]+/g, " ").replace(/\s+/g, " ").toUpperCase()

// Step 2: Match REGISTRATION NUMBER format strictly with potential OCR noise
const rawMatch = cleanedText.match(
  /([A-Z]{2})[\s\-]*([0-9]{2})[\s\-]*([A-Z]{2})[\s\-]*([A-Z0-9]{4})/
)

if (rawMatch) {
  let [_, state, district, series, numberRaw] = rawMatch

  // Step 3: Apply OCR fixes only to the numeric part (last 4)
  const fixNumber = (numStr: string) =>
    numStr
      .replace(/S/g, "5")
      .replace(/O/g, "0")
      .replace(/I/g, "1")
      .replace(/L/g, "1")
      .replace(/Z/g, "2")
      .replace(/B/g, "8")

  const fixedNumber = fixNumber(numberRaw)

  // Step 4: Assemble truck ID
  result.truckId = `${state}${district}${series}${fixedNumber}`
  console.log("Extracted Truck ID:", result.truckId)
}





    return result
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
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
        const imageText = await Tesseract.recognize(data.secure_url, "eng")
        const extracted = extractDataFromText(imageText.data.text)

        // setFormData(prev => ({
        //   ...prev,
        //   viewUrl: data.secure_url,
        //   downloadUrl: data.secure_url,
        //   ...extracted,
        // }))

        // Try to find a matching truck from list
const matchedTruck = trucks.find(
  t => t.registrationNumber === extracted.truckId
)
console.log("Matched Truck:", matchedTruck,trucks)

// If match found, prefill it in formData
setFormData(prev => ({
  ...prev,
  viewUrl: data.secure_url,
  downloadUrl: data.secure_url,
  ...extracted,
  truckId: matchedTruck?.registrationNumber || "", // ✅ auto-select if found
}))
        console.log("Extracted data:", extracted)
      }
    } catch (err) {
      console.error("Cloudinary upload failed:", err)
      setError("Upload failed.")
    } finally {
      setUploading(false)
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
      setFormData({
        name: "",
        truckId: "",
        viewUrl: "",
        downloadUrl: "",
        type: "",
        expiryDate: "",
        notes: "",
        version: 1,
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
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-[90%] max-w-md">
        <h2 className="text-lg font-semibold mb-4">Upload Document</h2>

        {error && <p className="text-red-500 mb-2">{error}</p>}

        <input
          type="file"
          accept="application/pdf,image/*"
          onChange={handleFileUpload}
          className="w-full mb-3"
        />

        {uploading && <p className="text-sm text-blue-600 mb-2">Uploading file and extracting info...</p>}

        <input
          type="text"
          placeholder="Document Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full border border-gray-300 rounded-md mb-3 p-2"
        />

        <select
          value={formData.truckId}
          onChange={(e) => setFormData({ ...formData, truckId: e.target.value })}
          className="w-full border border-gray-300 rounded-md mb-3 p-2"
        >
          <option value="">Select Truck</option>
          {trucks.map((truck) => (
            <option key={truck.id} value={truck.registrationNumber}>
              {truck.registrationNumber}
            </option>
          ))}
        </select>

    




        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full border border-gray-300 rounded-md mb-3 p-2"
        >
          <option value="">Select Type</option>
          <option value="Insurance">Insurance</option>
          <option value="RC">RC</option>
          <option value="Permit">Permit</option>
          <option value="Fitness">Fitness</option>
          <option value="Pollution">Pollution</option>
          <option value="Other">Other</option>
        </select>

        <input
          type="date"
          value={formData.expiryDate}
          onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
          className="w-full border border-gray-300 rounded-md mb-3 p-2"
        />

        <textarea
          placeholder="Notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full border border-gray-300 rounded-md mb-3 p-2"
        />

        <input
          type="number"
          placeholder="Version"
          value={formData.version}
          onChange={(e) => setFormData({ ...formData, version: parseInt(e.target.value) })}
          className="w-full border border-gray-300 rounded-md mb-4 p-2"
        />

        <input
          type="text"
          placeholder="View URL"
          value={formData.viewUrl}
          disabled
          className="w-full border border-gray-200 rounded-md mb-3 p-2 bg-gray-100 text-gray-600"
        />

        <input
          type="text"
          placeholder="Download URL"
          value={formData.downloadUrl}
          disabled
          className="w-full border border-gray-200 rounded-md mb-4 p-2 bg-gray-100 text-gray-600"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || uploading}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  )
} 
