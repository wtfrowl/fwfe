import React, { useContext, useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, ScrollRestoration } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import truckIcon from "../assets/truck.svg";
import { RiSteering2Fill } from "react-icons/ri";
import { AuthContext } from "../context/AuthContext";
import { NotificationBell } from "./components/NotificationBell";
import { FaTruck } from "react-icons/fa";
import { MdAnalytics, MdDashboard, MdHealthAndSafety } from "react-icons/md";
import { TbPackages, TbReceipt } from "react-icons/tb";
import { GiPathDistance, GiTyre } from "react-icons/gi";
import { HiOutlineDocumentText } from "react-icons/hi";
import { CgProfile } from "react-icons/cg";
import { FiLogOut } from "react-icons/fi";
import { ImLocation2 } from "react-icons/im";
import { useTracking } from "../context/TrackingContext";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { getLoginPath } from "../utils/auth";
import { onNotificationClick } from "../utils/push";
import { RealtimeProvider } from "../context/RealtimeContext";
import { ToastHost } from "../components/ui/Toast";
import { spring } from "../motion/springs";
import { cn } from "../utils/cn";

/* One source of truth for navigation. The previous version wrote this list
   out twice — once for the mobile rail, once for the sidebar — which is two
   places for a route to drift out of sync. */
interface NavEntry {
  to: string;
  label: string;
  icon: React.ReactNode;
  ownerOnly?: boolean;
  end?: boolean;
}

const NAV: NavEntry[] = [
  { to: "", label: "Dashboard", icon: <MdDashboard />, end: true },
  { to: "analytics", label: "Analytics", icon: <MdAnalytics />, ownerOnly: true },
  { to: "health", label: "Fleet Health", icon: <MdHealthAndSafety />, ownerOnly: true },
  { to: "billing", label: "Billing", icon: <TbReceipt />, ownerOnly: true },
  { to: "loads", label: "Loads", icon: <TbPackages />, ownerOnly: true },
  { to: "mytrucks", label: "My Trucks", icon: <FaTruck /> },
  { to: "drivers", label: "Drivers", icon: <RiSteering2Fill />, ownerOnly: true },
  { to: "trips", label: "Trips", icon: <GiPathDistance /> },
  { to: "tyre", label: "Tyre", icon: <GiTyre />, ownerOnly: true },
  { to: "mydocs", label: "Documents", icon: <HiOutlineDocumentText /> },
];

/**
 * The selected-state pill is a shared element: it travels from the old item to
 * the new one instead of one pill fading out while another fades in. That
 * continuity is what tells the user these are positions in one list rather
 * than unrelated buttons, and `layoutId` makes it interruptible for free —
 * click a third item mid-flight and the pill re-targets from where it is.
 */
function NavItem({ entry, layoutGroup }: { entry: NavEntry; layoutGroup: string }) {
  const reduced = useReducedMotion();

  return (
    <NavLink to={entry.to} end={entry.end} className="relative block">
      {({ isActive }) => (
        <motion.div
          className={cn(
            "relative flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-semibold",
            "whitespace-nowrap transition-colors duration-150",
            isActive ? "text-ink" : "text-ink-secondary hover:text-ink"
          )}
          whileTap={reduced ? { opacity: 0.7 } : { scale: 0.98 }}
          transition={spring.snappy}
        >
          {isActive && (
            <motion.span
              layoutId={layoutGroup}
              className="absolute inset-0 -z-10 rounded-control bg-surface shadow-[var(--shadow-key)] ring-1 ring-hairline-strong"
              transition={spring.move}
            />
          )}
          <span className="text-lg">{entry.icon}</span>
          {entry.label}
        </motion.div>
      )}
    </NavLink>
  );
}

