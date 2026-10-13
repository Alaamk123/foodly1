const express = require("express");
const mongoose = require("mongoose");
const Rating = require("../models/Rating");
const Recipe = require("../models/Recipe");
const User = require("../models/User");
const requireAuth = require("../middleware/auth");

// mergeParams: lets this router read :recipeId from the path it is mounted on
// (server.js mounts it at /api/recipes/:recipeId/rating)
const router = express.Router({ mergeParams: true });

const MAX_COMMENT = 1000;

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Recalculate the average and count from the Rating collection (the source of truth)
// and store them on the recipe so the recipe list/detail can show them without extra queries.
async function refreshRecipeStats(recipeId) {
  const [stats] = await Rating.aggregate([
    { $match: { recipe: new mongoose.Types.ObjectId(recipeId) } },
    { $group: { _id: "$recipe", avg: { $avg: "$value" }, count: { $sum: 1 } } },
  ]);
  const ratingAverage = stats ? Math.round(stats.avg * 100) / 100 : 0;
  const ratingCount = stats ? stats.count : 0;
  await Recipe.updateOne({ _id: recipeId }, { $set: { ratingAverage, ratingCount } });
  return { ratingAverage, ratingCount };
}

// GET /api/recipes/:recipeId/rating/reviews  (public) -> latest written reviews of a recipe.
// Only the reviewer's first name is exposed (no email, no id).
router.get("/reviews", async (req, res) => {
  try {
    const { recipeId } = req.params;
    if (!isValidId(recipeId)) return res.status(400).json({ message: "Invalid recipe id." });

    const rows = await Rating.find({ recipe: recipeId, comment: { $ne: "" } })
      .sort({ updatedAt: -1 })
      .limit(50)
      .populate({ path: "user", model: User, select: "name" })
      .lean();

    res.json(
      rows.map((r) => ({
        id: r._id,
        value: r.value,
        comment: r.comment,
        author: (r.user?.name || "").split(" ")[0] || "",
        createdAt: r.updatedAt || r.createdAt,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load reviews." });
  }
});

// Everything below needs a logged-in user
router.use(requireAuth);

// GET /api/recipes/:recipeId/rating  -> the logged-in user's own rating (null if none)
router.get("/", async (req, res) => {
  try {
    const { recipeId } = req.params;
    if (!isValidId(recipeId)) return res.status(400).json({ message: "Invalid recipe id." });

    const mine = await Rating.findOne({ recipe: recipeId, user: req.userId });
    res.json({ myRating: mine ? mine.value : null, myComment: mine ? mine.comment : "" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load your rating." });
  }
});

// PUT /api/recipes/:recipeId/rating  { value: 1..5, comment?: string }  -> add or change the user's rating/comment
router.put("/", async (req, res) => {
  try {
    const { recipeId } = req.params;
    if (!isValidId(recipeId)) return res.status(400).json({ message: "Invalid recipe id." });

    const { value } = req.body;
    if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 5) {
      return res.status(400).json({ message: "Rating must be a whole number from 1 to 5." });
    }

    // The comment is optional. If it is not sent at all, an existing comment is left untouched.
    const { comment } = req.body;
    if (comment !== undefined && (typeof comment !== "string" || comment.trim().length > MAX_COMMENT)) {
      return res.status(400).json({ message: `Comment must be text of at most ${MAX_COMMENT} characters.` });
    }

    if (!(await Recipe.exists({ _id: recipeId }))) {
      return res.status(404).json({ message: "Recipe not found." });
    }

    // One rating per (user, recipe): update it if it exists, otherwise create it
    const update = { value };
    if (comment !== undefined) update.comment = comment.trim();
    const saved = await Rating.findOneAndUpdate(
      { recipe: recipeId, user: req.userId },
      { $set: update },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    const stats = await refreshRecipeStats(recipeId);
    res.json({ myRating: value, myComment: saved.comment, ...stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not save your rating." });
  }
});

module.exports = router;
