const mongoose = require("mongoose");

const PAYMENT_METHODS = ["cod", "visa", "mastercard"];

const OrderItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, default: "Other" },
    unit: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    weekStart: { type: String, required: true },
    items: { type: [OrderItemSchema], default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    serviceFee: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    deliveryMethod: { type: String, enum: ["delivery", "pickup"], required: true },
    destination: { type: String, required: true, trim: true },
    // The chosen payment method is part of the order.
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    // Only non-sensitive card info is ever stored: never the full number, name or CVC.
    cardLast4: { type: String, default: null },
    paymentStatus: {
      type: String,
      enum: ["pending_on_delivery", "demo_simulated"],
      required: true,
    },
    status: { type: String, enum: ["placed", "cancelled"], default: "placed" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
