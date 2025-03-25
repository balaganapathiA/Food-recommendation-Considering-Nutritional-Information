import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  Grid,
  Card,
  CardContent,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";

const Foodrecommendations = () => {
  const [userData, setUserData] = useState(null);
  const [foods, setFoods] = useState({ Breakfast: [], Lunch: [], Dinner: [] });
  const navigate = useNavigate();
  const [WHtR, setWHtR] = useState(null);
  const [DailyCalories, setDailyCalories] = useState(null);
  const [BMR, setBMR] = useState(null);
  const [BMI, setBMI] = useState(null);
  const [BFP, setBFP] = useState(null);
  const [category, setCategory] = useState(null);
  const [loggedMeals, setLoggedMeals] = useState([]);
  const [totalCaloriesConsumed, setTotalCaloriesConsumed] = useState(0);
  const [remainingCalories, setRemainingCalories] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [showGoalAchieved, setShowGoalAchieved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      .then((res) => {
        if (!res.ok) throw new Error("Session expired");
        return res.json();
      })
      .then((data) => {
        setUserData(data.user);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        navigate("/login");
      });
  }, [navigate]);

  // Fetch food recommendations and health data
  useEffect(() => {
    if (!userData) return;

    const token = localStorage.getItem("token");
    setLoading(true);
    fetch("http://localhost:5001/api/recommend", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch recommendations");
        return res.json();
      })
      .then((data) => {
        if (data) {
          setFoods(data.foodRecommendations);
          setBFP(data.metrics.BFP);
          setBMI(data.metrics.BMI);
          setBMR(data.metrics.BMR);
          setDailyCalories(data.metrics?.DailyCalories);
          setWHtR(data.metrics?.WHtR);
          setCategory(data.metrics?.category);
          // console.log("data=>"+data)
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [userData]);
  // console.log(foods)
  // Fetch logged meals
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
        setRemainingCalories(
          (DailyCalories || 0) - (data.totalCaloriesConsumed || 0)
        );
      })
      .catch((err) => console.error("Error fetching logged meals:", err));
  }, [userData, DailyCalories]);

  // Fetch meals for the selected date
  useEffect(() => {
    if (!userData?._id) return;

    const token = localStorage.getItem("token");
    fetch(
      `http://localhost:5001/api/loggedMeals/${userData._id}/${selectedDate}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
      .then((res) => res.json())
      .then((data) => setLoggedMeals(data.loggedMeals || []))
      .catch((err) => console.error("Error fetching meals by date:", err));
  }, [userData, selectedDate]);

  const logMeal = (food, calories) => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:5001/api/logMeal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId: userData?._id,
        food,
        calories,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setLoggedMeals(data.loggedMeals || []);
        const newTotalCalories = (data.loggedMeals || []).reduce(
          (sum, meal) => sum + (meal.calories || 0),
          0
        );
        if (newTotalCalories > DailyCalories) {
          setShowGoalAchieved(true);
        }
        setTotalCaloriesConsumed(newTotalCalories);
        setRemainingCalories((DailyCalories || 0) - newTotalCalories);
      })
      .catch((err) => console.error("Error logging meal:", err));
  };

  const removeMeal = (food) => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:5001/api/removeMeal", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId: userData?._id,
        food,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setLoggedMeals(data.loggedMeals || []);
        const newTotalCalories = (data.loggedMeals || []).reduce(
          (sum, meal) => sum + (meal.calories || 0),
          0
        );
        setTotalCaloriesConsumed(newTotalCalories);
        setRemainingCalories((DailyCalories || 0) - newTotalCalories);
      })
      .catch((err) => console.error("Error removing meal:", err));
  };

  const handleCloseGoalAchieved = () => {
    setShowGoalAchieved(false);
  };

  if (loading) {
    return (
      <Container>
        <Typography variant="h6">Loading...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <Link
              to="/dashboard"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              Dashboard
            </Link>
          </Typography>
          <Button color="inherit" onClick={() => navigate("/recommendation")}>
            Food_Recommendations
          </Button>
          <Button color="inherit" onClick={() => navigate("/forum")}>
            Forum
          </Button>
          <Button
            color="inherit"
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/login");
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container>
        {/* <Typography variant="h4" gutterBottom>
          Welcome {userData?.name}
        </Typography>

        <Grid container spacing={3}>
          { Health Metrics Section }
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Your Health Metrics
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText primary="BMI" secondary={BMI || "N/A"} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="BFP" secondary={BFP || "N/A"} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="BMR" secondary={BMR || "N/A"} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="WHtR" secondary={WHtR || "N/A"} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Category" secondary={category || "N/A"} />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Daily Calories" 
                      secondary={DailyCalories ? `${DailyCalories} cal` : "N/A"} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Total Calories Consumed" 
                      secondary={`${totalCaloriesConsumed} cal`} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Remaining Calories" 
                      secondary={`${remainingCalories >= 0 ? remainingCalories : 0} cal`} 
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid> */}

        {/* Food Recommendations Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Food Recommendations
              </Typography>
              {foods?.Breakfast?.length > 0 ? (
                <>
                  <Typography variant="h6">Breakfast</Typography>
                  <List>
                    {foods.Breakfast.map((item, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={item.Meal}
                          secondary={`${item.Calories} cal (P: ${item.Protein}g, F: ${item.Fats}g, C: ${item.Carbs}g)`}
                        />
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => logMeal(item.Meal, item.Calories)}
                        >
                          Ate
                        </Button>
                      </ListItem>
                    ))}
                  </List>

                  <Typography variant="h6">Lunch</Typography>
                  <List>
                    {foods.Lunch.map((item, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={item.Meal}
                          secondary={`${item.Calories} cal (P: ${item.Protein}g, F: ${item.Fats}g, C: ${item.Carbs}g)`}
                        />
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => logMeal(item.Meal, item.Calories)}
                        >
                          Ate
                        </Button>
                      </ListItem>
                    ))}
                  </List>

                  <Typography variant="h6">Dinner</Typography>
                  <List>
                    {foods.Dinner.map((item, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={item.Meal}
                          secondary={`${item.Calories} cal (P: ${item.Protein}g, F: ${item.Fats}g, C: ${item.Carbs}g)`}
                        />
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => logMeal(item.Meal, item.Calories)}
                        >
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

        {/* Logged Meals Section */}
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
                      <ListItemText
                        primary={meal?.food}
                        secondary={`${meal?.calories} cal`}
                      />
                      <IconButton
                        color="error"
                        onClick={() => removeMeal(meal.food)}
                      >
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

        {/* Macronutrient Chart Section */}
        <Grid item xs={12}>
          {userData && <MacronutrientChart userId={userData._id} />}
        </Grid>

        <Snackbar
          open={showGoalAchieved}
          autoHideDuration={6000}
          onClose={handleCloseGoalAchieved}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseGoalAchieved}
            severity="success"
            sx={{ width: "100%" }}
          >
            Congratulations! You completed your today's calorie goal...🔥
          </Alert>
        </Snackbar>
      </Container>

      {/* {userData && <Forum userId={userData._id} />} */}
    </div>
  );
};

export default Foodrecommendations;
