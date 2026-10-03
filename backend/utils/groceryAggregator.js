const { GROCERY_CATEGORIES } = require("../models/Recipe");

function normalize(str) {
  return String(str || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * @param {Array} populatedMeals - MealPlan.meals with `recipe` populated
 * @returns {{ categories: Array<{ category: string, items: Array }>, recipeCount: number, itemCount: number }}
 */
function aggregateGroceryList(populatedMeals) {
  const bucket = new Map(); // key -> aggregated item

  for (const slot of populatedMeals) {
    const recipe = slot.recipe;
    if (!recipe || !Array.isArray(recipe.ingredients)) continue;

    const baseServings = recipe.servings || 1;
    const requestedServings = slot.servings || baseServings;
    const scaleFactor = requestedServings / baseServings;

    for (const ing of recipe.ingredients) {
      const key = `${normalize(ing.name)}::${normalize(ing.unit)}`;
      const scaledQty = round2(ing.quantity * scaleFactor);

      if (bucket.has(key)) {
        const existing = bucket.get(key);
        existing.quantity = round2(existing.quantity + scaledQty);
        existing.usedIn.add(recipe.title);
      } else {
        bucket.set(key, {
          name: titleCase(ing.name),
          unit: ing.unit,
          quantity: scaledQty,
          category: GROCERY_CATEGORIES.includes(ing.category) ? ing.category : "Other",
          usedIn: new Set([recipe.title]),
          checked: false,
        });
      }
    }
  }

  // Group by category, preserving canonical aisle order
  const grouped = new Map(GROCERY_CATEGORIES.map((c) => [c, []]));
  let itemCount = 0;

  for (const item of bucket.values()) {
    grouped.get(item.category).push({
      name: item.name,
      unit: item.unit,
      quantity: item.quantity,
      usedIn: Array.from(item.usedIn),
      checked: false,
    });
    itemCount += 1;
  }

  // Sort items alphabetically within each aisle, drop empty aisles
  const categories = [];
  for (const category of GROCERY_CATEGORIES) {
    const items = grouped.get(category).sort((a, b) => a.name.localeCompare(b.name));
    if (items.length > 0) {
      categories.push({ category, items });
    }
  }

  const uniqueRecipeIds = new Set(
    populatedMeals.filter((m) => m.recipe).map((m) => String(m.recipe._id))
  );

  return {
    categories,
    recipeCount: uniqueRecipeIds.size,
    itemCount,
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function titleCase(str) {
  return String(str)
    .split(" ")
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

module.exports = { aggregateGroceryList };
