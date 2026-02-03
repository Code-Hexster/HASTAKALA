const mongoose = require("mongoose");

/**
 * Connects to MongoDB via Mongoose.
 * Call once at server startup — index.js does this before app.listen().
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not defined in environment variables");
  }

  const conn = await mongoose.connect(uri);
  console.log(`🗄️  MongoDB connected: ${conn.connection.host}`);
};

module.exports = connectDB;
