import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
import joblib

# Sample dataset (replace with actual data)
data = {
    'booking_hour': [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    'day_of_week': [0, 1, 2, 3, 4, 5, 6, 0, 1, 2, 3, 4],
    'duration': [120, 150, 90, 110, 140, 100, 130, 180, 160, 200, 170, 140]
}

df = pd.DataFrame(data)

# Define features & target
X = df[['booking_hour', 'day_of_week']]
y = df['duration']

# Train model
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
model = LinearRegression()
model.fit(X_train, y_train)

# Save model
joblib.dump(model, "exit_time_model.pkl")
print("Model saved!")
