import { useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css'

import WebHome from './main/WebHome.tsx';
import Ologin from './owner/Ologin.tsx';
import OwnerHome from './owner/owner-home.tsx';
import OwnerDashboard from './owner/dashboard/ownerDashboard.tsx';
import OwnerTrucks from './owner/trucks/ownerTrucks.tsx';
import TruckDetails from './owner/trucks/truckDetails/truck-details.tsx';
import Trips from './owner/trips/trips.tsx';
import ProfileSettings from './owner/profile/profile-settings.tsx';
import TripDetails from './owner/trips/tripdetails/tripdetails.tsx';

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Router>
      <Routes>
        <Route path="/" element={<WebHome/>} />
        <Route path="/owner-login" element={<Ologin/>} />
        <Route path="/owner-home" element={<OwnerHome />}>
            <Route index element={<OwnerDashboard />} />
            <Route path="mytrucks" element={<OwnerTrucks />} />
            <Route path="mytrucks/:regNo" element={<TruckDetails />} /> {/* Dynamic route for Truck Info */}
            <Route path="trips" element={<Trips />} />
            <Route path="trips/:id" element={<TripDetails />} />
            <Route path ="owner-profile" element={<ProfileSettings/>}></Route>
        </Route>
        </Routes>
    </Router>
    </>
  )
}

export default App
