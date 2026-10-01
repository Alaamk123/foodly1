require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const recipeRoutes = require("./routes/recipes");

const connectDB = require("./config/db");

const app = express();

app.use("/api/recipes", recipeRoutes);
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));


connectDB();

app.listen(5000, () => {
  console.log("Server running on port 5000");
});