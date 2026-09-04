import { io, Socket } from "socket.io-client";
import { getStoredSession } from "./auth";

/**
 * The app's single socket.
 *
 * Two things the previous version got wrong:
 *
 * 1. It sent no credentials, and the server let any client join any room by
 *    name. Rooms are now derived server-side from this token, so the client
 *    cannot ask to listen to someone else's fleet.
 *
 * 2. Room membership was joined once, by the component, on mount. Socket.IO
 *    rooms do not survive a reconnect — so after any network blip the socket
 *    silently reconnected into no rooms at all and notifications stopped
 *    until a full page reload, with nothing on screen to say so. The server
 *    now joins on every connection, and this module reports the connection
 *    state so the UI can be honest about it.
 */

const URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export type ConnectionState = "idle" | "connecting" | "connected" | "reconnecting" | "error";

export const socket: Socket = io(URL, {
  autoConnect: false,
  withCredentials: true,
  /* Websocket first, but polling stays available: forcing websocket-only
     means a restrictive network gets no realtime at all and no diagnostic. */
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  reconnectionDelayMax: 10_000,
  /* The token is read fresh on every attempt rather than captured once, so a
     reconnect after a token refresh uses the new one. */
  auth: (cb) => cb({ token: getStoredSession().token ?? "" }),
});

let state: ConnectionState = "idle";
const listeners = new Set<(state: ConnectionState, detail?: string) => void>();

const setState = (next: ConnectionState, detail?: string) => {
  state = next;
  listeners.forEach((l) => l(next, detail));
};

export const getConnectionState = () => state;

export const onConnectionState = (listener: (s: ConnectionState, detail?: string) => void) => {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
};

socket.on("connect", () => setState("connected"));
socket.io.on("reconnect_attempt", () => setState("reconnecting"));
socket.io.on("error", () => setState("error"));

socket.on("disconnect", (reason) => {
  /* An explicit server-side or client-side disconnect is not a fault state;
     showing "reconnecting" for a deliberate logout would be a lie. */
  if (reason === "io client disconnect" || reason === "io server disconnect") {
    setState("idle", reason);
  } else {
    setState("reconnecting", reason);
  }
});

socket.on("connect_error", (err) => {
  /* An auth rejection will never succeed on retry with the same token, so
     stop hammering the server and surface it instead. */
  if (err.message?.startsWith("UNAUTHORIZED")) {
    socket.disconnect();
    setState("error", err.message);
    return;
  }
  setState("reconnecting", err.message);
});

/** Connect if we have a session. Safe to call repeatedly. */
export const connectSocket = () => {
  if (!getStoredSession().token) return;
  if (socket.connected || socket.active) return;
  setState("connecting");
  socket.connect();
};

/**
 * Tear down on logout.
 *
 * The old version called `socket.off()` with no arguments, which removes
 * *every* listener on the socket — including ones belonging to components
 * that were still mounted. Only the lifecycle handlers registered here are
 * kept; feature listeners clean up their own.
 */
export const cleanupSocketOnLogout = () => {
  socket.disconnect();
  setState("idle");
};
