const express = require("express");
const {createService,getServices,updateService,deleteService,} = require("../controllers/service.controller");
const protect = require("../middeleware/auth.middleware");

const router = express.Router();

router.get("/", getServices);

router.post("/", protect, createService);

router.put("/:id", protect, updateService);
router.delete("/:id", protect, deleteService);

module.exports = router;
