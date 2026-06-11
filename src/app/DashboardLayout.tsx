import React, { useContext, useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, ScrollRestoration } from "react-router-dom";
import { BiLogOut } from "react-icons/bi";
import truckIcon from "../assets/truck.svg";
import { RiSteering2Fill } from "react-icons/ri";
import { AuthContext } from "../context/AuthContext";
import { NotificationBell } from "./components/NotificationBell";
import { FaTruck } from "react-icons/fa";
import { MdAnalytics, MdDashboard } from "react-icons/md";
import { TbPackages } from "react-icons/tb";
import { GiPathDistance, GiTyre } from "react-icons/gi";
import { HiOutlineDocumentText } from "react-icons/hi";
import { CgProfile } from "react-icons/cg";
import { FiLogOut } from "react-icons/fi";
import { ImLocation2 } from "react-icons/im";
import { useTracking } from "../context/TrackingContext";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { getLoginPath } from "../utils/auth";

const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const { isTracking, startTracking, stopTracking, error } = useTracking();
  const { user, role, logout } = useContext(AuthContext);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isOwner = role === "owner";

  const handleToggleTracking = () => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

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

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center p-3 rounded-lg font-semibold transition-all duration-200 ${
      isActive
        ? "bg-[#e7f09c] text-black shadow-sm"
        : "text-gray-600 hover:bg-gray-100 hover:text-black"
    }`;

  return (
    <>
      <div className="sticky top-0 z-20 bg-white shadow-sm border-b border-gray-200">
        <div className="flex flex-row justify-between md:justify-around items-center h-20">
          <div className="ml-4 cursor-pointer" onClick={() => navigate("/")}>
            <img src={truckIcon} loading="lazy" className="w-12 h-16" alt="logo" />
          </div>
          <div className="mr-4 flex items-center gap-4">
            <div className="mr-4 flex items-center gap-4">
              <button
                onClick={handleToggleTracking}
                className={`h-9 w-9 items-center justify-center flex rounded-full cursor-pointer transition-all duration-300 ${
                  isTracking
                    ? "bg-green-100 text-green-600 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                    : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                } ${error ? "bg-red-100 text-red-500" : ""}`}
                title={isTracking ? "Stop Tracking (Go Offline)" : "Start Tracking (Go Online)"}
              >
                <ImLocation2 className={`w-5 h-5 ${isTracking ? "animate-pulse" : ""}`} />
              </button>

              {error && <span className="text-xs text-red-500 absolute top-12">{error}</span>}

              <NotificationBell />
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                <span className="hidden md:block text-sm md:text-lg font-medium text-gray-700">
                  Welcome, {user.firstName}
                </span>
                <BiLogOut
                  className="h-6 w-6 text-gray-500 cursor-pointer md:hidden hover:text-red-500"
                  onClick={() => setShowLogoutConfirm(true)}
                />
              </div>
            ) : (
              <span className="hidden md:block text-sm">
                Please{" "}
                <a className="text-cyan-600 font-bold hover:underline" href={isOwner ? "/owner-login" : "/driver-login"}>
                  Login
                </a>
              </span>
            )}
          </div>
        </div>

        <div className="flex md:hidden text-nowrap scrollbar-hide gap-3 p-3 border-t bg-white overflow-x-auto">
          <NavLink className={navLinkClasses} to="" end>
            <MdDashboard className="mr-2 text-xl" /> Dashboard
          </NavLink>
          {isOwner && (
            <>
              <NavLink className={navLinkClasses} to="analytics">
                <MdAnalytics className="mr-2 text-xl" /> Analytics
              </NavLink>
              <NavLink className={navLinkClasses} to="loads">
                <TbPackages className="mr-2 text-xl" /> Loads
              </NavLink>
            </>
          )}

          <NavLink className={navLinkClasses} to="mytrucks">
            <FaTruck className="mr-2 text-xl" /> My Trucks
          </NavLink>

          {isOwner && (
            <NavLink className={navLinkClasses} to="drivers">
              <RiSteering2Fill className="mr-2 text-xl" /> Drivers
            </NavLink>
          )}

          <NavLink className={navLinkClasses} to="trips">
            <GiPathDistance className="mr-2 text-xl" /> Trips
          </NavLink>

          {isOwner && (
            <NavLink className={navLinkClasses} to="tyre">
              <GiTyre className="mr-2 text-xl" /> Tyre
            </NavLink>
          )}

          <NavLink className={navLinkClasses} to="mydocs">
            <HiOutlineDocumentText className="mr-2 text-xl" /> Documents
          </NavLink>

          <NavLink className={navLinkClasses} to={isOwner ? "owner-profile" : "driver-profile"}>
            <CgProfile className="mr-2 text-xl" /> Profile
          </NavLink>
        </div>
      </div>

      <div className="relative bg-slate-50 min-h-screen">
        <div className="flex max-w-[1920px] mx-auto">
          <aside className="hidden md:block w-[240px] flex-shrink-0 bg-white border-r border-gray-200 sticky top-20 h-[calc(100vh-80px)] overflow-y-auto">
            <nav className="p-4 flex flex-col h-full justify-between">
              <ul className="space-y-2">
                <li>
                  <NavLink className={navLinkClasses} to="" end>
                    <MdDashboard className="mr-3 text-xl" /> Dashboard
                  </NavLink>
                </li>

                {isOwner && (
                  <>
                    <li>
                      <NavLink className={navLinkClasses} to="analytics">
                        <MdAnalytics className="mr-2 text-xl" /> Analytics
                      </NavLink>
                    </li>
                    <li>
                      <NavLink className={navLinkClasses} to="drivers">
                        <RiSteering2Fill className="mr-2 text-xl" /> Drivers
                      </NavLink>
                    </li>
                  </>
                )}

                <li>
                  <NavLink className={navLinkClasses} to="mytrucks">
                    <FaTruck className="mr-3 text-xl" /> My Trucks
                  </NavLink>
                </li>

                {isOwner && (
                  <li>
                    <NavLink className={navLinkClasses} to="loads">
                      <TbPackages className="mr-3 text-xl" /> Loads
                    </NavLink>
                  </li>
                )}

                <li>
                  <NavLink className={navLinkClasses} to="trips">
                    <GiPathDistance className="mr-3 text-xl" /> Trips
                  </NavLink>
                </li>

                {isOwner && (
                  <li>
                    <NavLink className={navLinkClasses} to="tyre">
                      <GiTyre className="mr-3 text-xl" /> Tyre
                    </NavLink>
                  </li>
                )}

                <li>
                  <NavLink className={navLinkClasses} to="mydocs">
                    <HiOutlineDocumentText className="mr-3 text-xl" /> Documents
                  </NavLink>
                </li>

                <li>
                  <NavLink className={navLinkClasses} to={isOwner ? "owner-profile" : "driver-profile"}>
                    <CgProfile className="mr-3 text-xl" /> Profile
                  </NavLink>
                </li>
              </ul>

              <div className="pt-4 border-t border-gray-100 mt-4">
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="flex items-center w-full p-3 rounded-lg font-semibold text-red-500 hover:bg-red-50 transition-colors duration-200"
                >
                  <FiLogOut className="mr-3 text-xl" /> Logout
                </button>
              </div>
            </nav>
          </aside>

          <main className="flex-1 p-4 md:p-8 w-full overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>
      <ConfirmDialog
        open={showLogoutConfirm}
        title="Logout?"
        description="Your FleetWise session will be cleared from this device."
        confirmLabel="Logout"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
      <ScrollRestoration />
    </>
  );
};

export default DashboardLayout;
