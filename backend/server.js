
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("ALBAB API is running!");
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`ALBAB server is running on port ${PORT}`);
  });
};

startServer();
