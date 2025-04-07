from flask import Flask, request, jsonify
import numpy as np
import pandas as pd

app = Flask(__name__)

# Load the food recommendation dataset
df = pd.read_csv('Food_recommendation_dataset.csv')

# Convert all numeric columns to float
numeric_cols = ['B_Calories', 'B_Protein', 'B_Fats', 'B_Carbs',
               'L_Calories', 'L_Protein', 'L_Fats', 'L_Carbs',
               'D_Calories', 'D_Protein', 'D_Fats', 'D_Carbs']

for col in numeric_cols:
    df[col] = pd.to_numeric(df[col], errors='coerce')  # Convert to numeric, invalid parsing will be set as NaN

# Drop rows with NaN values in numeric columns
df = df.dropna(subset=numeric_cols)

def calculate_metrics(height, weight, age, gender, waist, neck, activity_level, diet, health_goal):
    try:
        height = float(height)
        weight = float(weight)
        age = int(age)
        waist = float(waist)
        neck = float(neck)
    except ValueError:
        raise ValueError("Height, weight, age, waist, and neck must be valid numbers.")

    gender_encoded = 1 if gender.lower() == 'male' else 0
    bmi = weight / ((height / 100) ** 2)
    if waist <= 0 or neck <= 0 or height <= 0:
        raise ValueError("Waist, neck, and height must be positive values.")

    # BFP Calculation (unchanged)
    if waist > neck:
        try:
            if gender_encoded == 1:
                bfp = 86.010 * np.log(waist - neck) - 70.041 * np.log(height) + 36.76
            else:
                bfp = 163.205 * np.log(waist - neck) - 97.684 * np.log(height) - 78.387
        except ValueError:
            bfp = 1.2 * bmi + 0.23 * age - (10.8 * gender_encoded) - 5.4
    else:
        bfp = 1.2 * bmi + 0.23 * age - (10.8 * gender_encoded) - 5.4

    # BMR Calculation (unchanged)
    if gender_encoded == 1:
        bmr = 10 * weight + 6.25 * height - 5 * age + 5
    else:
        bmr = 10 * weight + 6.25 * height - 5 * age - 161

    whtr = waist / height

    # Activity level and TDEE
    activity_multipliers = {
        'sedentary': 1.2, 'light': 1.375, 'moderate': 1.55, 'active': 1.55, 'very_active': 1.725
    }
    if activity_level.lower() not in activity_multipliers:
        raise ValueError("Invalid activity level. Choose from: sedentary, light, moderate, active, very_active")
    tdee = bmr * activity_multipliers[activity_level.lower()]

    # Calorie adjustment based on body type, weight, and health goal
    body_type = "Unknown"
    calorie_adjustment = 0
    if bmi < 18.5:  # Underweight
        body_type = "Skinny"
        if activity_level.lower() == 'sedentary':
            calorie_adjustment = 200
        else:  # Active (including light, moderate, active, very_active)
            calorie_adjustment = 300
    elif 18.5 <= bmi < 25:  # Normal weight
        if 18.5 <= bmi < 22.5:  # Lean-Athletic range
            body_type = "Lean-Athletic"
            if activity_level.lower() == 'sedentary':
                calorie_adjustment = 0  # Maintenance
            else:
                calorie_adjustment = 100
        else:  # 22.5 <= bmi < 25 (Average range)
            body_type = "Average"
            if activity_level.lower() == 'sedentary':
                calorie_adjustment = 0  # Maintenance
            else:
                calorie_adjustment = 100
    elif 25 <= bmi < 30:  # Overweight
        body_type = "Overweight"
        if activity_level.lower() == 'sedentary':
            calorie_adjustment = -300
        else:
            calorie_adjustment = -500
    elif 30 <= bmi < 35:  # Muscular (assuming muscular build within this range for BMI)
        body_type = "Muscular"
        if activity_level.lower() == 'sedentary':
            calorie_adjustment = 250
        else:
            calorie_adjustment = 500
    else:  # BMI >= 35 (Obese)
        body_type = "Obese"
        if activity_level.lower() == 'sedentary':
            calorie_adjustment = -500
        else:
            calorie_adjustment = -700

    # Adjust calorie goal based on health goal
    if health_goal.lower() == 'weight_loss':
        calorie_goal = tdee + calorie_adjustment - 500
    elif health_goal.lower() == 'weight_gain':
        calorie_goal = tdee + calorie_adjustment + 500
    else:  # maintenance
        calorie_goal = tdee + calorie_adjustment

    # Clamp calorie goal to table's example range
    if calorie_goal < 1800:
        calorie_goal = 1800
    elif calorie_goal > 3600:
        calorie_goal = 3600

    # Determine weight category (unchanged)
    if bmi < 18.5:
        category = "Underweight"
    elif 18.5 <= bmi < 24.9:
        category = "Normal Weight"
    elif 25 <= bmi < 29.9:
        category = "Overweight"
    else:
        category = "Obese"

    return {
        'BMI': round(bmi, 2),
        'BFP': round(bfp, 2),
        'BMR': round(bmr, 2),
        'WHtR': round(whtr, 4),
        'TDEE': round(tdee, 2),
        'category': category,
        'Calorie Goal': round(calorie_goal, 2),
        'Body Type': body_type
    }





