import sys
import joblib
from datetime import datetime
import pandas as pd

try:
    # Load model
    model = joblib.load("exit_time_model.pkl")
    
    # Read timestamp from Node.js 
    booking_timestamp = sys.argv[1]  # Only 1 argument now!
    
    # Convert booking time to a naive datetime object (default system time)
    booking_time = datetime.fromisoformat(booking_timestamp.replace("Z", ""))

    # Extract features
    booking_hour = booking_time.hour
    day_of_week = booking_time.weekday()  # Monday=0 to Sunday=6
    
    # Prepare input data
    X_input = pd.DataFrame([[booking_hour, day_of_week]], columns=["booking_hour", "day_of_week"])
    
    # Predict duration (in minutes)
    predicted_duration = int(model.predict(X_input)[0])
    
    # Calculate exit time
    predicted_exit_time = booking_time + pd.DateOffset(minutes=predicted_duration)
    print(predicted_exit_time.isoformat(), flush=True)  
    sys.exit(0)

except Exception as e:
    print(f"❌ Critical error: {str(e)}", flush=True)
    sys.exit(1)
