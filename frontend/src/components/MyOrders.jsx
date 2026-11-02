
import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/orders";

const MyOrders = ({ onClose }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
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
      }
    };

    fetchOrders();
  }, []);

  const getStatusClass = (status) => {
    return `order-status status-${status}`;
  };

  return (
    <div className="my-orders-container">
      <div className="my-orders-header">
        <div>
          <span className="hero-tag">YOUR ACTIVITY</span>
          <h2>My Orders</h2>
          <p>Track your service requests.</p>
        </div>

        <button onClick={onClose} className="orders-back-btn">
          Back to Home
        </button>
      </div>

      {loading && <p className="status-message">Loading orders...</p>}

      {error && <p className="error-message">{error}</p>}

      {!loading && !error && orders.length === 0 && (
        <p className="status-message">You haven't placed any orders yet.</p>
      )}

      <div className="my-orders-list">
        {orders.map((order) => (
          <article className="my-order-card" key={order._id}>
            <div className="my-order-top">
              <h3>{order.service?.title || "Service"}</h3>

              <span className={getStatusClass(order.status)}>
                {order.status}
              </span>
            </div>

            <div className="my-order-details">
              <p>
                <strong>Quantity:</strong> {order.quantity}
              </p>

              <p>
                <strong>Total:</strong> {order.totalPrice} JOD
              </p>

              <p>
                <strong>Address:</strong> {order.deliveryAddress}
              </p>

              <p>
                <strong>Provider:</strong>{" "}
                {order.provider?.name || "ALBAB Provider"}
              </p>

              {order.notes && (
                <p>
                  <strong>Notes:</strong> {order.notes}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default MyOrders;
