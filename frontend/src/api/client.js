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

// ---------- Helpers ----------
// Uploaded images are served by the backend (e.g. /uploads/recipes/xxx.png), not by Vite.
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");
export const assetUrl = (path) => (typeof path === "string" && path.startsWith("/uploads/") ? `${API_ORIGIN}${path}` : path);
// The backend always answers errors as { message, errors? } — show that message when there is one.
export const errorMessage = (err, fallback = "حدث خطأ غير متوقع، حاول مرة أخرى.") =>
  err?.response?.data?.message || (err?.request && !err?.response ? "تعذّر الاتصال بالخادم. تأكد أن الـ backend يعمل." : fallback);

// ---------- Ratings (login required) ----------
export const fetchMyRating = (recipeId) => api.get(`/recipes/${recipeId}/rating`).then((r) => r.data);
export const rateRecipe = (recipeId, value) => api.put(`/recipes/${recipeId}/rating`, { value }).then((r) => r.data);

// ---------- Orders (login required) ----------
export const createOrder = (payload) => api.post("/orders", payload).then((r) => r.data);
export const fetchMyOrders = (params = {}) => api.get("/orders", { params }).then((r) => r.data);
export const fetchOrderById = (id) => api.get(`/orders/${id}`).then((r) => r.data);

// ---------- Recipe submissions (login required) ----------
export const uploadRecipeImage = (file) => {
  const form = new FormData();
  form.append("image", file);
  return api.post("/uploads/recipe-image", form, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
};
export const submitRecipe = (payload) => api.post("/submissions", payload).then((r) => r.data);
export const fetchMySubmissions = () => api.get("/submissions/mine").then((r) => r.data);

// ---------- Admin (the backend checks the admin role on every call) ----------
export const adminFetchRecipes = (params = {}) => api.get("/admin/recipes", { params }).then((r) => r.data);
export const adminFetchRecipe = (id) => api.get(`/admin/recipes/${id}`).then((r) => r.data);
export const adminApproveRecipe = (id) => api.patch(`/admin/recipes/${id}/approve`).then((r) => r.data);
export const adminRejectRecipe = (id, reason) => api.patch(`/admin/recipes/${id}/reject`, { reason }).then((r) => r.data);
export const adminFetchOrders = (params = {}) => api.get("/admin/orders", { params }).then((r) => r.data);
export const adminUpdateOrderStatus = (id, status) => api.patch(`/admin/orders/${id}/status`, { status }).then((r) => r.data);
