const mongoose = require("mongoose");

const GROCERY_CATEGORIES = [
  "Produce",
  "Dairy & Eggs",
  "Meat & Seafood",
  "Pantry",
  "Frozen",
  "Snacks",
  "Bakery",
  "Spices & Seasonings",
  "Other",
];

const DIET_TAGS = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Dairy-Free",
  "Low-Carb",
  "Keto",
  "Paleo",
  "Pescatarian",
  "Other",
];

const ALLERGENS = [
  "Peanuts",
  "Tree Nuts",
  "Dairy",
  "Eggs",
  "Gluten",
  "Soy",
  "Fish",
  "Shellfish",
];

const RECIPE_STATUSES = ["pending", "approved", "rejected"];

// Public recipes: approved recipes and legacy recipes without a status.
const PUBLIC_FILTER = {
  status: { $in: ["approved", null] },
};

// ---------------- Ingredient Schema ----------------

const IngredientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: String,
      required: true,
      min: 0,
    },

    unit: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: GROCERY_CATEGORIES,
      required: true,
      default: "Other",
    },

    allergens: {
      type: [String],
      enum: ALLERGENS,
    },
  },
  { _id: false }
);

// ---------------- Recipe Schema ----------------

const RecipeSchema = new mongoose.Schema(
  {
    // Basic recipe information
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    image: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    prepTimeMinutes: {
      type: Number,
      required: true,
      min: 0,
    },

    cookTimeMinutes: {
      type: Number,
      required: true,
      min: 0,
    },

    servings: {
      type: Number,
      required: true,
      min: 1,
      default: 2,
    },

    calories: {
      type: Number,
      required: true,
      min: 0,
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Advanced"],
      default: "Easy",
    },

    dietTags: [
      {
        type: String,
        enum: DIET_TAGS,
      },
    ],

    allergens: [
      {
        type: String,
        enum: ALLERGENS,
      },
    ],

    ingredients: {
      type: [IngredientSchema],
      validate: (v) => Array.isArray(v) && v.length > 0,
    },

    steps: {
      type: [String],
      validate: (v) => Array.isArray(v) && v.length > 0,
    },

    tips: {
      type: String,
      default: "",
    },

    // ---------------- Community Submissions ----------------
    // Moderation fields

    status: {
      type: String,
      enum: RECIPE_STATUSES,
      default: "approved",
      index: true,
    },

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    rejectionReason: {
      type: String,
      default: "",
      maxlength: 500,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ---------------- Recipe Ratings ----------------
    // Rating statistics are maintained by routes/ratings.js.
    // The Rating collection is the source of truth.

    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// ---------------- Virtual Fields ----------------

// Calculate total preparation and cooking time.
RecipeSchema.virtual("totalTimeMinutes").get(function () {
  return this.prepTimeMinutes + this.cookTimeMinutes;
});

// Include virtual fields in JSON and Object output.
RecipeSchema.set("toJSON", { virtuals: true });
RecipeSchema.set("toObject", { virtuals: true });

// ---------------- Indexes ----------------

RecipeSchema.index({ dietTags: 1 });
RecipeSchema.index({ allergens: 1 });

// ---------------- Export ----------------

module.exports = mongoose.model("Recipe", RecipeSchema);

module.exports.GROCERY_CATEGORIES = GROCERY_CATEGORIES;
module.exports.DIET_TAGS = DIET_TAGS;
module.exports.ALLERGENS = ALLERGENS;
module.exports.RECIPE_STATUSES = RECIPE_STATUSES;
module.exports.PUBLIC_FILTER = PUBLIC_FILTER;