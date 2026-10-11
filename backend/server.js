require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const recipeRoutes = require("./routes/recipes");
const authRoutes = require("./routes/auth");
const mealPlanRoutes = require("./routes/mealplan");
const groceryRoutes = require("./routes/grocery");
const orderRoutes = require("./routes/orders");
const ratingRoutes = require("./routes/ratings");
const submissionRoutes = require("./routes/submissions");
const uploadRoutes = require("./routes/uploads");
const adminRoutes = require("./routes/admin");
const connectDB = require("./config/db");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());
app.use(morgan("dev"));

// Uploaded recipe images (files are renamed by the server and only JPEG/PNG/WebP are accepted).
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff"),
  })
);

// Must be registered BEFORE "/api/recipes" so ".../:recipeId/rating" is matched first.
app.use("/api/recipes/:recipeId/rating", ratingRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/mealplans", mealPlanRoutes);
app.use("/api/grocery-list", groceryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/admin", adminRoutes);

// Only start the server when this file is run directly (node server.js).
// The automated tests import `app` and start it themselves on a random port.
if (require.main === module) {
  connectDB();
  app.listen(5000, () => {
    console.log("Server running on port 5000");
  });
}

module.exports = app;

