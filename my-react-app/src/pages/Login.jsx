import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/Auth.css";

const Login = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("rider"); // rider, driver, admin

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      alert("Please fill all fields");
      return;
    }

    try {
      // We pass the login data and the expected role (rider, driver, admin).
      const { data } = await API.post("/auth/login", { ...formData, role: activeTab });

      sessionStorage.setItem("authToken", data.token);
      sessionStorage.setItem("role", data.role);
      sessionStorage.setItem("username", data.name);
      sessionStorage.setItem("user", JSON.stringify(data));

      alert("Login Successful");

      // Redirect based on role to its specific dashboard
      if (data.role === "driver") {
        navigate("/driver/dashboard");
      } else if (data.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/rider/dashboard");
      }

    } catch (error) {
      alert(error.response?.data?.message || "Login Failed");
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo-container brand">
            <svg width="100" height="100" viewBox="0 0 100 100" className="company-logo hyper-logo">
              <defs>
                <linearGradient id="pinGradLogin" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
                <filter id="glowEffectLogin">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <path
                className="pin-path"
                d="M50 95 C50 95 15 65 15 40 C15 20 30 5 50 5 C70 5 85 20 85 40 C85 65 50 95 50 95 Z"
                fill="#1e1e2f"
                stroke="url(#pinGradLogin)"
                strokeWidth="4"
              />

              <line x1="30" y1="65" x2="70" y2="65" stroke="#fbbf24" strokeWidth="2" strokeDasharray="5,5" className="road-line" />

              <g className="cab-group">
                <path
                  d="M35 55 L35 48 C35 45 37 42 40 42 L60 42 C63 42 65 45 65 48 L65 55 L70 55 L70 62 L30 62 L30 55 Z"
                  fill="url(#pinGradLogin)"
                  filter="url(#glowEffectLogin)"
                />
                <rect x="38" y="58" width="6" height="6" rx="3" fill="#1e1e2f" />
                <rect x="56" y="58" width="6" height="6" rx="3" fill="#1e1e2f" />
                <path d="M40 46 L48 46 L48 52 L38 52 Z" fill="#1e1e2f" opacity="0.6" />
                <path d="M52 46 L60 46 L62 52 L52 52 Z" fill="#1e1e2f" opacity="0.6" />
              </g>

              <path d="M20 45 L10 45" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" className="speed-line sl-1" />
              <path d="M22 52 L12 52" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" className="speed-line sl-2" />
            </svg>
          </div>
          <h2>WeeFly Cab Login</h2>

          <div className="auth-tabs">
            <button
              className={`auth-tab ${activeTab === 'rider' ? 'active' : ''}`}
              onClick={() => setActiveTab('rider')}
            >
              Rider
            </button>
            <button
              className={`auth-tab ${activeTab === 'driver' ? 'active' : ''}`}
              onClick={() => setActiveTab('driver')}
            >
              Driver
            </button>
            <button
              className={`auth-tab ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              Admin
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="auth-input"
              value={formData.email}
              onChange={handleChange}
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              className="auth-input"
              value={formData.password}
              onChange={handleChange}
            />

            <button type="submit" className="auth-button">
              Login
            </button>
          </form>

          <div className="auth-link">
            Don’t have an account?{" "}
            <span onClick={() => navigate("/register")}>
              Create Account
            </span>
          </div>
        </div>
      </div>

      {/* Professional About Us Section */}
      <section id="about" className="about-section">
        <div className="about-content">
          <h2 className="about-title">About WeeFly Cab</h2>
          <p className="about-subtitle">Redefining Urban Mobility with Technology and Trust</p>

          <div className="about-grid">
            <div className="about-item">
              <span className="about-icon">🚀</span>
              <h3>Lightning Fast</h3>
              <p>Our intelligent dispatching algorithm ensures a cab reaches you in under 5 minutes, every single time.</p>
            </div>
            <div className="about-item">
              <span className="about-icon">🛡️</span>
              <h3>Safety First</h3>
              <p>Verified drivers, real-time trip tracking, and SOS features to keep you and your loved ones secure.</p>
            </div>
            <div className="about-item">
              <span className="about-icon">💰</span>
              <h3>Best Pricing</h3>
              <p>No hidden surges. We offer the most competitive rates in Salem, ensuring value for every mile traveled.</p>
            </div>
            <div className="about-item">
              <span className="about-icon">💳</span>
              <h3>Cashless Drive</h3>
              <p>Seamless digital payments integrated directly into the app for a hassle-free boarding experience.</p>
            </div>
          </div>

          <div className="about-footer-card">
            <h3>Why Choose WeeFly?</h3>
            <p>At WeeFly, we aren't just a cab service; we are your companion in every journey. From daily office commutes to late-night airport transfers, we ensure comfort, reliability, and professionalism at every turn.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;
