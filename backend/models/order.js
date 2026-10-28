
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    required: true,
  },

  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },

  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },

  deliveryAddress: {
    type: String,
    required: true,
    trim: true,
  },

  notes: {
    type: String,
    trim: true,
    default: "",
  },

  status: {
    type: String,
    enum: [
      "pending",
      "accepted",
      "rejected",
      "completed",
      "cancelled",
    ],
    default: "pending",
  },
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
