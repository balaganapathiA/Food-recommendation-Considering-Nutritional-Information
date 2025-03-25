import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Register, Login } from "./auth";
import Dashboard from "./pages/Dashboard";
import MacronutrientChart from './components/MacronutrientChart';
import Forum from './components/Forum'; // Import the Forum component
import Foodrecommendations from './pages/Foodrecommendation';
const App = () => {
  // Forum.js
const userId = localStorage.getItem("userId");
// console.log("app"+userId)
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/macronutrient" element={<MacronutrientChart />} />
        <Route path="/recommendation" element={<Foodrecommendations />} />
        <Route path="/forum" element={<Forum userId={userId} />} />
      </Routes>
    </Router>
  );
};

export default App;