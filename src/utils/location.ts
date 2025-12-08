import { useState, useRef, useCallback } from 'react';

// The API endpoint on your backend
const LOCATION_API_ENDPOINT =`${import.meta.env.VITE_API_BASE_URL}/api/driver/updateLocation`; // Make sure this path is correct

/**
 * A custom React hook to manage driver location tracking.
 */
export const useDriverTracking = () => {
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
      const { token } = getAuthDetails();
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState(null);
  
  // Use useRef to hold the watchId. This prevents re-renders when it changes.
  const watchIdRef = useRef<number | null>(null);

  /**
   * Success callback for watchPosition.
   * Called every time the browser detects a location change.
   */
  const handlePositionUpdate = (position:any) => {
    const { latitude, longitude } = position.coords;
    const timestamp = new Date(position.timestamp);

    console.log('New position found:', { latitude, longitude });

    // Send this data to your backend
    fetch(LOCATION_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // You MUST include your auth token here
        'Authorization': `${token}`
      },
      body: JSON.stringify({
        latitude,
        longitude,
        timestamp: timestamp.toISOString()
      })
    })
    .catch(err => {
      // Handle network errors (e.g., driver goes offline)
      console.error('Failed to send location to server:', err);
      // setError('Network error: Failed to send location.');
    });
  };

  /**
   * Error callback for watchPosition.
   * Called when the browser fails to get a location.
   */
  const handlePositionError = (error:any) => {
    setError(error.message);
    console.error('Geolocation error:', error.message);
    
    // If permission is permanently denied, stop trying.
    if (error.code === error.PERMISSION_DENIED) {
      stopTracking();
    }
  };

  /**
   * Starts watching the driver's location.
   */
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      // setError('Geolocation is not supported by this browser.');
      return;
    }
    
    // Don't start if already tracking
    if (watchIdRef.current !== null) {
      console.log('Already tracking.');
      return;
    }

    console.log('Starting location tracking...');
    setError(null);

    // Geolocation options for high accuracy (best for drivers)
    const options = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds to get a fix
      maximumAge: 0     // Don't use a cached position
    };

    // Start watching and save the ID
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handlePositionError,
      options
    );
    setIsTracking(true);
  }, []); // useCallback ensures this function is stable

  /**
   * Stops watching the driver's location.
   */
  const stopTracking = useCallback(() => {
    if (watchIdRef.current === null) {
      return; // Already stopped
    }

    console.log('Stopping location tracking...');
    navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    setIsTracking(false);
  }, []); // useCallback ensures this function is stable

  // Return the state and controls for your component to use
  return { isTracking, startTracking, stopTracking, error };
};