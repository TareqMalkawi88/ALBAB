import { useEffect, useState } from "react";

import Auth from "./components/Auth";
import OrderForm from "./components/OrderForm";
import MyOrders from "./components/MyOrders";
import SupportChat from "./components/SupportChat";
import AdminDashboard from "./components/AdminDashboard";
import ServiceReviews from "./components/ServiceReviews";

import "./App.css";

// Backend URL
const BACKEND_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const API_URL = `${BACKEND_URL}/api`;

const App = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAuth, setShowAuth] = useState(false);
  const [showMyOrders, setShowMyOrders] = useState(false);
  const [showSupportChat, setShowSupportChat] = useState(false);

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);

  const [selectedReviewsService, setSelectedReviewsService] =
    useState(null);

  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = {
    fuel_delivery: "Fuel",
    car_wash: "Car Wash",
    water_tank_cleaning: "Water Tank",
    home_cleaning: "Home Cleaning",
    plumbing: "Plumbing",
    electrical_maintenance: "Electrical",
    ac_maintenance: "AC Maintenance",
    car_repair: "Car Repair",
    battery_replacement: "Battery",
    tire_services: "Tire Services",
    gas_cylinder_delivery: "Gas Delivery",
    appliance_repair: "Appliance Repair",
  };

  const getServiceIcon = (category) => {
    const icons = {
      fuel_delivery: "⛽",
      car_wash: "🚗",
      water_tank_cleaning: "🚰",
      home_cleaning: "🧹",
      plumbing: "🔧",
      electrical_maintenance: "💡",
      ac_maintenance: "❄️",
      car_repair: "🛠️",
      battery_replacement: "🔋",
      tire_services: "🛞",
      gas_cylinder_delivery: "🔥",
      appliance_repair: "🏠",
    };

    return icons[category] || "🛠️";
  };

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
        console.error("Fetch services error:", error);
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
        console.error("Restore session error:", error);
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
    setShowSupportChat(false);
    setSelectedService(null);
    setSelectedReviewsService(null);
    setActiveCategory("all");
    setSearchQuery("");
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

  // Search and filter services
  const filteredServices = services.filter((service) => {
    const query = searchQuery.trim().toLowerCase();

    const matchesCategory =
      activeCategory === "all" ||
      service.category === activeCategory;

    const matchesSearch =
      service.title?.toLowerCase().includes(query) ||
      service.description?.toLowerCase().includes(query) ||
      service.location?.toLowerCase().includes(query) ||
      service.provider?.name?.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  if (authLoading) {
    return (
      <div className="status-message">
        Checking your session...
      </div>
    );
  }

  // Admin Dashboard
  if (user?.role === "admin") {
    return (
      <AdminDashboard
        onClose={handleLogout}
      />
    );
  }

  // Authentication page
  if (showAuth) {
    return (
      <Auth
        onLogin={handleLogin}
        onClose={() => setShowAuth(false)}
      />
    );
  }

  // My Orders page
  if (showMyOrders) {
    return (
      <MyOrders
        onClose={() => setShowMyOrders(false)}
        user={user}
      />
    );
  }

  return (
    <div className="app">

      {/* Navbar */}
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

              {user.role === "customer" && (
                <button
                  className="login-btn"
                  onClick={() => setShowSupportChat(true)}
                >
                  💬 Support Chat
                </button>
              )}

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

        {/* Hero Section */}
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
              car washing, home maintenance, and more services
              with just a few clicks.
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

        {/* Services Section */}
        <section className="services-section" id="services">
          <div className="section-heading">
            <span>WHAT WE OFFER</span>
            <h2>Our Services</h2>
            <p>
              Discover services available at your doorstep.
            </p>
          </div>

          {!loading && !error && (
            <div className="services-count">
              Showing {filteredServices.length} of {services.length} services
            </div>
          )}

          <div className="service-search">
            <span>🔍</span>

            <input
              type="text"
              placeholder="Search by service, description, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="category-filters">
            <button
              className={
                activeCategory === "all"
                  ? "filter-btn active"
                  : "filter-btn"
              }
              onClick={() => setActiveCategory("all")}
            >
              All Services
            </button>

            {Object.entries(categories).map(([value, label]) => (
              <button
                key={value}
                className={
                  activeCategory === value
                    ? "filter-btn active"
                    : "filter-btn"
                }
                onClick={() => setActiveCategory(value)}
              >
                {getServiceIcon(value)} {label}
              </button>
            ))}
          </div>

          {loading && (
            <p className="status-message">
              Loading services...
            </p>
          )}

          {error && (
            <p className="error-message">{error}</p>
          )}

          {!loading && !error && filteredServices.length === 0 && (
            <p className="status-message">
              No services found. Try another search or category.
            </p>
          )}

          <div className="services-grid">
            {filteredServices.map((service) => (
              <article className="service-card" key={service._id}>
                <div className="service-icon">
                  {getServiceIcon(service.category)}
                </div>

                <span className="service-category">
                  {categories[service.category] || "Other"}
                </span>

                <h3>{service.title}</h3>

                <h4>📍 {service.location}</h4>

                <p>{service.description}</p>

                {/* Service Rating */}
                <div className="service-rating">
                  {service.reviewCount > 0 ? (
                    <>
                      <span className="rating-stars">★</span>

                      <strong>
                        {Number(service.averageRating || 0).toFixed(1)}
                      </strong>

                      <span className="rating-total">/ 5</span>

                      <small>
                        ({service.reviewCount}{" "}
                        {service.reviewCount === 1
                          ? "review"
                          : "reviews"})
                      </small>
                    </>
                  ) : (
                    <small className="no-reviews">
                      No reviews yet
                    </small>
                  )}
                </div>

                {/* Read Reviews Button */}
                {service.reviewCount > 0 && (
                  <button
                    className="read-reviews-btn"
                    onClick={() =>
                      setSelectedReviewsService(service)
                    }
                  >
                    Read Reviews →
                  </button>
                )}

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

        {/* About Section */}
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

      {/* Footer */}
      <footer className="footer">
        <a href="#home" className="logo">
          AL<span>BAB</span>
          <small>عالباب</small>
        </a>

        <p>© 2026 ALBAB. All rights reserved.</p>
        <span>Made for Jordan 🇯🇴</span>
      </footer>

      {/* Order Modal */}
      {selectedService && (
        <OrderForm
          service={selectedService}
          onClose={() => setSelectedService(null)}
          onOrderSuccess={handleOrderSuccess}
        />
      )}

      {/* Customer Support Chat */}
      {showSupportChat && user?.role === "customer" && (
        <SupportChat
          onClose={() => setShowSupportChat(false)}
        />
      )}

      {/* Service Reviews Modal */}
      {selectedReviewsService && (
        <ServiceReviews
          service={selectedReviewsService}
          onClose={() => setSelectedReviewsService(null)}
        />
      )}

    </div>
  );
};

export default App;