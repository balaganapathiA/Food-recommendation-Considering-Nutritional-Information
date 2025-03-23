import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MacronutrientChart from "../components/MacronutrientChart";
import UserProfile from "../components/UserProfile";
import Challenges from "../components/Challanges";
import Forum from "../components/Forum";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  List,
  ListItem,
  ListItemText,
  TextField,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [foods, setFoods] = useState({});
  const [healthData, setHealthData] = useState({});
  const navigate = useNavigate();
  const [WHtR, setWHtR] = useState(null);
  const [DailyCalories, setDailyCalories] = useState(null);
  const [Category, setCategory] = useState(null);
  const [BMR, setBMR] = useState(null);
  const [BMI, setBMI] = useState(null);
  const [BFP, setBFP] = useState(null);
  const [loggedMeals, setLoggedMeals] = useState([]);
  const [totalCaloriesConsumed, setTotalCaloriesConsumed] = useState(0);
  const [remainingCalories, setRemainingCalories] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [showGoalAchieved, setShowGoalAchieved] = useState(false); // State for showing the goal achieved message

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Fetch user data
    fetch("http://localhost:5001/api/dashboard", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          alert("Session Expired.Plz Re-login ");
          navigate("/login");
        } else {
          setUserData(data.user);
        }
      })
      .catch(() => navigate("/login"));

    // Fetch food recommendations and health data
    fetch("http://localhost:5001/api/recommend", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.foods) {
          setFoods(data.foods);
        }
        setBFP(data.BFP);
        setBMI(data.BMI);
        setBMR(data.BMR);
        setCategory(data.Category);
        setDailyCalories(data.DailyCalories);
        setWHtR(data.WHtR);
      })
      .catch((err) => console.error("Error fetching foods:", err));
  }, [navigate]);

  useEffect(() => {
    if (!userData?._id) return;

    const token = localStorage.getItem("token");
    fetch(`http://localhost:5001/api/loggedMeals/${userData._id}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setLoggedMeals(Array.isArray(data.loggedMeals) ? data.loggedMeals : []);
        setTotalCaloriesConsumed(data.totalCaloriesConsumed || 0);
        setRemainingCalories((DailyCalories || 0) - (data.totalCaloriesConsumed || 0));
      });
  }, [userData, DailyCalories]);

  useEffect(() => {
    if (!userData?._id) return;

    // console.log(userData._id)
    fetch(`http://localhost:5001/api/loggedMeals/${userData._id}/${selectedDate}`)
      .then((res) => res.json())
      .then((data) => setLoggedMeals(data.loggedMeals))
      .catch((err) => console.log(err));
  }, [userData, selectedDate]);

  const logMeal = (food, calories) => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:5001/api/logMeal", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId: userData?._id, food, calories }),
    })
      .then((res) => res.json())
      .then((data) => {
        setLoggedMeals(data.loggedMeals);
        const newTotalCalories = data.loggedMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
        if (newTotalCalories > DailyCalories) {
          setShowGoalAchieved(true); // Show the goal achieved message
        }
        setTotalCaloriesConsumed(newTotalCalories);
        setRemainingCalories((DailyCalories || 0) - newTotalCalories);
      });
  };

  const removeMeal = (food) => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:5001/api/removeMeal", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId: userData?._id, food }),
    })
      .then((res) => res.json())
      .then((data) => {
        setLoggedMeals(data.loggedMeals);
        const newTotalCalories = data.loggedMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
        setTotalCaloriesConsumed(newTotalCalories);
        setRemainingCalories((DailyCalories || 0) - newTotalCalories);
      });
  };

  const handleCloseGoalAchieved = () => {
    setShowGoalAchieved(false); // Hide the goal achieved message
  };

  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Dashboard
          </Typography>
          <Button color="inherit" onClick={() => { localStorage.removeItem("token"); navigate("/login"); }}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container>
        <Typography variant="h4" gutterBottom>
          Welcome {userData?.name}
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Your Health Metrics
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText primary="BMI" secondary={BMI} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="BFP" secondary={BFP} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="BMR" secondary={BMR} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="WHtR" secondary={WHtR} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Daily Calories" secondary={DailyCalories} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Total Calories Consumed" secondary={`${totalCaloriesConsumed} cal`} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Remaining Calories" secondary={`${remainingCalories >= 0 ? remainingCalories : 0} cal`} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Category" secondary={Category} />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Food Recommendations
                </Typography>
                {foods.Breakfast ? (
                  <>
                    <Typography variant="h6">Breakfast</Typography>
                    <List>
                      {foods.Breakfast.map((item, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={item.Food_items} secondary={`${item.Calories} cal`} />
                          <Button variant="contained" color="primary" onClick={() => logMeal(item.Food_items, item.Calories)}>
                            Ate
                          </Button>
                        </ListItem>
                      ))}
                    </List>

                    <Typography variant="h6">Lunch</Typography>
                    <List>
                      {foods.Lunch.map((item, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={item.Food_items} secondary={`${item.Calories} cal`} />
                          <Button variant="contained" color="primary" onClick={() => logMeal(item.Food_items, item.Calories)}>
                            Ate
                          </Button>
                        </ListItem>
                      ))}
                    </List>

                    <Typography variant="h6">Dinner</Typography>
                    <List>
                      {foods.Dinner.map((item, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={item.Food_items} secondary={`${item.Calories} cal`} />
                          <Button variant="contained" color="primary" onClick={() => logMeal(item.Food_items, item.Calories)}>
                            Ate
                          </Button>
                        </ListItem>
                      ))}
                    </List>
                  </>
                ) : (
                  <Typography>No recommendations available.</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Logged Meals
                </Typography>
                <TextField
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  fullWidth
                  margin="normal"
                />
                <List>
                  {loggedMeals?.length > 0 ? (
                    loggedMeals.map((meal, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={meal?.food} secondary={`${meal?.calories} cal`} />
                        <IconButton color="error" onClick={() => removeMeal(meal.food)}>
                          <DeleteIcon />
                        </IconButton>
                      </ListItem>
                    ))
                  ) : (
                    <Typography>No meals logged yet.</Typography>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            {userData && <MacronutrientChart userId={userData._id} />}
          </Grid>
        </Grid>

        
      </Container>

      {/* Snackbar for Goal Achieved Message */}
      <Snackbar
        open={showGoalAchieved}
        autoHideDuration={6000} // Auto-hide after 6 seconds
        onClose={handleCloseGoalAchieved}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseGoalAchieved} severity="success" sx={{ width: "100%" }}>
          Congratulations! You completed your today's calorie goal...🔥
        </Alert>
      </Snackbar>
      {/* {userData && <UserProfile userId={userData._id} />}
      {userData &&<Challenges userId={userData._id} />} */}
      {userData && <Forum userId={userData._id} />}
      
    </div>
  );
};

export default Dashboard;