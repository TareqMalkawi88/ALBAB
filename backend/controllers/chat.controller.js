
const mongoose = require("mongoose");
const Conversation = require("../models/conversation");
const Message = require("../models/message");

// Create a conversation or return the existing open conversation
const createOrGetConversation = async (req, res) => {
  try {
    if (req.user.role !== "customer") {
      return res.status(403).json({
        message: "Only customers can start support conversations",
      });
    }

    let conversation = await Conversation.findOne({
      customer: req.user.id,
      status: "open",
    });

    if (!conversation) {
      conversation = await Conversation.create({
        customer: req.user.id,
        subject: "Customer Support",
      });
    }

    return res.status(200).json({
      message: "Conversation retrieved successfully",
      conversation,
    });
  } catch (error) {
    console.error("Create conversation error:", error.message);

    return res.status(500).json({
      message: "Failed to create conversation",
    });
  }
};

// Get conversations
const getConversations = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "customer") {
      filter.customer = req.user.id;
    } else if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const conversations = await Conversation.find(filter)
      .populate("customer", "name email")
      .sort({ lastMessageAt: -1 });

    return res.status(200).json({
      count: conversations.length,
      conversations,
    });
  } catch (error) {
    console.error("Get conversations error:", error.message);

    return res.status(500).json({
      message: "Failed to retrieve conversations",
    });
  }
};

// Get messages in a conversation
const getMessages = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid conversation ID",
      });
    }

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    const isCustomerOwner =
      req.user.role === "customer" &&
      conversation.customer.toString() === req.user.id;

    const isAdmin = req.user.role === "admin";

    if (!isCustomerOwner && !isAdmin) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const messages = await Message.find({
      conversation: id,
    })
      .populate("sender", "name role")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error("Get messages error:", error.message);

    return res.status(500).json({
      message: "Failed to retrieve messages",
    });
  }
};

module.exports = {
  createOrGetConversation,
  getConversations,
  getMessages,
};
