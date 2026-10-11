const mongoose = require("mongoose");

// "card" is what the checkout page sends; 
const PAYMENT_METHODS = ["cod", "card", "visa", "mastercard"];

const ORDER_STATUSES = ["placed", "processing", "completed", "cancelled"];

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
   status: { type: String, enum: ORDER_STATUSES, default: "placed", index: true },
  },
  { timestamps: true }
);

// Human-friendly order number derived from the id (no extra stored field needed).
OrderSchema.virtual("orderNumber").get(function () {
  return `FD-${this._id.toString().slice(-6).toUpperCase()}`;
});

OrderSchema.set("toJSON", { virtuals: true });
OrderSchema.set("toObject", { virtuals: true });


module.exports = mongoose.model("Order", OrderSchema);
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
module.exports.ORDER_STATUSES = ORDER_STATUSES;
