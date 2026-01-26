/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useContext } from "react";
import { Sidebar } from "./components/Sidebar";
import { ProfileForm } from "./components/ProfileForm";
import { PasswordForm } from "./components/PasswordForm";
import { useDriverTracking } from "../../utils/location";
import { changePassword, getDriverProfile, getOwnerProfile, updateProfile } from "../../api";
import { AuthContext } from "../../context/AuthContext";

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



export default function ProfileSettings() {
  const { isTracking, startTracking, stopTracking} = useDriverTracking();
  const [activeTab, setActiveTab] = useState("profile");
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
   const { user,role }:any = useContext(AuthContext);
useEffect(() => {
  const fetchProfileData = async () => {
    setIsLoading(true);
    setError(null);

    // WAIT for auth to restore after refresh
    if (!user || !role) {
      setIsLoading(false);
      return;
    }

    try {
      let response: any = {};
      if (role === "driver") {
        response = await getDriverProfile();
      } else {
        response = await getOwnerProfile();
      }

      setProfileData(response);
    } catch (err) {
      console.error("Error fetching profile data:", err);
      setError("Failed to load profile data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  fetchProfileData();
}, [user, role]);


  const handleProfileUpdate = async (data: ProfileData) => {
    const toBeSentData = {
      firstName: data.firstName,
      lastName: data.lastName,
      age: data.age,
      street: data.street,
      city: data.city,
      state: data.state,
    };

    try {
      const response:any= await updateProfile(role, toBeSentData);
      setProfileData(response);
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
  
    try {
     

      await changePassword(role, data);
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
