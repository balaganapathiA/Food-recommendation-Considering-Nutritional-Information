const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors=require('cors');
const cron = require("node-cron");
require("dotenv").config();

const axios = require("axios");
const app = express();
app.use(express.json());
app.use(cors());


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
 }).then(() => console.log("MongoDB connected"))
   .catch(err => console.log(err));

// User Schema
const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    age: Number,
    height: Number,
    weight: Number,
    activity_level: String,
    goal: String,
    loggedMeals: [{ food: String, calories: Number, date: { type: Date, default: Date.now } }]
  });

const User = mongoose.model("User", UserSchema);


const foodSchema = new mongoose.Schema({
    Food_items: String,
    Breakfast: Number,
    Lunch: Number,
    Dinner: Number,
    Calories: Number,
    Fats: Number,
    Proteins: Number,
    Carbohydrates: Number,
  } ,{ collection: "foods" });


  const Food = mongoose.model("Food", foodSchema);

  app.get("/api/macronutrients/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
    //   console.log(`Fetching macronutrients for user: ${userId}`);
  
      const user = await User.findById(userId);
      if (!user) {
        // console.log("User not found");
        return res.status(404).json({ message: "User not found" });
      }
  
      const recommendedFoods = await Food.find({
        $or: [{ Breakfast: 1 }, { Lunch: 1 }, { Dinner: 1 }]
      });
  
    //   console.log("Recommended foods found:", recommendedFoods.length);
  
      let totalFats = 0, totalProteins = 0, totalCarbohydrates = 0;
  
      recommendedFoods.forEach((food) => {
        totalFats += food.Fats || 0;
        totalProteins += food.Proteins || 0;
        totalCarbohydrates += food.Carbohydrates || 0;
      });
  
    //   console.log("Total Macronutrients:", { Fats: totalFats, Proteins: totalProteins, Carbohydrates: totalCarbohydrates });
  
      res.json({ Fats: totalFats, Proteins: totalProteins, Carbohydrates: totalCarbohydrates });
    } catch (error) {
      console.error("Error fetching macronutrient data:", error);
      res.status(500).json({ message: "Error fetching macronutrient data" });
    }
  });
  
  
  
// Register Route
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password, age, height, weight, activity_level, goal } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, age, height, weight, activity_level, goal });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error registering user" });
  }
});

// Login Route
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    // localStorage.setItem(token)
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: "Error logging in" });
  }
});

// Protected Route Example (Requires JWT)
const authMiddleware = (req, res, next) => {
    const authHeader = req.header("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Access denied. Token missing or invalid." });
    }
  
    const token = authHeader.split(" ")[1]; // Extract the actual token
    try {
      const verified = jwt.verify(token, process.env.JWT_SECRET);
      req.user = verified;
      next();
    } catch (error) {
      res.status(400).json({ error: "Invalid token" });
    }
  };
  

  app.get("/api/dashboard", authMiddleware, async (req, res) => {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ message: "Welcome to the dashboard!", user });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });
  app.get("/api/recommend", authMiddleware, async (req, res) => {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) return res.status(404).json({ error: "User not found" });
        // console.log(user.age)
      // Send user details to ML model for recommendations
      const response = await axios.post(`http://127.0.0.1:5001/api/recommend`, {
        age: user.age,
        height: user.height,
        weight: user.weight,
        waist: 0,  // Adjust if necessary
        gender: "male", // Adjust as per your schema
        activity_level: user.activity_level,
        goal: user.goal
      });
    //   console.log("foos"+response.data["Recommended Foods"])
      res.json({
        BFP: response.data["BFP"],
        BMI: response.data["BMI"],
        BMR: response.data["BMR"],
        Category: response.data["Category"],
        DailyCalories: response.data["Daily Calories"],
        WHtR: response.data["WHtR"],

        foods: response.data["Recommended Foods"]
      });
    } catch (error) {
        // console.log("cant fetching")
      res.status(500).json({ error: "Error fetching recommendations from ML model" });
    }
  });










  app.post("/api/logMeal", async (req, res) => {
    try {
      const { userId, food, calories } = req.body;
      const today = new Date().toISOString().split("T")[0]; // Store only YYYY-MM-DD
  
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
  
      user.loggedMeals.push({ food, calories, date: today }); // ✅ Store only date (not time)
      await user.save();
  
      res.json({ message: "Meal logged successfully", loggedMeals: user.loggedMeals });
    } catch (error) {
      res.status(500).json({ error: "Error logging meal" });
    }
  });
  
  
  
  app.get("/api/loggedMeals/:userId/:date", async (req, res) => {
    try {
      const { userId, date } = req.params;
      const user = await User.findById(userId);
  
      if (!user) return res.status(404).json({ message: "User not found" });
  
      // Convert the stored date and requested date to YYYY-MM-DD format
      const selectedDate = new Date(date).toISOString().split("T")[0];
  
      const mealsForDate = user.loggedMeals.filter(meal => {
        return new Date(meal.date).toISOString().split("T")[0] === selectedDate;
      });
  
    //   console.log(`Meals on ${selectedDate}:`, mealsForDate);
  
      res.json({ loggedMeals: mealsForDate });
    } catch (error) {
      console.error("Error fetching meals:", error);
      res.status(500).json({ message: "Error fetching meals" });
    }
  });
  

  app.get("/api/loggedMeals/:userId", async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      if (!user) return res.status(404).json({ error: "User not found" });
  
    //   console.log("Logged Meals from DB:", user.loggedMeals); // ✅ Debugging log
  
      // ✅ Ensure loggedMeals is an array
      const loggedMeals = Array.isArray(user.loggedMeals) ? user.loggedMeals : [];
  
      // ✅ Calculate total calories
      const totalCaloriesConsumed = loggedMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
  
      res.json({ 
        loggedMeals, 
        totalCaloriesConsumed // ✅ Send total calories
      });
    } catch (error) {
      console.error("Error fetching logged meals:", error);
      res.status(500).json({ error: "Error fetching logged meals" });
    }
  });
  
  
  
  
  






  app.delete("/api/removeMeal", async (req, res) => {
    try {
      const { userId, food } = req.body;
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
  
      user.loggedMeals = user.loggedMeals.filter(meal => meal.food !== food);
      await user.save();
  
      res.json({ message: "Meal removed successfully", loggedMeals: user.loggedMeals });
    } catch (error) {
      res.status(500).json({ error: "Error removing meal" });
    }
  });
  

  cron.schedule("0 0 * * *", async () => {
    await User.updateMany({}, { $set: { loggedMeals: [] } });
  });














// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));