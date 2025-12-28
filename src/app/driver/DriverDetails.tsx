"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import DriverRouteMap from './components/DriverRouteMap';
import { 
  FaArrowLeft, 
  FaUser, 
  FaPhone, 
  FaIdCard, 
  FaMapMarkerAlt, 
  FaClock, 
  FaRoute,
  FaStar
} from "react-icons/fa";

// --- Interfaces ---
interface GeoPoint {
  type: "Point";
  coordinates: number[]; // [Longitude, Latitude]
}

interface Driver {
  _id: string;
  firstName: string;
  lastName: string;
  age: number;
  contactNumber: string;
  aadharNumber: string;
  license: string;
  totalTrips: number;
  availability: boolean;
  street: string;
  city: string;
  state: string;
  currentLocation?: GeoPoint;
  lastLocationUpdate?: string;
}

interface LocationHistoryItem {
  location: GeoPoint;
  recordedAt: string;
}

interface DriverDetailResponse {
  driver: Driver;
  // ✅ 1. Add this back so we can read it from the API response
  locationHistory: LocationHistoryItem[]; 
}

const DriverDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // const { role } = useContext(AuthContext);

  const [driver, setDriver] = useState<Driver | null>(null);
  
  // ✅ Initialize as empty array to prevent "not iterable" error on first render
  const [history, setHistory] = useState<LocationHistoryItem[]>([]); 
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDriverDetails = async () => {
      try {
        setLoading(true);
        const tokenStr = localStorage.getItem("ownerToken") || localStorage.getItem("driverToken");
        const token = tokenStr ? JSON.parse(tokenStr).accessToken : "";

        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/driver/${id}`, {
          headers: { 
            "Content-Type": "application/json",
            Authorization: token 
          }
        });

        const data: DriverDetailResponse = response.data;
        
        setDriver(data.driver);
        
        // ✅ 2. Set the history state (with a safety fallback)
        // If data.locationHistory is undefined, fallback to []
        setHistory(data.locationHistory || []);
        
      } catch (err) {
        console.error("Error fetching driver details:", err);
        setError("Failed to load driver information.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDriverDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !driver) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-red-500">
        <p className="text-lg font-semibold">{error || "Driver not found"}</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline">Go Back</button>
      </div>
    );
  }

  // Helper to format dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-IN", {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      
      {/* --- Header --- */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)} 
                className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
              >
                <FaArrowLeft />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {driver.firstName} {driver.lastName}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">Driver ID: {driver._id}</p>
              </div>
            </div>
            
            {/* Status Badge */}
            <span className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold border ${
              driver.availability 
                ? "bg-green-50 text-green-700 border-green-200" 
                : "bg-red-50 text-red-700 border-red-200"
            }`}>
              {driver.availability ? "Available" : "On Trip / Busy"}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* --- Info Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Personal Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between h-full">
            <div>
              <h2 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                <FaUser /> Personal Details
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-500 text-sm">Age</span>
                  <span className="font-medium text-gray-900">{driver.age} Years</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-500 text-sm flex items-center gap-2"><FaPhone size={12}/> Contact</span>
                  <span className="font-medium text-gray-900">{driver.contactNumber}</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-500 text-sm flex items-center gap-2"><FaIdCard size={12}/> License</span>
                  <span className="font-medium text-gray-900 truncate max-w-[150px]">{driver.license}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-2 border-t border-gray-50">
                <span className="text-gray-500 text-xs block mb-1">Address</span>
                <span className="text-gray-800 text-sm block leading-snug">
                  {driver.street}, {driver.city}, {driver.state}
                </span>
            </div>
          </div>

          {/* Card 2: Performance Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-full">
            <h2 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <FaRoute /> Performance
            </h2>
            <div className="grid grid-cols-2 gap-4 h-full content-center pb-6">
              <div className="bg-blue-50 p-4 rounded-lg flex flex-col items-center justify-center text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600">{driver.totalTrips}</div>
                <div className="text-xs text-blue-600 font-medium uppercase mt-1">Total Trips</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg flex flex-col items-center justify-center text-center">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600 flex items-center gap-1">
                  4.5 <FaStar size={18} />
                </div>
                <div className="text-xs text-purple-600 font-medium uppercase mt-1">Rating</div>
              </div>
            </div>
          </div>

          {/* Card 3: Live Location Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500 opacity-10 rounded-bl-full -mr-4 -mt-4"></div>
            <h2 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <FaMapMarkerAlt /> Live Location
            </h2>
            
            {driver.currentLocation ? (
              <div className="flex flex-col justify-between h-3/4">
                <div className="mt-2">
                  <p className="text-2xl sm:text-3xl font-light text-gray-800 break-words">
                    {driver.currentLocation.coordinates[1].toFixed(4)}, 
                  </p>
                  <p className="text-2xl sm:text-3xl font-light text-gray-800 break-words">
                    {driver.currentLocation.coordinates[0].toFixed(4)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Latitude, Longitude</p>
                </div>
                
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 bg-gray-50 p-3 rounded-lg mt-4">
                  <FaClock className="text-blue-500 flex-shrink-0" />
                  <span>Last Updated: <strong>{formatDate(driver.lastLocationUpdate)}</strong></span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <FaMapMarkerAlt size={32} className="mb-2 opacity-50"/>
                <p>Location unknown</p>
              </div>
            )}
          </div>
        </div>

        {/* --- Full Width Map Section --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative w-full h-[300px] md:h-[500px]">
          
          {/* ✅ 3. Pass the fetched history to the map */}
          {driver.currentLocation ? (
            <DriverRouteMap 
              history={history} 
              currentLocation={driver.currentLocation} 
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-100 text-gray-400">
              <FaMapMarkerAlt size={32} className="mb-2 opacity-50"/>
              <p>Location data not available</p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default DriverDetailsPage;