const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const { isTracking, startTracking, stopTracking, error, pending } = useTracking();
  const { user, role, logout } = useContext(AuthContext);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const reduced = useReducedMotion();

  const isOwner = role === "owner";
  const entries = NAV.filter((e) => !e.ownerOnly || isOwner).concat({
    to: isOwner ? "owner-profile" : "driver-profile",
    label: "Profile",
    icon: <CgProfile />,
  });

  const handleToggleTracking = () => (isTracking ? stopTracking() : startTracking());

  const handleLogout = (): void => {
    const loginPath = getLoginPath(role);
    logout();
    navigate(loginPath, { replace: true });
  };

  useEffect(() => {
    document.title = user
      ? `Welcome ${user.firstName} - ${isOwner ? "Owner" : "Driver"} Dashboard`
      : "Please Login";
  }, [user, isOwner]);

  /* Tapping a background notification should land on the thing it is about.
     The service worker navigates the tab itself where the browser allows it;
     where it does not, it posts the target here and the router handles it —
     otherwise the tap just focuses whatever page happened to be open, which
     reads as the notification having done nothing. */
  useEffect(() => onNotificationClick((url) => navigate(url)), [navigate]);

  return (
    <RealtimeProvider>
      {/* Chrome is a translucent layer the content scrolls beneath, not an
          opaque strip that eats the top of the page. */}
      <header className="material-regular sticky top-0 z-30 border-b border-hairline/70">
        <div className="mx-auto flex h-16 max-w-[1920px] items-center justify-between px-4 md:px-6">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 rounded-control"
            aria-label="FleetWise home"
          >
            <img src={truckIcon} loading="lazy" className="h-9 w-9" alt="" />
            <span className="hidden text-base font-semibold text-ink-vibrant sm:block">
              FleetWise
            </span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <TrackingToggle
              isTracking={isTracking}
              pending={pending}
              error={error}
              onToggle={handleToggleTracking}
            />
            <NotificationBell />

            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="hidden text-sm font-medium text-ink-vibrant-secondary md:block">
                  {user.firstName}
                </span>
                <motion.button
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  aria-label="Log out"
                  className="grid h-9 w-9 place-items-center rounded-full text-ink-tertiary hover:bg-ink/6 hover:text-critical md:hidden"
                  whileTap={reduced ? { opacity: 0.6 } : { scale: 0.9 }}
                  transition={spring.snappy}
                >
                  <FiLogOut className="h-5 w-5" />
                </motion.button>
              </div>
            ) : (
              <a
                className="text-sm font-semibold text-accent hover:underline"
                href={isOwner ? "/owner-login" : "/driver-login"}
              >
                Login
              </a>
            )}
          </div>
        </div>

        {/* Mobile rail. Its own layout group so it never fights the sidebar
            over which pill owns the shared element. */}
        <nav className="scrollbar-hide flex gap-1.5 overflow-x-auto border-t border-hairline/60 px-3 py-2 md:hidden">
          {entries.map((entry) => (
            <NavItem key={entry.to || "index"} entry={entry} layoutGroup="nav-mobile" />
          ))}
        </nav>
      </header>

      <div className="mx-auto flex max-w-[1920px]">
        <aside className="material-thin sticky top-16 hidden h-[calc(100vh-4rem)] w-[248px] shrink-0 overflow-y-auto border-r border-hairline/70 md:block">
          <nav className="flex h-full flex-col justify-between p-3">
            <ul className="space-y-1">
              {entries.map((entry) => (
                <li key={entry.to || "index"}>
                  <NavItem entry={entry} layoutGroup="nav-desktop" />
                </li>
              ))}
            </ul>

            <div className="border-t border-hairline pt-3">
              <motion.button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-sm font-semibold text-critical-ink transition-colors duration-150 hover:bg-critical-soft"
                whileTap={reduced ? { opacity: 0.7 } : { scale: 0.98 }}
                transition={spring.snappy}
              >
                <FiLogOut className="text-lg" /> Logout
              </motion.button>
            </div>
          </nav>
        </aside>

        <main className="min-h-[calc(100vh-4rem)] w-full min-w-0 flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Log out?"
        description="Your FleetWise session will be cleared from this device. Any tracking currently running will stop."
        confirmLabel="Log out"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
      <ScrollRestoration />
      <ToastHost />
    </RealtimeProvider>
  );
};

/**
 * Live tracking is the one genuinely ambient state in the app, so it gets the
 * one genuinely ambient animation: a slow breathing halo that says "still on"
 * without demanding to be looked at.
 *
 * It animates a ring rather than the icon, because a pulsing icon competes
 * with the icon's job of being identifiable at a glance.
 */
function TrackingToggle({
  isTracking,
  error,
  pending = 0,
  onToggle,
}: {
  isTracking: boolean;
  error?: string | null;
  /** Fixes held on the device because the network was unavailable. */
  pending?: number;
  onToggle: () => void;
}) {
  const reduced = useReducedMotion();

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={onToggle}
        title={
          pending
            ? `${pending} location${pending === 1 ? "" : "s"} waiting to upload`
            : isTracking
              ? "Stop tracking (go offline)"
              : "Start tracking (go online)"
        }
        aria-pressed={isTracking}
        className={cn(
          "relative grid h-9 w-9 place-items-center rounded-full transition-colors duration-200",
          error
            ? "bg-critical-soft text-critical-ink"
            : isTracking
              ? "bg-positive-soft text-positive-ink"
              : "bg-ink/6 text-ink-tertiary hover:bg-ink/10 hover:text-ink-secondary"
        )}
        whileTap={reduced ? { opacity: 0.6 } : { scale: 0.9 }}
        transition={spring.snappy}
      >
        {isTracking && !reduced && (
          <motion.span
            className="absolute inset-0 rounded-full ring-2 ring-positive"
            animate={{ opacity: [0.55, 0, 0.55], scale: [1, 1.5, 1] }}
            transition={{ duration: 2.4, ease: "easeOut", repeat: Infinity }}
            aria-hidden
          />
        )}
        <ImLocation2 className="h-4.5 w-4.5" />
      </motion.button>

      {/* Held fixes, shown as a count.
          Without it, driving through a dead zone looks identical to tracking
          being broken — and a driver who thinks it is broken turns it off. */}
      {pending > 0 && (
        <span
          className="absolute -top-1 -right-1 grid min-w-4.5 place-items-center rounded-full bg-caution px-1 text-[0.625rem] font-bold text-white"
          title={`${pending} waiting to upload`}
        >
          {pending > 99 ? "99+" : pending}
        </span>
      )}

      {error ? (
        <span className="absolute top-11 right-0 z-10 whitespace-nowrap rounded-chip bg-critical-soft px-2 py-1 text-xs font-medium text-critical-ink">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export default DashboardLayout;
