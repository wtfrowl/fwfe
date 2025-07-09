import { useEffect, useState } from "react";
import { api } from "../../app/trips/services/api";
import { api as apiLoad } from "../services/api";
import { FiPhone, FiStar, FiTruck, FiInfo } from "react-icons/fi";
import { HiOutlineLocationMarker } from "react-icons/hi";
import { MdCalendarToday } from "react-icons/md";
import { AddTripModal } from "../trips/components/add-trip-modal";
import { Driver } from "../trips/types/api";

export default function Loads() {
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedLoad, setSelectedLoad] = useState<any | null>(null);

  const handleCreateTripClick = (load: any) => {
    setSelectedLoad(load);
  };

  const fetchData = async () => {
    try {
      const driversData = await api.drivers.list();
      setDrivers(driversData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchLoads = async () => {
    setLoading(true);
    fetchData();
    try {
      const data = await apiLoad.loads.allLoadForOwner();
      setLoads(data.matchedLoads);
    } catch (err) {
      console.error("Error fetching loads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoads();
  }, [page]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="bg-white rounded shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Matched Loads</h1>
            <p className="text-gray-500">
              Loads matched to your trucks based on location, availability, and capacity.
            </p>
          </div>
        </div>
      </div>

      <AddTripModal
        isOpen={selectedLoad}
        onClose={() => setSelectedLoad(null)}
        onAdd={async (tripData) => {
          await api.trips.create(tripData);
          setSelectedLoad(null);
          fetchLoads();
        }}
        trucks={
          selectedLoad
            ? [
                {
                  _id: selectedLoad.truckId,
                  registrationNumber: selectedLoad.truckReg,
                  model: selectedLoad.truckModel,
                  available: true,
                  status: "Available",
                },
              ]
            : []
        }
        drivers={drivers}
        load={selectedLoad}
      />

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse h-28 w-full bg-gray-200 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded shadow p-4">
       <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
  {loads.map((load: any) => (
    <div
      key={load._id}
      className="bg-white rounded-xl shadow-lg border border-gray-200 p-5 flex flex-col justify-between"
    >
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-blue-700 flex items-center gap-2">
          <HiOutlineLocationMarker className="text-blue-500" />
          {load.source} → {load.destination}
        </h3>

        <p className="text-sm text-gray-600 flex items-center gap-2">
          <FiTruck className="text-purple-500" />
          {load.truckModel} ({load.truckReg})
        </p>

        <p className="text-sm text-gray-600 flex items-center gap-2">
          <MdCalendarToday className="text-purple-400" />
          Pickup: {new Date(load.pickupDate).toLocaleDateString()} • {load.weight} T • ₹{load.price.toLocaleString()}
        </p>

        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <FiInfo className="text-blue-400" />
            Match Score: {load.matchScore}
          </span>
          <span>Distance: {load.distanceKm} km</span>
          <span>
            Status:{" "}
            <span className="bg-green-100 text-green-800 font-medium px-2 py-0.5 text-xs rounded-full">
              {load.status}
            </span>
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t mt-4">
        <div className="text-sm">
          <p className="text-gray-700 font-semibold">{load.broker.name}</p>
          <p className="text-gray-500 flex items-center gap-1">
            <FiPhone className="text-gray-400" /> {load.broker.contact}
          </p>
          <p className="text-gray-500 flex items-center gap-1">
            <FiStar className="text-yellow-500" /> {load.broker.rating}
          </p>
        </div>
        <button
          onClick={() => handleCreateTripClick(load)}
          className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Add Trip
        </button>
      </div>
    </div>
  ))}
</div>

        </div>
      )}

      <div className="mt-8 flex items-center justify-between text-sm">
        <p className="text-gray-500">
          Showing {(page - 1) * limit + 1} – {Math.min(page * limit, loads.length)}
        </p>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            &larr;
          </button>
          <button className="px-3 py-1 border rounded bg-blue-100 text-blue-600" disabled>
            Page {page}
          </button>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => setPage((p) => p + 1)}
            disabled={loads.length < limit}
          >
            &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
