const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./db");
const userRoutes = require("./routes/user.routes");
const protect = require("./middeleware/auth.middleware");


const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.send("ALBAB API is running!");
});

app.get("/api/users/profile", protect, (req, res) => {
  res.status(200).json({
    message: "Protected profile accessed successfully",
    user: req.user,
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`ALBAB server is running on port ${PORT}`);
  });
};

startServer();
