import React, { useContext, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate, ScrollRestoration } from "react-router-dom";
import { BiLogOut } from "react-icons/bi";
import truckIcon from "../assets/truck.svg";
import { AuthContext } from "../context/AuthContext";
import { NotificationBell } from "./components/NotificationBell";
import { FaTruck } from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import { TbPackages } from "react-icons/tb";
import { GiPathDistance, GiTyre } from "react-icons/gi";
import { HiOutlineDocumentText } from "react-icons/hi";
import { CgProfile } from "react-icons/cg";
import { FiLogOut } from "react-icons/fi";
import { getCurrentLocation } from "./services/location";
import { ImLocation2 } from "react-icons/im";

const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success'>('loading');
  const location = useLocation();

  const getLocationDetails = async () => {
    try {
      setLocationStatus('loading');
      await getCurrentLocation()
        .then(async (res: any) => {
          console.log("Lat:", res.latitude, "Long:", res.longitude, "Location:", res.location);
          setLocationStatus('success');
        })
        .catch((err) => {
          console.error("Location error:", err.message);
          setLocationStatus('idle');
        });
    } catch (err: any) {
      console.error("Error:", err.message);
      setLocationStatus('idle');
    }
  };

  const isOwner = location.pathname.startsWith("/owner");
  const { ownerLogout, driverLogout } = useContext(AuthContext);

  const tokenKey = (isOwner ? "ownerToken" : "driverToken");
  const tokenRaw = localStorage.getItem(tokenKey);
  let token: { firstName: string; _id: string } | null = null;
  if (tokenRaw) {
    try {
      token = JSON.parse(tokenRaw);
    } catch {
      token = null;
    }
  }

  const handleLogout = (): void => {
    if (isOwner) {
      ownerLogout();
      navigate("/owner-login");
    } else {
      driverLogout();
      navigate("/driver-login");
    }
  };

  useEffect(() => {
    if (!token) {
      navigate(isOwner ? "/owner-login" : "/driver-login");
    }
    document.title = token
      ? `Welcome ${token.firstName} - ${isOwner ? "Owner" : "Driver"} Dashboard`
      : "Please Login";
  }, [token, navigate, isOwner]);

  // --- STYLE HELPER FOR NAV LINKS ---
  // This ensures both mobile and desktop links look consistent
  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center p-3 rounded-lg font-semibold transition-all duration-200 ${
      isActive
        ? "bg-[#e7f09c] text-black shadow-sm" // Active: Yellow brand color
        : "text-gray-600 hover:bg-gray-100 hover:text-black" // Inactive: Gray with hover
    }`;

  return (
    <>
      <div className="sticky top-0 z-20 bg-white shadow-sm border-b border-gray-200">
        {/* Topbar */}
        <div className="flex flex-row justify-between md:justify-around items-center h-20">
          <div className="ml-4 cursor-pointer" onClick={() => navigate("/")}>
            <img
              src={truckIcon}
              loading="lazy"
              className="w-12 h-16"
              alt="logo"
            />
          </div>
          <div className="mr-4 flex items-center gap-4">
            {/* Location refresh button */}
            <button
              onClick={getLocationDetails}
              className={`h-9 w-9 items-center justify-center flex rounded-full cursor-pointer transition-colors ${
                locationStatus === 'loading'
                  ? 'bg-red-100 text-red-500 animate-pulse'
                  : locationStatus === 'success'
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              title="Refresh Location"
            >
              <ImLocation2 className="w-5 h-5" />
            </button>

            <NotificationBell />
            
            {token ? (
              <div className="flex items-center gap-3">
                <span className="hidden md:block text-sm md:text-lg font-medium text-gray-700">
                  Welcome, {token.firstName}
                </span>
                <BiLogOut
                  className="h-6 w-6 text-gray-500 cursor-pointer md:hidden hover:text-red-500"
                  onClick={handleLogout}
                />
              </div>
            ) : (
              <span className="hidden md:block text-sm">
                Please{" "}
                <a
                  className="text-cyan-600 font-bold hover:underline"
                  href={isOwner ? "/owner-login" : "/driver-login"}
                >
                  Login
                </a>
              </span>
            )}
          </div>
        </div>

        {/* Mobile Nav (Horizontal Scroll) */}
        <div className="flex md:hidden text-nowrap scrollbar-hide gap-3 p-3 border-t bg-white overflow-x-auto">
          <NavLink className={navLinkClasses} to="" end>
            <MdDashboard className="mr-2 text-xl" /> Dashboard
          </NavLink>

          {isOwner && (
            <NavLink className={navLinkClasses} to="loads">
              <TbPackages className="mr-2 text-xl" /> Loads
            </NavLink>
          )}

          <NavLink className={navLinkClasses} to="mytrucks">
            <FaTruck className="mr-2 text-xl" /> My Trucks
          </NavLink>

          <NavLink className={navLinkClasses} to="trips">
            <GiPathDistance className="mr-2 text-xl" /> Trips
          </NavLink>

          <NavLink className={navLinkClasses} to="tyre">
            <GiTyre className="mr-2 text-xl" /> Tyre
          </NavLink>

          <NavLink className={navLinkClasses} to="mydocs">
            <HiOutlineDocumentText className="mr-2 text-xl" /> Documents
          </NavLink>

          <NavLink className={navLinkClasses} to={isOwner ? "owner-profile" : "driver-profile"}>
            <CgProfile className="mr-2 text-xl" /> Profile
          </NavLink>
        </div>
      </div>

      {/* Main Section */}
      <div className="relative bg-slate-50 min-h-screen">
        <div className="flex max-w-[1920px] mx-auto">
          
          {/* Sidebar (Desktop) - Fixed color scheme */}
          <aside className="hidden md:block w-[240px] flex-shrink-0 bg-white border-r border-gray-200 sticky top-20 h-[calc(100vh-80px)] overflow-y-auto">
            <nav className="p-4 flex flex-col h-full justify-between">
              <ul className="space-y-2">
                <li>
                  <NavLink className={navLinkClasses} to="" end>
                    <MdDashboard className="mr-3 text-xl" /> Dashboard
                  </NavLink>
                </li>

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

                <li>
                  <NavLink className={navLinkClasses} to="tyre">
                    <GiTyre className="mr-3 text-xl" /> Tyre
                  </NavLink>
                </li>

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

              {/* Logout Button at bottom of sidebar */}
              <div className="pt-4 border-t border-gray-100 mt-4">
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full p-3 rounded-lg font-semibold text-red-500 hover:bg-red-50 transition-colors duration-200"
                >
                  <FiLogOut className="mr-3 text-xl" /> Logout
                </button>
              </div>
            </nav>
          </aside>

          {/* Page Outlet */}
          <main className="flex-1 p-4 md:p-8 w-full overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>
      <ScrollRestoration />
    </>
  );
};

export default DashboardLayout;