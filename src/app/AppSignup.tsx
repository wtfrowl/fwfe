import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axios, { AxiosError } from "axios";
import truckIcon from "../assets/truck.svg";

interface ErrorMessage {
  [key: string]: string;
}
interface ErrorResponse {
  errors: { path: string; msg: string }[];
}

export default function Signup() {
  const location = useLocation();
  const navigate = useNavigate();
  const isDriver = location.pathname === "/driver-signup";
  const themeColor = isDriver ? "blue" : "pink";

  const token = Cookies.get(isDriver ? "driverToken" : "ownerToken");

  const [errMsg, setErrMsg] = useState<ErrorMessage>({});
  const [signupData, setSignupData] = useState<any>({
    firstName: "",
    lastName: "",
    age: "",
    contactNumber: "",
    password: "",
    street: "",
    city: "",
    state: "",
    ...(isDriver && { aadharNumber: "", license: "", rating: "None" }),
  });

  useEffect(() => {
    document.title = isDriver ? "Driver Signup" : "Owner Signup";
    if (token) navigate(isDriver ? "/driver-dashboard" : "/owner-dashboard");
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignupData({ ...signupData, [e.target.name]: e.target.value });
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isDriver ? "driver" : "owner";

    axios
      .post(`${import.meta.env.VITE_API_BASE_URL}/api/${endpoint}`, signupData)
      .then((res) => {
        if (res.status === 201) {
          navigate(isDriver ? "/driver-login" : "/owner-login");
        }
      })
      .catch((err: AxiosError) => {
        const errObj: ErrorMessage = {};
        if (
          err.response &&
          (err.response.data as ErrorResponse).errors
        ) {
          (err.response.data as ErrorResponse).errors.forEach((error) => {
            errObj[error.path] = error.msg;
          });
          setErrMsg(errObj);
        }
      });
  };

  return (
    <>
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white shadow-md border-b border-gray-200">
        <img
          src={truckIcon}
          alt="Truck Logo"
          className="w-14 h-14 cursor-pointer"
          onClick={() => navigate("/")}
        />
        <div className="text-xs sm:text-base md:text-lg">
          Already Registered?{" "}
          <span
            onClick={() =>
              navigate(isDriver ? "/driver-login" : "/owner-login")
            }
            className={`text-${themeColor}-600 font-semibold cursor-pointer hover:underline`}
          >
            Login Here
          </span>
        </div>
      </header>

      <div className={`pt-24 min-h-screen bg-gradient-to-br from-${themeColor}-50 to-gray-100`}>
        <div className="container m-auto md:mt-6 px-6 md:px-12 xl:px-40">
          <div className="max-w-3xl mx-auto">
            <div className="rounded-xl bg-white shadow-xl border border-gray-200">
              <div className="p-6 sm:p-10">
                <h2 className={`text-2xl font-bold text-${themeColor}-700 mb-4 text-center`}>
                  {isDriver ? "Driver Signup" : "Owner Signup"}
                </h2>
                <form onSubmit={handleSignup}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto scrollbar-hide pr-2">
                    {[
                      { label: "First Name", name: "firstName" },
                      { label: "Last Name", name: "lastName" },
                      { label: "Contact Number", name: "contactNumber", type: "number" },
                      { label: "Password", name: "password", type: "password" },
                      ...(isDriver
                        ? [
                            { label: "Aadhar Number", name: "aadharNumber" },
                            { label: "License", name: "license" },
                          ]
                        : []),
                      { label: "Street", name: "street" },
                      { label: "City", name: "city" },
                      { label: "State", name: "state" },
                      { label: "Age", name: "age", type: "number" },
                    ].map(({ label, name, type = "text" }) => (
                      <div key={name} className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">
                          {label}:
                        </label>
                        <input
                          className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-100"
                          type={type}
                          name={name}
                          placeholder={`Enter your ${label.toLowerCase()}`}
                          onChange={handleChange}
                          required
                        />
                        {errMsg[name] && (
                          <p className="text-xs text-red-500 mt-1">{errMsg[name]}</p>
                        )}
                      </div>
                    ))}
                  </div>

                <button
  type="submit"
  className={`w-full h-12 mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition`}
>
                    Sign Up
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Already have an Account?{" "}
                    <span
                      className={`font-medium text-${themeColor}-600 cursor-pointer hover:underline`}
                      onClick={() =>
                        navigate(isDriver ? "/driver-login" : "/owner-login")
                      }
                    >
                      Login Now
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
