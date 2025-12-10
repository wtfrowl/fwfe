

const VehicleTableSkeleton = () => {
  return (
    <div className="overflow-x-auto animate-pulse">
      
      {/* --- DESKTOP VIEW --- */}
      <table className="w-full hidden md:table">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3"><div className="h-4 w-24 bg-gray-200 rounded"></div></th>
            <th className="px-4 py-3"><div className="h-4 w-16 bg-gray-200 rounded"></div></th>
            <th className="px-4 py-3"><div className="h-4 w-20 bg-gray-200 rounded"></div></th>
            <th className="px-4 py-3"><div className="h-4 w-24 bg-gray-200 rounded"></div></th>
            <th className="px-4 py-3"><div className="h-4 w-20 bg-gray-200 rounded"></div></th>
            <th className="px-4 py-3"><div className="h-4 w-16 bg-gray-200 rounded"></div></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {[1, 2, 3, 4, 5].map((i) => (
            <tr key={i} className="bg-white">
              <td className="px-4 py-4 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
              </td>
              <td className="px-4 py-4">
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
              </td>
              <td className="px-4 py-4">
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
              </td>
              <td className="px-4 py-4 w-64">
                <div className="h-2 w-full bg-gray-200 rounded-full"></div>
              </td>
              <td className="px-4 py-4">
                <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
              </td>
              <td className="px-4 py-4 flex gap-2">
                <div className="h-8 w-16 bg-gray-200 rounded"></div>
                <div className="h-8 w-16 bg-gray-200 rounded"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* --- MOBILE VIEW --- */}
      <div className="md:hidden space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border rounded-lg bg-white shadow space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
              </div>
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
            </div>
            <div className="h-3 w-40 bg-gray-200 rounded"></div>
            <div className="h-3 w-32 bg-gray-200 rounded"></div>
            <div className="space-y-1">
              <div className="h-3 w-20 bg-gray-200 rounded"></div>
              <div className="h-2 w-full bg-gray-200 rounded"></div>
            </div>
            <div className="flex gap-3 mt-2">
              <div className="h-8 w-16 bg-gray-200 rounded"></div>
              <div className="h-8 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VehicleTableSkeleton;