
import { useCallback, useEffect, useState } from "react";

// Backend URLs
const BACKEND_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const API_URL = `${BACKEND_URL}/api/orders`;
const REVIEWS_API_URL = `${BACKEND_URL}/api/reviews`;

const trackingSteps = [
  {
    status: "pending",
    title: "Order Placed",
    description: "Your order has been submitted.",
    icon: "📝",
  },
  {
    status: "accepted",
    title: "Order Accepted",
    description: "The provider has accepted your order.",
    icon: "✓",
  },
  {
    status: "completed",
    title: "Completed",
    description: "Your service has been completed.",
    icon: "🏁",
  },
];

const MyOrders = ({ onClose, user }) => {
  const [orders, setOrders] = useState([]);
  const [myReviews, setMyReviews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  // Review states
  const [selectedReviewOrder, setSelectedReviewOrder] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");

  // Fetch orders
  const fetchOrders = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/my-orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load orders");
      }

      setOrders(data.orders || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch customer's reviews
  const fetchMyReviews = useCallback(async () => {
    if (user?.role !== "customer") return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${REVIEWS_API_URL}/my-reviews`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load reviews");
      }

      setMyReviews(data.reviews || []);
    } catch (error) {
      console.error("Fetch reviews error:", error.message);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
    fetchMyReviews();
  }, [fetchOrders, fetchMyReviews]);

  // Check if an order has already been reviewed
  const getOrderReview = (orderId) => {
    return myReviews.find((review) => {
      const reviewedOrderId =
        typeof review.order === "object"
          ? review.order?._id
          : review.order;

      return reviewedOrderId?.toString() === orderId.toString();
    });
  };

  // Update order status
  const handleStatusUpdate = async (orderId, status) => {
    if (
      status === "cancelled" &&
      !window.confirm("Are you sure you want to cancel this order?")
    ) {
      return;
    }

    try {
      setUpdatingId(orderId);
      setError("");

      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update order");
      }

      await fetchOrders(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Open review form
  const handleOpenReview = (order) => {
    setSelectedReviewOrder(order);
    setRating(5);
    setComment("");
    setReviewMessage("");
    setReviewError("");
  };

  // Submit review
  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!selectedReviewOrder) return;

    if (comment.trim().length < 3) {
      setReviewError("Please write at least 3 characters.");
      return;
    }

    if (comment.trim().length > 500) {
      setReviewError("Review cannot exceed 500 characters.");
      return;
    }

    try {
      setSubmittingReview(true);
      setReviewError("");
      setReviewMessage("");

      const token = localStorage.getItem("token");

      const response = await fetch(REVIEWS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: selectedReviewOrder._id,
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit review");
      }

      setReviewMessage("Your review has been submitted successfully!");

      await fetchMyReviews();

      setSelectedReviewOrder(null);
      setRating(5);
      setComment("");
    } catch (error) {
      setReviewError(error.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusClass = (status) => {
    return `order-status status-${status}`;
  };

  const getTrackingState = (order, stepIndex) => {
    if (
      order.status === "rejected" ||
      order.status === "cancelled"
    ) {
      return "inactive";
    }

    const currentIndex = trackingSteps.findIndex(
      (step) => step.status === order.status
    );

    if (currentIndex === -1) return "inactive";
    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";

    return "inactive";
  };

  const getStatusMessage = (status) => {
    const messages = {
      pending: "Your order is waiting for provider approval.",
      accepted: "Your order has been accepted and is being processed.",
      completed: "Your service has been completed successfully!",
      rejected: "Unfortunately, the provider rejected this order.",
      cancelled: "This order has been cancelled.",
    };

    return messages[status] || "Order status unavailable.";
  };

  const formatDate = (date, orderId) => {
    let timestamp = date;

    if (!timestamp && orderId) {
      const seconds = parseInt(orderId.substring(0, 8), 16);
      timestamp = new Date(seconds * 1000);
    }

    if (!timestamp || isNaN(new Date(timestamp).getTime())) {
      return "Date unavailable";
    }

    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="my-orders-container">
      <div className="my-orders-header">
        <div>
          <span className="hero-tag">YOUR ACTIVITY</span>
          <h2>My Orders</h2>
          <p>
            {user?.role === "provider"
              ? "Manage your customer orders."
              : "Track your service requests."}
          </p>
        </div>

        <div className="orders-header-actions">
          <button
            onClick={() => {
              fetchOrders(true);
              fetchMyReviews();
            }}
            className="orders-refresh-btn"
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "↻ Refresh"}
          </button>

          <button onClick={onClose} className="orders-back-btn">
            Back to Home
          </button>
        </div>
      </div>

      {loading && (
        <p className="status-message">Loading orders...</p>
      )}

      {error && (
        <p className="error-message">{error}</p>
      )}

      {reviewMessage && (
        <p className="review-success-message">
          {reviewMessage}
        </p>
      )}

      {!loading && !error && orders.length === 0 && (
        <p className="status-message">
          {user?.role === "provider"
            ? "You haven't received any orders yet."
            : "You haven't placed any orders yet."}
        </p>
      )}

      <div className="my-orders-list">
        {orders.map((order) => {
          const isProvider = user?.role === "provider";
          const isCustomer = user?.role === "customer";
          const isUpdating = updatingId === order._id;

          const isTerminal = [
            "rejected",
            "cancelled",
            "completed",
          ].includes(order.status);

          const existingReview = getOrderReview(order._id);

          const isReviewing =
            selectedReviewOrder?._id === order._id;

          return (
            <article className="my-order-card" key={order._id}>
              <div className="my-order-top">
                <h3>{order.service?.title || "Service"}</h3>

                <span className={getStatusClass(order.status)}>
                  {order.status}
                </span>
              </div>

              <div className="my-order-details">
                <p>
                  <strong>Order ID:</strong>{" "}
                  {order._id.slice(-8).toUpperCase()}
                </p>

                {isProvider && (
                  <p>
                    <strong>Customer:</strong>{" "}
                    {order.customer?.name || "Customer"}
                  </p>
                )}

                <p>
                  <strong>Quantity:</strong> {order.quantity}
                </p>

                <p>
                  <strong>Total:</strong> {order.totalPrice} JOD
                </p>

                <p>
                  <strong>Address:</strong> {order.deliveryAddress}
                </p>

                {!isProvider && (
                  <p>
                    <strong>Provider:</strong>{" "}
                    {order.provider?.name || "ALBAB Provider"}
                  </p>
                )}

                <p>
                  <strong>Order Date:</strong>{" "}
                  {formatDate(order.createdAt, order._id)}
                </p>

                {order.notes && (
                  <p>
                    <strong>Notes:</strong> {order.notes}
                  </p>
                )}
              </div>

              {/* Provider Actions */}
              {isProvider && !isTerminal && (
                <div className="provider-order-actions">
                  {order.status === "pending" && (
                    <>
                      <button
                        className="accept-order-btn"
                        disabled={isUpdating}
                        onClick={() =>
                          handleStatusUpdate(order._id, "accepted")
                        }
                      >
                        {isUpdating ? "Updating..." : "✓ Accept Order"}
                      </button>

                      <button
                        className="reject-order-btn"
                        disabled={isUpdating}
                        onClick={() =>
                          handleStatusUpdate(order._id, "rejected")
                        }
                      >
                        ✕ Reject Order
                      </button>
                    </>
                  )}

                  {order.status === "accepted" && (
                    <button
                      className="complete-order-btn"
                      disabled={isUpdating}
                      onClick={() =>
                        handleStatusUpdate(order._id, "completed")
                      }
                    >
                      {isUpdating ? "Updating..." : "✓ Complete Order"}
                    </button>
                  )}
                </div>
              )}

              {/* Customer Cancel Action */}
              {isCustomer && order.status === "pending" && (
                <div className="customer-order-actions">
                  <button
                    className="cancel-order-btn"
                    disabled={isUpdating}
                    onClick={() =>
                      handleStatusUpdate(order._id, "cancelled")
                    }
                  >
                    {isUpdating ? "Cancelling..." : "✕ Cancel Order"}
                  </button>
                </div>
              )}

              {/* Customer Review Action */}
              {isCustomer && order.status === "completed" && (
                <div className="customer-review-section">
                  {existingReview ? (
                    <div className="review-already-submitted">
                      <strong>✓ You reviewed this service</strong>
                      <p>
                        <span className="review-stars">
                          {"★".repeat(existingReview.rating)}
                          {"☆".repeat(5 - existingReview.rating)}
                        </span>
                        <span>
                          {" "}
                          {existingReview.rating}/5
                        </span>
                      </p>
                      <p>{existingReview.comment}</p>
                    </div>
                  ) : (
                    <>
                      {!isReviewing && (
                        <button
                          className="rate-service-btn"
                          onClick={() => handleOpenReview(order)}
                        >
                          ⭐ Rate This Service
                        </button>
                      )}

                      {isReviewing && (
                        <form
                          className="review-form"
                          onSubmit={handleSubmitReview}
                        >
                          <h4>
                            Rate {order.service?.title || "This Service"}
                          </h4>

                          <p>How was your experience?</p>

                          <div className="review-rating-selector">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                className={
                                  star <= rating
                                    ? "review-star selected"
                                    : "review-star"
                                }
                                onClick={() => setRating(star)}
                                aria-label={`Rate ${star} stars`}
                              >
                                ★
                              </button>
                            ))}
                          </div>

                          <p className="selected-rating">
                            {rating} out of 5 stars
                          </p>

                          <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Write about your experience..."
                            rows={4}
                            maxLength={500}
                            required
                          />

                          <small>
                            {comment.length}/500 characters
                          </small>

                          {reviewError && (
                            <p className="error-message">
                              {reviewError}
                            </p>
                          )}

                          <div className="review-form-actions">
                            <button
                              type="submit"
                              className="submit-review-btn"
                              disabled={submittingReview}
                            >
                              {submittingReview
                                ? "Submitting..."
                                : "Submit Review"}
                            </button>

                            <button
                              type="button"
                              className="cancel-review-btn"
                              disabled={submittingReview}
                              onClick={() => {
                                setSelectedReviewOrder(null);
                                setReviewError("");
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Order Tracking */}
              <div className="order-tracking">
                <h4>Order Tracking</h4>

                {order.status === "rejected" ||
                order.status === "cancelled" ? (
                  <div className={`tracking-result ${order.status}`}>
                    <span>
                      {order.status === "rejected" ? "✕" : "⚠"}
                    </span>

                    <div>
                      <strong>
                        {order.status === "rejected"
                          ? "Order Rejected"
                          : "Order Cancelled"}
                      </strong>

                      <p>{getStatusMessage(order.status)}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="tracking-timeline">
                      {trackingSteps.map((step, index) => {
                        const state = getTrackingState(order, index);

                        return (
                          <div
                            className={`tracking-step ${state}`}
                            key={step.status}
                          >
                            <div className="tracking-marker">
                              {state === "completed"
                                ? "✓"
                                : step.icon}
                            </div>

                            <div className="tracking-step-content">
                              <strong>{step.title}</strong>
                              <p>{step.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <p className="tracking-message">
                      {getStatusMessage(order.status)}
                    </p>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default MyOrders;
