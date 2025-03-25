const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone:  { 
    type: String, 
    required: true, 
    match: [/^\d{10}$/, "Phone number must be 10 digits"] // Validates a 10-digit number
  },
  carNumber:String
});

const User = mongoose.model("User", userSchema);

module.exports = User;
