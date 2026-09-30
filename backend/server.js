require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");




const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[server] Foodly API running on http://localhost:${PORT}`);
  });
}


module.exports = app;