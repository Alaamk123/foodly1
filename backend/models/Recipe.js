const mongoose = require("mongoose");

const GROCERY_CATEGORY = ["Produce", "Dairy & Eggs", "Meat & Seafood", "Pantry", "Frozen", "Snacks", "Bakery", "Spices & Seasonings", "Other"];

const DIET_TAGES = ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Low-Carb", "Keto", "Paleo", "Other"];

const ALLERGENS = ["Peanuts", "Tree Nuts", "Dairy", "Eggs", "Gluten", "soy", "Fish",];

const IngredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
     type: String,
     required: true,
     min: 0
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: GROCERY_CATEGORY,
    required: true,
    default: "Other",  
  },
  allergens: {
    type: [String],
    enum: ALLERGENS,
  },
},
{_id: false}
);

const RecipeSchema = new mongoose.Schema({
  title: {type: String, required: true, trim: true, inde},
  image: {type: String, required: true},
  description: {type: String, default: ""},
  preparationTime: {type: Number, required: true, min: 0},
  cookingTime: {type: Number, required: true, min: 0},
  servings: {type: Number, required: true, min: 1, default: 2},
  calories: {type: Number, required: true, min: 0},
  difficulty: {type: String, enum: ["Easy", "Medium", "Advanced"], default: "Easy"},
  dietTags: [{type: String, enum: DIET_TAGES}],
  allergens: [{type: String, enum: ALLERGENS}],
  ingredients: {type: [IngredientSchema],
     validate: (v) => Array.isArray(v) && v.length > 0,
},
steps: {
  type: [String],
  validate: (v) => Array.isArray(v) && v.length > 0,  
},
tips: {type: String, default: ""},
},
{timestamps: true}
);


RecipeSchema.virtual("totalTimeMinutes").get(function () {
  return this.prepTimeMinutes + this.cookTimeMinutes;
});

  RecipeSchema.set("toJSON", { virtuals: true });
  RecipeSchema.set("toObject", { virtuals: true }); 
  RecipeSchema.index({ dietTags: 1 });
  RecipeSchema.index({ allergens: 1 });


module.exports = mongoose.model("Recipe", RecipeSchema);
module.exports.GROCERY_CATEGORIES = GROCERY_CATEGORIES;
module.exports.DIET_TAGS = DIET_TAGS;
module.exports.ALLERGENS = ALLERGENS;
