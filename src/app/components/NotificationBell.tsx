import { useContext, useEffect, useRef, useState } from "react";
import { BiBell } from "react-icons/bi";
import { socket } from "../../utils/socket"; 
import Cookies from "js-cookie";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
interface Notification {
  tripId?: string; // Optional, used for trip status updates
  id: string;
  message: string;
  timestamp: string;
}
interface TripData {
  status: any;
  tripId?: string;
  registrationNumber?: string;
}
export const NotificationBell = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { role} = useContext(AuthContext);
  useEffect(() => {
  const tokenRaw = Cookies.get(role === "owner" ? "ownerToken" : "driverToken");
  let token: { _id: string } | null = null;
  if (tokenRaw) {
    try {
      token = JSON.parse(tokenRaw);
    } catch {
      token = null;
    }
  }
    console.log("Connecting to socket...");
      socket.connect(); // 🔑 Explicitly connect
        const roomId = role === "owner" ? `owner-${token?._id}` : `driver-${token?._id}`;
  console.log("➡️ Joining room:", roomId);
  socket.emit("join-room", roomId);

  socket.on("connect", () => {
    console.log("🟢 Connected to socket:", socket.id);
  });
    // Only listen to 'trip-created' and 'trip-status-updated' as per your socket logic
    const handleTripCreated = (data: TripData) => {
      const newNotification: Notification = {
        id: `trip-created-${data.tripId || Date.now()}`,
        message: `New trip created: ${data.registrationNumber}`,
        timestamp: new Date().toISOString(),
      };
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    const handleTripStatusUpdated = (data: TripData) => {
      const newNotification: Notification = {
        tripId: data.tripId,
        id: `trip-status-${data.tripId}-${data.status}`,
        message: `Trip ${data.tripId} is now ${data.status}`,
        timestamp: new Date().toISOString(),
      };
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("trip-created", handleTripCreated);
    socket.on("trip-status-updated", handleTripStatusUpdated);

    return () => {
      socket.off("trip-created", handleTripCreated);
      socket.off("trip-status-updated", handleTripStatusUpdated);
    };
  }, []);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
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


   const handleNotificationClick = (notif: Notification) => {
    if (notif) {
      console.log("Navigating to trip detail for notification:", notif);
      // Navigate to trip detail page (update the route if needed)
      const basePath = role === "owner" ? "/owner-home/trips" : "/driver-home/trips";
      navigate(`${basePath}/${notif.tripId}`);
      setIsOpen(false);
    }
  };
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="relative p-2 rounded-full hover:bg-gray-100"
      >
        <BiBell className="text-2xl text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 px-1.5 py-0.5 text-xs font-bold text-white bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

   {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 bg-white border shadow-xl rounded-lg overflow-auto z-50">
          <div className="p-4 border-b font-semibold">Notifications</div>
          {notifications.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No notifications</div>
          ) : (
            <ul className="divide-y text-sm">
              {notifications.map((notif) => (
                <li
                  key={notif.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="font-medium">{notif.message}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(notif.timestamp).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
