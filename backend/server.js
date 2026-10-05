require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const recipeRoutes = require("./routes/recipes");
const authRoutes = require("./routes/auth");
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
connectDB();

app.listen(5000, () => {
  console.log("Server running on port 5000");
});

