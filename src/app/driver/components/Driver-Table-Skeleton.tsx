

export default function DriverTableSkeleton() {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow animate-pulse">
      <div className="min-w-full divide-y divide-gray-200">
        {/* Header Skeleton */}
        <div className="bg-gray-50 h-10 w-full" />
        
        {/* Rows Skeleton */}
        {[...Array(5)].map((_, index) => (
          <div key={index} className="flex items-center px-6 py-4 space-x-4">
            {/* Avatar Circle */}
            <div className="h-10 w-10 rounded-full bg-gray-200" />
            
            {/* Text Lines */}
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/6"></div>
            </div>

            {/* Status Pill */}
            <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
            
            {/* Action Buttons */}
            <div className="flex space-x-2">
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}