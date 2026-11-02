
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./db");
const User = require("./models/user");

const userRoutes = require("./routes/user.routes");
const protect = require("./middeleware/auth.middleware");
const serviceRoutes = require("./routes/service.routes");
const orderRoutes = require("./routes/order.routes");

const app = express();


app.use(cors());
app.use(express.json());


app.use("/api/users", userRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/orders", orderRoutes);


app.get("/", (req, res) => {
  res.send("ALBAB API is running!");
});


app.get("/api/users/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "Profile retrieved successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
});


const PORT = process.env.PORT || 5000;


const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`ALBAB server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
