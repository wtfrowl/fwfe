/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect, useCallback } from "react"
import Cookies from "js-cookie"
import axios from "axios"
import { Sidebar } from "./components/Sidebar"
import { ProfileForm } from "./components/ProfileForm"
import { PasswordForm } from "./components/PasswordForm"

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

export default function ProfileSettings() {
  const [activeTab, setActiveTab] = useState("profile")
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getToken = useCallback(() => {
    const token = Cookies.get("ownerToken")
    return token ? JSON.parse(token).accessToken : ""
  }, [])

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/owner/my-profile`, {
          headers: {
            "Content-Type": "application/json",
            authorization: getToken(),
          },
        })
        setProfileData(response.data)
      } catch (err) {
        console.error("Error fetching profile data:", err)
        setError("Failed to load profile data. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfileData()
  }, []) // Added getToken to dependencies

  const handleProfileUpdate = async (data: ProfileData) => {
    const toBeSentData= {
      firstName: data.firstName,
      lastName: data.lastName,
      age: data.age,
      street: data.street,
      city: data.city,
      state: data.state
    }
    try {
      const response = await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/api/owner/my-profile`,toBeSentData, {
        headers: {
          "Content-Type": "application/json",
          authorization: getToken(),
        },
      })
      setProfileData(response.data)
      alert("Profile updated successfully")
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Failed to update profile")
    }
  }

  const handlePasswordUpdate = async (data: { currentPassword: string; newPassword: string }) => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/api/owner/change-password`, data, {
        headers: {
          "Content-Type": "application/json",
          authorization: getToken(),
        },
      })
      alert("Password updated successfully")
    } catch (error) {
      console.error("Error updating password:", error)
      alert("Failed to update password")
    }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
    <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
    <div className="flex-1 p-4 md:p-8">
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 w-full max-w-3xl mx-auto">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-500">Loading...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : (
          <>
            {activeTab === "profile" && profileData && (
              <ProfileForm initialData={profileData} onSubmit={handleProfileUpdate} />
            )}
            {activeTab === "password" && <PasswordForm onSubmit={handlePasswordUpdate} />}
            {(activeTab === "notifications" || activeTab === "verification") && (
              <div className="text-center text-gray-500 py-8">This section is under development</div>
            )}
          </>
        )}
      </div>
    </div>
  </div>
  )
}

