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
const [loggedMeals, setLoggedMeals] = useState([]);
const [totalCaloriesConsumed, setTotalCaloriesConsumed] = useState(0);
const [remainingCalories, setRemainingCalories] = useState(null);


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
        console.log(data.foods.Breakfast)
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


  // const [loggedMeals, setLoggedMeals] = useState([]);


  useEffect(() => {
    if (!userData?._id) return;
  
    const token = localStorage.getItem("token");
    fetch(`http://localhost:5001/api/loggedMeals/${userData._id}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        console.log("Fetched Logged Meals (Frontend):", data); // ✅ Debugging log
  
        setLoggedMeals(Array.isArray(data.loggedMeals) ? data.loggedMeals : []); // ✅ Ensure it's an array
        setTotalCaloriesConsumed(data.totalCaloriesConsumed || 0);
        setRemainingCalories((DailyCalories || 0) - (data.totalCaloriesConsumed || 0));
      })
      .catch(err => console.log(err));
  }, [userData, DailyCalories]);
  
  
  
 // ✅ Runs when userData or DailyCalories updates
// ✅ Runs only when `userData` is updated
  
  

const logMeal = (food, calories) => {
  const token = localStorage.getItem("token");
  fetch("http://localhost:5001/api/logMeal", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ userId: userData?._id, food, calories })
  })
    .then(res => res.json())
    .then(data => {
      setLoggedMeals(data.loggedMeals); // ✅ Update logged meals instantly
      const newTotalCalories = data.loggedMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
      setTotalCaloriesConsumed(newTotalCalories); // ✅ Update total calories
      setRemainingCalories((DailyCalories || 0) - newTotalCalories); // ✅ Update remaining calories
    })
    .catch(err => console.log(err));
};




const removeMeal = (food) => {
  const token = localStorage.getItem("token");
  fetch("http://localhost:5001/api/removeMeal", {
    method: "DELETE",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ userId: userData?._id, food })
  })
    .then(res => res.json())
    .then(data => {
      setLoggedMeals(data.loggedMeals); // ✅ Update logged meals immediately
      const newTotalCalories = data.loggedMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
      setTotalCaloriesConsumed(newTotalCalories); // ✅ Update total calories
      setRemainingCalories((DailyCalories || 0) - newTotalCalories); // ✅ Update remaining calories
    })
    .catch(err => console.log(err));
};
  
















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
        <li><strong>Total Calories Consumed:</strong> {totalCaloriesConsumed ? totalCaloriesConsumed + " cal" : "0 cal"}</li>
<li><strong>Remaining Calories:</strong> {remainingCalories >= 0 ? remainingCalories + " cal" : "0 cal"}</li>

  <li><strong>Category:</strong> {Category}</li>
        <li><strong>Category:</strong> {Category}</li>
      </ul>

      <h3>Food Recommendations:</h3>
      {foods.Breakfast ? (
        <>
          <ul>
  {foods.Breakfast.map((item, index) => (
    <li key={index}>
      {item.Food_items} - {item.Calories} cal
      <button onClick={() => logMeal(item.Food_items, item.Calories)}>Ate</button>
    </li>
  ))}</ul>
          <h4>Lunch:</h4>
<ul>
  {foods.Lunch.map((item, index) => (
    <li key={index}>
      {item.Food_items} - {item.Calories} cal
      <button onClick={() => logMeal(item.Food_items, item.Calories)}>Ate</button>
    </li>
  ))}
</ul>

<h4>Dinner:</h4>
<ul>
  {foods.Dinner.map((item, index) => (
    <li key={index}>
      {item.Food_items} - {item.Calories} cal
      <button onClick={() => logMeal(item.Food_items, item.Calories)}>Ate</button>
    </li>
  ))}
</ul>
    </>
      ) : (
        <p>No recommendations available.</p>
      )}

<h3>Logged Meals:</h3>
<ul>
  {loggedMeals?.length > 0 ? (
    loggedMeals.map((meal, index) => (
      <li key={index}>
        {meal?.food} - {meal?.calories} cal 
        <button onClick={() => removeMeal(meal.food)}>Remove</button>
      </li>
    ))
  ) : (
    <p>No meals logged yet.</p>
  )}
</ul>





      <button onClick={() => { 
        localStorage.removeItem("token"); 
        navigate("/login"); 
      }}>Logout</button>
    </div>
  );
};

export default Dashboard;
