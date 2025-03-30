Park Genie

Project Overview

Park Genie is a smart parking management system that enables users to find, book, and predict parking slot availability. The system integrates Node.js (Express.js), MongoDB, and Python (Machine Learning) to optimize parking slot usage and provide real-time availability and predictions based on historical data.

Features

Real-time Parking Slot Availability – View available slots before arriving.

QR Code-based Booking System – Users receive a QR code for payment confirmation.

Machine Learning Predictions – Predicts when a slot will be free based on past data.

Session-based Slot Reservation – Ensures seamless user experience.

MongoDB Integration – Stores user and slot data efficiently.

Dependencies

Backend (Node.js + Express)

Node.js 18+

Express – Web framework

Path – Built-in Node.js module for handling file paths

EJS-Mate – Layout engine for EJS templates

Mongoose – MongoDB ODM

Body-parser – Middleware to parse incoming request bodies

Dotenv – Loads environment variables

Axios – HTTP client for API requests

CORS – Middleware for cross-origin requests

QRCode – Generates QR codes

Express-session – Manages user sessions

Python-shell – Runs Python scripts from Node.js

Child_process – Spawns and manages system processes

Machine Learning Model (Python)

Python 3.9+

Pandas – Data manipulation

NumPy – Numerical computing

Scikit-learn – ML model implementation

Joblib – Saves and loads ML models

Flask – Serves ML predictions via API

Setup Instructions

1️⃣ Clone the Repository

git clone https://github.com/kashish2710/park-genie.git
cd park-genie

2️⃣ Set Up Virtual Environment (For Python ML Model)

python3 -m venv venv
source venv/bin/activate  # On macOS/Linux
venv\Scripts\activate  # On Windows

3️⃣ Install Dependencies

For Node.js Backend:

npm install express path ejs-mate mongoose body-parser dotenv axios cors qrcode express-session python-shell child_process

For Python ML Model:

pip install pandas flask joblib scikit-learn

4️⃣ Setup Environment Variables

Create a .env file in the root directory and add:

MONGO_URI=your_mongodb_connection_string
SESSION_SECRET=your_secret_key

5️⃣ Run the Application

Start the Backend Server:

node app.js

Server will be available at: http://localhost:8080/

API Endpoints

Parking Slot Management

GET / → View the front Page.

GET /parking-slot → View all parking slots.

POST /confirm-payment → Confirms slot payment and updates availability.

POST /next → Stores selected slot in session.

POST /payment → Registers user details and generates QR Code.

Slot Prediction

POST /check-slot → Predicts when a slot will be free.

GET /available-slots → Returns the number of available slots.

Future Enhancements

Integration with IoT sensors for real-time occupancy updates.

Implementing automated payments.

Enhancing ML predictions with more data points.

License

This project is licensed under the MIT License.

Contributing

Want to contribute? Feel free to fork this repo and submit a pull request!

Contact

For any queries, reach out to the project maintainers.
