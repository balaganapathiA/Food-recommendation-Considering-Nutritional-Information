import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  Chip,
  Box,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Restaurant,
  Forum,
  ExitToApp,
  LocalFireDepartment,
  FavoriteBorder,
  Favorite,
  CheckCircle,
} from "@mui/icons-material";
import Tooltip from "@mui/material/Tooltip";

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
      <Container
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          backgroundColor: "#f8faf7",
        }}
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Restaurant
            color="primary"
            sx={{
              fontSize: 80,
              mb: 2,
              color: "#2E7D32",
            }}
          />
          <Typography
            variant="h5"
            sx={{
              fontWeight: "bold",
              color: "#2E7D32",
              fontFamily: '"Poppins", sans-serif',
              mb: 2,
            }}
          >
            Preparing Your Meal Plan
          </Typography>
        </motion.div>

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "60%" }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          style={{
            height: 6,
            backgroundColor: "#2E7D32",
            borderRadius: 3,
            marginTop: 20,
          }}
        />
      </Container>
    );
  }

  if (error) {
    return (
      <Container
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          backgroundColor: "#f8faf7",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center" }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: "bold",
              color: "#d32f2f",
              mb: 2,
              fontFamily: '"Poppins", sans-serif',
            }}
          >
            Error Loading Recommendations
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {error}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => window.location.reload()}
            sx={{ mr: 2 }}
          >
            Try Again
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </Button>
        </motion.div>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "#f8faf7",
      }}
    >
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
        sx={{
          py: 4,
          flex: 1,
          position: "relative",
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontWeight: "bold",
              color: "#2E7D32",
              mb: 4,
              fontFamily: '"Poppins", sans-serif',
              textAlign: "center",
            }}
          >
            Personalized Meal Recommendations
          </Typography>

          <Box
            sx={{
              backgroundColor: "#e8f5e9",
              borderRadius: 2,
              p: 3,
              mb: 4,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Daily Goal
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                {DailyCalories || 0} calories
              </Typography>
            </Box>

            <Box sx={{ textAlign: "center" }}>
              <Typography variant="subtitle2" color="text.secondary">
                Consumed
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                {totalCaloriesConsumed} calories
              </Typography>
            </Box>

            <Box sx={{ textAlign: "right" }}>
              <Typography variant="subtitle2" color="text.secondary">
                Remaining
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  color: remainingCalories > 0 ? "#2E7D32" : "#d32f2f",
                }}
              >
                {remainingCalories >= 0 ? remainingCalories : 0} calories
              </Typography>
            </Box>
          </Box>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Card
              sx={{
                borderRadius: 3,
                border: "none",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                overflow: "hidden",
                mb: 4,
              }}
            >
              <CardContent sx={{ p: 0 }}>
                <Box
                  sx={{
                    backgroundColor: "#2E7D32",
                    p: 3,
                    color: "white",
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: "bold",
                      fontFamily: '"Poppins", sans-serif',
                    }}
                  >
                    Today's Meal Plan
                  </Typography>
                  <Typography variant="body2">
                    Based on your health profile and goals
                  </Typography>
                </Box>

                {foods?.Breakfast?.length > 0 ? (
                  <Box sx={{ p: 3 }}>
                    {["Breakfast", "Lunch", "Dinner"].map((mealType) => (
                      <Box key={mealType} mb={4}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            mb: 3,
                            "&:before": {
                              content: '""',
                              display: "block",
                              width: "4px",
                              height: "24px",
                              backgroundColor: "#2E7D32",
                              mr: 2,
                              borderRadius: "2px",
                            },
                          }}
                        >
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: "bold",
                              color: "#2E7D32",
                              fontFamily: '"Poppins", sans-serif',
                            }}
                          >
                            {mealType}
                          </Typography>
                        </Box>

                        <Grid container spacing={3} justifyContent="center">
                          {foods[mealType].map((item, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                              <motion.div
                                whileHover={{ y: -5 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Card
                                  sx={{
                                    height: "100%",
                                    borderRadius: 2,
                                    border: "1px solid rgba(46, 125, 50, 0.2)",
                                    transition: "all 0.3s ease",
                                    "&:hover": {
                                      boxShadow:
                                        "0 6px 16px rgba(46, 125, 50, 0.15)",
                                    },
                                  }}
                                >
                                  <CardContent>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        mb: 1,
                                      }}
                                    >
                                      <Typography
                                        variant="subtitle1"
                                        sx={{
                                          fontWeight: "bold",
                                          color: "#2E7D32",
                                        }}
                                      >
                                        {item.Meal}
                                      </Typography>
                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          logMeal(item.Meal, item.Calories)
                                        }
                                        sx={{
                                          color: "#2E7D32",
                                          "&:hover": {
                                            backgroundColor:
                                              "rgba(46, 125, 50, 0.1)",
                                          },
                                        }}
                                      >
                                        <CheckCircle />
                                      </IconButton>
                                    </Box>

                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        mb: 2,
                                      }}
                                    >
                                      <LocalFireDepartment
                                        color="error"
                                        fontSize="small"
                                        sx={{ mr: 0.5 }}
                                      />
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                      >
                                        {item.Calories} calories
                                      </Typography>
                                    </Box>

                                    <Box
                                      sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        mb: 2,
                                        gap: 1,
                                      }}
                                    >
                                      <Tooltip title="Protein">
                                        <Chip
                                          label={`${item.Protein}g`}
                                          size="small"
                                          color="primary"
                                          variant="outlined"
                                          sx={{ flex: 1 }}
                                        />
                                      </Tooltip>
                                      <Tooltip title="Carbs">
                                        <Chip
                                          label={`${item.Carbs}g`}
                                          size="small"
                                          variant="outlined"
                                          sx={{ flex: 1 }}
                                        />
                                      </Tooltip>
                                      <Tooltip title="Fats">
                                        <Chip
                                          label={`${item.Fats}g`}
                                          size="small"
                                          variant="outlined"
                                          sx={{ flex: 1 }}
                                        />
                                      </Tooltip>
                                    </Box>

                                    <Button
                                      fullWidth
                                      variant="contained"
                                      color="primary"
                                      sx={{
                                        mt: 1,
                                        borderRadius: 2,
                                        textTransform: "none",
                                        fontWeight: "bold",
                                        py: 1,
                                        fontSize: "0.875rem",
                                      }}
                                      onClick={() =>
                                        logMeal(item.Meal, item.Calories)
                                      }
                                      startIcon={<FavoriteBorder />}
                                    >
                                      Log This Meal
                                    </Button>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box
                    sx={{
                      p: 6,
                      textAlign: "center",
                      backgroundColor: "#f5f5f5",
                    }}
                  >
                    <Typography
                      variant="h6"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      No recommendations available
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      We're working on personalized recommendations for you.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
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
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            }}
            icon={<Favorite color="inherit" />}
          >
            Great job! You've reached your daily calorie goal!
          </Alert>
        </motion.div>
      </Snackbar>
    </Box>
  );
};

export default Foodrecommendations;