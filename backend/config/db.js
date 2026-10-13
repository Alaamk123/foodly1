const mongoose = require("mongoose");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Connects to MongoDB and retries when the database is not ready yet
// (typical with Docker: the app container can start before MongoDB accepts connections).
const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI is not set. Copy .env.example to .env and fill it in.");
    process.exit(1);
  }

  const retries = Number(process.env.DB_CONNECT_RETRIES || 20);
  const delayMs = Number(process.env.DB_CONNECT_RETRY_DELAY_MS || 3000);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log("MongoDB connected");
      return;
    } catch (error) {
      console.error(`MongoDB connection failed (attempt ${attempt}/${retries}): ${error.message}`);
      if (attempt === retries) process.exit(1);
      await sleep(delayMs);
    }
  }
};

module.exports = connectDB;
