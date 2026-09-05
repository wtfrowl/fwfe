import React, { createContext, useContext } from "react";
import { useDriverTracking } from "../utils/location";

/**
 * Driver tracking, shared across the app.
 *
 * This file used to hold a second, independent implementation of the tracking
 * loop — its own throttle, its own distance filter, its own `fetch`, its own
 * accuracy fallback — alongside the one in `utils/location.ts`. Both were
 * live, the two disagreed about the thresholds, and only one of them was
 * actually mounted, so fixing a bug in tracking meant finding out which.
 *
 * There is now one implementation. This is the provider around it, so the
 * watcher is started once for the session rather than once per component that
 * happens to want the status.
 */

interface TrackingContextType {
  isTracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;
  error: string | null;
  /** Fixes collected but not yet accepted by the server. */
  pending: number;
}

const TrackingContext = createContext<TrackingContextType | undefined>(undefined);

export const TrackingProvider = ({ children }: { children: React.ReactNode }) => {
  const tracking = useDriverTracking();

  return (
    <TrackingContext.Provider value={tracking}>{children}</TrackingContext.Provider>
  );
};

export const useTracking = () => {
  const context = useContext(TrackingContext);
  if (!context) throw new Error("useTracking must be used within a TrackingProvider");
  return context;
};
