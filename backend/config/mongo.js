const mongoose = require("mongoose");
const config = require("./config.js");

const connectMongo = async () => {
  try {
    await mongoose.connect(config.db.mongoUri);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = { connectMongo };
