const { GROCERY_CATEGORIES, DIET_TAGS, ALLERGENS } = require("../models/Recipe");

const DIFFICULTIES = ["Easy", "Medium", "Advanced"];

// Our own uploads (see routes/uploads.js) look exactly like this. Anything else must be an https URL.
const UPLOADED_IMAGE_RE = /^\/uploads\/recipes\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

const isPlainString = (v) => typeof v === "string";

function toInt(v) {
  if (typeof v === "number") return Number.isInteger(v) ? v : NaN;
  if (typeof v === "string" && /^\d+$/.test(v.trim())) return parseInt(v.trim(), 10);
  return NaN;
}

function isValidImage(value) {
  if (UPLOADED_IMAGE_RE.test(value)) return true;
  if (value.length > 500) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function validateRecipeSubmission(body = {}) {
  const errors = [];
  const add = (field, message) => errors.push({ field, message });
  const value = {};

  // title
  const title = isPlainString(body.title) ? body.title.trim() : "";
  if (title.length < 3 || title.length > 100) add("title", "Title must be 3-100 characters.");
  value.title = title;

  // description (optional)
  const description = isPlainString(body.description) ? body.description.trim() : "";
  if (body.description !== undefined && !isPlainString(body.description)) add("description", "Description must be text.");
  if (description.length > 500) add("description", "Description is limited to 500 characters.");
  value.description = description;

  // image
  const image = isPlainString(body.image) ? body.image.trim() : "";
  if (!image) add("image", "A recipe image is required.");
  else if (!isValidImage(image)) add("image", "Image must be an uploaded image or a valid https URL.");
  value.image = image;

  // numbers
  const ranges = [
    ["prepTimeMinutes", 0, 1440],
    ["cookTimeMinutes", 0, 1440],
    ["servings", 1, 50],
    ["calories", 0, 5000],
  ];
  for (const [field, min, max] of ranges) {
    const n = toInt(body[field]);
    if (!Number.isInteger(n) || n < min || n > max) add(field, `${field} must be a whole number between ${min} and ${max}.`);
    value[field] = n;
  }

  // difficulty
  const difficulty = body.difficulty === undefined || body.difficulty === "" ? "Easy" : body.difficulty;
  if (!DIFFICULTIES.includes(difficulty)) add("difficulty", `Difficulty must be one of: ${DIFFICULTIES.join(", ")}.`);
  value.difficulty = difficulty;

  // tags
  for (const [field, allowed] of [["dietTags", DIET_TAGS], ["allergens", ALLERGENS]]) {
    const list = body[field] === undefined ? [] : body[field];
    if (!Array.isArray(list) || list.some((x) => !allowed.includes(x))) {
      add(field, `${field} must be a list containing only: ${allowed.join(", ")}.`);
      value[field] = [];
    } else {
      value[field] = [...new Set(list)];
    }
  }

  // ingredients
  if (!Array.isArray(body.ingredients) || body.ingredients.length < 1 || body.ingredients.length > 60) {
    add("ingredients", "Add between 1 and 60 ingredients.");
    value.ingredients = [];
  } else {
    value.ingredients = body.ingredients.map((raw, i) => {
      const ing = raw && typeof raw === "object" ? raw : {};
      const name = isPlainString(ing.name) ? ing.name.trim() : "";
      const quantity = typeof ing.quantity === "number" ? String(ing.quantity) : isPlainString(ing.quantity) ? ing.quantity.trim() : "";
      const unit = isPlainString(ing.unit) ? ing.unit.trim() : "";
      const category = ing.category === undefined || ing.category === "" ? "Other" : ing.category;
      const ingAllergens = ing.allergens === undefined ? [] : ing.allergens;

      if (!name || name.length > 80) add(`ingredients[${i}].name`, "Ingredient name is required (max 80 characters).");
      if (!quantity || quantity.length > 20) add(`ingredients[${i}].quantity`, "Quantity is required (max 20 characters).");
      else if (!/^\d+(\.\d+)?$/.test(quantity)) add(`ingredients[${i}].quantity`, "Quantity must be a number such as 2 or 0.5.");
      if (!unit || unit.length > 20) add(`ingredients[${i}].unit`, "Unit is required (max 20 characters).");
      if (!GROCERY_CATEGORIES.includes(category)) add(`ingredients[${i}].category`, "Unknown ingredient category.");
      if (!Array.isArray(ingAllergens) || ingAllergens.some((a) => !ALLERGENS.includes(a))) {
        add(`ingredients[${i}].allergens`, "Unknown allergen.");
      }
      return { name, quantity, unit, category, allergens: Array.isArray(ingAllergens) ? ingAllergens.filter((a) => ALLERGENS.includes(a)) : [] };
    });
  }

  // steps
  if (!Array.isArray(body.steps) || body.steps.length < 1 || body.steps.length > 40) {
    add("steps", "Add between 1 and 40 steps.");
    value.steps = [];
  } else {
    value.steps = body.steps.map((s, i) => {
      const step = isPlainString(s) ? s.trim() : "";
      if (!step || step.length > 1000) add(`steps[${i}]`, "Each step must be 1-1000 characters.");
      return step;
    });
  }

  // tips (optional)
  const tips = isPlainString(body.tips) ? body.tips.trim() : "";
  if (tips.length > 1000) add("tips", "Tips are limited to 1000 characters.");
  value.tips = tips;

  return { errors, value };
}

module.exports = { validateRecipeSubmission, UPLOADED_IMAGE_RE };
