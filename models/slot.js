const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({
    slotNumber: String,      // Parking slot number
    isBooked: { type: Boolean, default: false },  // Booking status
    bookingTime: Date,       // Time of booking
    predictedExitTime:Date 
});

const Slot = mongoose.model("Slot", slotSchema);
module.exports = Slot;
