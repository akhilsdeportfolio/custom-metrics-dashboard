import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

// Import your pages
import Dashboard from './pages/Dashboard';
import NewDashboard from './pages/NewDashboard';
import CommsDashboard from './pages/CommsDashboard';
import CommsInboundDashboard from './pages/CommsInboundDashboard';
import CommandCenterDashboard from './pages/CommandCenterDashboard';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="bg-gray-800 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <div className="text-xl font-bold">Dashboard App</div>
            <div className="space-x-4">
              <Link to="/" className="hover:text-gray-300">Home</Link>
              <Link to="/dashboard" className="hover:text-gray-300">Dashboard</Link>
              <Link to="/new-dashboard" className="hover:text-gray-300">New Dashboard</Link>
              <Link to="/comms-dashboard" className="hover:text-gray-300">Comms Dashboard</Link>
              <Link to="/comms-inbound-dashboard" className="hover:text-gray-300">Inbound Dashboard</Link>
              <Link to="/command-centre-dashboard" className="hover:text-gray-300">Command Center</Link>
            </div>
          </div>
        </nav>
        
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/new-dashboard" element={<NewDashboard />} />
          <Route path="/comms-dashboard" element={<CommsDashboard />} />
          <Route path="/comms-inbound-dashboard" element={<CommsInboundDashboard />} />
          <Route path="/command-centre-dashboard" element={<CommandCenterDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
