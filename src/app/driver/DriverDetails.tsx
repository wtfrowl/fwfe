import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  FaUser,
  FaPhone,
  FaIdCard,
  FaMapMarkerAlt,
  FaClock,
  FaRoute,
} from "react-icons/fa";
import DriverRouteMap from "./components/DriverRouteMap";
import { getDriverById } from "../../api";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { InlineMessage } from "../../components/ui/InlineMessage";
import { RevealGroup, RevealItem } from "../../motion/Reveal";
import {
  DetailPage,
  DetailHeader,
  BackButton,
  DetailSection,
} from "../../components/ui/DetailPage";

interface GeoPoint {
  type: "Point";
  coordinates: number[]; // [longitude, latitude]
}

interface Driver {
  _id: string;
  firstName: string;
  lastName: string;
  age: number;
  contactNumber: string;
  aadharNumber: string;
  license: string;
  totalTrips: number;
  availability: boolean;
  street: string;
  city: string;
  state: string;
  currentLocation?: GeoPoint;
  lastLocationUpdate?: string;
}

interface LocationHistoryItem {
  location: GeoPoint;
  recordedAt: string;
}

const Row = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) => (
  <div className="flex items-center justify-between gap-3 border-b border-hairline/70 pb-2 last:border-0">
    <span className="flex items-center gap-2 text-sm text-ink-secondary">
      {Icon ? <Icon className="h-3 w-3" /> : null}
      {label}
    </span>
    <span className="truncate font-medium text-ink">{value}</span>
  </div>
);

const DriverDetailsPage = () => {
  const { id } = useParams<{ id: string }>();

  const [driver, setDriver] = useState<Driver | null>(null);
  const [history, setHistory] = useState<LocationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDriverDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = (await getDriverById(id!)) as unknown as {
          driver?: Driver;
          locationHistory?: LocationHistoryItem[];
        };
        setDriver(response?.driver ?? null);
        setHistory(response?.locationHistory || []);
      } catch (err) {
        console.error("Error fetching driver details:", err);
        setError("Could not load this driver's details.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDriverDetails();
  }, [id]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return Number.isNaN(date.getTime())
      ? "Unknown"
      : date.toLocaleString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  if (loading) {
    return (
      <DetailPage>
        <header className="flex items-start gap-3">
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-ink/8" />
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-48 animate-pulse rounded-chip bg-ink/8" />
              <div className="h-6 w-24 animate-pulse rounded-full bg-ink/8" />
            </div>
            <div className="h-4 w-40 animate-pulse rounded-chip bg-ink/8" />
          </div>
        </header>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-card bg-ink/6" />
          ))}
        </div>
        <div className="h-[300px] animate-pulse rounded-card bg-ink/6 md:h-[500px]" />
      </DetailPage>
    );
  }

  if (error || !driver) {
    return (
      <DetailPage>
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-2xl font-semibold text-ink">Driver</h1>
        </div>
        <InlineMessage tone="error">{error || "We couldn't find that driver."}</InlineMessage>
      </DetailPage>
    );
  }

  return (
    <DetailPage>
      <DetailHeader
        title={`${driver.firstName} ${driver.lastName}`}
        subtitle={`${driver.city}, ${driver.state}`}
        badge={
          <StatusBadge tone={driver.availability ? "success" : "warning"}>
            {driver.availability ? "Available" : "On a trip"}
          </StatusBadge>
        }
      />

      <RevealGroup className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <RevealItem className="h-full">
          <DetailSection title="Personal details" icon={<FaUser />} className="h-full">
            <div className="flex flex-1 flex-col justify-between">
              <div className="space-y-2.5">
                <Row label="Age" value={`${driver.age} years`} />
                <Row label="Contact" value={driver.contactNumber} icon={FaPhone} />
                <Row label="Licence" value={driver.license} icon={FaIdCard} />
              </div>
              <div className="mt-4 border-t border-hairline pt-3">
                <span className="text-caption block text-xs text-ink-tertiary">Address</span>
                <span className="mt-0.5 block text-sm leading-snug text-ink-secondary">
                  {driver.street}, {driver.city}, {driver.state}
                </span>
              </div>
            </div>
          </DetailSection>
        </RevealItem>

        <RevealItem className="h-full">
          <DetailSection title="Performance" icon={<FaRoute />} className="h-full">
            {/* The old card sat a hardcoded "4.5 ★" next to a real trip count,
                which makes the real number look invented too. Only the number
                the API actually returns is shown. */}
            <div className="flex flex-1 flex-col items-center justify-center py-4 text-center">
              <div className="text-4xl font-semibold tabular-nums tracking-[-0.02em] text-ink">
                {driver.totalTrips}
              </div>
              <div className="text-caption mt-1 text-sm text-ink-secondary">
                {driver.totalTrips === 1 ? "trip completed" : "trips completed"}
              </div>
            </div>
          </DetailSection>
        </RevealItem>

        <RevealItem className="h-full">
          <DetailSection title="Live location" icon={<FaMapMarkerAlt />} className="h-full">
            {driver.currentLocation ? (
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <p className="text-2xl font-medium tabular-nums text-ink">
                    {driver.currentLocation.coordinates[1].toFixed(4)}
                  </p>
                  <p className="text-2xl font-medium tabular-nums text-ink">
                    {driver.currentLocation.coordinates[0].toFixed(4)}
                  </p>
                  <p className="mt-1 text-xs text-ink-tertiary">Latitude, longitude</p>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-control bg-canvas-sunken p-3 text-sm text-ink-secondary">
                  <FaClock className="h-3 w-3 shrink-0 text-ink-tertiary" />
                  <span>
                    Updated{" "}
                    <strong className="font-medium text-ink">
                      {formatDate(driver.lastLocationUpdate)}
                    </strong>
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-ink-quaternary">
                <FaMapMarkerAlt className="h-7 w-7" />
                <p className="text-sm">Location unknown</p>
              </div>
            )}
          </DetailSection>
        </RevealItem>
      </RevealGroup>

      <DetailSection title="Route" icon={<FaRoute />} padded={false}>
        <div className="h-[300px] w-full md:h-[500px]">
        {driver.currentLocation ? (
          <DriverRouteMap history={history} currentLocation={driver.currentLocation} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-canvas-sunken text-ink-quaternary">
            <FaMapMarkerAlt className="h-7 w-7" />
            <p className="text-sm">No location data to map yet</p>
          </div>
        )}
        </div>
      </DetailSection>
    </DetailPage>
  );
};

export default DriverDetailsPage;
