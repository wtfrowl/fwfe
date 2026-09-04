import { useCallback, useEffect, useState } from "react";
import { FiPhone, FiStar, FiTruck, FiInfo, FiPackage } from "react-icons/fi";
import { HiOutlineLocationMarker } from "react-icons/hi";
import { MdCalendarToday } from "react-icons/md";
import { api } from "../trips/services/api";
import { api as apiLoad } from "../services/api";
import { AddTripModal } from "../trips/components/add-trip-modal";
import type { Driver } from "../trips/types/api";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { EmptyState } from "../../components/ui/EmptyState";
import { InlineMessage } from "../../components/ui/InlineMessage";
import { RevealGroup, RevealItem } from "../../motion/Reveal";

interface Load {
  _id: string;
  source: string;
  destination: string;
  truckId: string;
  truckReg: string;
  truckModel: string;
  pickupDate: string;
  weight: number;
  price: number;
  matchScore: number;
  distanceKm: number;
  status: string;
  broker: { name: string; contact: string; rating: number };
}

export default function Loads() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);

  const fetchLoads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      /* Both requests are independent, so they go together rather than the
         drivers call being fired and forgotten inside the loads call. */
      const [loadData, driversData] = await Promise.all([
        apiLoad.loads.allLoadForOwner(),
        api.drivers.list(),
      ]);
      setLoads(loadData?.matchedLoads ?? []);
      setDrivers(driversData ?? []);
    } catch (err) {
      console.error("Error fetching loads:", err);
      setError("Could not load matched loads. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoads();
  }, [fetchLoads]);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader
        title="Matched loads"
        description="Loads matched to your trucks by location, availability and capacity."
      />

      <InlineMessage tone="error">{error}</InlineMessage>

      {/* The old pager incremented a page number that was never sent to the
          API and never used to slice the results, so both arrows just
          refetched the same list. Removed rather than left looking functional. */}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-card bg-ink/6" />
          ))}
        </div>
      ) : loads.length === 0 ? (
        <EmptyState
          icon={<FiPackage />}
          title="No matched loads right now"
          description="When a broker posts a load that fits one of your available trucks, it will appear here."
        />
      ) : (
        <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loads.map((load) => (
            <RevealItem key={load._id}>
              <article className="flex h-full flex-col justify-between rounded-card border border-hairline bg-surface p-5 shadow-[var(--shadow-raised)]">
                <div className="space-y-3">
                  <h3 className="flex items-start gap-2 text-base font-semibold text-ink">
                    <HiOutlineLocationMarker className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>
                      {load.source} → {load.destination}
                    </span>
                  </h3>

                  <p className="flex items-center gap-2 text-sm text-ink-secondary">
                    <FiTruck className="h-4 w-4 shrink-0 text-ink-tertiary" />
                    {load.truckModel} ({load.truckReg})
                  </p>

                  <p className="flex items-center gap-2 text-sm text-ink-secondary">
                    <MdCalendarToday className="h-4 w-4 shrink-0 text-ink-tertiary" />
                    {new Date(load.pickupDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>

                  {/* The headline number of the card is the money, so it is
                      typed like a headline instead of buried in a run-on line
                      with the weight and the date. */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-semibold tabular-nums tracking-[-0.02em] text-ink">
                      ₹{load.price.toLocaleString("en-IN")}
                    </span>
                    <span className="text-sm text-ink-tertiary">· {load.weight} T</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-ink-tertiary">
                    <span className="flex items-center gap-1">
                      <FiInfo className="h-3.5 w-3.5" />
                      Match {load.matchScore}
                    </span>
                    <span className="tabular-nums">{load.distanceKm} km</span>
                    <StatusBadge tone="success">{load.status}</StatusBadge>
                  </div>
                </div>

                <div className="mt-4 flex items-end justify-between gap-3 border-t border-hairline pt-4">
                  <div className="min-w-0 text-sm">
                    <p className="truncate font-semibold text-ink">{load.broker.name}</p>
                    <p className="flex items-center gap-1.5 text-ink-tertiary">
                      <FiPhone className="h-3.5 w-3.5" /> {load.broker.contact}
                    </p>
                    <p className="flex items-center gap-1.5 text-ink-tertiary">
                      <FiStar className="h-3.5 w-3.5 text-caution" /> {load.broker.rating}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => setSelectedLoad(load)}>
                    Add trip
                  </Button>
                </div>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
      )}

      <AddTripModal
        /* `isOpen={selectedLoad}` passed an object where a boolean belonged. */
        isOpen={selectedLoad !== null}
        onClose={() => setSelectedLoad(null)}
        onAdd={async (tripData) => {
          await api.trips.create(tripData);
          setSelectedLoad(null);
          await fetchLoads();
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
    </div>
  );
}
