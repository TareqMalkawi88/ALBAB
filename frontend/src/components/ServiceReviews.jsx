
import { useEffect, useState } from "react";

// Backend URL
const BACKEND_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const API_URL = `${BACKEND_URL}/api/reviews`;

const ServiceReviews = ({ service, onClose }) => {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/service/${service._id}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load reviews");
        }

        setReviews(data.reviews || []);
        setAverageRating(data.averageRating || 0);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [service._id]);

  return (
    <div className="reviews-overlay" onClick={onClose}>
      <div
        className="reviews-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="reviews-header">
          <div>
            <span className="hero-tag">CUSTOMER FEEDBACK</span>
            <h2>{service.title}</h2>
          </div>

          <button
            className="reviews-close-btn"
            onClick={onClose}
            aria-label="Close reviews"
          >
            ✕
          </button>
        </div>

        <div className="reviews-summary">
          <strong>{averageRating.toFixed(1)}</strong>

          <div>
            <div className="reviews-summary-stars">
              {"★".repeat(Math.round(averageRating))}
              {"☆".repeat(5 - Math.round(averageRating))}
            </div>

            <span>
              {reviews.length}{" "}
              {reviews.length === 1 ? "review" : "reviews"}
            </span>
          </div>
        </div>

        {loading && (
          <p className="status-message">Loading reviews...</p>
        )}

        {error && (
          <p className="error-message">{error}</p>
        )}

        {!loading && !error && reviews.length === 0 && (
          <p className="status-message">
            No reviews yet. Be the first to review this service!
          </p>
        )}

        {!loading && !error && (
          <div className="reviews-list">
            {reviews.map((review) => (
              <article className="review-item" key={review._id}>
                <div className="review-item-header">
                  <strong>
                    {review.customer?.name || "Customer"}
                  </strong>

                  <span>
                    {review.createdAt
                      ? new Date(review.createdAt).toLocaleDateString()
                      : ""}
                  </span>
                </div>

                <div className="review-item-stars">
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </div>

                <p>{review.comment}</p>
              </article>
            ))}
          </div>
        )}

        <button
          className="reviews-close-bottom"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ServiceReviews;
