import { createContext, useContext } from "react";
import type { ConnectionState } from "../utils/socket";

/**
 * Kept out of the provider module so that file exports only a component and
 * stays eligible for Fast Refresh.
 */
export interface RealtimeValue {
  connection: ConnectionState;
}

export const RealtimeContext = createContext<RealtimeValue>({ connection: "idle" });

export const useRealtime = () => useContext(RealtimeContext);
