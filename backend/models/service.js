const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },

  description: {
    type: String,
    required: true,
    trim: true,
  },

  category: {
    type: String,
    required: true,
    enum: ["fuel_delivery", "water_delivery", "car_wash"],
  },

  price: {
    type: Number,
    required: true,
    min: 0,
  },

  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  location: {
    type: String,
    required: true,
    trim: true,
  },

  isAvailable: {
    type: Boolean,
    default: true,
  },
});

const Service = mongoose.model("Service", serviceSchema);

module.exports = Service;
