
const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    subject: {
      type: String,
      default: "Customer Support",
      trim: true,
    },

    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },

    lastMessage: {
      type: String,
      default: "",
    },

    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Conversation = mongoose.model(
  "Conversation",
  conversationSchema
);

module.exports = Conversation;
