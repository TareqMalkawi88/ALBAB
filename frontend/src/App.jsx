
import { useEffect, useState } from "react";
import Auth from "./components/Auth";
import OrderForm from "./components/OrderForm";
import MyOrders from "./components/MyOrders";
import "./App.css";

const API_URL = "http://localhost:5000/api";

const App = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAuth, setShowAuth] = useState(false);
  const [showMyOrders, setShowMyOrders] = useState(false);

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch(`${API_URL}/services`);

        if (!response.ok) {
          throw new Error("Failed to load services");
        }

        const data = await response.json();
        setServices(data.services || []);
      } catch (error) {
        setError("Unable to load services. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Restore user session
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/users/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Session expired");
        }

        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Handle login
  const handleLogin = (userData) => {
    setUser(userData);
    setShowAuth(false);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setShowMyOrders(false);
    setSelectedService(null);
  };

  // Get service icon
  const getServiceIcon = (category) => {
    const icons = {
      fuel_delivery: "⛽",
      water_delivery: "💧",
      car_wash: "🚗",
    };

    return icons[category] || "🛠️";
  };

  // Handle order click
  const handleOrderClick = (service) => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    setSelectedService(service);
  };

  // Handle successful order
  const handleOrderSuccess = (order) => {
    console.log("Order created successfully:", order);
    setSelectedService(null);
    alert("Your order has been placed successfully!");
  };

  if (authLoading) {
    return (
      <div className="status-message">
        Checking your session...
      </div>
    );
  }

  if (showAuth) {
    return (
      <Auth
        onLogin={handleLogin}
        onClose={() => setShowAuth(false)}
      />
    );
  }

  if (showMyOrders) {
    return (
      <MyOrders
        onClose={() => setShowMyOrders(false)}
      />
    );
  }

  return (
    <div className="app">
      <nav className="navbar">
        <a href="#home" className="logo">
          AL<span>BAB</span>
          <small>عالباب</small>
        </a>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#services">Services</a>
          <a href="#about">About</a>
        </div>

        <div className="nav-actions">
          {user ? (
            <>
              <span>Hi, {user.name}</span>

              <button
                className="login-btn"
                onClick={() => setShowMyOrders(true)}
              >
                My Orders
              </button>

              <button
                className="login-btn"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                className="login-btn"
                onClick={() => setShowAuth(true)}
              >
                Login
              </button>

              <button
                className="register-btn"
                onClick={() => setShowAuth(true)}
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </nav>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <span className="hero-tag">
              YOUR SERVICES, AT YOUR DOOR
            </span>

            <h1>
              Everything You Need,
              <span> Delivered to Your Door.</span>
            </h1>

            <p>
              ALBAB makes your daily life easier. Order fuel, water,
              car washing, and more services with just a few clicks.
            </p>

            <div className="hero-actions">
              <a href="#services" className="primary-btn">
                Explore Services →
              </a>

              <a href="#about" className="secondary-btn">
                Learn More
              </a>
            </div>

            <div className="hero-stats">
              <div>
                <strong>Easy</strong>
                <span>Ordering</span>
              </div>

              <div>
                <strong>Fast</strong>
                <span>Delivery</span>
              </div>

              <div>
                <strong>Reliable</strong>
                <span>Services</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-circle">
              <span className="hero-icon">🏠</span>

              <div className="floating-card">
                <span>📦</span>

                <div>
                  <strong>On your doorstep</strong>
                  <small>Simple. Fast. Reliable.</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="services-section" id="services">
          <div className="section-heading">
            <span>WHAT WE OFFER</span>
            <h2>Our Popular Services</h2>
            <p>Live services from ALBAB providers.</p>
          </div>

          {loading && (
            <p className="status-message">Loading services...</p>
          )}

          {error && (
            <p className="error-message">{error}</p>
          )}

          {!loading && !error && services.length === 0 && (
            <p className="status-message">
              No services are available yet.
            </p>
          )}

          <div className="services-grid">
            {services.map((service) => (
              <article className="service-card" key={service._id}>
                <div className="service-icon">
                  {getServiceIcon(service.category)}
                </div>

                <h3>
                  {service.title.replaceAll("_", " ")}
                </h3>

                <h4>{service.location}</h4>

                <p>{service.description}</p>

                <div className="service-footer">
                  <span>{service.price} JOD</span>

                  <button
                    onClick={() => handleOrderClick(service)}
                    aria-label={`Order ${service.title}`}
                  >
                    →
                  </button>
                </div>

                <small className="provider-name">
                  Provider: {service.provider?.name || "ALBAB Provider"}
                </small>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section" id="about">
          <span>ABOUT ALBAB</span>

          <h2>
            Life is easier when everything is at your door.
          </h2>

          <p>
            ALBAB connects customers with trusted service providers
            across Jordan, making everyday services easier to access.
          </p>
        </section>
      </main>

      <footer className="footer">
        <a href="#home" className="logo">
          AL<span>BAB</span>
          <small>عالباب</small>
        </a>

        <p>© 2026 ALBAB. All rights reserved.</p>
        <span>Made for Jordan 🇯🇴</span>
      </footer>

      {selectedService && (
        <OrderForm
          service={selectedService}
          onClose={() => setSelectedService(null)}
          onOrderSuccess={handleOrderSuccess}
        />
      )}
    </div>
  );
};

export default App;
