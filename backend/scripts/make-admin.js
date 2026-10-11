require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

(async () => {
  const email = String(process.argv[2] || "").trim().toLowerCase();
  if (!email) {
    console.error("Usage: npm run make-admin -- someone@example.com");
    process.exit(1);
  }
  await connectDB();
  const result = await User.updateOne({ email }, { $set: { role: "admin" } });
  const found = result.matchedCount > 0;
  console.log(found ? `[make-admin] ${email} is now an admin.` : `[make-admin] No user with email ${email}. Register first.`);
  await mongoose.disconnect();
  process.exit(found ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
