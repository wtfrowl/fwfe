import { io } from "socket.io-client";

const URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000"; // your backend socket URL
export const socket = io(URL, {
  withCredentials: true,
  transports: ["websocket"],
    autoConnect: false, // Important for explicit control
});
// utils/socket.ts (or in AuthContext)
export const cleanupSocketOnLogout = () => {
  console.log("🔌 Disconnecting socket and cleaning listeners (on logout)");

  socket.off(); // remove all listeners
  socket.disconnect();
};
