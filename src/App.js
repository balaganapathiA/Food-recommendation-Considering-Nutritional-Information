import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Register, Login } from "./auth";
import Dashboard from "./pages/Dashboard";


const App = () => {
    return (
        <Router>
        <Routes>
        <Route path="/" element={<Dashboard />} />
        {/* <Route path="/" element={<App />} /> */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard"element={<Dashboard />} />
      </Routes>
      </Router>
    );
  };
  
  export default App;