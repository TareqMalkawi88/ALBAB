
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

// Backend URLs
const BACKEND_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const API_URL = `${BACKEND_URL}/api`;
const SOCKET_URL = BACKEND_URL;

const AdminDashboard = ({ onClose }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);

  const socketRef = useRef(null);
  const selectedConversationRef = useRef(null);
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem("token");

  // Load all conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch(`${API_URL}/chat/conversations`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Unable to load conversations");
        }

        const data = await response.json();
        setConversations(data.conversations || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [token]);

  // Connect Admin to Socket.IO
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      auth: { token },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      const current = selectedConversationRef.current;

      if (current) {
        socket.emit("joinConversation", {
          conversationId: current._id,
        });
      }
    });

    socket.on("conversationJoined", () => {
      setJoined(true);
    });

    socket.on("newMessage", (message) => {
      const current = selectedConversationRef.current;

      if (
        current &&
        message.conversation === current._id
      ) {
        setMessages((previous) => {
          const exists = previous.some(
            (item) => item._id === message._id
          );

          return exists ? previous : [...previous, message];
        });
      }

      // Update conversation preview
      setConversations((previous) =>
        previous.map((conversation) =>
          conversation._id === message.conversation
            ? {
                ...conversation,
                lastMessage: message.content,
                lastMessageAt: message.createdAt,
              }
            : conversation
        )
      );
    });

    socket.on("chatError", (data) => {
      setError(data.message || "Chat error");
    });

    socket.on("disconnect", () => {
      setConnected(false);
      setJoined(false);
    });

    socket.on("connect_error", () => {
      setConnected(false);
      setError("Unable to connect to chat server");
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  // Select conversation and load its messages
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;

    if (!selectedConversation) {
      setMessages([]);
      setJoined(false);
      return;
    }

    const fetchMessages = async () => {
      setMessagesLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/chat/conversations/${selectedConversation._id}/messages`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Unable to load messages");
        }

        const data = await response.json();
        setMessages(data.messages || []);

        if (socketRef.current?.connected) {
          setJoined(false);

          socketRef.current.emit("joinConversation", {
            conversationId: selectedConversation._id,
          });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setMessagesLoading(false);
      }
    };

    fetchMessages();
  }, [selectedConversation, token]);

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // Send Admin reply
  const handleSendMessage = (e) => {
    e.preventDefault();

    const content = newMessage.trim();

    if (!content || !selectedConversation || !joined) {
      return;
    }

    socketRef.current.emit("sendMessage", {
      conversationId: selectedConversation._id,
      content,
    });

    setNewMessage("");
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div>
          <h2>ALBAB Support Dashboard</h2>
          <p>Manage customer conversations</p>
        </div>

        <div className="admin-header-actions">
          <span className={connected ? "admin-online" : "admin-offline"}>
            {connected ? "● Connected" : "● Disconnected"}
          </span>

          <button onClick={onClose}>Back to Website</button>
        </div>
      </header>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-chat-layout">
        <aside className="admin-conversations">
          <h3>Customer Conversations</h3>

          {loading && <p>Loading conversations...</p>}

          {!loading && conversations.length === 0 && (
            <p className="admin-empty">
              No customer conversations yet.
            </p>
          )}

          {conversations.map((conversation) => (
            <button
              key={conversation._id}
              className={`admin-conversation-item ${
                selectedConversation?._id === conversation._id
                  ? "selected"
                  : ""
              }`}
              onClick={() => setSelectedConversation(conversation)}
            >
              <strong>
                {conversation.customer?.name || "Customer"}
              </strong>

              <span>
                {conversation.lastMessage || "No messages yet"}
              </span>

              <small>
                {conversation.lastMessageAt
                  ? new Date(conversation.lastMessageAt).toLocaleString()
                  : ""}
              </small>
            </button>
          ))}
        </aside>

        <section className="admin-chat-area">
          {!selectedConversation ? (
            <div className="admin-select-message">
              <span>💬</span>
              <h3>Select a conversation</h3>
              <p>Choose a customer conversation to start replying.</p>
            </div>
          ) : (
            <>
              <div className="admin-chat-title">
                <div>
                  <h3>
                    {selectedConversation.customer?.name || "Customer"}
                  </h3>
                  <span>
                    {selectedConversation.customer?.email || ""}
                  </span>
                </div>

                <span className="conversation-status">
                  {selectedConversation.status}
                </span>
              </div>

              <div className="admin-messages">
                {messagesLoading && <p>Loading messages...</p>}

                {!messagesLoading && messages.length === 0 && (
                  <p className="admin-empty">
                    No messages in this conversation yet.
                  </p>
                )}

                {messages.map((message) => {
                  const isAdmin = message.senderRole === "admin";

                  return (
                    <div
                      key={message._id}
                      className={`support-message ${
                        isAdmin ? "customer-message" : "admin-message"
                      }`}
                    >
                      <div className="message-sender">
                        {isAdmin
                          ? "You (Support)"
                          : message.sender?.name || "Customer"}
                      </div>

                      <p>{message.content}</p>

                      <small>
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>

              <form
                className="admin-reply-form"
                onSubmit={handleSendMessage}
              >
                <input
                  type="text"
                  placeholder="Reply to customer..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  maxLength={2000}
                  disabled={!joined || !connected}
                />

                <button
                  type="submit"
                  disabled={!joined || !newMessage.trim()}
                >
                  Send Reply
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
