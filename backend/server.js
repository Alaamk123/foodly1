require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const recipeRoutes = require("./routes/recipes");
const authRoutes = require("./routes/auth");
const mealPlanRoutes = require("./routes/mealplan");
const groceryRoutes = require("./routes/grocery");
const orderRoutes = require("./routes/orders");
const connectDB = require("./config/db");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());
app.use(morgan("dev"));

app.use("/api/recipes", recipeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/mealplans", mealPlanRoutes);
app.use("/api/grocery-list", groceryRoutes);
app.use("/api/orders", orderRoutes);
connectDB();

app.listen(5000, () => {
  console.log("Server running on port 5000");
});

