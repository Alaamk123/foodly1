require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Recipe = require("../models/Recipe");


const recipes = [
  {
    title: "Garlic Butter Chicken with Roasted Broccoli",
    image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800",
    description: "Juicy pan-seared chicken breast finished in a garlic butter sauce, served with crisp roasted broccoli.",
    prepTimeMinutes: 10,
    cookTimeMinutes: 25,
    servings: 2,
    calories: 480,
    difficulty: "Easy",
    dietTags: ["Low Carb", "Gluten Free"],
    allergens: ["Dairy"],
    ingredients: [
      { name: "chicken breast", quantity: 2, unit: "unit", category: "Meat & Seafood" },
      { name: "broccoli florets", quantity: 3, unit: "cup", category: "Produce" },
      { name: "garlic cloves", quantity: 4, unit: "unit", category: "Produce" },
      { name: "butter", quantity: 3, unit: "tbsp", category: "Dairy & Eggs", allergens: ["Dairy"] },
      { name: "olive oil", quantity: 2, unit: "tbsp", category: "Pantry" },
      { name: "salt", quantity: 1, unit: "tsp", category: "Spices & Condiments" },
      { name: "black pepper", quantity: 0.5, unit: "tsp", category: "Spices & Condiments" },
      { name: "lemon", quantity: 1, unit: "unit", category: "Produce" },
    ],
    steps: [
      "Preheat oven to 220°C (425°F) and toss broccoli florets with 1 tbsp olive oil, salt and pepper on a baking sheet.",
      "Roast broccoli for 18-20 minutes, tossing halfway, until edges are crisp.",
      "Season chicken breasts with salt and pepper. Heat remaining olive oil in a skillet over medium-high heat.",
      "Sear chicken 6-7 minutes per side until golden and cooked through (internal temp 74°C/165°F).",
      "Lower heat, add butter and minced garlic to the skillet, basting the chicken for 1-2 minutes.",
      "Squeeze fresh lemon over the chicken and broccoli, then serve immediately.",
    ],
    tips: "Pound the chicken to an even thickness first for faster, more even cooking.",
  },
  {
    title: "Creamy Avocado Chickpea Salad",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800",
    description: "A no-cook, protein-packed salad with creamy mashed avocado, chickpeas, and fresh herbs.",
    prepTimeMinutes: 15,
    cookTimeMinutes: 0,
    servings: 2,
    calories: 390,
    difficulty: "Easy",
    dietTags: ["Vegetarian", "Vegan", "Gluten Free"],
    allergens: [],
    ingredients: [
      { name: "chickpeas, canned", quantity: 1, unit: "can", category: "Pantry" },
      { name: "avocado", quantity: 2, unit: "unit", category: "Produce" },
      { name: "red onion", quantity: 0.25, unit: "unit", category: "Produce" },
      { name: "cherry tomatoes", quantity: 1, unit: "cup", category: "Produce" },
      { name: "lime", quantity: 1, unit: "unit", category: "Produce" },
      { name: "fresh cilantro", quantity: 2, unit: "tbsp", category: "Produce" },
      { name: "salt", quantity: 0.5, unit: "tsp", category: "Spices & Condiments" },
    ],
    steps: [
      "Drain and rinse the chickpeas, then add to a large mixing bowl.",
      "Halve the avocados, remove pits, and mash roughly into the bowl with a fork.",
      "Dice the red onion and halve the cherry tomatoes; add both to the bowl.",
      "Squeeze in fresh lime juice, add chopped cilantro and salt, then fold everything together gently.",
      "Serve chilled, on its own or over greens or toast.",
    ],
    tips: "Add a diced jalapeño for extra heat.",
  },
    

];

async function seed() {
  await connectDB();

  const count = await Recipe.countDocuments();
  if (count > 0) {
    console.log(`[seed] Recipes collection already has ${count} documents. Dropping and reseeding...`);
    await Recipe.deleteMany({});
  }

  const all = [...recipes, ...moreRecipes];
  await Recipe.insertMany(all);
  console.log(`[seed] Inserted ${all.length} recipes successfully.`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
