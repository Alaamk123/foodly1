// يحدّث صور الوصفات داخل قاعدة البيانات مباشرة، بدون حذف أي وصفة
// // (فلا تضيع الوجبات المحفوظة في المخطط). العنوان يجب أن يطابق الإنجليزي تمامًا.
// التشغيل:  node scripts/setImages.js
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Recipe = require("../models/Recipe");

// ضع هنا: "عنوان الوصفة" : "مسار الصورة"
// الصور المحلية توضع في  frontend/public/images/recipes/  وتُكتب هكذا: "/images/recipes/اسم.jpg"
// أو يمكنك استخدام رابط كامل https://...
const IMAGES = {
  "Vegetarian Lentil Bolognese":
    "/images/recipes/vegetarian-lentil-bolognese.jpg",

  "Red Lentil Soup":
    "/images/recipes/red-lentil-soup.jpg",

  "Beef & Broccoli Stir-Fry":
    "/images/recipes/beef-broccoli-stir-fry.jpg",

  "Falafel Bowl with Tahini Sauce":
    "/images/recipes/falafel-bowl-tahini.jpg",

  "Chicken Shawarma Bowl":
    "/images/recipes/chicken-shawarma-bowl.jpg",

  "Mujaddara (Lentils & Rice with Crispy Onions)":
    "/images/recipes/mujaddara.jpg",
};

(async () => {
  await connectDB();
  for (const [title, image] of Object.entries(IMAGES)) {
    const res = await Recipe.updateOne({ title }, { $set: { image } });
    console.log(res.matchedCount ? `OK   ${title}` : `NOT FOUND (check the exact title): ${title}`);
  }
  await mongoose.disconnect();
})();
