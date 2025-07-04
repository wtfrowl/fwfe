import { useContext, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BiHomeAlt,
  BiLogOut,
  BiTrip,
  BiSolidUser,
  BiSolidTruck,
  BiFile,
} from "react-icons/bi";
import truckIcon from "../assets/truck.svg";
import Cookies from "js-cookie";
import { AuthContext } from "../context/AuthContext";

const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isOwner = location.pathname.startsWith("/owner");
  const { ownerLogout, driverLogout } = useContext(AuthContext);

  const tokenRaw = Cookies.get(isOwner ? "ownerToken" : "driverToken");
  let token: { firstName: string } | null = null;
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
        <div className="mr-4">
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
          <BiHomeAlt className="mr-2" />
          Dashboard
        </NavLink>
        {isOwner && (
          <>
            <NavLink
              className="flex items-center p-2 font-semibold border rounded-lg bg-[#dbdbdb]"
              to="mytrucks"
            >
              <BiSolidTruck className="mr-2" />
              My Trucks
            </NavLink>
            <NavLink
              className="flex items-center p-2 font-semibold border rounded-lg bg-[#dbdbdb]"
              to="trips"
            >
              <BiTrip className="mr-2" />
              Trips
            </NavLink>
          </>
        )}
        <NavLink
          className="flex items-center p-2 font-semibold border rounded-lg bg-[#dbdbdb]"
          to="mydocs"
        >
          <BiFile className="mr-2" />
          Documents
        </NavLink>
        <NavLink
          className="flex items-center p-2 font-semibold border rounded-lg bg-[#dbdbdb]"
          to={isOwner ? "owner-profile" : "driver-profile"}
        >
          <BiSolidUser className="mr-2" />
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
                  <BiHomeAlt className="mr-2" />
                  Dashboard
                </NavLink>
              </li>
                 <li className="mb-2 h-10 p-2 font-semibold w-[220px]">
                    <NavLink className="flex items-center p-2" to="mytrucks">
                      <BiSolidTruck className="mr-2" />
                      My Trucks
                    </NavLink>
                  </li>
              {isOwner && (
                <>
               
                  <li className="mb-2 h-10 p-2 font-semibold w-[220px]">
                    <NavLink className="flex items-center p-2" to="trips">
                      <BiTrip className="mr-2" />
                      Trips
                    </NavLink>
                  </li>
                </>
              )}
              <li className="mb-2 h-10 p-2 font-semibold w-[220px]">
                <NavLink className="flex items-center p-2" to="mydocs">
                  <BiFile className="mr-2" />
                  Documents
                </NavLink>
              </li>
              <li className="mb-2 h-10 p-2 font-semibold w-[220px]">
                <NavLink
                  className="flex items-center p-2"
                  to={isOwner ? "owner-profile" : "driver-profile"}
                >
                  <BiSolidUser className="mr-2" />
                  Profile
                </NavLink>
              </li>
            </ul>

            <ul className="mt-10 list-none p-3 flex flex-col m-0">
              <li className="mb-2 h-10 p-2 font-semibold">
                <button onClick={handleLogout} className="flex items-center p-2">
                  <BiLogOut className="mr-2" />
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
