export interface LoginData {
  email?: string;
  password?: string;
  driverId?: string;
}

export interface LoginResponse {
  _id: string;
  firstName: string;
  lastName: string;
  age: number;
  contactNumber: string;
  street: string;
  city: string;
  state: string;
  totalTrucks: number;
  allTrucks: string[];
  role: string;
  __v: number;
  accessToken: string;
}

