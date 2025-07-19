import { useContext, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BiLogOut,

} from "react-icons/bi";


import truckIcon from "../assets/truck.svg";
import Cookies from "js-cookie";
import { AuthContext } from "../context/AuthContext";
import { NotificationBell } from "./components/NotificationBell";
import { FaTruck } from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import { TbPackages } from "react-icons/tb";
import { GiPathDistance } from "react-icons/gi";
import { HiOutlineDocumentText } from "react-icons/hi";
import { CgProfile } from "react-icons/cg";
import { FiLogOut } from "react-icons/fi";

const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isOwner = location.pathname.startsWith("/owner");
  const { ownerLogout, driverLogout } = useContext(AuthContext);

  const tokenRaw = Cookies.get(isOwner ? "ownerToken" : "driverToken");
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



  //sockettt
  //  useEffect(() => {
  //   if (!token) {
  //     navigate(isOwner ? "/owner-login" : "/driver-login");
  //     return;
  //   }

  //   socket.connect(); // 🔑 Explicitly connect

  //   const roomId = isOwner ? `owner-${token._id}` : `driver-${token._id}`;
  //   console.log("➡️ Joining room:", roomId);
  //   socket.emit("join-room", roomId);

  //   socket.on("connect", () => {
  //     console.log("🟢 Connected to socket:", socket.id);
  //   });

  //   socket.on("disconnect", () => {
  //     console.log("🔴 Disconnected from socket");
  //   });

  //   socket.on("trip-created", (data) => {
  //     console.log("📦 Trip created:", data);
  //     alert(`New Trip Created: ${data.registrationNumber}`);
  //   });

  //   socket.on("trip-status-updated", (data) => {
  //     console.log("🔁 Trip status updated:", data);
  //     alert(`Trip ${data.tripId} is now ${data.status}`);
  //   });

  //   return () => {
  //     socket.off("connect");
  //     socket.off("disconnect");
  //     socket.off("trip-created");
  //     socket.off("trip-status-updated");
  //     socket.disconnect(); // 🔌 Optional: close when layout unmounts
  //   };
  // }, [token, isOwner, navigate]);



  return (
    <>
      {/* Topbar */}
      <div className="flex flex-row justify-between md:justify-around items-center h-20 border-b-indigo-400 bg-white">
        <div className="ml-4">
          <img
            src={truckIcon}
            loading="lazy"
            className="w-15 h-20"
            alt="tailus logo"
            onClick={() => navigate("/")}
          />
        </div>
        <div className="mr-4 flex items-center gap-4">
          <NotificationBell />
          {token ? (
            <>
              <span className="hidden md:block text-xs md:text-xl sm:text-xl">
                Welcome {token.firstName}
              </span>
              <BiLogOut
                className="h-8 w-8 block text-[#5786cc] cursor-pointer md:hidden"
                onClick={handleLogout}
              />
            </>
          ) : (
            <span className="hidden md:block text-xs md:text-xl sm:text-xl">
              Please{" "}
              <a
                className="text-cyan-600 font-bold"
                href={isOwner ? "/owner-login" : "/driver-login"}
              >
                Login
              </a>
            </span>
          )}
        </div>
      </div>

      {/* Mobile Nav */}
     <div className="flex text-nowrap scrollbar-hide gap-6 p-4 bg-white border-2 overflow-hidden overflow-x-scroll md:hidden">
  <NavLink
    className="flex items-center p-2 font-semibold border rounded-lg bg-[#dbdbdb]"
    to=""
    end
  >
    <MdDashboard className="mr-2" />
    Dashboard
  </NavLink>

  {isOwner && (
    <NavLink
      className="flex items-center p-2 font-semibold border rounded-lg bg-[#dbdbdb]"
      to="loads"
    >
      <TbPackages className="mr-2" />
      Loads
    </NavLink>
  )}

  <NavLink
    className="flex items-center p-2 font-semibold border rounded-lg bg-[#dbdbdb]"
    to="mytrucks"
  >
    <FaTruck className="mr-2" />
    My Trucks
  </NavLink>

  <NavLink
    className="flex items-center p-2 font-semibold border rounded-lg bg-[#dbdbdb]"
    to="trips"
  >
    <GiPathDistance className="mr-2" />
    Trips
  </NavLink>

  <NavLink
    className="flex items-center p-2 font-semibold border rounded-lg bg-[#dbdbdb]"
    to="mydocs"
  >
    <HiOutlineDocumentText className="mr-2" />
    Documents
  </NavLink>

  <NavLink
    className="flex items-center p-2 font-semibold border rounded-lg bg-[#dbdbdb]"
    to={isOwner ? "owner-profile" : "driver-profile"}
  >
    <CgProfile className="mr-2" />
    Profile
  </NavLink>
</div>


      {/* Main Section */}
      <div className="relative bg-gradient-to-br bg-slate-100">
        <div className="flex h-full">
          {/* Sidebar (desktop) */}
          <div className="bg-[#e7f09c] hidden md:block">
            <ul className="list-none p-3 flex flex-col m-0">
              <li className="mb-2 h-10 p-2 font-semibold w-[220px]">
                <NavLink className="flex items-center p-2" to="" end>
                  <MdDashboard className="mr-2" />
                  Dashboard
                </NavLink>
              </li>

              <li className="mb-2 h-10 p-2 font-semibold w-[220px]">
                <NavLink className="flex items-center p-2" to="mytrucks">
                  <FaTruck className="mr-2" />
                  My Trucks
                </NavLink>
              </li>
              {isOwner && (<li className="mb-2 h-10 p-2 font-semibold w-[220px]">
                <NavLink className="flex items-center p-2" to="loads">
                  <TbPackages className="mr-2" />
                  Loads
                </NavLink>
              </li>)}
              <li className="mb-2 h-10 p-2 font-semibold w-[220px]">
                <NavLink className="flex items-center p-2" to="trips">
                  <GiPathDistance className="mr-2" />
                  Trips
                </NavLink></li>
              <li className="mb-2 h-10 p-2 font-semibold w-[220px]">
                <NavLink className="flex items-center p-2" to="mydocs">
                  <HiOutlineDocumentText className="mr-2" />
                  Documents
                </NavLink></li>

              <li className="mb-2 h-10 p-2 font-semibold w-[220px]">
                <NavLink className="flex items-center p-2" to={isOwner ? "owner-profile" : "driver-profile"}>
                  <CgProfile className="mr-2" />
                  Profile
                </NavLink></li>


            </ul>

            <ul className="mt-10 list-none p-3 flex flex-col m-0">
              <li className="mb-2 h-10 p-2 font-semibold">
                <button onClick={handleLogout} className="flex items-center p-2">
                  <FiLogOut className="mr-2" />
                  Logout
                </button>
              </li>
            </ul>
          </div>

          {/* Page Outlet */}
          <main className="min-h-screen block w-full">
            <Outlet />
          </main>
        </div>

        {/* Footer */}
        <footer className="w-full p-4 mb-0 bg-white shadow md:flex md:items-center md:justify-between md:p-3">
          <span className="text-sm sm:text-center">
            © 2024 Made with Love. All Rights Reserved.
          </span>
        </footer>
      </div>
    </>
  );
};

export default DashboardLayout;
