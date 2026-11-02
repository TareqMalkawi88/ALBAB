
const express = require("express");

const {
  createReview,
  getServiceReviews,
  getMyReviews,
} = require("../controllers/review.controller");

const protect = require("../middeleware/auth.middleware");

const router = express.Router();

// Submit a review
router.post("/", protect, createReview);

// Get reviews for a specific service
router.get("/service/:serviceId", getServiceReviews);

// Get reviews submitted by the logged-in customer
router.get("/my-reviews", protect, getMyReviews);

module.exports = router;
