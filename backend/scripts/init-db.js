require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Recipe = require("../models/Recipe");
require("../models/User");
require("../models/MealPlan");
require("../models/Order");
require("../models/Rating");
const { recipes, normalizeRecipe } = require("../data/seedRecipes");

(async () => {
  await connectDB();

  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
  console.log("[init] indexes ready");

  const migrated = await Recipe.updateMany({ status: { $exists: false } }, { $set: { status: "approved" } });
  console.log(`[init] migration: ${migrated.modifiedCount ?? 0} recipe(s) updated`);

  if (process.env.SEED_ON_START === "false") {
    console.log("[init] SEED_ON_START=false, skipping initial recipes");
  } else if ((await Recipe.estimatedDocumentCount()) === 0) {
    await Recipe.insertMany(recipes.map(normalizeRecipe));
    console.log(`[init] empty database: inserted ${recipes.length} built-in recipes`);
  } else {
    console.log("[init] recipes already exist, nothing to seed");
  }

  await mongoose.disconnect();
})().catch((err) => {
  console.error("[init] failed:", err);
  process.exit(1);
});
