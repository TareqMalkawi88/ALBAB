const Service = require("../models/service");

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
    } = req.body;

    if (
      !title ||
      !description ||
      !category ||
      price === undefined ||
      price === null ||
      price === "" ||
      !location
    ) {
      return res.status(400).json({
        message: "Please provide all required service fields",
      });
    }

    const service = await Service.create({
      title,
      description,
      category,
      price,
      location,
      provider: req.user.id,
    });

    return res.status(201).json({
      message: "Service created successfully",
      service,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error("Create service error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getServices = async (req, res) => {
  try {
    const services = await Service.find()
      .populate("provider", "name");

    return res.status(200).json({
      count: services.length,
      services,
    });
  } catch (error) {
    console.error("Get services error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const updateService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        message: "Service not found",
      });
    }

    if (
      req.user.role !== "admin" &&
      service.provider.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: "Not allowed to update this service",
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

    await service.save();

    return res.status(200).json({
      message: "Service updated successfully",
      service,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error("Update service error:", error.message);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        message: "Service not found",
      });
    }

    if (
      req.user.role !== "admin" &&
      service.provider.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: "Not allowed to delete this service",
      });
    }

    await service.deleteOne();

    return res.status(200).json({
      message: "Service deleted successfully",
    });
  } catch (error) {
    console.error("Delete service error:", error.message);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {createService,getServices,updateService,deleteService,};
