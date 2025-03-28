const mongoose = require("mongoose");
const Slot = require("./slot");

mongoose.connect("mongodb+srv://vanipandey2502:1kKJya7fVwOxKj66@park-genie.33ebflp.mongodb.net/?retryWrites=true&w=majority&appName=park-genie", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const seedSlots = async () => {
    try {
        await Slot.deleteMany(); // Clear previous data

        const slots = [
            { slotNumber: "A01", isBooked: false },
            { slotNumber: "A02", isBooked: false },
            { slotNumber: "A03", isBooked: false }, 
            { slotNumber: "A04", isBooked: false },
            { slotNumber: "A05", isBooked: false },
            { slotNumber: "A06", isBooked: false  }, 
            { slotNumber: "A07", isBooked: false },
            { slotNumber: "A08", isBooked: true },
            { slotNumber: "A09", isBooked: false },
            { slotNumber: "A10", isBooked: true },
            { slotNumber: "A11", isBooked: false },
            { slotNumber: "A12", isBooked: false },
            { slotNumber: "A13", isBooked: false }, 
            { slotNumber: "A14", isBooked: false },
            { slotNumber: "A15", isBooked: false },
            { slotNumber: "A16", isBooked: false  }, 
            { slotNumber: "A17", isBooked: false },
            { slotNumber: "A18", isBooked: false },
            { slotNumber: "A19", isBooked: false },
            { slotNumber: "A20", isBooked: false  }
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
