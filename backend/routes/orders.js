const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const { PAYMENT_METHODS, ORDER_STATUSES } = require("../models/Order");
const requireAuth = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// POST /api/orders  -> save an order together with its payment method.
// NOTE: there is no real payment provider yet. Card orders are saved as
// "demo_simulated" and the card number is never sent to or stored by the server.
router.post("/", async (req, res) => {
  try {
    const {
      weekStart, items, subtotal, deliveryFee, serviceFee, total,
      deliveryMethod, destination, paymentMethod, cardLast4,
    } = req.body;

    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method.", code: "INVALID_PAYMENT" });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order has no items.", code: "EMPTY_ORDER" });
    }
    if (!destination || !String(destination).trim()) {
      return res.status(400).json({ message: "Destination is required.", code: "NO_DESTINATION" });
    }

    // Basic sanity checks so a tampered request cannot store nonsense amounts.
    const nums = { subtotal, deliveryFee: deliveryFee ?? 0, serviceFee: serviceFee ?? 0, total };
    for (const [k, v] of Object.entries(nums)) {
      if (typeof v !== "number" || !Number.isFinite(v) || v < 0) {
        return res.status(400).json({ message: `${k} must be a non-negative number.`, code: "INVALID_AMOUNT" });
      }
    }
    if (items.length > 300 || items.some((it) => !it || typeof it.price !== "number" || typeof it.quantity !== "number")) {
      return res.status(400).json({ message: "Order items are invalid.", code: "INVALID_ITEMS" });
    }
    const itemsSum = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    if (Math.abs(itemsSum - subtotal) > 0.05 || Math.abs(subtotal + nums.deliveryFee + nums.serviceFee - total) > 0.05) {
      return res.status(400).json({ message: "Order totals do not add up.", code: "TOTAL_MISMATCH" });
    }
    if (String(destination).length > 300) {
      return res.status(400).json({ message: "Destination is too long.", code: "NO_DESTINATION" });
    }

    const isCard = paymentMethod !== "cod";
    const last4 = isCard ? String(cardLast4 || "").replace(/\D/g, "").slice(-4) : null;
    if (isCard && last4.length !== 4) {
      return res.status(400).json({ message: "Invalid card details.", code: "INVALID_CARD" });
    }

    const order = await Order.create({
      userId: req.userId,
      weekStart, items, subtotal, deliveryFee, serviceFee, total,
      deliveryMethod, destination, paymentMethod,
      cardLast4: last4,
      paymentStatus: isCard ? "demo_simulated" : "pending_on_delivery",
    });

    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Failed to place order.", error: err.message });
  }
});

// GET /api/orders?page=&limit=&status=  -> ONLY the current user's orders (newest first)
router.get("/", async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const query = { userId: req.userId };
    if (req.query.status) {
      if (!ORDER_STATUSES.includes(req.query.status)) return res.status(400).json({ message: "Invalid status filter." });
      query.status = req.query.status;
    }
    const [total, data] = await Promise.all([
      Order.countDocuments(query),
      Order.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    ]);
    res.json({ data, pagination: { total, page, limit, totalPages: Math.max(Math.ceil(total / limit), 1) } });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders.", error: err.message });
  }
});

// GET /api/orders/:id -> one order, but only if it belongs to the current user.
// Someone else's order answers 404 (not 403) so order ids cannot be probed.
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Order not found" });
    const order = await Order.findOne({ _id: req.params.id, userId: req.userId });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch the order.", error: err.message });
  }
});

module.exports = router;
