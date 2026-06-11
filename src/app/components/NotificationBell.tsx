import { useContext, useEffect, useRef, useState } from "react";
import { BiBell } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { useEventStore } from "../../store/trips/store";
import { socket } from "../../utils/socket";

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
  const { role, user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!role || !user?._id) {
      return;
    }

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
        message: `New trip created: ${data.tripId}`,
        timestamp: new Date().toISOString(),
      });
    };

    const handleTripStatusUpdated = (data: TripData) => {
      triggerTripRefresh();
      pushNotification({
        tripId: data.tripId,
        id: `trip-status-${data.tripId}-${data.status}`,
        message: `Trip ${data.tripId} is now ${data.status}`,
        timestamp: new Date().toISOString(),
      });
    };

    const handleTripExpenseCreated = (data: TripData) => {
      triggerExpenseRefresh();
      pushNotification({
        tripId: data.tripId,
        id: `trip-expense-${data.tripId}-${Date.now()}`,
        message: `New expense added for trip ${data.tripId}`,
        timestamp: new Date().toISOString(),
      });
    };

    const handleTripExpenseApproved = (data: TripData) => {
      triggerExpenseRefresh();
      pushNotification({
        tripId: data.tripId,
        id: `trip-expense-approved-${data.tripId}-${Date.now()}`,
        message: `Expense approved for trip ${data.tripId}`,
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

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
      <button onClick={toggleDropdown} className="relative rounded-full p-2 hover:bg-gray-100" aria-label="Open notifications">
        <BiBell className="text-2xl text-gray-700" />
        {unreadCount > 0 ? (
          <span className="absolute right-0 top-0 translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-50 mt-2 max-h-96 w-80 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-200 p-4 font-semibold text-slate-900">Notifications</div>
          {notifications.length === 0 ? (
            <div className="p-4 text-sm text-slate-500">No notifications yet</div>
          ) : (
            <ul className="divide-y divide-slate-200 text-sm">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className="cursor-pointer p-3 transition hover:bg-slate-50"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="font-medium text-slate-800">{notification.message}</div>
                  <div className="text-xs text-slate-400">
                    {new Date(notification.timestamp).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
};
