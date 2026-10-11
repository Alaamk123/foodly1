
const mongoose = require("mongoose");

// One document per (user, recipe).
// Editing a rating updates the same document.
const RatingSchema = new mongoose.Schema(
  {
    // Recipe being rated
    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      required: true,
    },

    // User who submitted the rating
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Rating value from 1 to 5
    value: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "Rating must be a whole number from 1 to 5.",
      },
    },

    // Written review or comment
    comment: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

// The database guarantees one rating per user per recipe
RatingSchema.index({ recipe: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("Rating", RatingSchema);
