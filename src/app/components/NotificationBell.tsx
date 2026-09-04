import { useContext, useEffect, useRef, useState } from "react";
import { BiBell } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AuthContext } from "../../context/AuthContext";
import { useEventStore } from "../../store/trips/store";
import { socket } from "../../utils/socket";
import { spring, ease } from "../../motion/springs";

const { triggerTripRefresh, triggerExpenseRefresh } = useEventStore.getState();

interface Notification {
  tripId?: string;
  id: string;
  message: string;
  timestamp: string;
}

interface TripData {
  status?: string;
  tripId?: string;
}

export const NotificationBell = () => {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const { role, user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!role || !user?._id) return;

    const roomPrefix = role === "owner" ? "owner" : "driver";
    const roomId = `${roomPrefix}-${user._id}`;

    socket.connect();
    socket.emit("join-room", roomId);

    const pushNotification = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    const handleTripCreated = (data: TripData) => {
      triggerTripRefresh();
      pushNotification({
        tripId: data.tripId,
        id: `trip-created-${data.tripId || Date.now()}`,
        message: `New trip created`,
        timestamp: new Date().toISOString(),
      });
    };

    const handleTripStatusUpdated = (data: TripData) => {
      triggerTripRefresh();
      pushNotification({
        tripId: data.tripId,
        id: `trip-status-${data.tripId}-${data.status}`,
        message: `Trip is now ${data.status}`,
        timestamp: new Date().toISOString(),
      });
    };

    const handleTripExpenseCreated = (data: TripData) => {
      triggerExpenseRefresh();
      pushNotification({
        tripId: data.tripId,
        id: `trip-expense-${data.tripId}-${Date.now()}`,
        message: `New expense added to a trip`,
        timestamp: new Date().toISOString(),
      });
    };

    const handleTripExpenseApproved = (data: TripData) => {
      triggerExpenseRefresh();
      pushNotification({
        tripId: data.tripId,
        id: `trip-expense-approved-${data.tripId}-${Date.now()}`,
        message: `An expense was approved`,
        timestamp: new Date().toISOString(),
      });
    };

    socket.on("trip-created", handleTripCreated);
    socket.on("trip-status-updated", handleTripStatusUpdated);
    socket.on("trip-expense-created", handleTripExpenseCreated);
    socket.on("trip-expense-approved", handleTripExpenseApproved);

    return () => {
      socket.off("trip-created", handleTripCreated);
      socket.off("trip-status-updated", handleTripStatusUpdated);
      socket.off("trip-expense-created", handleTripExpenseCreated);
      socket.off("trip-expense-approved", handleTripExpenseApproved);
    };
  }, [role, user?._id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) setUnreadCount(0);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.tripId) return;
    const basePath = role === "owner" ? "/owner-home/trips" : "/driver-home/trips";
    navigate(`${basePath}/${notification.tripId}`);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        onClick={toggleDropdown}
        className="relative grid h-9 w-9 place-items-center rounded-full text-ink-secondary transition-colors duration-150 hover:bg-ink/6 hover:text-ink"
        aria-label={
          unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"
        }
        aria-expanded={isOpen}
        whileTap={reduced ? { opacity: 0.6 } : { scale: 0.9 }}
        transition={spring.snappy}
      >
        <BiBell className="h-5 w-5" />

        {/* The badge lands with a small overshoot — something arrived, and a
            spring is how a physical thing settles. */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-critical px-1 text-[0.625rem] font-semibold tabular-nums text-white"
              initial={reduced ? { opacity: 0 } : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={reduced ? { opacity: 0 } : { scale: 0, opacity: 0 }}
              transition={spring.sheet}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            data-motion="transform"
            /* Anchored to the bell it came from, not scaling out of its own
               centre — the spatial relationship between trigger and panel is
               what makes the panel feel attached rather than teleported. */
            style={{ transformOrigin: "top right" }}
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -4 }}
            transition={ease.enter}
            className="material-thick absolute right-0 z-50 mt-2 max-h-96 w-80 overflow-auto rounded-card shadow-[var(--shadow-floating)] ring-1 ring-hairline"
            role="dialog"
            aria-label="Notifications"
          >
            <div className="sticky top-0 border-b border-hairline/70 bg-white/60 px-4 py-3 text-sm font-semibold text-ink-vibrant">
              Notifications
            </div>

            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-ink-tertiary">
                Nothing yet. Trip and expense updates will show up here.
              </p>
            ) : (
              <ul className="text-sm">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => handleNotificationClick(notification)}
                      className="w-full border-b border-hairline/60 px-4 py-3 text-left transition-colors duration-150 last:border-0 hover:bg-ink/4"
                    >
                      <div className="font-medium text-ink-vibrant">{notification.message}</div>
                      <div className="mt-0.5 text-xs text-ink-tertiary">
                        {new Date(notification.timestamp).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
