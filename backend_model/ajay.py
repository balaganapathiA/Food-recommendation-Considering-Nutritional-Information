from flask import Flask, request, jsonify
import numpy as np
import pandas as pd

app = Flask(__name__)

# Load the food recommendation dataset
df = pd.read_csv('Food_recommendation_dataset.csv')

def calculate_metrics(height, weight, age, gender, waist, neck, activity_level, diet, health_goal):
    # Encode gender
    gender_encoded = 1 if gender.lower() == 'male' else 0
    
    # BMI Calculation
    bmi = weight / ((height / 100) ** 2)

    # BMR Calculation (Mifflin-St Jeor Equation)
    if gender_encoded == 1:
        bmr = 10 * weight + 6.25 * height - 5 * age + 5
    else:
        bmr = 10 * weight + 6.25 * height - 5 * age - 161

    # Adjusted BFP Calculation using Navy Method
    if gender_encoded == 1:
        bfp = 86.010 * np.log(waist - neck) - 70.041 * np.log(height) + 36.76
    else:
        bfp = 163.205 * np.log(waist - neck) - 97.684 * np.log(height) - 78.387

    # Waist-to-Height Ratio
    whtr = waist / height

    # Daily Calorie Needs Calculation
    activity_multipliers = {'sedentary': 1.2, 'lightly active': 1.375, 'moderately active': 1.55, 'highly active': 1.725}
    calorie_goal = bmr * activity_multipliers[activity_level.lower()]

    if health_goal.lower() == 'weight gain' or health_goal.lower() == 'muscle gain':
        calorie_goal += 500
    elif health_goal.lower() == 'weight loss':
        calorie_goal -= 500

    return {
        'BMI': round(bmi, 2),
        'BMR': round(bmr, 2),
        'BFP': round(bfp, 2),
        'Waist-to-Height Ratio': round(whtr, 2),
        'Daily Calorie Needs': round(calorie_goal, 2),
        'Calorie Goal': round(calorie_goal, 2)
    }

def recommend_food(calorie_goal, diet):
    # Filter by diet type
    filtered_data = df[df['Diet'].str.lower() == diet.lower()]

    # Sort meals by calories to best match the calorie goal
    breakfast_data = filtered_data[['Breakfast', 'B_Calories']].sort_values(by='B_Calories')
    lunch_data = filtered_data[['Lunch', 'L_Calories']].sort_values(by='L_Calories')
    dinner_data = filtered_data[['Dinner', 'D_Calories']].sort_values(by='D_Calories')

    # Select meals that help achieve the calorie goal
    breakfast = breakfast_data[breakfast_data['B_Calories'] <= calorie_goal / 3].iloc[-1]
    calorie_goal -= breakfast['B_Calories']

    lunch = lunch_data[lunch_data['L_Calories'] <= calorie_goal / 2].iloc[-1]
    calorie_goal -= lunch['L_Calories']

    dinner = dinner_data[dinner_data['D_Calories'] <= calorie_goal].iloc[-1]
    calorie_goal -= dinner['D_Calories']

    return {
        'Breakfast': breakfast['Breakfast'],
        'Lunch': lunch['Lunch'],
        'Dinner': dinner['Dinner'],
        'Remaining Calories': max(calorie_goal, 0)
    }

@app.route('/calculate', methods=['POST'])
def calculate():
    try:
        data = request.get_json()
        metrics = calculate_metrics(
            data['height'], data['weight'], data['age'], data['gender'],
            data['waist'], data['neck'], data['activity_level'],
            data['diet'], data['health_goal']
        )
        food_recommendations = recommend_food(metrics['Calorie Goal'], data['diet'])
        return jsonify({**metrics, **food_recommendations})
    except Exception as e:        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)
