require("dotenv").config();

const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
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

app.disable("x-powered-by");

// Allowed browser origins (comma separated). Not needed when the frontend and the API share
// one address (the Docker setup does this through nginx), only for `npm run dev` on port 5173.
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins }));

app.use(express.json());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Used by Docker health checks: 200 only when the database connection is up.
app.get("/api/health", (req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({ status: dbUp ? "ok" : "database unavailable" });
});

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
  (async () => {
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not set. Copy .env.example to .env and set a long random value.");
      process.exit(1);
    }
    await connectDB();

    const port = Number(process.env.PORT || 5000);
    const server = app.listen(port, () => console.log(`Server running on port ${port}`));

    // `docker compose stop` sends SIGTERM: finish open requests, then close the DB connection.
    const shutdown = () => {
      server.close(async () => {
        await mongoose.connection.close();
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000).unref();
    };
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  })();
}

module.exports = app;

