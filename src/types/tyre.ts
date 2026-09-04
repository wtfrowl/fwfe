import type { AxleApplication, TyreStatus } from "../app/tyre/lib/tyre-standards";

export type TyreHistoryAction =
  | "Bought"
  | "Installed"
  | "Dismounted"
  | "Moved"
  | "PunctureRepair"
  | "Rotation"
  | "Inspection"
  | "Retread";

export interface ITyreHistory {
  date: string;
  action: TyreHistoryAction;
  truckId?: { _id: string; registrationNumber?: string } | string | null;
  /** Where the tyre sat for this event — a wheel position code. */
  position?: string | null;
  kmAtAction?: number;
  cost?: number;
  notes?: string;
}

/** The truck reference as the list and detail endpoints populate it. */
export interface ITyreTruckRef {
  _id: string;
  registrationNumber: string;
  model?: string;
}

export interface ITyre {
  _id: string;
  tyreNumber: string;
  brand: string;
  model?: string;
  size: string;
  status: TyreStatus;
  position?: string | null;
  axleApplication?: AxleApplication;

  currentTreadDepth: number;
  initialTreadDepth: number;
  totalKmRun?: number;

  purchaseDate?: string;
  purchasePrice?: number;
  vendorName?: string;

  isRetreaded?: boolean;
  retreadCount?: number;

  currentTruckId?: ITyreTruckRef | string | null;
  history?: ITyreHistory[];

  createdAt?: string;
  updatedAt?: string;
}

/** Payload for adding one tyre to inventory. */
export interface ICreateTyrePayload {
  tyreNumber: string;
  brand: string;
  model?: string;
  size: string;
  purchaseDate: string;
  purchasePrice: number;
  vendorName?: string;
  initialTreadDepth: number;
  axleApplication?: AxleApplication;
}

export interface IMountTyrePayload {
  tyreId: string;
  truckId: string;
  position: string;
  currentKm?: number;
  notes?: string;
}

export interface IDismountTyrePayload {
  tyreId: string;
  reason: "Rotation" | "Puncture" | "Retread" | "Scrap" | "Spare" | "Other";
  currentKm?: number;
  notes?: string;
}

/**
 * Moving a fitted tyre — to another position on the same truck, or onto a
 * different truck — without it passing through the stockroom on the way.
 */
export interface IMoveTyrePayload {
  tyreId: string;
  /** Omit to keep it on the truck it is already on. */
  truckId?: string;
  position: string;
  currentKm?: number;
  notes?: string;
}

export interface IInspectTyrePayload {
  currentTreadDepth: number;
  notes?: string;
}
