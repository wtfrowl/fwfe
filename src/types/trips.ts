export interface Trip {
  _id: string;
  tripId: string;
  truck: Truck;
  driver: Driver;
  startLocation: string;
  endLocation: string;
  startDate: string;
  endDate: string;
  status: 'Running' | 'Completed' | 'Cancelled';
  // Add other properties as needed
}

export interface Driver {
  _id: string;
  name: string;
}

export interface Truck {
  _id: string;
  regNo: string;
}
