import React, { useMemo } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Polyline, 
  Marker, 
  Popup, 
  useMap, 
  LayersControl // 👈 1. Import LayersControl
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { FaCrosshairs, FaCompressArrowsAlt } from 'react-icons/fa';

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

// --- Map Controller Component ---
const MapControls = ({ 
  centerPosition, 
  routePath 
}: { 
  centerPosition: [number, number], 
  routePath: [number, number][] 
}) => {
  const map = useMap();

  const handleRecenter = () => {
    map.flyTo(centerPosition, 15, { duration: 1.5 });
  };

  const handleFitBounds = () => {
    if (routePath.length > 0) {
      const bounds = L.latLngBounds(routePath);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[400]">
      <button 
        onClick={handleRecenter}
        className="material-thick rounded-control p-2 text-ink-secondary shadow-[var(--shadow-raised)] ring-1 ring-hairline transition-colors duration-150 hover:text-ink"
        title="Center on Truck"
      >
        <FaCrosshairs size={18} className="text-accent" />
      </button>

      <button 
        onClick={handleFitBounds}
        className="material-thick rounded-control p-2 text-ink-secondary shadow-[var(--shadow-raised)] ring-1 ring-hairline transition-colors duration-150 hover:text-ink"
        title="Show Full Route"
      >
        <FaCompressArrowsAlt size={18} className="text-ink-secondary" />
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
    return <div className="flex h-full w-full items-center justify-center bg-canvas-sunken text-sm text-ink-tertiary">No route recorded yet</div>;
  }

  const centerPosition = routePath[routePath.length - 1];

  return (
    <MapContainer 
      center={centerPosition} 
      zoom={13} 
      scrollWheelZoom={false} 
      className="h-full w-full z-0 relative"
    >
      {/* 2. LayersControl acts as the container for the switcher UI. 
             position="topright" places the icon in the top right corner.
      */}
      <LayersControl position="topright">

        {/* --- BASE LAYERS (Radio Buttons - Choose One) --- */}
        
        {/* Standard OpenStreetMap */}
        <LayersControl.BaseLayer checked name="Street Map">
          <TileLayer
           // attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
             attribution='OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>

        {/* Satellite View (using Esri World Imagery) */}
        <LayersControl.BaseLayer name="Satellite">
          <TileLayer
          //Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community
            attribution='Maps'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>



        {/* --- OVERLAYS (Checkboxes - Toggle On/Off) --- */}
        
        {/* We wrap the Polyline in an overlay so users can hide the blue line if they want */}
        <LayersControl.Overlay checked name="Route Path">
          <Polyline 
            positions={routePath} 
            pathOptions={{ color: '#3B82F6', weight: 4, opacity: 0.8 }} 
          />
        </LayersControl.Overlay>

        {/* You can also wrap markers if you want to toggle them */}
        <LayersControl.Overlay checked name="Trip Markers">
            {routePath.length > 0 && (
              <Marker position={routePath[0]} icon={StartIcon}>
                <Popup>Trip Start</Popup>
              </Marker>
            )}
        </LayersControl.Overlay>

      </LayersControl>

      {/* Markers outside of LayersControl will ALWAYS be visible (like the truck) */}
      <Marker position={centerPosition} icon={TruckIcon}>
          <Popup>Current Location</Popup>
      </Marker>

      <MapControls centerPosition={centerPosition} routePath={routePath} />

    </MapContainer>
  );
};

export default DriverRouteMap;