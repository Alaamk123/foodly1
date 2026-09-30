const mongoose = require("mongoose");

const RecipeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },

  image: {
    type: String,
    required: true,
  },

  prepTimeMinutes: {
    type: Number,
    required: true,
  },

  cookTimeMinutes: {
    type: Number,
    required: true,
  },

  servings: {
    type: Number,
    required: true,
  },

  calories: {
    type: Number,
    required: true,
  },

  dietTags: {
    type: [String],
    default: [],
  },

  allergens: {
    type: [String],
    default: [],
  },

  ingredients: {
    type: [String],
    required: true,
  },

  steps: {
    type: [String],
    required: true,
  },
});

module.exports = mongoose.model("Recipe", RecipeSchema);
