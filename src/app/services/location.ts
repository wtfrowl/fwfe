export const getCurrentLocation = async (): Promise<{
  latitude: number;
  longitude: number;
  location: [];

}> => {
  if (!navigator.geolocation) {
    throw new Error("Geolocation is not supported by your browser.");
  }

  try {
    // Optional: Check permission state
    if (navigator.permissions) {
      const permissionStatus = await navigator.permissions.query({
        name: "geolocation" as PermissionName,
      });

      if (permissionStatus.state === "denied") {
        throw new Error(
          "Location access is blocked. Please enable it in your browser settings."
        );
      }
    }

    // Step 1: Get coordinates (triggers popup if not previously granted)
    const { latitude, longitude } = await new Promise<{
      latitude: number;
      longitude: number;
    }>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve({ latitude, longitude });
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(
                new Error("Permission denied. Please allow location access.")
              );
              break;
            case error.POSITION_UNAVAILABLE:
              reject(
                new Error("Location unavailable. Please try again outdoors.")
              );
              break;
            case error.TIMEOUT:
              reject(new Error("Location request timed out."));
              break;
            default:
              reject(new Error("Unknown location error occurred."));
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 1,
        }
      );
    });

    // Step 2: Call reverse geocode API
    const response = await fetch(
      `https://api-bdc.io/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch reverse geocoding info.");
    }

    const location = await response.json();

    return { latitude, longitude, location };
  } catch (err) {
    throw err instanceof Error ? err : new Error("Unexpected geolocation error.");
  }
};
