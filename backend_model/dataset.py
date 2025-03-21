import pandas as pd
from pymongo import MongoClient

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["food-tracker"]  # Database name
collection = db["foods"]  # Collection name

# Read CSV file
df = pd.read_csv("food_categorized.csv")

# Convert DataFrame to dictionary
data = df.to_dict(orient="records")

# Insert into MongoDB
collection.insert_many(data)

print("✅ Data inserted successfully into MongoDB!")
