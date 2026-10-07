// يفحص رابط/مسار صورة كل وصفة ويطبع الوصفات التي صورتها معطّلة.
// التشغيل:  node scripts/checkImages.js
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Recipe = require("../models/Recipe");

const PUBLIC_DIR = path.join(__dirname, "../../frontend/public");

async function isOk(image) {
  if (!image) return false;
  if (image.startsWith("/")) return fs.existsSync(path.join(PUBLIC_DIR, image)); // صورة محلية
  try {
    const res = await fetch(image, { method: "HEAD", redirect: "follow" });
    return res.ok;
  } catch {
    return false;
  }
}

(async () => {
  await connectDB();
  const recipes = await Recipe.find({}, "title image").lean();
  const broken = [];
  for (const r of recipes) if (!(await isOk(r.image))) broken.push(r);

  console.log(`\nChecked ${recipes.length} recipes. Broken images: ${broken.length}\n`);
  broken.forEach((r) => console.log(`- "${r.title}"\n    current: ${r.image || "(empty)"}`));
  await mongoose.disconnect();
})();
