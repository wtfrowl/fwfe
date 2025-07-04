import './App.css';

import { Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <Routes>
      {/* Owner Routes */}
      <Route path="/" element={<WebHome/>} />
       <Route path="/owner-login" element={<Login />} />
       <Route path="/driver-signup" element={<Signup/>} />
      <Route path="/owner-signup" element={<Signup />} />
      <Route path="/driver-login" element={<Login />} />


{/* Owner Routes */}
      <Route
        path="/owner-home"
        element={
          <ProtectedRoute role="owner">
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
       

        <Route index element={<Dashboard />} />
        <Route path="mytrucks" element={<OwnerTrucks />} />
        <Route path="mytrucks/:regNo" element={<TruckDetails />} />
        <Route path="trips" element={<Trips />} />
        <Route path="trips/:id" element={<TripDetails />} />
        <Route path="mydocs" element={<Documents />} />
        <Route path="mydocs/documents/:id" element={<DocumentPreviewPage />} />
        <Route path="owner-profile" element={<ProfileSettings />} />
      </Route>

      {/* Driver Routes */}
    
      <Route
        path="/driver-home"
        element={
          <ProtectedRoute role="driver">
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
         <Route path="mytrucks" element={<OwnerTrucks />} />
        <Route path="mytrucks/:regNo" element={<TruckDetails />} />
        <Route path="mydocs" element={<Documents />} />
        <Route path="mydocs/documents/:id" element={<DocumentPreviewPage />} />
          <Route path="trips" element={<Trips />} />
        <Route path="trips/:id" element={<TripDetails />} />
        <Route path="driver-profile" element={<ProfileSettings />} />
      </Route>
      <Route path="*" element={<div>404 Page Not Found</div>} />

    </Routes>
  );
}

export default App;
