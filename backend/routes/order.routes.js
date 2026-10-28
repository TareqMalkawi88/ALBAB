
const express = require("express");

const {
  createOrder,
  getMyOrders,
  updateOrderStatus,
} = require("../controllers/order.controller");

const protect = require("../middeleware/auth.middleware");

const router = express.Router();

router.post("/", protect, createOrder);

router.get("/my-orders", protect, getMyOrders);

router.patch("/:id/status", protect, updateOrderStatus);

module.exports = router;
