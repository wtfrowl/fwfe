import { useEffect, useState } from "react"
import { Truck } from "../types/docs"
import { api } from "../services/api"

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
  const [truckId, setTruckId] = useState("")
  const [name, setName] = useState("")
  const [viewUrl, setViewUrl] = useState("")
  const [downloadUrl, setDownloadUrl] = useState("")
  const [type, setType] = useState("")
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", "testing") // your unsigned preset
    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/dewedem6y/auto/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (data.secure_url) {
        setViewUrl(data.secure_url)
        setDownloadUrl(data.secure_url)
      }
    } catch (err) {
      console.error("Cloudinary upload failed:", err)
      setError("Upload failed.")
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!name || !truckId || !viewUrl || !downloadUrl || !type) {
      alert("Please fill in all fields.")
      return
    }

    try {
      setLoading(true)
      await api.documents.addDoc({
        name,
        truckId,
        viewUrl,
        downloadUrl,
        type,
      })
      onClose()
      onUpload()
      setName("")
      setTruckId("")
      setViewUrl("")
      setDownloadUrl("")
      setType("")
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
        <h2 className="text-lg font-semibold mb-4">Add Document</h2>

        {error && <p className="text-red-500 mb-2">{error}</p>}

        <input
          type="text"
          placeholder="Document Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-md mb-3 p-2"
        />

        <select
          value={truckId}
          onChange={(e) => setTruckId(e.target.value)}
          className="w-full border border-gray-300 rounded-md mb-3 p-2"
        >
          <option value="">Select Truck</option>
          {trucks.map((truck) => (
            <option key={truck.id} value={truck.id}>
              {truck.registrationNumber}
            </option>
          ))}
        </select>

        <input
          type="file"
          accept="application/pdf,image/*"
          onChange={handleFileUpload}
          className="w-full mb-3"
        />

        {uploading && <p className="text-sm text-blue-600 mb-2">Uploading file...</p>}

        <input
          type="text"
          placeholder="View URL"
          value={viewUrl}
          disabled
          className="w-full border border-gray-300 rounded-md mb-3 p-2 bg-gray-100 text-gray-700"
        />

        <input
          type="text"
          placeholder="Download URL"
          value={downloadUrl}
          disabled
          className="w-full border border-gray-300 rounded-md mb-3 p-2 bg-gray-100 text-gray-700"
        />

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full border border-gray-300 rounded-md mb-4 p-2"
        >
          <option value="">Select Type</option>
          <option value="Insurance">Insurance</option>
          <option value="RC">RC</option>
          <option value="Permit">Permit</option>
          <option value="Fitness">Fitness</option>
          <option value="Pollution">Pollution</option>
          <option value="Other">Other</option>
        </select>

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
