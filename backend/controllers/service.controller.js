
const Service = require("../models/service");
const Review = require("../models/review");

// Create a new service
const createService = async (req, res) => {
  try {
    if (!["provider", "admin"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Only providers and admins can create services",
      });
    }

    const {
      title,
      description,
      category,
      price,
      location,
      isAvailable,
    } = req.body;

    if (!title || !description || !category || price === undefined || !location) {
      return res.status(400).json({
        message: "Please provide all required service fields",
      });
    }

    if (Number(price) < 0 || !Number.isFinite(Number(price))) {
      return res.status(400).json({
        message: "Price must be a valid non-negative number",
      });
    }

    const service = await Service.create({
      title,
      description,
      category,
      price: Number(price),
      provider: req.user.id,
      location,
      isAvailable: isAvailable ?? true,
    });

    return res.status(201).json({
      message: "Service created successfully",
      service,
    });
  } catch (error) {
    console.error("Create service error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Get all services with average ratings and review counts
const getServices = async (req, res) => {
  try {
    const services = await Service.find().populate("provider", "name");

    const ratingStats = await Review.aggregate([
      {
        $group: {
          _id: "$service",
          averageRating: {
            $avg: "$rating",
          },
          reviewCount: {
            $sum: 1,
          },
        },
      },
    ]);

    const statsMap = new Map(
      ratingStats.map((stat) => [
        stat._id.toString(),
        stat,
      ])
    );

    const servicesWithRatings = services.map((service) => {
      const stats = statsMap.get(service._id.toString());

      return {
        ...service.toObject(),
        averageRating: stats
          ? Number(stats.averageRating.toFixed(1))
          : 0,
        reviewCount: stats?.reviewCount || 0,
      };
    });

    return res.status(200).json({
      count: servicesWithRatings.length,
      services: servicesWithRatings,
    });
  } catch (error) {
    console.error("Get services error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Update a service
const updateService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        message: "Service not found",
      });
    }

    const isOwner = service.provider.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "Not authorized to update this service",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "category",
      "price",
      "location",
      "isAvailable",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        service[field] = req.body[field];
      }
    });

    if (
      service.price === undefined ||
      !Number.isFinite(Number(service.price)) ||
      Number(service.price) < 0
    ) {
      return res.status(400).json({
        message: "Price must be a valid non-negative number",
      });
    }

    service.price = Number(service.price);

    await service.save();

    return res.status(200).json({
      message: "Service updated successfully",
      service,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid service ID",
      });
    }

    console.error("Update service error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Delete a service
const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        message: "Service not found",
      });
    }

    const isOwner = service.provider.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "Not authorized to delete this service",
      });
    }

    await service.deleteOne();

    return res.status(200).json({
      message: "Service deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid service ID",
      });
    }

    console.error("Delete service error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  createService,
  getServices,
  updateService,
  deleteService,
};
