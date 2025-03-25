const mongoose = require("mongoose");
const Slot = require("./slot");

mongoose.connect("mongodb://localhost:27017/park-genie", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const seedSlots = async () => {
    try {
        await Slot.deleteMany(); // Clear previous data

        const slots = [
            { slotNumber: "A11", isBooked: false },
            { slotNumber: "A12", isBooked: false },
            { slotNumber: "A13", isBooked: false }, 
            { slotNumber: "A14", isBooked: false },
            { slotNumber: "A15", isBooked: false },
            { slotNumber: "A16", isBooked: true }, 
            { slotNumber: "A17", isBooked: false },
            { slotNumber: "A18", isBooked: true },
            { slotNumber: "A19", isBooked: false },
            { slotNumber: "A20", isBooked: true }
        ];

        await Slot.insertMany(slots);
        console.log("✅ Slots added successfully!");
        mongoose.connection.close();
    } catch (err) {
        console.error("❌ Error seeding slots:", err);
        mongoose.connection.close();
    }
};

seedSlots();
