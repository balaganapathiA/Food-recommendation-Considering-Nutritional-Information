import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Register, Login } from "./auth";
import Dashboard from "./pages/Dashboard";
import MacronutrientChart from './components/MacronutrientChart';

const App = () => {
    return (
        <Router>
        <Routes>
        <Route path="/" element={<Dashboard />} />
        {/* <Route path="/" element={<App />} /> */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard"element={<Dashboard />} />
        <Route path="/macronutrient"element={<MacronutrientChart />} />
      </Routes>
      </Router>
    );
  };
  
  export default App;