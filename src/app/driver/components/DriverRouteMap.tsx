import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
// Make sure the path is correct relative to this file
import truckSvg from '../../../assets/truck.svg';
// --- Default Leaflet Fix ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- 1. Define Custom Truck Icon ---
const TruckIcon = L.icon({
  // You can replace this URL with your local import: import truckImg from '../assets/truck.png'
  iconUrl: truckSvg,
  iconSize: [40, 40], // Size of the icon
  iconAnchor: [20, 20], // Point of the icon which corresponds to marker's location (center)
  popupAnchor: [0, -20] // Point from which the popup should open relative to the iconAnchor
});

// Start Icon (Green Dot)
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

const DriverRouteMap: React.FC<DriverRouteMapProps> = ({ history, currentLocation }) => {
  
  const routePath = useMemo(() => {
    // Sort oldest to newest
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
      className="h-full w-full z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Route Line */}
      <Polyline 
        positions={routePath} 
        pathOptions={{ color: '#3B82F6', weight: 4, opacity: 0.8 }} 
      />

      {/* Start Marker */}
      {routePath.length > 0 && (
        <Marker position={routePath[0]} icon={StartIcon}>
          <Popup>Trip Start</Popup>
        </Marker>
      )}

      {/* --- 2. Use Truck Icon for Current Location --- */}
      <Marker position={centerPosition} icon={TruckIcon}>
         <Popup>
            <div className="text-center">
              <strong>Current Location</strong><br/>
              Driver is here
            </div>
         </Popup>
      </Marker>

    </MapContainer>
  );
};

export default DriverRouteMap;