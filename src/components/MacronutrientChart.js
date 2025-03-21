 import React, { useState, useEffect } from "react";
 import { useNavigate } from "react-router-dom";
 import { Pie } from "react-chartjs-2";
 import axios from "axios";
 import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
 
 ChartJS.register(ArcElement, Tooltip, Legend);
 
 const MacronutrientChart = ({ userId }) => {
    const [macros, setMacros] = useState({ Fats: 0, Proteins: 0, Carbohydrates: 0 });
  
    useEffect(() => {
      if (!userId) return; // ✅ Prevents running if userId is missing
  
      axios.get(`http://localhost:5001/api/macronutrients/${userId}`)
        .then((response) => setMacros(response.data))
        .catch((error) => console.error("Error fetching macronutrient data", error));
    }, [userId]);
  
    const data = {
      labels: ["Fats", "Proteins", "Carbohydrates"],
      datasets: [{
        data: [macros.Fats, macros.Proteins, macros.Carbohydrates],
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
      }]
    };
  
    return (
      <div style={{ width: "400px", height: "400px", margin: "auto" }}>
        <h4>Macronutrient Breakdown</h4>
        <Pie data={data} options={{ maintainAspectRatio: false }} />
      </div>
    );
  };
  
  export default MacronutrientChart;
  
