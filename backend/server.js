const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

require("dotenv").config();

const connectDB = require("./db");
const User = require("./models/user");

const userRoutes = require("./routes/user.routes");
const serviceRoutes = require("./routes/service.routes");
const orderRoutes = require("./routes/order.routes");
const reviewRoutes = require("./routes/review.routes");
const chatRoutes = require("./routes/chat.routes");

const protect = require("./middeleware/auth.middleware");
const socketAuth = require("./middeleware/socket.middleware");

const app = express();
const server = http.createServer(app);


const allowedOrigins = (
  process.env.FRONTEND_URL ||
  "http://localhost:5173,http://localhost:5174"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);


const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
};


app.use(cors(corsOptions));
app.use(express.json());


app.use("/api/users", userRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/chat", chatRoutes);


const io = new Server(server, {
  cors: corsOptions,
});

io.use(socketAuth);

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.user.id}`);

  socket.on("joinConversation", async ({ conversationId }) => {
    try {
      const Conversation = require("./models/conversation");

      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        return socket.emit("chatError", {
          message: "Conversation not found",
        });
      }

      const isCustomer =
        conversation.customer.toString() === socket.user.id;

      const isAdmin = socket.user.role === "admin";

      if (!isCustomer && !isAdmin) {
        return socket.emit("chatError", {
          message: "Not authorized to join this conversation",
        });
      }

      socket.join(conversationId);

      socket.emit("conversationJoined", {
        conversationId,
      });
    } catch (error) {
      console.error("Join conversation error:", error.message);

      socket.emit("chatError", {
        message: "Unable to join conversation",
      });
    }
  });

  socket.on("sendMessage", async ({ conversationId, content }) => {
    try {
      const Conversation = require("./models/conversation");
      const Message = require("./models/message");

      if (!conversationId || !content?.trim()) {
        return socket.emit("chatError", {
          message: "Conversation ID and message are required",
        });
      }

      if (content.trim().length > 2000) {
        return socket.emit("chatError", {
          message: "Message cannot exceed 2000 characters",
        });
      }

      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        return socket.emit("chatError", {
          message: "Conversation not found",
        });
      }

      const isCustomer =
        conversation.customer.toString() === socket.user.id;

      const isAdmin = socket.user.role === "admin";

      if (!isCustomer && !isAdmin) {
        return socket.emit("chatError", {
          message: "Not authorized to send messages",
        });
      }

      if (conversation.status === "closed") {
        return socket.emit("chatError", {
          message: "This conversation is closed",
        });
      }

      const message = await Message.create({
        conversation: conversationId,
        sender: socket.user.id,
        content: content.trim(),
      });

      conversation.lastMessage = content.trim();
      conversation.lastMessageAt = new Date();

      await conversation.save();

      const populatedMessage = await Message.findById(message._id)
        .populate("sender", "name role");

      const messageData = {
        _id: populatedMessage._id,
        conversation: conversationId,
        sender: populatedMessage.sender,
        senderRole: socket.user.role,
        content: populatedMessage.content,
        createdAt: populatedMessage.createdAt,
      };

      io.to(conversationId).emit("newMessage", messageData);
    } catch (error) {
      console.error("Send message error:", error.message);

      socket.emit("chatError", {
        message: "Unable to send message",
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.user.id}`);
  });
});


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

    return res.status(200).json({
      message: "Profile retrieved successfully",
      user,
    });
  } catch (error) {
    console.error("Profile error:", error.message);

    return res.status(500).json({
      message: "Server error",
    });
  }
});


const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`ALBAB server is running on port ${PORT}`);
      console.log("Socket.IO is ready");
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
