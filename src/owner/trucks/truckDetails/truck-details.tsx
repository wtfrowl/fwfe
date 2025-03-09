import { StatusBadge } from "./components/status-badge";
import { MetricCard } from "./components/metric-card";
import { TripsTable } from "./components/trips-table";
import { CurrentTripCard } from "./components/current-trip-card";
import { FaArrowLeft } from "react-icons/fa";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import { LoadingSpinner } from "../../trips/components/loading-spinner";

export default function TruckDetails() {
  const { regNo } = useParams(); // Extract regNo from the URL
  const [truckDetails, setTruckDetails] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTruckDetails = async () => {
      const token = Cookies.get("ownerToken");
      let parsedToken:any = "";

      if (token) {
        try {
          parsedToken = JSON.parse(token);
        } catch (error) {
          console.error("Invalid token format:", error);
          setError("Failed to parse token.");
          setLoading(false);
          console.log(error);
          return;
        }
      }

      const config = {
        headers: {
          "Content-Type": "application/json",
          authorization: parsedToken ? parsedToken?.accessToken : "",
        },
      };

      try {
        // Log the API request URL for debugging
        console.log(`Fetching data from: http://localhost:5000/api/info/getMyTruckDetails/${regNo}`);
        
        const response = await axios.get(
          `http://localhost:5000/api/info/getMyTruckDetails/${regNo}`,
          config
        );

        console.log("Response data:", response.data);

        setTruckDetails(response.data);
      } catch (err:any) {
        console.error("Truck details fetch failed:", err.response || err.message || err);
        setError("Failed to fetch truck details.");
      } finally {
        setLoading(false);
      }
    };

    if (regNo) fetchTruckDetails();
  }, [regNo]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Truck #{truckDetails.id}</h1>
              <p className="text-sm text-gray-500">Get all Details of Truck</p>
            </div>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"  onClick={() => window.history.back()} >
              <FaArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {error && <p className="text-red-500">{error}</p>} 

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{truckDetails._id}</h2>
                  <p className="text-sm text-gray-500">{truckDetails.lastUpdated}</p>
                  <p className="text-sm text-gray-600 mt-2">{truckDetails.location}</p>
                </div>
                <div className="flex-shrink-0">
                  <StatusBadge status="Stopped" duration={truckDetails.stoppedDuration} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <MetricCard
                  label="Ignition"
                  value={truckDetails.ignition}
                  valueColor={truckDetails.ignition === "ON" ? "text-green-600" : "text-red-600"}
                />
                <MetricCard label="Speed" value={`${truckDetails.currentSpeed} km/h`} />
                <MetricCard label="Travelled Today" value={`${truckDetails.travelledToday} km`} />
              </div>
            </div>
          </div>
          {loading ? (<>
<LoadingSpinner/>
</>):(
  <>       
      { <CurrentTripCard trip={truckDetails.currentTrip} />}
  </>)
  }
      
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Recently Completed Trips</h2>
          <div className="bg-white rounded-lg shadow">
            

{loading ? (<>
<LoadingSpinner/>
</>):(
  <>       
      {truckDetails.trips  &&   <TripsTable trips={truckDetails.trips} />}
  </>)
  }
          </div>
        </div>
      </div>
    </div>
  );
}