def recommend_food(calorie_goal, diet, health_goal, body_type, activity_level, weight):
    filtered_data = df[df['Diet'].str.lower() == diet.lower()]

    # Determine macronutrient targets from table (g/kg)
    if body_type == "Skinny":
        protein_kg = 1.6 if activity_level.lower() == 'sedentary' else 2.0
        carbs_kg = 3.5 if activity_level.lower() == 'sedentary' else 4.0
        fats_kg = 0.8 if activity_level.lower() == 'sedentary' else 1.0
    elif body_type == "Lean-Athletic":
        protein_kg = 1.5 if activity_level.lower() == 'sedentary' else 2.0
        carbs_kg = 3.5 if activity_level.lower() == 'sedentary' else 4.5
        fats_kg = 1.0 if activity_level.lower() == 'sedentary' else 1.2
    elif body_type == "Average":
        protein_kg = 1.2 if activity_level.lower() == 'sedentary' else 1.5
        carbs_kg = 3.0 if activity_level.lower() == 'sedentary' else 3.5
        fats_kg = 1.0 if activity_level.lower() == 'sedentary' else 1.2
    elif body_type == "Overweight":
        protein_kg = 1.8 if activity_level.lower() == 'sedentary' else 2.0
        carbs_kg = 2.0 if activity_level.lower() == 'sedentary' else 2.5
        fats_kg = 0.8 if activity_level.lower() == 'sedentary' else 1.0
    elif body_type == "Muscular":
        protein_kg = 2.2 if activity_level.lower() == 'sedentary' else 2.4
        carbs_kg = 3.5 if activity_level.lower() == 'sedentary' else 4.5
        fats_kg = 1.0 if activity_level.lower() == 'sedentary' else 0.8
    else:  # Obese
        protein_kg = 2.0 if activity_level.lower() == 'sedentary' else 2.2
        carbs_kg = 1.0 if activity_level.lower() == 'sedentary' else 0.8
        fats_kg = 1.0 if activity_level.lower() == 'sedentary' else 1.0

    # Calculate target macronutrient totals
    target_protein = protein_kg * weight
    target_carbs = carbs_kg * weight
    target_fats = fats_kg * weight

    # Sort meals to prioritize matching macronutrient targets
    def score_meal(meal, meal_type):
        meal_protein = meal[f'{meal_type}_Protein']
        meal_carbs = meal[f'{meal_type}_Carbs']
        meal_fats = meal[f'{meal_type}_Fats']
        # Score based on proximity to targets
        protein_diff = abs(meal_protein - (target_protein * 0.3))  # 30% for breakfast
        carbs_diff = abs(meal_carbs - (target_carbs * 0.3))
        fats_diff = abs(meal_fats - (target_fats * 0.3))
        return protein_diff + carbs_diff + fats_diff

    for meal_type in ['B', 'L', 'D']:
        filtered_data[f'{meal_type}_Score'] = filtered_data.apply(
            lambda row: score_meal(row, meal_type), axis=1
        )
        filtered_data = filtered_data.sort_values(by=f'{meal_type}_Score')

    # Meal calorie distribution
    breakfast_goal = calorie_goal * 0.3
    lunch_goal = calorie_goal * 0.6
    dinner_goal = calorie_goal * 0.3

    def find_closest_meals(data, calorie_target, meal_type):
        data[f'{meal_type}_Diff'] = abs(data[f'{meal_type}_Calories'] - calorie_target)
        return data.sort_values(by=[f'{meal_type}_Score', f'{meal_type}_Diff']).head(10)

    breakfast = find_closest_meals(filtered_data, breakfast_goal, 'B')
    lunch = find_closest_meals(filtered_data, lunch_goal, 'L')
    dinner = find_closest_meals(filtered_data, dinner_goal, 'D')

    def select_meals(meals, calorie_target, meal_type):
        selected_meals = []
        total_calories = 0
        for _, meal in meals.iterrows():
            if total_calories + meal[f'{meal_type}_Calories'] <= calorie_goal :
                selected_meals.append(meal)
                total_calories += meal[f'{meal_type}_Calories']
                if total_calories >= calorie_target-400:
                    break
        return selected_meals, total_calories

    breakfast_meals, breakfast_total = select_meals(breakfast, breakfast_goal, 'B')
    lunch_meals, lunch_total = select_meals(lunch, lunch_goal, 'L')
    dinner_meals, dinner_total = select_meals(dinner, dinner_goal, 'D')
    total_calories = breakfast_total + lunch_total + dinner_total

    return {
        'Breakfast': [{
            'Meal': meal['Breakfast'],
            'Calories': round(meal['B_Calories'], 2),
            'Protein': round(meal['B_Protein'], 2),
            'Fats': round(meal['B_Fats'], 2),
            'Carbs': round(meal['B_Carbs'], 2)
        } for meal in breakfast_meals],
        'Lunch': [{
            'Meal': meal['Lunch'],
            'Calories': round(meal['L_Calories'], 2),
            'Protein': round(meal['L_Protein'], 2),
            'Fats': round(meal['L_Fats'], 2),
            'Carbs': round(meal['L_Carbs'], 2)
        } for meal in lunch_meals],
        'Dinner': [{
            'Meal': meal['Dinner'],
            'Calories': round(meal['D_Calories'], 2),
            'Protein': round(meal['D_Protein'], 2),
            'Fats': round(meal['D_Fats'], 2),
            'Carbs': round(meal['D_Carbs'], 2)
        } for meal in dinner_meals],
        'Total Recommended Calories': round(total_calories, 2)
    }

# Update /calculate endpoint to pass weight
@app.route('/calculate', methods=['POST'])
def calculate():
    try:
        data = request.get_json()
        required_fields = ['age', 'height', 'weight', 'waist', 'neck', 'gender', 
                          'activity_level', 'diet', 'health_goal']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        metrics = calculate_metrics(**data)
        food_recommendations = recommend_food(
            calorie_goal=metrics['Calorie Goal'],
            diet=data['diet'],
            health_goal=data['health_goal'],
            body_type=metrics['Body Type'],
            activity_level=data['activity_level'],
            weight=float(data['weight'])  # Pass weight
        )

        return jsonify({
            "metrics": metrics,
            "food_recommendations": food_recommendations
        })
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500
    
    
    
    
if __name__ == '__main__':
    app.run(debug=True)