/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Sidebar } from "./components/Sidebar";
import { ProfileForm } from "./components/ProfileForm";
import { PasswordForm } from "./components/PasswordForm";
import { useDriverTracking } from "../../utils/location";

interface ProfileData {
  _id?: string;
  firstName: string;
  lastName: string;
  age: number;
  contactNumber: string;
  street: string;
  city: string;
  state: string;
  role?: string;
  totalTrucks?: number;
}

// Utility to get token + role
const getAuthDetails = (): { token: string; role: "owner" | "driver" | null } => {
  const ownerToken = localStorage.getItem("ownerToken");
  if (ownerToken) {
    const parsed = JSON.parse(ownerToken);
    return { token: parsed.accessToken, role: "owner" };
  }

  const driverToken = localStorage.getItem("driverToken");
  if (driverToken) {
    const parsed = JSON.parse(driverToken);
    return { token: parsed.accessToken, role: "driver" };
  }

  return { token: "", role: null };
};

export default function ProfileSettings() {
  const { isTracking, startTracking, stopTracking, error: trackingError } = useDriverTracking();
  const [activeTab, setActiveTab] = useState("profile");
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<"owner" | "driver" | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      setError(null);

      const { token, role } = getAuthDetails();
      setRole(role); // set role state here

      if (!token || !role) {
        setError("No valid session found. Please login again.");
        setIsLoading(false);
        return;
      }

      try {
        const endpoint =
          role === "driver"
            ? "/api/driver/my-profile"
            : "/api/owner/my-profile";

        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}${endpoint}`,
          {
            headers: {
              "Content-Type": "application/json",
              authorization: token,
            },
          }
        );
        setProfileData(response.data);
      } catch (err) {
        console.error("Error fetching profile data:", err);
        setError("Failed to load profile data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleProfileUpdate = async (data: ProfileData) => {
    const { token, role } = getAuthDetails();
    if (!token || !role) return;

    const toBeSentData = {
      firstName: data.firstName,
      lastName: data.lastName,
      age: data.age,
      street: data.street,
      city: data.city,
      state: data.state,
    };

    try {
      const endpoint =
        role === "driver"
          ? "/api/driver/my-profile"
          : "/api/owner/my-profile";

      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}${endpoint}`,
        toBeSentData,
        {
          headers: {
            "Content-Type": "application/json",
            authorization: token,
          },
        }
      );
      setProfileData(response.data);
      alert("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    }
  };

  const handlePasswordUpdate = async (data: {
    currentPassword: string;
    newPassword: string;
  }) => {
    const { token, role } = getAuthDetails();
    if (!token || !role) return;

    try {
      const endpoint =
        role === "driver"
          ? "/api/driver/change-password"
          : "/api/owner/change-password";

      await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}${endpoint}`,
        data,
        {
          headers: {
            "Content-Type": "application/json",
            authorization: token,
          },
        }
      );
      alert("Password updated successfully");
    } catch (error) {
      console.error("Error updating password:", error);
      alert("Failed to update password");
    }
  };

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
              {activeTab === "profile" && role && profileData && (
                <ProfileForm
                  initialData={profileData}
                  onSubmit={handleProfileUpdate}
                />
              )}
              {activeTab === "password" && (
                <PasswordForm onSubmit={handlePasswordUpdate} />
              )}
              {(activeTab === "notifications" ||
                activeTab === "verification") && (
                <div className="text-center text-gray-500 py-8">
                <div>
      <h2>Driver Status</h2>
      <p>Tracking: {isTracking ? <strong>ON AIR</strong> : <strong>OFF DUTY</strong>}</p>
      
      {/* Button to start tracking (e.g., "Go Online") */}
      <button 
        onClick={startTracking} 
        disabled={isTracking}
        style={{ marginRight: '10px', backgroundColor: '#4CAF50', color: 'white' }}
      >
        Start Shift (Start Tracking)
      </button>
      
      {/* Button to stop tracking (e.g., "Go Offline") */}
      <button 
        onClick={stopTracking} 
        disabled={!isTracking}
        style={{ backgroundColor: '#f44336', color: 'white' }}
      >
        End Shift (Stop Tracking)
      </button>

      {/* Display any errors */}
      {error && (
        <p style={{ color: 'red', marginTop: '15px' }}>
          <strong>Error:</strong> {error}
        </p>
      )}
    </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
