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

    # Encode gender
    gender_encoded = 1 if gender.lower() == 'male' else 0

    # Calculate BMI
    bmi = weight / ((height / 100) ** 2)

    # Validate inputs
    if waist <= 0 or neck <= 0 or height <= 0:
        raise ValueError("Waist, neck, and height must be positive values.")

    # Adjusted BFP Calculation using Navy Method
    if waist > neck:
        try:
            if gender_encoded == 1:
                bfp = 86.010 * np.log(waist - neck) - 70.041 * np.log(height) + 36.76
            else:
                bfp = 163.205 * np.log(waist - neck) - 97.684 * np.log(height) - 78.387
        except ValueError:
            # Fallback if logarithmic calculation fails
            bfp = 1.2 * bmi + 0.23 * age - (10.8 * gender_encoded) - 5.4
    else:
        # Fallback using Deurenberg formula
        bfp = 1.2 * bmi + 0.23 * age - (10.8 * gender_encoded) - 5.4
        
    # BMR Calculation (Mifflin-St Jeor Equation)
    if gender_encoded == 1:
        bmr = 10 * weight + 6.25 * height - 5 * age + 5
    else:
        bmr = 10 * weight + 6.25 * height - 5 * age - 161
    
    # Waist-to-Height Ratio
    whtr = waist / height

    # Daily Calorie Needs Calculation
    activity_multipliers = {
        'sedentary': 1.2, 
         'light': 1.375, 
        'moderate' or 'active': 1.55, 
        'very_active': 1.725
    }
    
    if activity_level.lower() not in activity_multipliers:
        raise ValueError("Invalid activity level. Choose from: sedentary, lightly active, moderate, highly active")
    
    tdee = bmr * activity_multipliers[activity_level.lower()]

    # Adjust calorie goal based on health goal
    if health_goal.lower() == 'weight_loss':
        calorie_goal = tdee - 500
    elif health_goal.lower() == 'weight_gain':
        calorie_goal = tdee + 500
    elif health_goal.lower() == 'maintenance':
        calorie_goal = tdee
    else:
        raise ValueError("Invalid health goal. Choose from weight loss, weight gain, or maintenance.")
        # Determine weight category
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
        'category':category,
        'Calorie Goal': round(calorie_goal, 2)
    }

def recommend_food(calorie_goal, diet, health_goal):
    # Filter by diet type
    filtered_data = df[df['Diet'].str.lower() == diet.lower()]

    # Sort based on goal
    if health_goal.lower() == 'weight_loss':
        # High protein, moderate fat, low carbs
        filtered_data = filtered_data.sort_values(by=['B_Protein', 'B_Fats', 'B_Carbs'], ascending=[False, True, True])
    elif health_goal.lower() == 'weight_gain':
        # Higher carbs and protein
        filtered_data = filtered_data.sort_values(by=['B_Carbs', 'B_Protein', 'B_Fats'], ascending=[False, False, True])
    else:  
        # Maintenance
        # Balanced macronutrient ratio
        filtered_data = filtered_data.sort_values(by=['B_Protein', 'B_Fats', 'B_Carbs'], ascending=[False, True, True])

    # Divide calorie goals into proportional parts
    breakfast_goal = calorie_goal * 0.3  # 30% of total calories
    lunch_goal = calorie_goal * 0.6     # 40% of total calories
    dinner_goal = calorie_goal * 0.3     # 30% of total calories

    # Function to find meals closest to the calorie goal
    def find_closest_meals(data, calorie_target, meal_type):
        # Calculate the absolute difference between meal calories and the target
        data[f'{meal_type}_Diff'] = abs(data[f'{meal_type}_Calories'] - calorie_target)
        # Sort by the difference and select the top meals
        return data.sort_values(by=f'{meal_type}_Diff').head(10)  # Limit to top 10 closest meals

    # Recommend meals for breakfast, lunch, and dinner
    breakfast = find_closest_meals(filtered_data, breakfast_goal, 'B')
    lunch = find_closest_meals(filtered_data, lunch_goal, 'L')
    dinner = find_closest_meals(filtered_data, dinner_goal, 'D')

    # Function to select meals dynamically to meet the calorie goal
    def select_meals(meals, calorie_target, meal_type):
        selected_meals = []
        total_calories = 0
        for _, meal in meals.iterrows():
            if total_calories + meal[f'{meal_type}_Calories'] <= calorie_target * 1.0:  # Allow 10% over target
                selected_meals.append(meal)
                total_calories += meal[f'{meal_type}_Calories']
                if total_calories >= calorie_target:  # Stop if we reach 90% of the target
                    break
        return selected_meals, total_calories

    # Select meals for breakfast, lunch, and dinner
    breakfast_meals, breakfast_total = select_meals(breakfast, breakfast_goal, 'B')
    lunch_meals, lunch_total = select_meals(lunch, lunch_goal, 'L')
    dinner_meals, dinner_total = select_meals(dinner, dinner_goal, 'D')

    # Calculate total calories of recommended meals
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

@app.route('/calculate', methods=['POST'])
def calculate():
    try:
        data = request.get_json()
        required_fields = ['age', 'height', 'weight', 'waist', 'neck', 'gender', 
                          'activity_level', 'diet', 'health_goal']
        
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        print(data['health_goal'])
        metrics = calculate_metrics(
            height=data['height'],
            weight=data['weight'],
            age=data['age'],
            gender=data['gender'],
            waist=data['waist'],
            neck=data['neck'],
            activity_level=data['activity_level'],
            diet=data['diet'],
            health_goal=data['health_goal']
        )
        food_recommendations = recommend_food(
            calorie_goal=metrics['Calorie Goal'],
            diet=data['diet'],
            health_goal=data['health_goal']
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