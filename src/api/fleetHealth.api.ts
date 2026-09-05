import api from "./axios";

/**
 * Service schedules, service history, the compliance calendar and fuel
 * economy — the four things that answer "is this fleet actually healthy".
 */

export interface DueStatus {
  state: "ok" | "due-soon" | "due" | "overdue" | "unknown";
  kmRemaining: number | null;
  daysRemaining: number | null;
  dueAtKm: number | null;
  dueAtDate: string | null;
  urgency: number;
}

export interface MaintenanceSchedule {
  _id: string;
  truck: string;
  registrationNumber: string;
  task: string;
  label?: string;
  intervalKm?: number;
  intervalDays?: number;
  lastServiceKm: number | null;
  lastServiceDate: string | null;
  warnAheadKm: number;
  warnAheadDays: number;
  active: boolean;
  odometer: number | null;
  due: DueStatus;
}

export interface MaintenanceRecord {
  _id: string;
  registrationNumber: string;
  task: string;
  servicedAt: string;
  odometer: number | null;
  cost: number;
  vendorName?: string;
  downtimeHours: number;
  unplanned: boolean;
  notes?: string;
  parts?: { name: string; quantity: number; cost: number }[];
}

export interface ComplianceItem {
  kind: "document" | "driver" | "maintenance";
  subject: string;
  subjectId: string;
  what: string;
  dueDate: string | null;
  daysRemaining: number | null;
  kmRemaining: number | null;
  severity: "ok" | "warning" | "critical" | "expired";
  entityId: string;
}

export interface FuelTruckRow {
  registrationNumber: string;
  model: string;
  bodyType?: string;
  odometer?: number;
  totalTrips: number;
  totalKm: number;
  dieselLitres: number;
  fuelSpend: number;
  pendingFuelSpend: number;
  tripsMissingDistance: number;
  unmeasuredLitres: number;
  kmpl: number | null;
  fuelCostPerKm: number | null;
  reliable: boolean;
}

export const MaintenanceAPI = {
  getTasks: () => api.get("/api/maintenance/tasks") as unknown as Promise<{ tasks: string[] }>,

  getDue: () =>
    api.get("/api/maintenance/due") as unknown as Promise<{
      total: number;
      overdue: number;
      due: number;
      dueSoon: number;
      items: MaintenanceSchedule[];
    }>,

  getSchedules: (truckId?: string) =>
    api.get("/api/maintenance/schedules", {
      params: truckId ? { truckId } : undefined,
    }) as unknown as Promise<{ schedules: MaintenanceSchedule[] }>,

  createSchedule: (data: Record<string, unknown>) =>
    api.post("/api/maintenance/schedules", data) as unknown as Promise<MaintenanceSchedule>,

  updateSchedule: (id: string, data: Record<string, unknown>) =>
    api.patch(`/api/maintenance/schedules/${id}`, data) as unknown as Promise<MaintenanceSchedule>,

  retireSchedule: (id: string) => api.delete(`/api/maintenance/schedules/${id}`),

  getRecords: (truckId?: string, page = 1) =>
    api.get("/api/maintenance/records", {
      params: { ...(truckId ? { truckId } : {}), page },
    }) as unknown as Promise<{
      records: MaintenanceRecord[];
      total: number;
      totalPages: number;
      summary: {
        totalCost: number;
        totalDowntimeHours: number;
        unplannedCount: number;
        plannedCount: number;
      };
    }>,

  logService: (data: Record<string, unknown>) =>
    api.post("/api/maintenance/records", data) as unknown as Promise<MaintenanceRecord>,
};

export const ComplianceAPI = {
  /* `days` is the look-ahead window. Anything already expired comes back
     regardless of it — that is decided on the server, so no caller can
     accidentally hide the rows that matter most. */
  getCalendar: (days = 60) =>
    api.get("/api/compliance/calendar", { params: { days } }) as unknown as Promise<{
      horizonDays: number;
      summary: {
        total: number;
        expired: number;
        critical: number;
        warning: number;
        documents: number;
        drivers: number;
        maintenance: number;
        trucksAffected: number;
      };
      items: ComplianceItem[];
      coverage: {
        trucks: number;
        trucksWithDocuments: number;
        drivers: number;
        driversWithLicenceExpiry: number;
        trucksWithSchedules: number;
        schedulesTotal: number;
      };
    }>,
};

export const FuelAPI = {
  getFleetEfficiency: (params?: { from?: string; to?: string }) =>
    api.get("/api/stats/fuel-efficiency", { params }) as unknown as Promise<{
      summary: {
        totalKm: number;
        dieselLitres: number;
        fuelSpend: number;
        pendingFuelSpend: number;
        tripsMissingDistance: number;
        kmpl: number | null;
        fuelCostPerKm: number | null;
        trucksMeasured: number;
        trucksTotal: number;
      };
      trucks: FuelTruckRow[];
    }>,

  getTrend: (period: "DAY" | "MONTH" | "YEAR" = "MONTH", registrationNumber?: string) =>
    api.get("/api/stats/fuel-efficiency/trend", {
      params: { period, ...(registrationNumber ? { registrationNumber } : {}) },
    }) as unknown as Promise<
      {
        dateKey: { year: number; month?: number; day?: number };
        trips: number;
        totalKm: number;
        dieselLitres: number;
        fuelSpend: number;
        kmpl: number | null;
        fuelCostPerKm: number | null;
        value: number;
      }[]
    >,
};
