import pandas as pd
import numpy as np
import pickle
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

# Load the updated dataset
df = pd.read_csv("food_categorized.csv")

# Convert categorical column "Suitable_For" into numerical labels
df["Suitable_For"] = df["Suitable_For"].astype("category").cat.codes  # Assigns 0, 1, 2 for Weight Loss, Gain, Maintenance

# Select features (nutritional values) and target (goal category)
X = df[["Calories", "Proteins", "Carbohydrates", "Fats"]]
y = df["Suitable_For"]

# Split the dataset for training and testing
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train a Random Forest model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Save the trained model
with open("food_recommendation_model.pkl", "wb") as f:
    pickle.dump(model, f)

print("✅ Model trained and saved as food_recommendation_model.pkl")
