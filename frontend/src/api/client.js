import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const TOKEN_KEY = "foodly_token";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach the login token (if any) to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---------- Auth ----------
export const registerUser = (payload) => api.post("/auth/register", payload).then((r) => r.data);
export const loginUser = (payload) => api.post("/auth/login", payload).then((r) => r.data);
export const fetchMe = () => api.get("/auth/me").then((r) => r.data);

// ---------- Recipes (public) ----------
export const fetchRecipes = (params = {}) => api.get("/recipes", { params }).then((r) => r.data);
export const fetchRecipeById = (id) => api.get(`/recipes/${id}`).then((r) => r.data);

// ---------- Meal Plans (login required) ----------
export const fetchMealPlan = (weekStart) => api.get(`/mealplans/${weekStart}`).then((r) => r.data);
export const addMealToPlan = (weekStart, payload) =>
  api.post(`/mealplans/${weekStart}/meals`, payload).then((r) => r.data);
export const removeMealFromPlan = (weekStart, slotId) =>
  api.delete(`/mealplans/${weekStart}/meals/${slotId}`).then((r) => r.data);
export const clearWeek = (weekStart) => api.delete(`/mealplans/${weekStart}`).then((r) => r.data);

// ---------- Grocery List (login required) ----------
export const fetchGroceryList = (weekStart) => api.get(`/grocery-list/${weekStart}`).then((r) => r.data);
