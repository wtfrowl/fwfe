export interface ITruck {
  _id: string;
  regNo: string;
  model: string;
  year: number;
  driver: {
    _id: string;
    name: string;
  };
  status: 'active' | 'inactive' | 'in-shop';
  // Add other properties as needed
}

export interface ITrucksResponse {
  trucks: ITruck[];
  count: number;
}
