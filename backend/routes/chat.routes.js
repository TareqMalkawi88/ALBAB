const express = require("express");

const {
  createOrGetConversation,
  getConversations,
  getMessages,
} = require("../controllers/chat.controller");

const protect = require("../middeleware/auth.middleware");

const router = express.Router();

// All chat routes require authentication
router.use(protect);

// Customer: create or retrieve an open conversation
router.post("/conversations", createOrGetConversation);

// Customer: get own conversations
// Admin: get all conversations
router.get("/conversations", getConversations);

// Customer or Admin: get messages in a conversation
router.get("/conversations/:id/messages", getMessages);

module.exports = router;
