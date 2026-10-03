const express = require("express");
const MealPlan = require("../models/MealPlan");
const requireAuth = require("../middleware/auth");
const { aggregateGroceryList } = require("../utils/groceryAggregator");

const router = express.Router();

router.get("/:weekStart", requireAuth, async (req, res) => {
  try {
    const { weekStart } = req.params;
    const userId = req.userId;

    const plan = await MealPlan.findOne({ userId, weekStart }).populate("meals.recipe");

    if (!plan || plan.meals.length === 0) {
      return res.json({
        weekStart,
        categories: [],
        recipeCount: 0,
        itemCount: 0,
        message: "No meals planned for this week yet.",
      });
    }

    const { categories, recipeCount, itemCount } = aggregateGroceryList(plan.meals);

    res.json({ weekStart, categories, recipeCount, itemCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to build grocery list", error: err.message });
  }
});

module.exports = router;
