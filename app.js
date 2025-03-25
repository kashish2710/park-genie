const express = require("express");
const app = express();
const path = require("path");
const ejsmate = require("ejs-mate");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();
const axios = require("axios");
const cors = require("cors");
const QRCode = require("qrcode");

// Load Environment Variables
const CASHFREE_API_URL = process.env.CASHFREE_API_URL;
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;

const User = require("./models/user"); 

// Middleware
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(bodyParser.json()); // Needed for JSON requests
app.use(cors());

// Set up view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.engine("ejs", ejsmate);

// **🔹 Connect to MongoDB**
mongoose
  .connect("mongodb://127.0.0.1:27017/park-genie", {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log("✅ MongoDB Connected!"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// **🔹 Check Parking Availability**
app.post('/check-parking', async (req, res) => {
    try {
        console.log("🚀 Received Request from Frontend:", req.body);  // Debugging line

        const { sensor_distance, time_of_day } = req.body;
        const entry_time = time_of_day;  // ✅ Rename time_of_day to entry_time
        
        if (!sensor_distance || entry_time === undefined) {
            console.error("❌ Missing sensor_distance or entry_time:", req.body);
            return res.status(400).json({ error: "Missing sensor_distance or entry_time" });
        }

        const response = await axios.post('http://127.0.0.1:6000/predict', {
            sensor_distance,
            entry_time
        });

        console.log("✅ AI Model Response:", response.data);
        res.json({ estimated_exit_time: response.data.predicted_exit_time });
    } catch (error) {
        console.error("❌ Error calling AI model:", error.response?.data || error.message);
        res.status(500).json({ error: "Prediction failed" });
    }
});


// **🔹 Render Booking Page**
app.get("/book", (req, res) => {
    res.render("mains/book");
});

// **🔹 Create Order (Cashfree Payment)**
app.post("/create-order", async (req, res) => {
    try {
        const { name, phone, amount } = req.body;
        console.log("📦 Received Order Request:", { name, phone, amount });

        const orderData = {
            order_id: `ORD_${Math.floor(Math.random() * 1000000)}`,
            order_amount: amount,
            order_currency: "INR",
            customer_details: {
                customer_id: phone,
                customer_name: name,
                customer_phone: phone,
            },
            order_meta: {
                return_url: "http://localhost:8080/payment-status?order_id={order_id}",
            },
        };

        console.log("💳 Sending Request to Cashfree:", orderData);

        const response = await axios.post(CASHFREE_API_URL, orderData, {
            headers: {
              "Content-Type": "application/json",
              "x-api-version": "2022-09-01",
              "x-client-id": CASHFREE_APP_ID.trim(),  
              "x-client-secret": CASHFREE_SECRET_KEY.trim(),
            },
        });

        console.log("✅ Cashfree Response:", response.data);

        // ✅ Fix: Correctly extract payment link
        if (response.data && response.data.payment_link) {
            res.redirect(response.data.payment_link);
        } else {
            console.error("❌ Error: Payment link not received", response.data);
            res.send("❌ Error: Payment link not received");
        }          
    } catch (err) {
        console.error("❌ Payment Error:", err.response ? err.response.data : err.message);
        res.send("❌ Error processing payment<br><pre>" + JSON.stringify(err.response ? err.response.data : err.message, null, 2) + "</pre>");
    }
});

// **🔹 Payment Status Route**
app.get("/payment-status", async (req, res) => {
    const orderId = req.query.order_id;
    res.send(`<h2>✅ Payment Successful!</h2><p>Order ID: ${orderId}</p>`);
});

// **🔹 User Registration**
app.post("/index", async (req, res) => {
    try {
        const { name, phone, carNumber } = req.body;
        const newUser = new User({ name, phone, carNumber });
        await newUser.save();
        res.render("mains/payment");
    } catch (err) {
        res.status(400).send("❌ Error: " + err.message);
    }
});

// **🔹 Render Home Page**
app.get("/", (req, res) => {
    res.render("mains/index.ejs");
});
app.get("/predict", (req, res) => {
    res.render("mains/predict");
});
app.get("/slot",(req,res)=>{
    res.render("mains/parking-slot")
})
app.get("/mains/index", (req, res) => {
    res.render("mains/index");  // Render the EJS file
});
app.get("/payment", async (req, res) => {
    try {
        const fakeData = "https://example.com/fake-payment";  // Fake QR URL
        const qrCodeDataUrl = await QRCode.toDataURL(fakeData); // Generate QR code
        res.render("payment", { qrCodeDataUrl });
    } catch (err) {
        res.status(500).send("Error generating QR code");
    }
});
app.post("/p", (req, res) => {
    res.redirect("/slot");
});

// **🔹 Start Server**
const PORT = 8080;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
