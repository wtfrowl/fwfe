import { useState, useEffect } from "react";
import truckIcon from "../assets/truck.svg";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import axios, { AxiosError } from 'axios'

const btnCss =
  "w-full group h-12 mt-2 border-2 border-gray-400 rounded-full transition duration-300 hover:border-blue-400 focus:bg-blue-50 active:bg-blue-100";
function Osignup() {
  const token = Cookies.get("driverToken")
  const navigate = useNavigate();

  //give type to error message
  interface ErrorMessage {
    [key: string]: string;
  }
  //manage state of error message
  const [errMsg,setErrMsg]= useState<ErrorMessage>({});

  //manage state of signup form 
  const [signupData,setSignupData]=useState({
    firstName: '',
    lastName: '',
    age: '',
    contactNumber: '',
    password: '',
    street:'',
    city:'',
    state:''
  })

interface ErrorResponse {
  errors: { path: string; msg: string }[];
}

  useEffect(() => { 
    document.title = "Owner - Signup";
    if (token) {
      navigate("/owner-dashboard");
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    } else null;
  }, []);


  const handleChange = (e:any) => {
    setSignupData({...signupData,[e.target.name]:e.target.value})
  }


const handleSignup =(e:React.FormEvent)=>{
e.preventDefault();
console.log(signupData);

    axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/owner`,signupData)
    .then(res=>{console.log(res.data)
      if(res.status==201){
        navigate("/owner-login");
      }
    }
  )
   .catch((err: AxiosError) => {
  setErrMsg({});  
 const errObj: { [key: string]: string } = {};

 if (err && err.response && err.response.data && (err.response.data as ErrorResponse).errors) {
  (err.response.data as ErrorResponse).errors.forEach((error) => {
    errObj[error.path] = error.msg;
  });
  setErrMsg(errObj);
}
  if (errMsg) console.log(errMsg)
})
  

    
}





  return (
    <>
      <div className="flex flex-row justify-around items-center h-20 border-b-indigo-400 bg-white">
        <div>
          {" "}
          <img
            src={truckIcon}
            loading="lazy"
            className="w-15 h-20"
            alt="tailus logo"
            onClick={()=>navigate("/")}
          />{" "}
        </div>
        <div className="text-xs md:text-xl sm:text-xl">
          Already Registered?
          <a  className="text-cyan-600 font-bold cursor-pointer" onClick={()=>navigate("/owner-login")}>
            {" "}
            Login{" "}
          </a>
          here.
        </div>
      </div>

      {(
        <div className="h-screen relative pt-3 bg-gradient-to-br from-sky-50 to-gray-200">
          <div className="relative container m-auto px-6 text-gray-600 md:px-12 xl:px-40">
            <div className="m-auto md:w-8/12 lg:w-6/12 xl:w-6/12">
              <div className="rounded-xl bg-white shadow-xl">
                <div className="p-5 sm:p-6">
                  <form > 
                    <div className="border-2 rounded-md shadow-md bg-white flex flex-col gap-2 md:max-h-[500px] p-3 md:p-5 md:overflow-auto  scrollbar-hide">
                      <label>First Name:</label>
                      <input
                        className="border rounded-xl p-2 h-8 bg-gray-50"
                        type="text"
                        name="firstName"
                        placeholder="Enter Your First Name"
                        onChange={handleChange}
                        required
                      /> {errMsg.firstName && <p className="error text-xs text-red-600">{errMsg.firstName}</p>}

                      <label>Last Name:</label>
                      <input
                        className="border rounded-xl p-2 h-8 bg-gray-50"
                        type="text"
                        name="lastName"
                        placeholder="Enter Your Last Name"
                        onChange={handleChange}
                        required
                      /> {errMsg.lastName && <p className="error text-xs text-red-600">{errMsg.lastName}</p>}

                      <label>Contact Number:</label>
                      <input
                        className="border rounded-xl p-2 h-8 bg-gray-50"
                        type="number"
                        name="contactNumber"
                        placeholder="Enter Your Contact Number"
                        onChange={handleChange}
                        required
                      />
                  {errMsg.contactNumber && <p className="error text-xs text-red-600">{errMsg.contactNumber}</p>}

                    

                      <label>Password:</label>
                      <input
                        className="border rounded-xl p-2 h-8 bg-gray-50"
                        type="password"
                        name="password"
                        placeholder="Enter Your Password"
                        onChange={handleChange}
                        required
                      />
                           {errMsg.password && <p className="error text-xs text-red-600">{errMsg.password}</p>}
                           <label>Address:</label>
                        <input
                        className="border rounded-xl p-2 h-8 bg-gray-50"
                        type="text"
                        name="street"
                        placeholder="street"
                        onChange={handleChange}
                        required
                      /> {errMsg.street && <p className="error text-xs text-red-600">{errMsg.street}</p>}
                             <input
                        className="border rounded-xl p-2 h-8 bg-gray-50"
                        type="text"
                        name="city"
                        placeholder="city"
                        onChange={handleChange}
                        required
                      /> {errMsg.city && <p className="error text-xs text-red-600">{errMsg.city}</p>}
                             <input
                        className="border rounded-xl p-2 h-8 bg-gray-50"
                        type="text"
                        name="state"
                        placeholder="state"
                        onChange={handleChange}
                        required
                      /> {errMsg.state && <p className="error text-xs text-red-600">{errMsg.state}</p>}

<label>Age:</label>
                      <input
                        className="border rounded-xl p-2 h-8 bg-gray-50"
                        type="number"
                        name="age"
                        placeholder="Enter Your Age"
                        onChange={handleChange}
                        required
                      /> {errMsg.age && <p className="error text-xs text-red-600">{errMsg.age}</p>}
                   
                    </div>
                    <p className="mt-2 md:mt-4"></p>
                    <button
                      onClick={handleSignup}
                      className={btnCss}
                    >
                      Sign Up
                    </button>
                  </form>

                  <div className="flex-col flex mt-5">
                    <p className="m-auto">
                      Already have an Account ?{" "}
                          <a  className="font-bold cursor-pointer underline text-slate-600 " onClick={()=>navigate("/owner-login")}>
                        Login Now
                      </a>
                    </p>
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

export default Osignup;