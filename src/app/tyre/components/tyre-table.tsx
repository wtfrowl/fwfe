import { useNavigate } from "react-router-dom"; // 1. Import hook
import { Tyre } from "../tyre";
interface Props {
  tyres: Tyre[];
  userRole: any;
}

export function TyreTable({ tyres }: Props) {
  const navigate = useNavigate(); // 2. Initialize hook

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Spare": return "bg-green-100 text-green-800";
      case "Mounted": return "bg-blue-100 text-blue-800";
      case "Scrapped": return "bg-red-100 text-red-800";
      case "SentForRetreading": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // 3. Create click handler
  const handleRowClick = (tyreId: string) => {
    navigate(`${tyreId}`); // Ensure this route matches your App.tsx route
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tyre No / ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand & Model</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tread Depth</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tyres.map((tyre) => (
            <tr 
              key={tyre._id} 
              className="hover:bg-gray-50 cursor-pointer transition-colors" // Added cursor-pointer
              onClick={() => handleRowClick(tyre._id)} // 4. Attach click event
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="font-medium text-gray-900">{tyre.tyreNumber}</span>
                <div className="text-xs text-gray-500">{tyre.size}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{tyre.brand}</div>
                <div className="text-sm text-gray-500">{tyre.model}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(tyre.status)}`}>
                  {tyre.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {tyre.status === "Mounted" && tyre.currentTruckId ? (
                   <span 
                     className="font-medium text-blue-600 hover:underline z-10 relative"
                     onClick={(e) => {
                       e.stopPropagation(); // Prevent row click if user specifically clicks truck number
                       navigate(`/owner-home/mytrucks/${tyre.currentTruckId?.registrationNumber}`);
                     }}
                   >
                     {tyre.currentTruckId.registrationNumber || "Truck Assigned"}
                   </span>
                ) : (
                   <span>Inventory</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                 <div className="flex items-center">
                    <span className={`text-sm font-bold ${tyre.currentTreadDepth < 3 ? 'text-red-600' : 'text-gray-700'}`}>
                        {tyre.currentTreadDepth} mm
                    </span>
                 </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}