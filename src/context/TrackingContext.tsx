import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

// --- Configuration ---
const LOCATION_API_ENDPOINT = `${import.meta.env.VITE_API_BASE_URL}/api/driver/updateLocation`;

// --- Helpers ---
const getDistanceFromLatLonInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; 
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getAuthDetails = (): { token: string; role: "owner" | "driver" | null } => {
  if (typeof window === 'undefined') return { token: "", role: null };
  const ownerToken = localStorage.getItem("ownerToken");
  if (ownerToken) return { token: JSON.parse(ownerToken).accessToken, role: "owner" };
  const driverToken = localStorage.getItem("driverToken");
  if (driverToken) return { token: JSON.parse(driverToken).accessToken, role: "driver" };
  return { token: "", role: null };
};

// --- Context Definition ---
interface TrackingContextType {
  isTracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;
  error: string | null;
}

const TrackingContext = createContext<TrackingContextType | undefined>(undefined);

// --- Provider Component ---
export const TrackingProvider = ({ children }: { children: React.ReactNode }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const watchIdRef = useRef<number | null>(null);
  const isHighAccuracyRef = useRef(true);
  const restartWatcherRef = useRef<() => void>(() => {}); 
  const lastSentRef = useRef<{ lat: number | null; lng: number | null; time: number }>({ 
    lat: null, lng: null, time: 0 
  });

  // =========================================================
  // 1. DEFINE stopTracking FIRST (Fixes Initialization Error)
  // =========================================================
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    console.log("🔴 Tracking Stopped");
    setIsTracking(false);
  }, []);

  // =========================================================
  // 2. handlePositionUpdate
  // =========================================================
  const handlePositionUpdate = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude } = position.coords;
    const now = Date.now();
    const last = lastSentRef.current;

    if (last.time !== 0 && now - last.time < 5000) return; // 5s throttle

    if (last.lat !== null && last.lng !== null) {
        const distance = getDistanceFromLatLonInMeters(last.lat, last.lng, latitude, longitude);
        if (distance < 20) return; // 20m filter
    }

    const { token } = getAuthDetails();
    if (!token) return;

    lastSentRef.current = { lat: latitude, lng: longitude, time: now };
    setError(null);
    console.log(`🚀 API HIT | Loc: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);

    fetch(LOCATION_API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': token },
      body: JSON.stringify({ latitude, longitude, timestamp: new Date(now).toISOString() })
    }).catch(err => console.error("API Error:", err));

  }, []);

  // =========================================================
  // 3. handlePositionError (Now safe to call stopTracking)
  // =========================================================
  const handlePositionError = useCallback(async (err: GeolocationPositionError) => {
    console.warn(`Geolocation Error Code ${err.code}: ${err.message}`);

    // TIMEOUT Handling with Permission Check
    if (err.code === 3 && isHighAccuracyRef.current) {
      console.log("⚠️ GPS Timeout. Checking permissions for retry...");

      try {
        // @ts-ignore
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
        
        if (permissionStatus.state === 'granted') {
           isHighAccuracyRef.current = false; 
           restartWatcherRef.current(); // Safe Retry
        } else {
           setError("GPS Timed out. Please click Start again.");
           stopTracking(); // Stop safely
        }
      } catch (e) {
        // Fallback for browsers that don't support permissions API
        setError("GPS Timed out. Please click Start again.");
        stopTracking();
      }
      return; 
    }

    if (err.code === 1) {
        setError("Permission denied.");
        stopTracking();
        return;
    }
    setError(err.message);
  }, [stopTracking]); 

  // =========================================================
  // 4. Watcher Process
  // =========================================================
  const startWatcherProcess = useCallback(() => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);

    const options = {
      enableHighAccuracy: isHighAccuracyRef.current,
      timeout: isHighAccuracyRef.current ? 30000 : 40000, 
      maximumAge: 10000 
    };

    console.log(`👁️ Watcher Started (High Acc: ${isHighAccuracyRef.current})`);
    
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handlePositionError,
      options
    );
  }, [handlePositionUpdate, handlePositionError]);

  // Connect Ref (Fixes Cycle)
  useEffect(() => {
    restartWatcherRef.current = startWatcherProcess;
  }, [startWatcherProcess]);

  // =========================================================
  // 5. startTracking
  // =========================================================
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) return setError("Not supported");
    if (watchIdRef.current !== null) return; 

    console.log("🟢 Initializing Tracking...");
    setError(null);
    setIsTracking(true);
    isHighAccuracyRef.current = true; 
    lastSentRef.current = { lat: null, lng: null, time: 0 };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("✅ First Fix Received");
        handlePositionUpdate(position); 
        startWatcherProcess(); 
      },
      (err) => {
        handlePositionError(err);
        setIsTracking(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }, [handlePositionUpdate, startWatcherProcess, handlePositionError]);

  return (
    <TrackingContext.Provider value={{ isTracking, startTracking, stopTracking, error }}>
      {children}
    </TrackingContext.Provider>
  );
};

export const useTracking = () => {
  const context = useContext(TrackingContext);
  if (!context) throw new Error("useTracking must be used within a TrackingProvider");
  return context;
};