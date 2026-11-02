
import { useState } from "react";

const API_URL = "http://localhost:5000/api/orders";

const OrderForm = ({ service, onClose, onOrderSuccess }) => {
  const [quantity, setQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const totalPrice = service.price * quantity;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please log in before placing an order.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceId: service._id,
          quantity: Number(quantity),
          deliveryAddress,
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to place order.");
      }

      setSuccess("Your order has been placed successfully!");

      onOrderSuccess(data.order);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="order-overlay">
      <div className="order-card">
        <button
          type="button"
          className="order-close"
          onClick={onClose}
        >
          ✕
        </button>

        <h2>Place Your Order</h2>
        <p className="order-subtitle">{service.title.replaceAll("_", " ")}</p>

        <div className="order-service-info">
          <span>Location: {service.location}</span>
          <span>Price per unit: {service.price} JOD</span>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="quantity">Quantity</label>
          <input
            id="quantity"
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />

          <label htmlFor="deliveryAddress">Delivery Address</label>
          <input
            id="deliveryAddress"
            type="text"
            placeholder="Enter your full address"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            required
          />

          <label htmlFor="notes">Notes (Optional)</label>
          <textarea
            id="notes"
            placeholder="Any additional instructions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="order-total">
            <span>Total Price</span>
            <strong>{totalPrice} JOD</strong>
          </div>

          {error && <p className="order-error">{error}</p>}
          {success && <p className="order-success">{success}</p>}

          <button type="submit" disabled={loading || success !== ""}>
            {loading ? "Placing Order..." : "Place Order"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OrderForm;
