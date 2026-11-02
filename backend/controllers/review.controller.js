
const Review = require("../models/review");
const Order = require("../models/order");
const Service = require("../models/service");

// Create a review
const createReview = async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;

    // Validate required fields
    if (!orderId || rating === undefined || !comment?.trim()) {
      return res.status(400).json({
        message: "Please provide orderId, rating, and comment",
      });
    }

    // Validate rating
    if (
      typeof rating !== "number" ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return res.status(400).json({
        message: "Rating must be an integer between 1 and 5",
      });
    }

    if (typeof comment !== "string" || comment.trim().length < 3) {
      return res.status(400).json({
        message: "Review must contain at least 3 characters",
      });
    }

    if (comment.trim().length > 500) {
      return res.status(400).json({
        message: "Review cannot exceed 500 characters",
      });
    }

    // Find order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // Only the customer who placed the order can review it
    if (order.customer.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You can only review your own orders",
      });
    }

    // Only completed orders can be reviewed
    if (order.status !== "completed") {
      return res.status(400).json({
        message: "You can only review completed orders",
      });
    }

    // Check if order already has a review
    const existingReview = await Review.findOne({ order: orderId });

    if (existingReview) {
      return res.status(409).json({
        message: "You have already reviewed this order",
      });
    }

    // Create review
    const review = await Review.create({
      customer: req.user.id,
      service: order.service,
      order: order._id,
      rating,
      comment: comment.trim(),
    });

    return res.status(201).json({
      message: "Review submitted successfully",
      review,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message: "You have already reviewed this order",
      });
    }

    console.error("Create review error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Get reviews for a service
const getServiceReviews = async (req, res) => {
  try {
    const service = await Service.findById(req.params.serviceId);

    if (!service) {
      return res.status(404).json({
        message: "Service not found",
      });
    }

    const reviews = await Review.find({
      service: req.params.serviceId,
    })
      .populate("customer", "name")
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;

    const averageRating =
      totalReviews === 0
        ? 0
        : reviews.reduce((sum, review) => sum + review.rating, 0) /
          totalReviews;

    return res.status(200).json({
      count: totalReviews,
      averageRating: Number(averageRating.toFixed(1)),
      reviews,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid service ID",
      });
    }

    console.error("Get reviews error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Get reviews submitted by the logged-in customer
const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      customer: req.user.id,
    })
      .populate("service", "title")
      .populate("order", "status")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error("Get my reviews error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  createReview,
  getServiceReviews,
  getMyReviews,
};
