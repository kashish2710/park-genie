const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone:  { 
    type: String, 
    required: true, 
    match: [/^\d{10}$/, "Phone number must be 10 digits"] 
  },
  carNumber:String
});


const uri = "process.env.MONGO_URI";

// Connect to MongoDB
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ Connected to MongoDB Atlas"))
.catch(err => console.error("❌ Error connecting to MongoDB:", err));

const User = mongoose.model("User", userSchema);

module.exports = User;

