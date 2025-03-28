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
const Slot = require("./models/slot");
const session = require("express-session");
const { PythonShell } = require("python-shell");
const { spawn } = require("child_process");

app.use(session({
    secret: "yourSecretKey",
    resave: false,
    saveUninitialized: true
}));

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
  .connect("mongodb+srv://vanipandey2502:1kKJya7fVwOxKj66@park-genie.33ebflp.mongodb.net/?retryWrites=true&w=majority&appName=park-genie", {
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
app.get("/payment-success", async (req, res) => {
    try {
        const slotNumber = req.session.slotNumber;
        if (!slotNumber) return res.status(400).send("No slot found!");

        // Update the slot in the database
        await Slot.findOneAndUpdate({ slotNumber }, { isBooked: true });

        // Redirect to the parking slot page
        res.redirect("/parking-slot");
    } catch (err) {
        res.status(500).send("❌ Error: " + err.message);
    }
});

app.post("/next", (req, res) => {
    const { slotNumber } = req.body;
    req.session.slotNumber = slotNumber; // Store slotNumber in session
    res.render("mains/index", { slotNumber }); // Pass slotNumber to index.ejs
});
// **🔹 User Registration**
app.post("/index", async (req, res) => {
    try {
        const { name, phone, carNumber } = req.body;
        const newUser = new User({ name, phone, carNumber });
        await newUser.save();

        // Redirect to payment page with a query parameter
        res.redirect("/payment?generateQR=true");
    } catch (err) {
        res.status(400).send("❌ Error: " + err.message);
    }
});

// **🔹 Render Home Page**
app.get("/", (req, res) => {
    res.render("mains/firstpg.ejs");
});
app.get("/predict", (req, res) => {
    res.render("mains/predict");
});
// app.get("/slot",(req,res)=>{
//     res.render("mains/parking-slot")
// })
app.get("/index", (req, res) => {
    res.render("mains/index", { slotNumber: req.session.slotNumber || null });
});

app.get("/payment", async (req, res) => {
    try {
        const slotNumber = req.query.slotNumber || req.session.slotNumber || "Unknown"; // Read from query first
        
        // Generate a QR code (Example: Payment URL or Slot Information)
        const qrData = `Payment for Slot: ${slotNumber}`;
        const qrCodeDataUrl = await QRCode.toDataURL(qrData);

        res.render("mains/payment", { slotNumber, qrCodeDataUrl }); // Pass slotNumber & QR code
    } catch (error) {
        console.error("❌ Error generating QR Code:", error);
        res.status(500).send("Error generating QR Code.");
    }
});

app.post("/payment", async (req, res) => {
    try {
        const { name, phone, carNumber, slotNumber } = req.body;
        req.session.slotNumber = slotNumber; // Ensure slotNumber is stored

        // Store user details in the database
        const newUser = new User({ name, phone, carNumber, slotNumber });
        await newUser.save();

        // Redirect to payment page
        res.redirect(`/payment?generateQR=true&slotNumber=${slotNumber}`);

    } catch (err) {
        res.status(400).send("❌ Error: " + err.message);
    }
});

app.post("/confirm-payment", async (req, res) => {
    const { slotNumber } = req.body;

    try {
        const slot = await Slot.findOneAndUpdate(
            { slotNumber, isBooked: false },  // Only update if not booked
            { $set: { isBooked: true, bookingTime: new Date((new Date()).toLocaleString("en-US", { timeZone: "Asia/Kolkata" })) } },
            { new: true }  // Return updated document
        );

        if (slot) {
            console.log(`✅ Slot ${slotNumber} successfully booked at ${slot.bookingTime}`);
            res.redirect("/parking-slot");  // Redirect after booking
        } else {
            console.log(`❌ Slot ${slotNumber} is already booked!`);
            res.status(400).send("❌ Slot is already booked.");
        }

    } catch (err) {
        console.error("❌ Error updating slot:", err);
        res.status(500).send("❌ Error updating slot booking status.");
    }
});


app.get("/slot", async (req, res) => {
    try {
        const slots = await Slot.find(); 
        if (!slots || slots.length === 0) {
            console.log("No slots found in the database.");
            return res.render("mains/parking-slot", { slots: [] });
        }

        res.render("mains/parking-slot", { slots }); // Pass slots to EJS
    } catch (err) {
        console.error("❌ Error fetching slots:", err);
        res.status(500).send("Error fetching slot data.");
    }
});
app.get("/parking-slot", async (req, res) => {
    try {
        const slots = await Slot.find(); // Fetch all slots from MongoDB
        // console.log("📌 Slots Data:", slots); // Debugging log

        if (!slots || slots.length === 0) {
            console.log("⚠️ No slots found in the database.");
            return res.render("mains/parking-slot", { slots: [] }); // Send empty array if no slots
        }
        res.render("mains/parking-slot", { slots }); // ✅ Pass slots to EJS
    } catch (err) {
        console.error("❌ Error fetching slots:", err);
        res.status(500).send("Error fetching slot data.");
    }
});


// app.post("/check-slot", async (req, res) => {
//     const { slotNumber } = req.body;
//     const slot = await Slot.findOne({ slotNumber });

//     if (!slot) {
//         console.log("❌ Slot not found!");
//         return res.render("mains/check", {
//             slotNumber,
//             bookingTime: "Not found",
//             day: "Not found",
//             date: "Not found",
//             predictedExitTime: "Not found",
//             timeLeft: "Not available"
//         });
//     }

//     // Ensure bookingTime is valid
//     if (!slot.bookingTime || !(slot.bookingTime instanceof Date)) {
//         console.error("❌ Error: bookingTime is invalid.");
//         return res.status(500).send("Error: Invalid booking time.");
//     }

//     const bookingTimestamp = slot.bookingTime.toISOString();
//     console.log("⏳ Running Python script with timestamp:", bookingTimestamp);

//     const pythonProcess = spawn("python3", ["predict.py", bookingTimestamp]);

//     let outputData = "";
//     let errorData = "";

//     pythonProcess.stdout.on("data", (data) => {
//         outputData += data.toString().trim();
//     });

//     pythonProcess.stderr.on("data", (data) => {
//         errorData += data.toString();
//     });

//     pythonProcess.on("close", async (code) => {
//         if (code !== 0) {
//             console.error(`❌ Python script exited with error: ${errorData}`);
//             return res.status(500).send("Error predicting exit time");
//         }

//         console.log("✅ Python script executed successfully. Output:", outputData);

//         // Validate and convert output
//         const predictedExitTimeStr = outputData.trim();
//         console.log("🕒 Parsed exit time string:", predictedExitTimeStr);

//         if (!predictedExitTimeStr || isNaN(Date.parse(predictedExitTimeStr))) {
//             console.error("❌ Invalid exit time format from Python!");
//             return res.status(500).send("Error: Invalid exit time received.");
//         }

//         const predictedExitTime = new Date(predictedExitTimeStr);
//         console.log("📅 Parsed JavaScript Date object:", predictedExitTime);

//         // Calculate time left
//         const now = new Date();
//         const timeDiffMs = predictedExitTime - now;

//         let timeLeft = "Expired";
//         if (timeDiffMs > 0) {
//             const minutesLeft = Math.floor(timeDiffMs / 60000);
//             const hours = Math.floor(minutesLeft / 60);
//             const minutes = minutesLeft % 60;
//             timeLeft = `${hours}h ${minutes}m left`;
//         }

//         // Update database
//         slot.predictedExitTime = predictedExitTime;
//         await slot.save();

//         // Render the check page
//         res.render("mains/check", {
//             slotNumber,
//             bookingTime: slot.bookingTime.toLocaleTimeString(),
//             day: slot.bookingTime.toLocaleDateString(),
//             date: slot.bookingTime.toLocaleDateString(),
//             predictedExitTime: predictedExitTime.toLocaleString(),
//             timeLeft
//         });
//     });
// });
app.post("/check-slot", async (req, res) => {
    const { slotNumber } = req.body;
    const slot = await Slot.findOne({ slotNumber });

    if (!slot) {
        return res.json({ success: false, message: "Slot not found" });
    }

    if (!slot.bookingTime || !(slot.bookingTime instanceof Date)) {
        return res.status(500).json({ success: false, message: "Invalid booking time" });
    }

    const bookingTimestamp = slot.bookingTime.toISOString();
    // console.log("⏳ Running Python script with timestamp:", bookingTimestamp);

    const pythonProcess = spawn("python3", ["predict.py", bookingTimestamp]);

    let outputData = "";
    let errorData = "";

    pythonProcess.stdout.on("data", (data) => {
        outputData += data.toString().trim();
    });

    pythonProcess.stderr.on("data", (data) => {
        errorData += data.toString();
    });

    pythonProcess.on("close", async (code) => {
        if (code !== 0) {
            return res.status(500).json({ success: false, message: "Error predicting exit time" });
        }

        const predictedExitTimeStr = outputData.trim();
        if (!predictedExitTimeStr || isNaN(Date.parse(predictedExitTimeStr))) {
            return res.status(500).json({ success: false, message: "Invalid exit time format" });
        }

        const predictedExitTime = new Date(predictedExitTimeStr);
        const now = new Date();
        const timeDiffMs = predictedExitTime - now;

        let timeLeft = "Expired";
        if (timeDiffMs > 0) {
            const minutesLeft = Math.floor(timeDiffMs / 60000);
            const hours = Math.floor(minutesLeft / 60);
            const minutes = minutesLeft % 60;
            timeLeft = `${hours}h ${minutes}m left`;
        }

        slot.predictedExitTime = predictedExitTime;
        await slot.save();

        return res.json({
            success: true,
            slotNumber,
            timeLeft
        });
    });
});

app.get("/available-slots", async (req, res) => {
    try {
        const availableSlots = await Slot.countDocuments({ isBooked: 0 }); // Count slots that are not booked
        res.json({ availableSlots });
    } catch (error) {
        console.error("❌ Error fetching available slots:", error);
        res.status(500).json({ error: "Error fetching available slots" });
    }
});

// **🔹 Start Server**
const PORT = 8080;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
