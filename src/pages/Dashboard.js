import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [foods, setFoods] = useState({});
  const [healthData, setHealthData] = useState({});
  const navigate = useNavigate();
 const [WHtR,setWHtR]=useState(null);
 const [DailyCalories,setDailyCalories]=useState(null);
 const [Category,setCategory]=useState(null);
const  [BMR,setBMR]=useState(null);
const [BMI,setBMI]=useState(null)
const [BFP,setBFP]=useState(null)




  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Fetch user data
    fetch("http://localhost:5001/api/dashboard", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert(data.error);
          navigate("/login");
        } else {
          setUserData(data.user);
        }
      })
      .catch(() => navigate("/login"));

    // Fetch food recommendations and health data
    fetch("http://localhost:5001/api/recommend", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.foods) {
          setFoods(data.foods);
        }
          setBFP(data.BFP) ,
          setBMI(data.BMI) ,
          setBMR( data.BMR),
          setCategory(data.Category) ,
          setDailyCalories(data.DailyCalories) ,
          setWHtR(data.WHtR) 
        
      })
      .catch(err => console.error("Error fetching foods:", err));
  }, [navigate]);
  return (
    <div>
      <h2>Dashboard</h2>
      {userData ? <p>Welcome {userData.name}</p> : <p>Loading...</p>}

      <h3>Your Health Metrics:</h3>
      <ul>
        <li><strong>BMI:</strong> {BMI}</li>
        <li><strong>BFP:</strong> {BFP}</li>
        <li><strong>BMR:</strong> {BMR}</li>
        <li><strong>WHtR:</strong> {WHtR}</li>
        <li><strong>Daily Calories:</strong> {DailyCalories}</li>
        <li><strong>Category:</strong> {Category}</li>
      </ul>

      <h3>Food Recommendations:</h3>
      {foods.Breakfast ? (
        <>
          <h4>Breakfast:</h4>
          <ul>{foods.Breakfast.map((item, index) => <li key={index}>{item}</li>)}</ul>

          <h4>Lunch:</h4>
          <ul>{foods.Lunch.map((item, index) => <li key={index}>{item}</li>)}</ul>

          <h4>Dinner:</h4>
          <ul>{foods.Dinner.map((item, index) => <li key={index}>{item}</li>)}</ul>
        </>
      ) : (
        <p>No recommendations available.</p>
      )}

      <button onClick={() => { 
        localStorage.removeItem("token"); 
        navigate("/login"); 
      }}>Logout</button>
    </div>
  );
};

export default Dashboard;
