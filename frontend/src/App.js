import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Players from './pages/Players';
import PlayerProfile from './pages/PlayerProfile';
import Compare from './pages/Compare';
import SmartSearch from './pages/SmartSearch';
import Lab from './pages/Lab';
import Dataset from './pages/Dataset';
import Captains from './pages/Captains';
import TeamStudio from './pages/TeamStudio';
import Discover from './pages/Discover';
import { Toaster } from './components/ui/sonner';
import './App.css';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/players" element={<Players />} />
            <Route path="/players/:format/:id" element={<PlayerProfile />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/search" element={<SmartSearch />} />
            <Route path="/lab" element={<Lab />} />
            <Route path="/dataset" element={<Dataset />} />
            <Route path="/captains" element={<Captains />} />
            <Route path="/team-builder" element={<TeamStudio mode="builder" />} />
            <Route path="/best-xi" element={<TeamStudio mode="optimizer" />} />
            <Route path="/discover" element={<Discover />} />
          </Routes>
        </Layout>
        <Toaster richColors position="top-right" />
      </BrowserRouter>
    </div>
  );
}

export default App;
