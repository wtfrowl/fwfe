import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { InlineMessage } from "../../components/ui/InlineMessage";
import { SegmentedControl, type Segment } from "../../components/ui/SegmentedControl";
import { RevealGroup, RevealItem } from "../../motion/Reveal";
import { getTrucks } from "../../api";
import {
  ComplianceAPI,
  FuelAPI,
  MaintenanceAPI,
  type ComplianceItem,
  type FuelTruckRow,
  type MaintenanceSchedule,
} from "../../api/fleetHealth.api";
import { ComplianceList } from "./components/ComplianceList";
import { FuelEconomyPanel } from "./components/FuelEconomyPanel";
import { ServiceSchedulePanel } from "./components/ServiceSchedulePanel";

/**
 * Fleet health.
 *
 * Three questions that were previously unanswerable in this product, and that
 * belong together because they share one failure mode — a truck stops
 * earning:
 *
 *   - What lapses soon, and is anything already expired?
 *   - What needs servicing, by distance as well as by date?
 *   - Which trucks are burning more diesel than they should?
 *
 * Kept as one page with sections rather than three routes: an owner opening
 * this is asking "what needs my attention", not "show me the maintenance
 * module", and splitting it would mean checking three places to get one
 * answer.
 */

type SectionId = "compliance" | "service" | "fuel";

interface TruckLite {
  _id: string;
  registrationNumber: string;
  totalKm?: number;
}

const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

