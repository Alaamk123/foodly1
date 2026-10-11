const express = require("express");
const mongoose = require("mongoose");
const Recipe = require("../models/Recipe");
const Order = require("../models/Order");
const User = require("../models/User");
const requireAuth = require("../middleware/auth");
const requireAdmin = require("../middleware/admin");
const { RECIPE_STATUSES } = require("../models/Recipe");
const { ORDER_STATUSES } = require("../models/Order");

const router = express.Router();
// Every route in this file needs a valid login AND the admin role (checked in the database).
router.use(requireAuth, requireAdmin);

const SUBMITTED = { submittedBy: { $ne: null } }; // only community submissions, not seed recipes
const pageParams = (req) => ({
  page: Math.max(parseInt(req.query.page, 10) || 1, 1),
  limit: Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50),
});

// ---------------------------------------------------------------- recipes

// GET /api/admin/recipes?status=pending|approved|rejected&page=&limit=
router.get("/recipes", async (req, res) => {
  try {
    const { page, limit } = pageParams(req);
    const query = { ...SUBMITTED };
    if (req.query.status) {
      if (!RECIPE_STATUSES.includes(req.query.status)) return res.status(400).json({ message: "Invalid status filter." });
      query.status = req.query.status;
    }

    const [total, data, pending, approved, rejected] = await Promise.all([
      Recipe.countDocuments(query),
      Recipe.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("submittedBy", "name email"),
      Recipe.countDocuments({ ...SUBMITTED, status: "pending" }),
      Recipe.countDocuments({ ...SUBMITTED, status: "approved" }),
      Recipe.countDocuments({ ...SUBMITTED, status: "rejected" }),
    ]);

    res.json({
      data,
      counts: { pending, approved, rejected },
      pagination: { total, page, limit, totalPages: Math.max(Math.ceil(total / limit), 1) },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load submissions." });
  }
});

// GET /api/admin/recipes/:id  -> full details for review (works for any status)
router.get("/recipes/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Recipe not found" });
    const recipe = await Recipe.findOne({ _id: req.params.id, ...SUBMITTED }).populate("submittedBy", "name email");
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });
    res.json(recipe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load the recipe." });
  }
});

async function review(req, res, update) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Recipe not found" });
  const recipe = await Recipe.findOneAndUpdate(
    { _id: req.params.id, ...SUBMITTED },
    { $set: { ...update, reviewedAt: new Date(), reviewedBy: req.userId } },
    { new: true }
  ).populate("submittedBy", "name email");
  if (!recipe) return res.status(404).json({ message: "Recipe not found" });
  res.json(recipe);
}

// PATCH /api/admin/recipes/:id/approve  -> becomes visible in the public catalog
router.patch("/recipes/:id/approve", async (req, res) => {
  try {
    await review(req, res, { status: "approved", rejectionReason: "" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not approve the recipe." });
  }
});

// PATCH /api/admin/recipes/:id/reject  body: { reason?: string }
router.patch("/recipes/:id/reject", async (req, res) => {
  try {
    const reason = typeof req.body.reason === "string" ? req.body.reason.trim() : "";
    if (reason.length > 500) return res.status(400).json({ message: "Reason is limited to 500 characters." });
    await review(req, res, { status: "rejected", rejectionReason: reason });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not reject the recipe." });
  }
});

// ---------------------------------------------------------------- orders

// GET /api/admin/orders?status=&page=&limit=
router.get("/orders", async (req, res) => {
  try {
    const { page, limit } = pageParams(req);
    const query = {};
    if (req.query.status) {
      if (!ORDER_STATUSES.includes(req.query.status)) return res.status(400).json({ message: "Invalid status filter." });
      query.status = req.query.status;
    }
    const [total, orders] = await Promise.all([
      Order.countDocuments(query),
      Order.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    ]);

    // Order.userId is a plain string, so look the customers up in one extra query.
    const ids = [...new Set(orders.map((o) => o.userId))].filter((id) => mongoose.isValidObjectId(id));
    const users = await User.find({ _id: { $in: ids } }).select("name email");
    const byId = Object.fromEntries(users.map((u) => [u._id.toString(), { name: u.name, email: u.email }]));

    const data = orders.map((o) => ({ ...o.toJSON(), customer: byId[o.userId] || null }));
    res.json({ data, pagination: { total, page, limit, totalPages: Math.max(Math.ceil(total / limit), 1) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load orders." });
  }
});

// PATCH /api/admin/orders/:id/status  body: { status }
router.patch("/orders/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${ORDER_STATUSES.join(", ")}.` });
    }
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Order not found" });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status === "completed" || order.status === "cancelled") {
      return res.status(409).json({ message: `This order is already ${order.status} and can no longer be changed.` });
    }
    order.status = status;
    await order.save();
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not update the order." });
  }
});

module.exports = router;
