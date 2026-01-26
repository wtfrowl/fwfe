export interface ITyre {
  _id: string;
  tyreNumber: string;
  brand: string;
  model: string;
  size: string;
  currentTreadDepth: number;
  status: string;
  position?: string;
  currentTruckId?: string | { _id: string };
}
