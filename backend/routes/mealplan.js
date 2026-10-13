const express = require("express");
const mongoose = require("mongoose");
const MealPlan = require("../models/MealPlan");
const Recipe = require("../models/Recipe");
const requireAuth = require("../middleware/auth");

const router = express.Router();

// Every meal-plan route needs a logged-in user (req.userId comes from the JWT)
router.use(requireAuth);

// GET /api/mealplans/:weekStart  -> fetch (or create empty) plan for that week
router.get("/:weekStart", async (req, res) => {
  try {
    const { weekStart } = req.params;
    const userId = req.userId;
    let plan = await MealPlan.findOne({ userId, weekStart }).populate("meals.recipe");

if (!plan) {
  plan = { userId, weekStart, meals: [] };
} else {
  // Remove meal slots whose recipe was deleted
  const validMeals = plan.meals.filter((slot) => slot.recipe);

  if (validMeals.length !== plan.meals.length) {
    plan.meals = validMeals;
    await plan.save();
  }
}

// Compute daily calorie totals
const dailyTotals = Array.from({ length: 7 }, () => 0);

(plan.meals || []).forEach((slot) => {
  if (slot.recipe && typeof slot.recipe === "object") {
    dailyTotals[slot.dayIndex] += slot.recipe.calories || 0;
  }
});

res.json({
  ...(plan.toObject ? plan.toObject() : plan),
  dailyTotals,
});

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch meal plan", error: err.message });
  }
});

router.post("/:weekStart/meals", async (req, res) => {
  try {
    const { weekStart } = req.params;
    const userId = req.userId;
    const { mealType, recipeId, servings } = req.body;
    const dayIndex = Number(req.body.dayIndex); // tolerate "2" as well as 2

    if (req.body.dayIndex === undefined || !Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex > 6 || !mealType || !recipeId) {
      return res.status(400).json({ message: "dayIndex (0-6), mealType and recipeId are required" });
    }

    const recipeExists = await Recipe.exists({ _id: recipeId });
    if (!recipeExists) return res.status(404).json({ message: "Recipe not found" });

    // 1) Make sure the week's plan exists. Two quick requests could both try to create it
    //    (unique index on userId+weekStart), so a duplicate-key error here is safe to ignore.
    try {
      await MealPlan.updateOne(
        { userId, weekStart },
        { $setOnInsert: { meals: [] } },
        { upsert: true }
      );
    } catch (err) {
      if (err.code !== 11000) throw err;
    }

    // 2) Remove any existing meal slot for that day+type, then add the new one.
    await MealPlan.updateOne({ userId, weekStart }, { $pull: { meals: { dayIndex, mealType } } });
    await MealPlan.updateOne(
      { userId, weekStart },
      { $push: { meals: { dayIndex, mealType, recipe: recipeId, servings: servings || undefined } } },
      { runValidators: true }
    );

    const plan = await MealPlan.findOne({ userId, weekStart }).populate("meals.recipe");
    res.status(201).json(plan);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Failed to update meal plan", error: err.message });
  }
});

// DELETE /api/mealplans/:weekStart/meals/:slotId
router.delete("/:weekStart/meals/:slotId", async (req, res) => {
  try {
    const { weekStart, slotId } = req.params;
    const userId = req.userId;
    const plan = await MealPlan.findOne({ userId, weekStart });
    if (!plan) return res.status(404).json({ message: "Meal plan not found" });

    plan.meals = plan.meals.filter((m) => String(m._id) !== slotId);
    await plan.save();
    await plan.populate("meals.recipe");

    res.json(plan);
  } catch (err) {
    res.status(400).json({ message: "Failed to remove meal", error: err.message });
  }
});

// DELETE /api/mealplans/:weekStart -> clear the whole week
router.delete("/:weekStart", async (req, res) => {
  try {
    const { weekStart } = req.params;
    const userId = req.userId;
    await MealPlan.findOneAndUpdate(
      { userId, weekStart },
      { meals: [] },
      { upsert: true }
    );
    res.json({ message: "Week cleared" });
  } catch (err) {
    res.status(400).json({ message: "Failed to clear week", error: err.message });
  }
});

module.exports = router;
