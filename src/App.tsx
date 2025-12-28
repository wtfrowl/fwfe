import './App.css';

import { RouteObject } from 'react-router-dom';
import Dashboard from './app/dashboard/Dashboard.tsx';
import OwnerTrucks from './app/trucks/MyTrucks.tsx';
import Trips from './app/trips/trips.tsx';
import ProfileSettings from './app/profile/profile-settings.tsx';
import TripDetails from './app/trips/tripdetails/tripdetails.tsx';
import Documents from './app/docs/documents.tsx';
import DashboardLayout from './app/DashboardLayout.tsx';
import ProtectedRoute from './ProtectedRoute.tsx';
import DocumentPreviewPage from './app/docs/components/document-preview.tsx';
import TruckDetails from './app/trucks/truckDetails/truck-details.tsx';
import WebHome from './main/WebHome.tsx';
import Login from './app/AppLogin.tsx';
import Signup from './app/AppSignup.tsx';
import Loads from './app/loads/loads.tsx';
import Tyre from './app/tyre/tyre.tsx';
import TyreDetailsPage from './app/tyre/components/tyreDetails.tsx';
import DriversPage from './app/driver/Drivers.tsx';
import DriverDetailsPage from './app/driver/DriverDetails.tsx';

export const routes: RouteObject[] = [
  { path: "/", element: <WebHome /> },
  { path: "/owner-login", element: <Login /> },
  { path: "/driver-signup", element: <Signup /> },
  { path: "/owner-signup", element: <Signup /> },
  { path: "/driver-login", element: <Login /> },
  {
    path: "/owner-home",
    element: (
      <ProtectedRoute role="owner">
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: "loads", element: <Loads /> },
      { path: "mytrucks", element: <OwnerTrucks /> },
      { path: "mytrucks/:regNo", element: <TruckDetails /> },
      { path: "drivers", element: <DriversPage /> },
      {path: "drivers/:id", element: <DriverDetailsPage /> },
      { path: "trips", element: <Trips /> },
       { path: "tyre", element: <Tyre /> },
       { path: "tyre/:id", element: <TyreDetailsPage /> },
      { path: "trips/:id", element: <TripDetails /> },
      { path: "mydocs", element: <Documents /> },
      { path: "mydocs/documents/:id", element: <DocumentPreviewPage /> },
      { path: "owner-profile", element: <ProfileSettings /> },
    ],
  },
  {
    path: "/driver-home",
    element: (
      <ProtectedRoute role="driver">
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: "mytrucks", element: <OwnerTrucks /> },
      { path: "mytrucks/:regNo", element: <TruckDetails /> },
      { path: "mydocs", element: <Documents /> },
      { path: "mydocs/documents/:id", element: <DocumentPreviewPage /> },
      { path: "trips", element: <Trips /> },
      { path: "trips/:id", element: <TripDetails /> },
      { path: "driver-profile", element: <ProfileSettings /> },
    ],
  },
  { path: "*", element: <div>404 Page Not Found</div> },
];
