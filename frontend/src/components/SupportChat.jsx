
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

// Backend URL
const BACKEND_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const API_URL = `${BACKEND_URL}/api`;
const SOCKET_URL = BACKEND_URL;

const SupportChat = ({ onClose }) => {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem("token");

  // Initialize conversation and Socket.IO
  useEffect(() => {
    let socket;

    const initializeChat = async () => {
      try {
        const response = await fetch(`${API_URL}/chat/conversations`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Unable to start support conversation");
        }

        const data = await response.json();
        const currentConversation = data.conversation;

        setConversation(currentConversation);

        const messagesResponse = await fetch(
          `${API_URL}/chat/conversations/${currentConversation._id}/messages`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!messagesResponse.ok) {
          throw new Error("Unable to load messages");
        }

        const messagesData = await messagesResponse.json();
        setMessages(messagesData.messages || []);

        socket = io(SOCKET_URL, {
          auth: { token },
        });

        socketRef.current = socket;

        socket.on("connect", () => {
          setConnected(true);
          setJoined(false);

          socket.emit("joinConversation", {
            conversationId: currentConversation._id,
          });
        });

        socket.on("conversationJoined", () => {
          setJoined(true);
          setError("");
        });

        socket.on("newMessage", (message) => {
          setMessages((previousMessages) => {
            const alreadyExists = previousMessages.some(
              (item) => item._id === message._id
            );

            if (alreadyExists) {
              return previousMessages;
            }

            return [...previousMessages, message];
          });
        });

        socket.on("chatError", (data) => {
          setError(data.message || "Something went wrong");
        });

        socket.on("disconnect", () => {
          setConnected(false);
          setJoined(false);
        });

        socket.on("connect_error", () => {
          setConnected(false);
          setError("Unable to connect to support. Please try again.");
        });
      } catch (err) {
        setError(err.message || "Unable to load support chat");
      } finally {
        setLoading(false);
      }
    };

    initializeChat();

    return () => {
      if (socket) {
        socket.disconnect();
      }

      socketRef.current = null;
    };
  }, [token]);

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // Send message
  const handleSendMessage = (e) => {
    e.preventDefault();

    const content = newMessage.trim();

    if (!content || !socketRef.current || !joined || !conversation) {
      return;
    }

    socketRef.current.emit("sendMessage", {
      conversationId: conversation._id,
      content,
    });

    setNewMessage("");
  };

  return (
    <div className="support-chat-overlay">
      <div className="support-chat">
        <div className="support-chat-header">
          <div>
            <h3>ALBAB Support</h3>
            <span className="support-connection">
              <span
                className={`connection-dot ${
                  connected && joined ? "online" : ""
                }`}
              ></span>
              {connected && joined ? "Connected" : "Connecting..."}
            </span>
          </div>

          <button
            className="support-close-btn"
            onClick={onClose}
            aria-label="Close support chat"
          >
            ✕
          </button>
        </div>

        <div className="support-chat-messages">
          {loading && (
            <p className="support-status">
              Loading conversation...
            </p>
          )}

          {!loading && messages.length === 0 && (
            <div className="support-empty">
              <span>💬</span>
              <h4>How can we help you?</h4>
              <p>
                Send us a message and our support team will assist you.
              </p>
            </div>
          )}

          {messages.map((message) => {
            const isCustomer = message.senderRole === "customer";

            return (
              <div
                key={message._id}
                className={`support-message ${
                  isCustomer ? "customer-message" : "admin-message"
                }`}
              >
                <div className="message-sender">
                  {isCustomer ? "You" : "ALBAB Support"}
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

        {error && <p className="support-error">{error}</p>}

        <form
          className="support-chat-form"
          onSubmit={handleSendMessage}
        >
          <input
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            maxLength={2000}
            disabled={!joined || loading}
          />

          <button
            type="submit"
            disabled={!joined || !newMessage.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default SupportChat;
