const express = require("express");
const Recipe = require("../models/Recipe");
const requireAuth = require("../middleware/auth");
const { validateRecipeSubmission } = require("../utils/recipeValidation");

const router = express.Router();
router.use(requireAuth);

const MAX_PENDING_PER_USER = 10; // simple protection against flooding the review queue

// POST /api/submissions  -> a subscriber sends a new recipe for admin review
router.post("/", async (req, res) => {
  try {
    const { errors, value } = validateRecipeSubmission(req.body);
    if (errors.length) return res.status(400).json({ message: "Please fix the highlighted fields.", errors });

    const pending = await Recipe.countDocuments({ submittedBy: req.userId, status: "pending" });
    if (pending >= MAX_PENDING_PER_USER) {
      return res.status(429).json({ message: `You already have ${MAX_PENDING_PER_USER} recipes waiting for review.` });
    }

    // status and submittedBy are decided HERE, never taken from the request body.
    const recipe = await Recipe.create({ ...value, status: "pending", submittedBy: req.userId });
    res.status(201).json(recipe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not submit the recipe." });
  }
});

// GET /api/submissions/mine  -> my own submissions with their review status
router.get("/mine", async (req, res) => {
  try {
    const recipes = await Recipe.find({ submittedBy: req.userId }).sort({ createdAt: -1 });
    res.json({ data: recipes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load your recipes." });
  }
});

module.exports = router;
