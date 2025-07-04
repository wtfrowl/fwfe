import { useState, useEffect } from "react"
import { FiCamera, FiTrash2, FiSave } from "react-icons/fi"

interface ProfileData {
  _id?: string
  firstName: string
  lastName: string
  age: number
  contactNumber: string
  street: string
  city: string
  state: string
  role?: string
  totalTrucks?: number
}

interface ProfileFormProps {
  initialData: ProfileData | null
  onSubmit: (data: ProfileData) => Promise<void>
}

export function ProfileForm({ initialData, onSubmit }: ProfileFormProps) {
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    age: 0,
    contactNumber: "",
    street: "",
    city: "",
    state: "",
  })

  useEffect(() => {
    if (initialData) {
      setProfileData(initialData)
    }
  }, [initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.name === "age" ? Number.parseInt(e.target.value) : e.target.value
    setProfileData({ ...profileData, [e.target.name]: value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(profileData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
        <div className="relative">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-FKLZQgI28uCjqaBW8AAzuP903CyhrA.png"
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover"
          />
          <button type="button" className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white">
            <FiCamera size={16} />
          </button>
        </div>
        <div className="flex space-x-3">
          <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Upload New
          </button>
          <button type="button" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center space-x-2">
            <FiTrash2 />
            <span>Delete avatar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            id="firstName"
            type="text"
            name="firstName"
            value={profileData.firstName}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            id="lastName"
            type="text"
            name="lastName"
            value={profileData.lastName}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
            Age
          </label>
          <input
            id="age"
            type="number"
            name="age"
            value={profileData.age}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg"
          />
        </div>
        <div>
          <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Contact Number <span className="text-red-500">*</span>
          </label>
          <input
            id="contactNumber"
            type="tel"
            name="contactNumber"
            value={profileData.contactNumber}
            disabled
            className="w-full p-2 border rounded-lg"
           
          />
        </div>
      </div>

      <div>
        <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
          Street Address
        </label>
        <input
          id="street"
          type="text"
          name="street"
          value={profileData.street}
          onChange={handleChange}
          className="w-full p-2 border rounded-lg"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <input
            id="city"
            type="text"
            name="city"
            value={profileData.city}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg"
          />
        </div>
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
            State
          </label>
          <input
            id="state"
            type="text"
            name="state"
            value={profileData.state}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
      >
        <FiSave />
        Save Changes
      </button>
    </form>
  )
}

