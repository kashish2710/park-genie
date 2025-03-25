import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import joblib
from flask import Flask, request, jsonify

# Generate Sample Data
np.random.seed(42)
data = pd.DataFrame({
    "sensor_distance": np.random.randint(0, 100, 1000),
    "entry_time": np.random.randint(0, 24, 1000),  # Hour of entry
    "parking_duration": np.random.randint(5, 120, 1000),  # Duration in minutes
})

# Calculate exit time (entry time + duration)
data["exit_time"] = (data["entry_time"] + (data["parking_duration"] / 60)) % 24

# Train Model
X = data[["sensor_distance", "entry_time"]]
y = data["exit_time"]
model = RandomForestRegressor()
model.fit(X, y)

# Save Model
joblib.dump(model, "parking_model.pkl")

# Create Flask API
app = Flask(__name__)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    print("📩 Received Data:", data)  # Debugging log
    
    if not data or "sensor_distance" not in data or "entry_time" not in data:
        print("❌ Missing required fields!")
        return jsonify({"error": "Missing required fields"}), 400
    
    features = np.array([[data["sensor_distance"], data["entry_time"]]])
    prediction = model.predict(features)

    return jsonify({"predicted_exit_time": prediction.tolist()})  # Convert NumPy array to list

if __name__ == '__main__':
    app.run(port=6000, debug=True)
import pandas as pd
import numpy as np
import datetime

# Generate fake data
np.random.seed(42)

def generate_fake_data(n=100):
    data = []
    for _ in range(n):
        entry_time = datetime.datetime(2025, 3, np.random.randint(1, 30), np.random.randint(6, 22), np.random.randint(0, 60))
        duration = np.random.randint(15, 180)  # Parking duration between 15 mins to 3 hours
        exit_time = entry_time + datetime.timedelta(minutes=duration)
        data.append([entry_time, exit_time])
    
    return pd.DataFrame(data, columns=['entry_time', 'exit_time'])

# Generate 100 fake entries
df = generate_fake_data(100)

# Save to CSV
df.to_csv("parking_data.csv", index=False)

# print("Fake parking data saved to 'parking_data.csv'")
# import pandas as pd
# import numpy as np
# from sklearn.ensemble import RandomForestRegressor
# import datetime

# # Load parking data (CSV should have 'entry_time' and 'exit_time')
# data = pd.read_csv("parking_data.csv")

# # Convert times to datetime and calculate parking duration in minutes
# data['entry_time'] = pd.to_datetime(data['entry_time'])
# data['exit_time'] = pd.to_datetime(data['exit_time'])
# data['duration'] = (data['exit_time'] - data['entry_time']).dt.total_seconds() / 60  

# # Extract hour and weekday as features
# X = data[['entry_time']].copy()
# X['hour'] = data['entry_time'].dt.hour
# X['weekday'] = data['entry_time'].dt.weekday
# y = data['duration']  # Target variable (parking duration)

# # Train the model
# model = RandomForestRegressor(n_estimators=100, random_state=42)
# model.fit(X[['hour', 'weekday']], y)

# # Function to predict exit time
# def predict_exit_time(entry_time):
#     entry_time = pd.to_datetime(entry_time)
#     features = np.array([[entry_time.hour, entry_time.weekday()]])
#     predicted_duration = model.predict(features)[0]
#     return entry_time + datetime.timedelta(minutes=predicted_duration)

# # Example usage
# entry_time = "2025-03-24 14:30:00"
# print("Predicted Slot Free Time:", predict_exit_time(entry_time))