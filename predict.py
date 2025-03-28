import sys
import joblib
from datetime import datetime
import pandas as pd
from datetime import timedelta

try:
    # Load model
    model = joblib.load("exit_time_model.pkl")
    
    # Read timestamp from Node.js (assumed in UTC)
    booking_timestamp = sys.argv[1]  # Only 1 argument now!
    
    # Convert booking time to UTC datetime
    booking_time_utc = datetime.fromisoformat(booking_timestamp.replace("Z", ""))

    # Convert to local time zone
    booking_time_local = booking_time_utc.astimezone()  # Converts to system's local time

    # Extract features
    booking_hour = booking_time_local.hour
    day_of_week = booking_time_local.weekday()  # Monday=0 to Sunday=6
    
    # Prepare input data
    X_input = pd.DataFrame([[booking_hour, day_of_week]], columns=["booking_hour", "day_of_week"])
    
    # Predict duration (in minutes)
    predicted_duration = int(model.predict(X_input)[0])
    
    # Calculate exit time
    predicted_exit_time_local = booking_time_local + pd.DateOffset(minutes=predicted_duration)+ timedelta(minutes=330)

    # Print formatted local exit time
    print(predicted_exit_time_local.strftime("%A, %m-%d-%Y %I:%M %p"), flush=True)  # Day, MM-DD-YYYY HH:MM AM/PM
    sys.exit(0)

except Exception as e:
    print(f"❌ Critical error: {str(e)}", flush=True)
    sys.exit(1)

