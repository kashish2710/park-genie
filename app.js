require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const ejsmate = require("ejs-mate");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const QRCode = require("qrcode");
const session = require("express-session");
const { PythonShell } = require("python-shell");
const { spawn } = require("child_process");



// Session Middleware: Stores user session data
app.use(session({
    secret: "yourSecretKey",
    resave: false,
    saveUninitialized: true
}));

//require MongoDB models
const Slot = require("./models/slot");
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

// Connect to MongoDB
if (!mongoose.connection.readyState) {
    mongoose
      .connect("mongodb+srv://vanipandey2502:1kKJya7fVwOxKj66@park-genie.33ebflp.mongodb.net/?retryWrites=true&w=majority&appName=park-genie", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(() => console.log("Connected to MongoDB Atlas"))
      .catch((err) => console.error("MongoDB Connection Error:", err));
  } else {
    console.log("MongoDB connection already established.");
  }


app.get("/", (req, res) => {
    res.render("mains/index.ejs");
});

app.get("/parking-slot", async (req, res) => {
    try {
        const slots = await Slot.find(); // Fetch all slots from MongoDB

        if (!slots || slots.length === 0) {
            console.log("No slots found in the database.");
            return res.render("mains/parking-slot", { slots: [] }); // Send empty array if no slots
        }
        res.render("mains/parking-slot", { slots }); // Pass slots to EJS
    } catch (err) {
        console.error("Error fetching slots:", err);
        res.status(500).send("Error fetching slot data.");
    }
});

app.get("/discuss",(req,res)=>{
    res.render("mains/discuss.ejs")
})

app.get("/payment", async (req, res) => {
    try {
        const slotNumber = req.query.slotNumber || req.session.slotNumber || "Unknown"; // Read from query first
        
        // Generate a QR code (Example: Payment URL or Slot Information)
        const qrData = `Payment for Slot: ${slotNumber}`;
        const qrCodeDataUrl = await QRCode.toDataURL(qrData);

        res.render("mains/payment", { slotNumber, qrCodeDataUrl }); // Pass slotNumber & QR code
    } catch (error) {
        console.error("Error generating QR Code:", error);
        res.status(500).send("Error generating QR Code.");
    }
});

app.get("/payment-success", async (req, res) => {
    try {
        const slotNumber = req.session.slotNumber;
        if (!slotNumber) return res.status(400).send("No slot found!");

        // Update the slot in the database
        await Slot.findOneAndUpdate({ slotNumber }, { isBooked: true });

        // Redirect to the parking slot page
        res.redirect("/parking-slot");
    } catch (err) {
        res.status(500).send(" Error: " + err.message);
    }
});
app.post("/confirm-payment", async (req, res) => {
    const { slotNumber } = req.body;

    try {
        const bookingTime = new Date();

        const slot = await Slot.findOneAndUpdate(
            { slotNumber, isBooked: false },  
            { 
                $set: { 
                    isBooked: true, 
                    bookingTime: bookingTime 
                } 
            },
            { new: true }  // Return updated document
        );

        if (slot) {
            res.redirect("/parking-slot");  // Redirect after booking
        } else {
            console.log(`Slot ${slotNumber} is already booked!`);
            res.status(400).send("Slot is already booked.");
        }

    } catch (err) {
        console.error("Error updating slot:", err);
        res.status(500).send("Error updating slot booking status.");
    }
});

app.post("/next", (req, res) => {
    const { slotNumber } = req.body;
    req.session.slotNumber = slotNumber; // Store slotNumber in session
    res.render("mains/details", { slotNumber }); // Pass slotNumber to index.ejs
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
        res.status(400).send("Error: " + err.message);
    }
});

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

    const pythonProcess = spawn(process.platform === "win32" ? "python" : "python3", ["predict.py", bookingTimestamp]); //works for both window and mac 
    // const  pythonProcess= await axios.get(`https://park-genie-4.onrender.com/predict?booking_time=${bookingTimestamp}`);
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
        const predictedExitTime = new Date(predictedExitTimeStr + "Z"); // Ensure UTC
        if (!predictedExitTimeStr || isNaN(predictedExitTime.getTime())) {
            return res.status(500).json({ success: false, message: "Invalid exit time format" });
        }

        const now = new Date(new Date().toISOString());
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
        const totalSlots= await Slot.countDocuments();
        res.json({ availableSlots ,totalSlots });
    } catch (error) {
        console.error("Error fetching available slots:", error);
        res.status(500).json({ error: "Error fetching available slots" });
    }
});

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
