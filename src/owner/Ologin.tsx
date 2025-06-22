import { useState, useContext, useEffect, ChangeEvent, FormEvent } from "react";
import truckIcon from "../assets/truck.svg";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie"
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

function Ologin() {
  const [errMsg, setErrMsg] = useState<ErrorMessages>({});
  const [loginErr, setLoginErr] = useState<string>("");
  const [driverLoginData, setDriverLoginData] = useState<LoginData>({
    contactNumber: "",
    password: "",
  });

  const { ownerLogin } = useContext(AuthContext); // Assuming AuthContext provides a specific type
  const token = Cookies.get("ownerToken");
  const navigate = useNavigate();
  const btnCss =
    "w-full group h-12 mt-2 px-6 border-2 border-gray-300 rounded-full transition duration-300 hover:border-blue-400 focus:bg-blue-50 active:bg-blue-100";

  useEffect(() => {
    document.title = "Owner - Login";
    if (token) {
      navigate("/owner-home");
    }
  }, [token, navigate]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDriverLoginData({ ...driverLoginData, [name]: value });
  };

  let controller: AbortController | undefined;

  const handleOwnerLogin = (e: FormEvent) => {
    e.preventDefault();
    if (controller) {
      controller.abort();
    }

    controller = new AbortController();
    const signal = controller.signal;

    axios
      .post(`${import.meta.env.VITE_API_BASE_URL}/api/owner/login`, driverLoginData, { signal })
      .then((res) => {
        ownerLogin(res.data);
        if (res.status === 200) navigate("/owner-home");
      })
      .catch((err) => {
        setErrMsg({});
        setLoginErr("");
        if (err.response?.status === 401) {
          setLoginErr(err.response.data.error);
        } else if (err.response?.data.errors) {
          const errObj: ErrorMessages = {};
          err.response.data.errors.forEach((error: { path: string; msg: string }) => {
            errObj[error.path] = error.msg;
          });
          setErrMsg(errObj);
        }
      });
  };

  return (
    <>
      <div className="flex flex-row justify-around items-center h-20 border-b-indigo-400 bg-white">
        <div>
          <img
            src={truckIcon}
            loading="lazy"
            className="w-15 h-20"
            alt="tailus logo"
            onClick={() => navigate("/")}
          />
        </div>
        <div className="text-xs md:text-xl sm:text-xl">
          Need an Account?{" "}
          <a
            className="text-cyan-600 font-bold cursor-pointer"
            onClick={() => navigate("/owner-signup")}
          >
            Register
          </a>{" "}
          here.
        </div>
      </div>

      {token ? (
        <p className="flex justify-center items-center">
          You are already logged in. Redirecting...
        </p>
      ) : (
        <div className="h-screen relative pt-3 bg-gradient-to-br from-sky-50 to-gray-200">
          <div className="relative container m-auto px-6 text-gray-500 md:px-12 xl:px-40">
            <div className="mt-10 m-auto md:w-4/12">
              <div className="rounded-xl bg-white shadow-xl">
                <div className="border-2 rounded-md shadow-md bg-white p-6 md:p-10">
                  <div className="space-y-4">
                    <form className="flex flex-col gap-3" onSubmit={handleOwnerLogin}>
                      <div className="flex-col flex">
                        <label>Mobile:</label>
                        <input
                          className="border rounded-xl p-2 h-8 bg-gray-50"
                          name="contactNumber"
                          onChange={handleChange}
                          required
                          type="text"
                          pattern="\d*"
                          maxLength={10}
                        />
                        {errMsg.contactNumber && (
                          <p className="error text-xs text-red-600">{errMsg.contactNumber}</p>
                        )}
                      </div>
                      <div className="flex-col flex">
                        <label>Password/PassCode:</label>
                        <input
                          className="border rounded-xl p-2 h-8 bg-gray-50"
                          type="password"
                          name="password"
                          onChange={handleChange}
                          required
                          maxLength={6}
                        />
                        {errMsg.password && (
                          <p className="error text-xs text-red-600">{errMsg.password}</p>
                        )}
                      </div>
                      <button type="submit" className={btnCss}>
                        Login
                      </button>
                      {loginErr && <p className="p-2 error text-xs text-red-600">{loginErr}</p>}
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Ologin;
