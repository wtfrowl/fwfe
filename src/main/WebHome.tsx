import { Link } from 'react-router-dom';
import truckIcon from '../assets/truck.svg' 
import driverIcon from '../assets/drivericon.svg'
import ownerIcon from '../assets/ownerIcon.svg'
import { useNavigate } from "react-router-dom";



function WebHome() {
    const navigate = useNavigate();
  return (
  <div className="h-screen relative py-16 bg-gradient-to-br from-sky-50 to-gray-200"> 
  <h2 className=" flex justify-center mb-8 text-3xl text-cyan-900 font-bold">Manage Fleet with Ease.</h2>
    <div className="relative container m-auto px-6 text-gray-500 md:px-12 xl:px-40">
        <div className="m-auto md:w-8/12 lg:w-6/12 xl:w-6/12">
            <div className="rounded-xl bg-white shadow-xl">
                <div className="p-6 sm:p-16">
                    <div className="space-y-4">
                        <img src={truckIcon} loading="lazy" className="w-15 h-20" alt="tailus logo"/>
                        <h2 className="mb-8 text-2xl text-cyan-900 font-bold">Track Everything<br/> Login Now.</h2>
                    <div className="mt-16 grid space-y-4">
                    
                     <button className="group h-12 px-6 border-2 border-gray-300 rounded-full transition duration-300 hover:border-blue-400 focus:bg-blue-50 active:bg-blue-100">
                     <Link to="/owner-login">    <div className="relative flex items-center space-x-4 justify-center">
                                <img src={ownerIcon} className="absolute left-0 w-5" alt="fleet owner logo"/>
                                <span className="block w-max font-semibold tracking-wide text-gray-700 text-sm transition duration-300 group-hover:text-blue-600 sm:text-base">Continue as FleetOwner</span>
                            </div></Link>
                        </button>
                   <button className="group h-12 mt-2 px-6 border-2 border-gray-300 rounded-full transition duration-300 
 hover:border-blue-400 focus:bg-blue-50 active:bg-blue-100 disabled:cursor-not-allowed" onClick={() => navigate("/driver-login")} disabled>
                         {/* <Link to="/driver-login"> */}
                          <div className="relative flex items-center space-x-4 justify-center">
                                <img src={driverIcon} className="absolute left-0 w-5" alt="fleet owner logo"/>
                                <span className="block w-max font-semibold tracking-wide text-gray-700 text-sm transition duration-300 group-hover:text-blue-600 sm:text-base">Continue as Driver</span>
                            </div>
                            {/* </Link>  */}
                            </button>
                        </div>
                        
                    </div>

                    <div className="mt-5 md:mt-10 space-y-4 text-gray-600 text-center ">
                        <p className="text-xs">Built by Humans  <a href="#" className="underline">Connect with Us.</a></p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>





  );
}

export default WebHome;