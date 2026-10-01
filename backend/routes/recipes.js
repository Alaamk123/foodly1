const express = require("express");
const router = express.Router();
const Recipe = require("../models/Recipe");

router.get("/", async (req, res) => {
  try {
    const { diet, excludeAllergens, search,maxTime } = req.query;
    const page = Math.max(Math.max(parseInt(req.query.page, 10)) || 1, 1);
    const limit = Math.max(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);

    const query = {};

    if (diet) {
        const diets = diet.split(",").map((d) => d.trim()).filter((Boolean));
         if (diets.length) query.dietTags = { $in: diets };
    }

    if (excludeAllergens) {
      const allergens = excludeAllergens.split(",").map((a) => a.trim()).filter(Boolean);
      if (allergens.length) query.allergens = { $nin: allergens };
    }

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    let recipes = await Recipe.find(query).sort({ createdAt: -1 });

    if (maxTime) {
      const max = parseInt(maxTime, 10);
      recipes = recipes.filter((r) => r.prepTimeMinutes + r.cookTimeMinutes <= max);
    }

    const total = recipes.length;
    const start = (page - 1) * limit;
    const paged = recipes.slice(start, start + limit);

    res.json({
      data: paged,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch recipes", error: err.message });
  }
});

// GET /api/recipes/:id
router.get("/:id", async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });
    res.json(recipe);
  } catch (err) {
    res.status(400).json({ message: "Invalid recipe id", error: err.message });
  }
});

// POST /api/recipes  (utility endpoint for admins / seeding via API instead of script)
router.post("/", async (req, res) => {
  try {
    const recipe = await Recipe.create(req.body);
    res.status(201).json(recipe);
  } catch (err) {
    res.status(400).json({ message: "Failed to create recipe", error: err.message });
  }
});

// PUT /api/recipes/:id
router.put("/:id", async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });
    res.json(recipe);
  } catch (err) {
    res.status(400).json({ message: "Failed to update recipe", error: err.message });
  }
});

// DELETE /api/recipes/:id
router.delete("/:id", async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndDelete(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });
    res.json({ message: "Recipe deleted" });
  } catch (err) {
    res.status(400).json({ message: "Failed to delete recipe", error: err.message });
  }
});

module.exports = router;
 