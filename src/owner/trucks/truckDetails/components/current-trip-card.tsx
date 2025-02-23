import type { CurrentTrip } from "../types/truck"

interface CurrentTripCardProps {
  trip: CurrentTrip
}

export function CurrentTripCard({ trip }: CurrentTripCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
{ trip === null ? <div className="flex items-center justify-center h-40 border rounded-lg">No Current Trip</div> : (

   <div className="space-y-4">
   <div className="flex justify-between items-start">
     <h2 className="text-xl font-semibold">Current Trip for {trip.id}</h2>
     <div className="text-sm text-gray-500">{new Date().toLocaleDateString()}</div>
   </div>

   <div className="space-y-4">
     <div>
       <div className="text-sm text-gray-500">Driver</div>
       <div className="font-medium">{trip.driverContactNumber}</div>
     </div>

     <div>
       <div className="text-sm text-gray-500">Status</div>
       <div className="font-medium">{trip.status}</div>
     </div>

     <div className="grid grid-cols-2 gap-4">
       <div>
         <div className="text-sm text-gray-500">Started On</div>
         <div className="font-medium">{trip.departureDateTime}</div>
       </div>
       <div>
         <div className="text-sm text-gray-500">Speed</div>
         <div className="font-medium">{trip.speed} km/h</div>
       </div>
     </div>

     <div className="grid grid-cols-2 gap-4">
       <div>
         <div className="text-sm text-gray-500">Departure</div>
         <div className="font-medium">{trip.departureLocation}</div>
       </div>
       <div>
         <div className="text-sm text-gray-500">Arrival</div>
         <div className="font-medium">{trip.arrivalLocation}</div>
       </div>
     </div>
   </div>
 </div>
)
     }
    
    </div>
  )
}

