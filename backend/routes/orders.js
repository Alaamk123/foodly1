const express = require("express");
const Order = require("../models/Order");
const { PAYMENT_METHODS } = require("../models/Order");
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

// GET /api/orders -> the current user's latest orders
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(10);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders.", error: err.message });
  }
});

module.exports = router;
