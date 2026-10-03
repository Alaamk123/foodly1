const mongoose = require("mongoose");

const MealSlotSchema = new mongoose.Schema(
  {
    dayIndex: { type: Number, required: true, min: 0, max: 6 },
    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "snack"],
      required: true,
    },
    recipe: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe", required: true },
    servings: { type: Number, min: 1, default: 2 },
  },
  { _id: true }
);

const MealPlanSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },  
    weekStart: { type: String, required: true, index: true },
    meals: { type: [MealSlotSchema], default: [] },
  },
  { timestamps: true }
);

MealPlanSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

module.exports = mongoose.model("MealPlan", MealPlanSchema);
