import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'; // 👈 Import useMap
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { FaCrosshairs, FaCompressArrowsAlt } from 'react-icons/fa'; // Icons for buttons

// ... (Keep your existing Icon imports and definitions here) ...
import truckSvg from '../../../assets/truck.svg'; 
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const TruckIcon = L.icon({
  iconUrl: truckSvg,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
  className: 'truck-icon-marker'
});

const StartIcon = L.divIcon({
  html: '<div style="background-color: green; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>',
  className: 'custom-div-icon'
});

// --- Types ---
interface GeoPoint {
  type: "Point";
  coordinates: number[];
}

interface LocationHistoryItem {
  location: GeoPoint;
  recordedAt: string;
}

interface DriverRouteMapProps {
  history: LocationHistoryItem[];
  currentLocation?: GeoPoint;
}

// --- 🆕 NEW: Map Controller Component ---
// This must be INSIDE MapContainer to work
const MapControls = ({ 
  centerPosition, 
  routePath 
}: { 
  centerPosition: [number, number], 
  routePath: [number, number][] 
}) => {
  const map = useMap();

  const handleRecenter = () => {
    // Fly to the current location smoothly
    map.flyTo(centerPosition, 15, { duration: 1.5 });
  };

  const handleFitBounds = () => {
    if (routePath.length > 0) {
      // Zoom out to fit the entire blue line
      const bounds = L.latLngBounds(routePath);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  // We use standard HTML/Tailwind for the buttons, floating them with absolute positioning
  // z-[400] is needed because Leaflet tiles are z-0 to z-200
  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[400]">
      
      <button 
        onClick={handleRecenter}
        className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 text-gray-700 border border-gray-200"
        title="Center on Truck"
      >
        <FaCrosshairs size={20} className="text-blue-600" />
      </button>

      <button 
        onClick={handleFitBounds}
        className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 text-gray-700 border border-gray-200"
        title="Show Full Route"
      >
        <FaCompressArrowsAlt size={20} className="text-gray-600" />
      </button>

    </div>
  );
};

// --- Main Component ---
const DriverRouteMap: React.FC<DriverRouteMapProps> = ({ history, currentLocation }) => {
  
  const routePath = useMemo(() => {
    const sortedHistory = [...history].sort((a, b) => 
      new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    );

    const path = sortedHistory.map(item => [
      item.location.coordinates[1], 
      item.location.coordinates[0]
    ] as [number, number]);

    if (currentLocation) {
      path.push([currentLocation.coordinates[1], currentLocation.coordinates[0]]);
    }

    return path;
  }, [history, currentLocation]);

  if (routePath.length === 0) {
    return <div className="h-full w-full bg-gray-100 flex items-center justify-center">No Route Data</div>;
  }

  const centerPosition = routePath[routePath.length - 1];

  return (
    <MapContainer 
      center={centerPosition} 
      zoom={13} 
      scrollWheelZoom={false} 
      className="h-full w-full z-0 relative" // Ensure relative for absolute children
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <Polyline 
        positions={routePath} 
        pathOptions={{ color: '#3B82F6', weight: 4, opacity: 0.8 }} 
      />

      {routePath.length > 0 && (
        <Marker position={routePath[0]} icon={StartIcon}>
          <Popup>Trip Start</Popup>
        </Marker>
      )}

      <Marker position={centerPosition} icon={TruckIcon}>
         <Popup>Current Location</Popup>
      </Marker>

      {/* 🆕 Add the controls here */}
      <MapControls centerPosition={centerPosition} routePath={routePath} />

    </MapContainer>
  );
};

export default DriverRouteMap;