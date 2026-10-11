const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    
    password: { type: String, required: true, select: false },
    // "user" = ordinary subscriber, "admin" = can review recipes and manage orders.
    // Existing users have no role stored; Mongoose applies the default when loading them.
    // Promote someone with: npm run make-admin -- email@example.com
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
