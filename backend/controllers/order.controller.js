const Order = require("../models/order");
const Service = require("../models/service");

const createOrder = async (req, res) => {
  try {
    const {
      serviceId,
      quantity = 1,
      deliveryAddress,
      notes = "",
    } = req.body;

    if (!serviceId || !deliveryAddress?.trim()) {
      return res.status(400).json({
        message: "Please provide serviceId and deliveryAddress",
      });
    }

    if (
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return res.status(400).json({
        message: "Quantity must be a positive integer",
      });
    }

    if (typeof notes !== "string") {
      return res.status(400).json({
        message: "Notes must be a string",
      });
    }

    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({
        message: "Service not found",
      });
    }

    if (!service.isAvailable) {
      return res.status(400).json({
        message: "This service is currently unavailable",
      });
    }

    if (service.provider.toString() === req.user.id) {
      return res.status(400).json({
        message: "You cannot order your own service",
      });
    }

    const totalPrice = service.price * quantity;

    const order = await Order.create({
      customer: req.user.id,
      service: service._id,
      provider: service.provider,
      quantity,
      totalPrice,
      deliveryAddress: deliveryAddress.trim(),
      notes: notes.trim(),
    });

    return res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid service ID",
      });
    }

    console.error("Create order error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getMyOrders = async (req, res) => {
  try {
    let filter;

    if (req.user.role === "admin") {
      filter = {};
    } else if (req.user.role === "provider") {
      filter = { provider: req.user.id };
    } else {
      filter = { customer: req.user.id };
    }

    const orders = await Order.find(filter)
      .populate("customer", "name email")
      .populate("provider", "name")
      .populate("service", "title category price")
      .sort({ _id: -1 });

    return res.status(200).json({
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get orders error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "accepted",
      "rejected",
      "completed",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const isCustomer = order.customer.toString() === req.user.id;
    const isProvider = order.provider.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (status === "cancelled") {
      if (!isCustomer && !isAdmin) {
        return res.status(403).json({
          message: "Only the customer or admin can cancel this order",
        });
      }

      if (order.status !== "pending") {
        return res.status(400).json({
          message: "Only pending orders can be cancelled",
        });
      }
    } else {
      if (!isProvider && !isAdmin) {
        return res.status(403).json({
          message: "Only the provider or admin can update this status",
        });
      }

      if (order.status !== "pending" && order.status !== "accepted") {
        return res.status(400).json({
          message: "This order can no longer be updated",
        });
      }

      if (status === "completed" && order.status !== "accepted") {
        return res.status(400).json({
          message: "Only accepted orders can be completed",
        });
      }
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    console.error("Update order status error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


module.exports = {createOrder,getMyOrders,updateOrderStatus,};