 require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Recipe = require("../models/Recipe");

(async () => {
  await connectDB();
  const res = await Recipe.updateMany({ status: { $exists: false } }, { $set: { status: "approved" } });
  console.log(`[migrate] recipes updated: ${res.modifiedCount ?? res.nModified ?? 0}`);
  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
