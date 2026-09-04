import { useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import {
  socket,
  connectSocket,
  onConnectionState,
  type ConnectionState,
} from "../utils/socket";
import { useNotificationStore } from "../store/notifications/store";
import { useEventStore } from "../store/trips/store";
import { toast } from "../store/notifications/toastStore";
import type { AppNotification } from "../api/notifications.api";

/**
 * The one place socket events are turned into application state.
 *
 * Before this, `NotificationBell` owned the socket: it registered four
 * listeners, held the list in component state, and joined its own room. That
 * meant realtime only worked while the bell happened to be mounted, the list
 * died on unmount, and cleanup called `socket.off()` — removing every
 * listener in the app, not just its own.
 *
 * Now the socket is wired once here, at the top of the authenticated tree,
 * and components read from stores.
 */

import { RealtimeContext } from "./realtime";

/** Which stale queries a given notification type should invalidate. */
const REFRESH_BY_TYPE: Record<string, "trip" | "expense" | "document" | undefined> = {
  "trip.created": "trip",
  "trip.status_updated": "trip",
  "trip.deleted": "trip",
  "expense.created": "expense",
  "expense.approved": "expense",
  "expense.rejected": "expense",
  "document.expiring": "document",
  "document.expired": "document",
};

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { isAuthenticated, role, user } = useContext(AuthContext);
  const [connection, setConnection] = useState<ConnectionState>("idle");

  useEffect(() => {
    const unsubscribe = onConnectionState(setConnection);
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      useNotificationStore.getState().reset();
      return;
    }

    const store = useNotificationStore.getState();
    const events = useEventStore.getState();

    // The list is authoritative from the API; the socket only adds to it.
    void store.hydrate();
    connectSocket();

    const basePath = role === "owner" ? "/owner-home" : "/driver-home";

    const linkFor = (n: AppNotification) => {
      if (!n.entity?.id) return undefined;
      switch (n.entity.kind) {
        case "trip":
          return `${basePath}/trips/${n.entity.id}`;
        case "document":
          return `${basePath}/mydocs/documents/${n.entity.id}`;
        case "tyre":
          return `${basePath}/tyre/${n.entity.id}`;
        default:
          return undefined;
      }
    };

    const handleNew = (n: AppNotification) => {
      useNotificationStore.getState().receive(n);

      /* Invalidate whatever list this makes stale, so the page the user is
         already looking at updates instead of showing yesterday's data. */
      const refresh = REFRESH_BY_TYPE[n.type];
      if (refresh === "trip") events.triggerTripRefresh();
      if (refresh === "expense") events.triggerExpenseRefresh();
      if (refresh === "document") events.triggerDocumentRefresh();

      const link = linkFor(n);
      const open = link ? () => navigate(link) : undefined;
      toast[n.severity]?.(n.title, n.body, open);
    };

    /* The server pushes the authoritative count whenever it changes, so
       reading a notification on your phone clears the badge on your laptop. */
    const handleUnread = ({ unread }: { unread: number }) => {
      useNotificationStore.getState().setUnread(unread);
    };

    /* A reconnect means we may have missed events entirely while offline.
       Re-hydrating is the only way to be sure the list is complete. */
    const handleReady = () => {
      if (useNotificationStore.getState().hydrated) {
        void useNotificationStore.getState().hydrate();
      }
    };

    socket.on("notification:new", handleNew);
    socket.on("notification:unread", handleUnread);
    socket.on("connection:ready", handleReady);

    return () => {
      /* Only our own listeners — never a bare `socket.off()`. */
      socket.off("notification:new", handleNew);
      socket.off("notification:unread", handleUnread);
      socket.off("connection:ready", handleReady);
    };
  }, [isAuthenticated, user?._id, role, navigate]);

  return (
    <RealtimeContext.Provider value={{ connection }}>{children}</RealtimeContext.Provider>
  );
}
