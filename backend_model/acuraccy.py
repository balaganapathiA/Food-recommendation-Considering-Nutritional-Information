from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import pandas as pd

# Load dataset (example)
data = pd.read_csv("Food_recommendation_dataset.csv")

# Features (X) and Target (y)
X = data[["B_Calories", "B_Fats", "B_Carbs", "B_Protein","L_Calories", "L_Fats", "L_Carbs", "L_Protein", "D_Calories", "D_Fats", "D_Carbs", "D_Protein"]]
y = data["Breakfast","Lunch","Dinner"]

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train Random Forest Model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Predict and Evaluate
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"Model Accuracy: {accuracy:.2f}")