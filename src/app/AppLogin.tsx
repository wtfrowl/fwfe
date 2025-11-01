import React, { useState, useContext, useEffect, ChangeEvent, FormEvent } from "react";
import truckIcon from "../assets/truck.svg";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

interface LoginData {
  contactNumber: string;
  password: string;
}

interface ErrorMessages {
  contactNumber?: string;
  password?: string;
  [key: string]: string | undefined;
}

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState(() => location.pathname.includes("owner") ? "owner" : "driver");
  const isOwner = role === "owner";

  const [errMsg, setErrMsg] = useState<ErrorMessages>({});
  const [loginErr, setLoginErr] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const [loginData, setLoginData] = useState<LoginData>({
    contactNumber: "",
    password: "",
  });

  

  const { ownerLogin, driverLogin } = useContext(AuthContext);
  const tokenKey = isOwner ? "ownerToken" : "driverToken";
  const token = localStorage.getItem(tokenKey);

  useEffect(() => {
    document.title = isOwner ? "Owner Login" : "Driver Login";
    // Redirect if already logged in
    if (token) {
      navigate(isOwner ? "/owner-home" : "/driver-home");
    }
  }, [token, isOwner, navigate]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData({ ...loginData, [name]: value });
  };

//on role change change url too
  useEffect(() => {
    const newPath = isOwner ? "/owner-login" : "/driver-login";
    if (location.pathname !== newPath) {
      navigate(newPath);
    }
  }, [role, location.pathname, navigate]);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setLoginErr("");
    setIsLoading(true);
    const apiURL = `${import.meta.env.VITE_API_BASE_URL}/api/${isOwner ? "owner" : "driver"}/login`;

    axios
      .post(apiURL, loginData)
      .then((res) => {
        if (isOwner) ownerLogin(res.data); else driverLogin(res.data);
        if (res.status === 200) {
          navigate(isOwner ? "/owner-home" : "/driver-home");
        }
      })
    .catch((err) => {
    setErrMsg({}); // Clears field-level errors (the object state)
    setLoginErr(""); // Clears overall login error (the string state)
    setIsLoading(false); // Make sure loading is stopped

    if (err.response?.status === 401) {
        // You are receiving: { "error": "Invalid credentials..." }
        
        // 1. Set the string state (loginErr) to the string from the response
        setLoginErr(err.response.data.error); 
        
        // 2. 🚨 CRITICAL: The line that must be REMOVED or commented out.
        // If this line exists, it is the cause of the crash and refresh.
        // setErrMsg(err.response.data.error); // <--- MUST NOT BE HERE!

    } else if (err.response?.data.errors) {
        // ... (This handles the 400 validation array)
        const errObj: ErrorMessages = {};
        err.response.data.errors.forEach((error: { path: string; msg: string }) => {
            errObj[error.path] = error.msg;
        });
        setErrMsg(errObj); // Correctly setting the object state (errMsg)
    }
})
.finally(() => {
    setIsLoading(false);
});
  };

  return (
    <>
   <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white shadow-md border-b border-gray-200">
  <img
    src={truckIcon}
    alt="Truck Logo"
    className="w-14 h-14 cursor-pointer"
    onClick={() => navigate("/")}
  />
  <p className="flex items-center gap-2 text-sm">
    Need an Account?{" "}
    <Link
      className="text-blue-600 font-semibold cursor-pointer hover:underline"
      to={role === "owner" ? "/owner-signup" : "/driver-signup"}
    >
      Register here
    </Link>
  </p>
</header>


      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 p-6">
        <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-200 p-8">
          {/* Toggle */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-700">
              {isOwner ? "Owner Login" : "Driver Login"}
            </h2>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${!isOwner ? "text-blue-600 font-medium" : "text-gray-400"}`}>
                Driver
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isOwner}
                  onChange={() => setRole(isOwner ? "driver" : "owner")}
                />
                <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-300 transition duration-300"></div>
                <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-md transition-transform peer-checked:translate-x-5"></div>
              </label>
              <span className={`text-sm ${isOwner ? "text-blue-600 font-medium" : "text-gray-400"}`}>
                Owner
              </span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="text-sm font-medium text-gray-700">Mobile Number</label>
              <input
                type="text"
                name="contactNumber"
                pattern="\d*"
                maxLength={10}
                required
                onChange={handleChange}
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50"
              />
              {errMsg.contactNumber && (
                <p className="text-xs text-red-600 mt-1">{errMsg.contactNumber}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Password / Passcode</label>
              <input
                type="password"
                name="password"
                required
                maxLength={6}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50"
              />
              {errMsg.password && (
                <p className="text-xs text-red-600 mt-1">{errMsg.password}</p>
              )}
            </div>

            {loginErr && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{loginErr}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
              
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default Login;
