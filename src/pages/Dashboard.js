import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import MacronutrientChart from "../components/MacronutrientChart";
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
  Paper,
  Box,
  Divider,
  Chip,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  FitnessCenter,
  Forum,
  Restaurant,
  ExitToApp,
} from "@mui/icons-material";

const Dashboard = () => {
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
  const [BodyType, setBodyType] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

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
          setBodyType(data.metrics?.BodyType);  // New
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [userData]);

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
      <Container sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh'
      }}>
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <FitnessCenter 
            color="primary" 
            sx={{ 
              fontSize: 80,
              mb: 2
            }} 
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 'bold',
              color: '#2E7D32'
            }}
          >
            Loading Your Health Data...
          </Typography>
        </motion.div>
        
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '50%' }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            height: 4,
            backgroundColor: '#2E7D32',
            borderRadius: 2,
            marginTop: 20
          }}
        />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Error: {error}
            </Typography>
          </Alert>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/login')}
            sx={{ width: '100%' }}
          >
            Return to Login
          </Button>
        </motion.div>
      </Container>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar position="static" sx={{ backgroundColor: "#2E7D32" }}>
        <Toolbar>
          <Box
            component={Link}
            to="/dashboard"
            sx={{
              flexGrow: 1,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: "bold",
                fontFamily: '"Poppins", sans-serif',
                fontSize: "1.25rem",
                "&:hover": {
                  opacity: 0.8,
                },
              }}
            >
              HealthTrack
            </Typography>
          </Box>
          <Button
            color="inherit"
            startIcon={<Restaurant />}
            onClick={() => navigate("/recommendation")}
            sx={{ mr: 2 }}
          >
            Food
          </Button>
          <Button
            color="inherit"
            startIcon={<Forum />}
            onClick={() => navigate("/forum")}
            sx={{ mr: 2 }}
          >
            Community
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

      <Container 
        maxWidth="lg" 
        sx={{ py: 4, flex: 1 }}
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: "bold", color: "#2E7D32", mb: 4 }}
          component={motion.div}
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.3 }}
        >
          Welcome back, {userData?.name || "User"}!
        </Typography>

        <Grid container spacing={4}>
          {/* Health Metrics Section */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card elevation={3} sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <FitnessCenter color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                      Health Metrics
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2}>
  {[
    { label: "BMI", value: BMI },
    { label: "BFP", value: BFP },
    { label: "BMR", value: BMR },
    { label: "WHtR", value: WHtR },
    { label: "Body Type", value: BodyType }  // New
  ].map((metric, index) => (
    <Grid item xs={6} key={metric.label}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: "#E8F5E9" }}>
          <Typography variant="subtitle2">{metric.label}</Typography>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            {metric.value || "N/A"}
          </Typography>
        </Paper>
      </motion.div>
    </Grid>
  ))}
</Grid>

                  <Divider sx={{ my: 3 }} />

                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: "bold", mb: 1 }}
                    >
                      Daily Nutrition
                    </Typography>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={1}
                    >
                      <Typography variant="body2">Goal:</Typography>
                      <Chip
                        label={`${DailyCalories || 0} cal`}
                        color="primary"
                        size="small"
                      />
                    </Box>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={1}
                    >
                      <Typography variant="body2">Consumed:</Typography>
                      <Chip label={`${totalCaloriesConsumed} cal`} size="small" />
                    </Box>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="body2">Remaining:</Typography>
                      <Chip
                        label={`${
                          remainingCalories >= 0 ? remainingCalories : 0
                        } cal`}
                        color={remainingCalories > 0 ? "primary" : "error"}
                        size="small"
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Logged Meals Section */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card elevation={3} sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ fontWeight: "bold" }}
                  >
                    Today's Meals
                  </Typography>

                  <TextField
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    fullWidth
                    margin="normal"
                    size="small"
                    sx={{ mb: 2 }}
                  />

                  {loggedMeals?.length > 0 ? (
                    <List sx={{ maxHeight: 300, overflow: "auto" }}>
                      {loggedMeals.map((meal, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <ListItem
                            sx={{
                              bgcolor: index % 2 === 0 ? "#FAFAFA" : "white",
                              borderRadius: 1,
                              mb: 1,
                            }}
                            secondaryAction={
                              <IconButton
                                edge="end"
                                color="error"
                                onClick={() => removeMeal(meal.food)}
                                component={motion.div}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            }
                          >
                            <ListItemText
                              primary={meal?.food}
                              secondary={`${meal?.calories} calories`}
                              primaryTypographyProps={{ fontWeight: "medium" }}
                            />
                          </ListItem>
                        </motion.div>
                      ))}
                    </List>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Box textAlign="center" py={4}>
                        <Typography color="textSecondary">
                          No meals logged for this date
                        </Typography>
                      </Box>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Macronutrient Chart Section */}
          <Grid item xs={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card elevation={3} sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ fontWeight: "bold" }}
                  >
                    Nutrition Overview
                  </Typography>
                  {userData && <MacronutrientChart userId={userData._id} />}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </Container>

      <Snackbar
        open={showGoalAchieved}
        autoHideDuration={6000}
        onClose={handleCloseGoalAchieved}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
        >
          <Alert
            onClose={handleCloseGoalAchieved}
            severity="success"
            sx={{ 
              width: "100%", 
              fontWeight: "bold",
              boxShadow: 3
            }}
          >
            🎉 Congratulations! You've reached your daily calorie goal!
          </Alert>
        </motion.div>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;