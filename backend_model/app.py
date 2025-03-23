import pickle
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})
@app.route('/')
def home():
    return "Flask API is running!"

# Load dataset
df = pd.read_csv("food_categorized.csv")
df.columns = df.columns.str.strip()  # Remove leading/trailing spaces

# Load trained model (if needed for ML-based recommendations)
with open("food_recommendation_model.pkl", "rb") as f:
    model = pickle.load(f)

# Mapping of goals
goal_map = {"weight_loss": "Weight Loss", "weight_gain": "Weight Gain", "maintenance": "Maintenance"}

# Function to calculate body metrics
def calculate_metrics(age, height, weight, waist, gender, activity_level, goal):
    # ✅ Convert inputs to numbers (if needed)
    age = int(age)
    height = float(height)
    weight = float(weight)
    waist = float(waist)

    # BMI Calculation
    height_m = height / 100  # Convert height to meters
    bmi = round(weight / (height_m ** 2), 2)

    # WHtR Calculation
    whtr = round((waist / height) * 100, 2)

    # Body Fat Percentage (BFP)
    if gender.lower() == "male":
        bfp = round(1.2 * bmi + 0.23 * age - 16.2, 2)
    else:
        bfp = round(1.2 * bmi + 0.23 * age - 5.4, 2)

    # BMR Calculation
    if gender.lower() == "male":
        bmr = round(10 * weight + 6.25 * height - 5 * age + 5, 2)
    else:
        bmr = round(10 * weight + 6.25 * height - 5 * age - 161, 2)

    # Determine daily calories (with activity level)
    activity_multipliers = {
        "sedentary": 1.2, "light": 1.375, "moderate": 1.55, "active": 1.725, "very_active": 1.9
    }
    daily_calories = round(bmr * activity_multipliers.get(activity_level, 1.2), 2)

    # Determine weight category
    if bmi < 18.5:
        category = "Underweight"
    elif 18.5 <= bmi < 24.9:
        category = "Normal Weight"
    elif 25 <= bmi < 29.9:
        category = "Overweight"
    else:
        category = "Obese"

    return bmi, bfp, bmr, whtr, daily_calories, category

# Function to filter and recommend foods
def recommend_food(goal, daily_calories):
    if request.method == "OPTIONS":  # ✅ Handle preflight request
        response = jsonify({"message": "CORS preflight successful"})
        response.headers.add("Access-Control-Allow-Origin", "http://127.0.0.1:5000")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
        return response, 200
    filtered_df = df[df["Suitable_For"] == goal_map.get(goal, "Maintenance")]

    if goal == "weight_loss":
        filtered_df = filtered_df.sort_values(by=["Calories", "Fibre", "Proteins"], ascending=[True, False, False])
    elif goal == "weight_gain":
        filtered_df = filtered_df.sort_values(by=["Calories", "Carbohydrates", "Proteins"], ascending=[False, False, False])
    else:
        filtered_df = filtered_df.sort_values(by=["Proteins", "Fibre", "Carbohydrates"], ascending=[False, False, True])

    # Distribute foods into meal categories
    breakfast = filtered_df[filtered_df["Breakfast"] == 1][["Food_items", "Calories"]].head(5).to_dict(orient="records")
    lunch = filtered_df[filtered_df["Lunch"] == 1][["Food_items", "Calories"]].head(5).to_dict(orient="records")
    dinner = filtered_df[filtered_df["Dinner"] == 1][["Food_items", "Calories"]].head(5).to_dict(orient="records")


    return {"Breakfast": breakfast, "Lunch": lunch, "Dinner": dinner}

# API Endpoint for recommendation
@app.route("/api/recommend", methods=["POST"])
def recommend():
    data = request.get_json()
    
    # Get user input
    age = data.get("age")
    height = data.get("height")
    weight = data.get("weight")
    waist = data.get("waist")
    gender = data.get("gender")
    activity_level = data.get("activity_level")
    goal = data.get("goal")

    # Validate inputs
    if None in [age, height, weight, waist, gender, activity_level, goal]:
        return jsonify({"error": "Missing input values"}), 400

    # Calculate user metrics
    bmi, bfp, bmr, whtr, daily_calories, category = calculate_metrics(
        age, height, weight, waist, gender, activity_level, goal
    )

    # print(whtr)
    # Get food recommendations
    recommended_foods = recommend_food(goal, daily_calories)

    return jsonify({
        "BMI": bmi,
        "BFP": bfp,
        "BMR": bmr,
        "WHtR": whtr,
        "Category": category,
        "Daily Calories": daily_calories,
        "Recommended Foods": recommended_foods
    })

if __name__ == "__main__":
    app.run(port=5001, debug=True)