function SummaryTile({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone?: string;
}) {
  return (
    <div className="h-full rounded-card border border-hairline bg-surface p-5 shadow-[var(--shadow-raised)]">
      <p className="text-caption text-sm text-ink-secondary">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold tabular-nums tracking-[-0.02em] ${
          tone ?? "text-ink"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-ink-tertiary">{note}</p>
    </div>
  );
}

export default function FleetHealth() {
  const location = useLocation();
  const navigate = useNavigate();

  const [trucks, setTrucks] = useState<TruckLite[]>([]);
  const [compliance, setCompliance] = useState<{
    items: ComplianceItem[];
    summary: any;
    coverage: any;
  } | null>(null);
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [fuel, setFuel] = useState<{ summary: any; trucks: FuelTruckRow[] } | null>(null);
  const [horizon, setHorizon] = useState(60);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      /* All four in parallel. Sequentially this is four round trips before
         anything renders, and the sections do not depend on each other. */
      const [truckRes, complianceRes, scheduleRes, fuelRes] = await Promise.all([
        getTrucks(),
        ComplianceAPI.getCalendar(horizon),
        MaintenanceAPI.getSchedules(),
        FuelAPI.getFleetEfficiency(),
      ]);

      setTrucks(((truckRes as any)?.trucks ?? []) as TruckLite[]);
      setCompliance({
        items: complianceRes.items,
        summary: complianceRes.summary,
        coverage: complianceRes.coverage,
      });
      setSchedules(scheduleRes.schedules ?? []);
      setFuel({ summary: fuelRes.summary, trucks: fuelRes.trucks ?? [] });
    } catch (err) {
      console.error("Failed to load fleet health:", err);
      setError("Fleet health could not be loaded right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [horizon]);

  useEffect(() => {
    void load();
  }, [load]);

  const sections: Segment<SectionId>[] = [
    { label: "Expiring", value: "compliance" },
    { label: "Servicing", value: "service" },
    { label: "Fuel", value: "fuel" },
  ];

  const activeSection = (location.hash.replace("#", "") || "compliance") as SectionId;

  const dueCounts = useMemo(() => {
    const due = schedules.filter((s) =>
      ["due-soon", "due", "overdue"].includes(s.due.state)
    );
    return {
      total: due.length,
      overdue: due.filter((s) => s.due.state === "overdue").length,
    };
  }, [schedules]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="h-9 w-56 animate-pulse rounded-chip bg-ink/8" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-card bg-ink/6" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-card bg-ink/6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl space-y-5">
        <PageHeader title="Fleet health" />
        <InlineMessage tone="error">{error}</InlineMessage>
      </div>
    );
  }

  const expired = compliance?.summary?.expired ?? 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Fleet health"
        description="What lapses, what needs servicing, and what is burning more diesel than it should."
      />

      {/* The one line that earns the page. Anything expired is a truck that
          can be stopped at a checkpoint today, so it leads — above the
          navigation, not inside a tab the reader has to find. */}
      {expired > 0 && (
        <InlineMessage tone="error">
          {expired} item{expired === 1 ? "" : "s"} already expired
          {compliance?.summary?.trucksAffected
            ? `, affecting ${compliance.summary.trucksAffected} truck${
                compliance.summary.trucksAffected === 1 ? "" : "s"
              }`
            : ""}
          . These are the ones that stop a vehicle.
        </InlineMessage>
      )}

      <RevealGroup className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <RevealItem>
          <SummaryTile
            label="Expired"
            value={String(expired)}
            note="Documents, licences and services past due"
            tone={expired > 0 ? "text-critical-ink" : "text-ink"}
          />
        </RevealItem>
        <RevealItem>
          <SummaryTile
            label="Lapsing soon"
            value={String(compliance?.summary?.critical ?? 0)}
            note={`Within 7 days · ${horizon}-day window`}
            tone={(compliance?.summary?.critical ?? 0) > 0 ? "text-caution-ink" : "text-ink"}
          />
        </RevealItem>
        <RevealItem>
          <SummaryTile
            label="Services due"
            value={String(dueCounts.total)}
            note={
              dueCounts.overdue
                ? `${dueCounts.overdue} already overdue`
                : `${schedules.length} schedule${schedules.length === 1 ? "" : "s"} tracked`
            }
            tone={dueCounts.overdue > 0 ? "text-critical-ink" : "text-ink"}
          />
        </RevealItem>
        <RevealItem>
          <SummaryTile
            label="Fleet mileage"
            value={fuel?.summary?.kmpl == null ? "—" : `${fuel.summary.kmpl.toFixed(2)} kmpl`}
            note={
              fuel?.summary?.fuelCostPerKm == null
                ? "Log diesel litres and distances to measure"
                : `${rupees(fuel.summary.fuelCostPerKm)} per km on fuel`
            }
          />
        </RevealItem>
      </RevealGroup>

      <div className="sticky top-16 z-10 -mx-1 px-1 py-2">
        <SegmentedControl
          segments={sections}
          value={activeSection}
          onChange={(id) => navigate({ hash: `#${id}` })}
          className="material-thin shadow-[var(--shadow-hairline)] ring-1 ring-hairline"
        />
      </div>

      {activeSection === "compliance" && (
        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink">Expiring</h2>
              <p className="text-sm text-ink-secondary">
                Truck paperwork, driver licences and services, in one order of urgency.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-secondary">
              Look ahead
              <select
                value={horizon}
                onChange={(e) => setHorizon(Number(e.target.value))}
                className="rounded-control border border-hairline bg-surface px-2 py-1 text-sm"
              >
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
                <option value={180}>6 months</option>
              </select>
            </label>
          </div>

          {/* Coverage, not just findings. "Nothing is expiring" means something
              very different when no paperwork has been uploaded at all, and a
              clean list that is clean because it is empty is the most
              dangerous screen in a compliance tool. */}
          {compliance?.coverage && (
            <p className="text-xs text-ink-tertiary">
              Watching {compliance.coverage.trucksWithDocuments} of {compliance.coverage.trucks}{" "}
              trucks with documents on file, {compliance.coverage.driversWithLicenceExpiry} of{" "}
              {compliance.coverage.drivers} drivers with a licence expiry recorded, and{" "}
              {compliance.coverage.schedulesTotal} service schedule
              {compliance.coverage.schedulesTotal === 1 ? "" : "s"}.
            </p>
          )}

          <ComplianceList items={compliance?.items ?? []} />
        </section>
      )}

      {activeSection === "service" && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">Servicing</h2>
            <p className="text-sm text-ink-secondary">
              Distance- and time-based schedules. Alerts fire before a service falls due, not after.
            </p>
          </div>
          <ServiceSchedulePanel schedules={schedules} trucks={trucks} onChanged={load} />
        </section>
      )}

      {activeSection === "fuel" && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">Fuel</h2>
            <p className="text-sm text-ink-secondary">
              Kilometres per litre from approved diesel entries and recorded trip distances.
            </p>
          </div>
          {fuel && <FuelEconomyPanel summary={fuel.summary} trucks={fuel.trucks} />}
        </section>
      )}
    </div>
  );
}
