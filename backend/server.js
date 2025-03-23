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
app.use(cors({ origin: "http://localhost:3000" }));

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
    waist: Number,
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
  // --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------







  const replySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: String,
    createdAt: { type: Date, default: Date.now },
    parentReplyId: { type: mongoose.Schema.Types.ObjectId, ref: "Reply", default: null }, // Track parent reply
  });
  
  const postSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: String,
    createdAt: { type: Date, default: Date.now },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    replies: [replySchema], // Store replies for each post
  });
  const Post = mongoose.model("Post", postSchema);













  // --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
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
    const { name, email, password, age, height, weight,waist, activity_level, goal } = req.body;
    console.log("input"+waist)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, age, height, weight,waist, activity_level, goal });
    await newUser.save();
    console.log("reg:"+newUser.waist)
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
      console.log("user"+user.waist)
      // Send user details to ML model for recommendations
      const response = await axios.post(`http://127.0.0.1:5001/api/recommend`, {
        age: user.age,
        height: user.height,
        weight: user.weight,
        waist: user.waist,  // Adjust if necessary
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
  

  // cron.schedule("0 0 * * *", async () => {
  //   await User.updateMany({}, { $set: { loggedMeals: [] } });
  // });

  // --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


  app.post("/api/profile", async (req, res) => {
    const { userId, bio, profilePicture, progress } = req.body;
    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      { bio, profilePicture, progress },
      { upsert: true, new: true }
    );
    res.json(profile);
  });

  // server.js
app.get("/api/profile/:userId", async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ userId: req.params.userId });
    console.log(req.params.userId)
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: "Error fetching profile" });
  }
});



  app.post("/api/challenges", async (req, res) => {
    const { title, description, startDate, endDate } = req.body;
    const challenge = new Challenge({ title, description, startDate, endDate });
    await challenge.save();
    res.json(challenge);
  });



  app.post("/api/challenges/:challengeId/join", async (req, res) => {
    const { userId } = req.body;
    const challenge = await Challenge.findByIdAndUpdate(
      req.params.challengeId,
      { $push: { participants: userId } },
      { new: true }
    );
    res.json(challenge);
  });


  // server.js
app.get("/api/challenges", async (req, res) => {
  try {
    const challenges = await Challenge.find();
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ error: "Error fetching challenges" });
  }
});



app.post("/api/posts", async (req, res) => {
  const { userId, content } = req.body;
  const post = new Post({ userId, content });
  await post.save();
  res.json(post);
});



app.post("/api/posts/:postId/like", async (req, res) => {
  try {
    const postId = req.params.postId;
    const { userId } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    // Check if the user already liked the post
    const userIndex = post.likes.indexOf(userId);
    if (userIndex === -1) {
      // Like the post
      post.likes.push(userId);
    } else {
      // Unlike the post
      post.likes.splice(userIndex, 1);
    }

    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: "Error liking post" });
  }
});


app.post("/api/posts/:postId/reply", async (req, res) => {
  try {
    const postId = req.params.postId;
    const { userId, content, parentReplyId } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    // Add the reply to the post
    post.replies.push({ userId, content, parentReplyId });
    await post.save();

    res.json(post);
  } catch (error) {
    res.status(500).json({ error: "Error adding reply" });
  }
});


const buildNestedReplies = (replies, parentReplyId = null) => {
  return replies
    .filter((reply) => reply.parentReplyId?.toString() === parentReplyId?.toString())
    .map((reply) => ({
      ...reply.toObject(),
      replies: buildNestedReplies(replies, reply._id), // Recursively find nested replies
    }));
};

app.get("/api/posts", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("userId", "name") // Populate the post creator's name
      .populate("replies.userId", "name"); // Populate the reply creator's name

    // Build nested replies for each post
    const postsWithNestedReplies = posts.map((post) => ({
      ...post.toObject(),
      replies: buildNestedReplies(post.replies),
    }));

    res.json(postsWithNestedReplies);
  } catch (error) {
    res.status(500).json({ error: "Error fetching posts" });
  }
});


  app.delete("/api/posts/:postId", async (req, res) => {
    try {
      const postId = req.params.postId;
      await Post.findByIdAndDelete(postId); // Delete the post
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Error deleting post" });
    }
  });































  // --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));