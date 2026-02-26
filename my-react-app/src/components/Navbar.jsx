import React from "react";
import { useNavigate, NavLink } from "react-router-dom";
import "./Navbar.css"; // External CSS file

function Navbar() {
  const navigate = useNavigate();
  const role = sessionStorage.getItem("role"); // rider / driver / admin
  const username = sessionStorage.getItem("username"); // optional

  const logout = () => {
    sessionStorage.clear();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="brand" onClick={() => navigate("/")}>
          <div className="logo-wrapper">
            <svg width="45" height="45" viewBox="0 0 100 100" className="company-logo hyper-logo">
              <defs>
                <linearGradient id="pinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
                <filter id="glowEffect">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Location Pin Outer */}
              <path
                className="pin-path"
                d="M50 95 C50 95 15 65 15 40 C15 20 30 5 50 5 C70 5 85 20 85 40 C85 65 50 95 50 95 Z"
                fill="#1e1e2f"
                stroke="url(#pinGrad)"
                strokeWidth="4"
              />

              {/* Road / Dash lines */}
              <line x1="30" y1="65" x2="70" y2="65" stroke="#fbbf24" strokeWidth="2" strokeDasharray="5,5" className="road-line" />

              {/* Stylized Cab Silhouette */}
              <g className="cab-group">
                <path
                  d="M35 55 L35 48 C35 45 37 42 40 42 L60 42 C63 42 65 45 65 48 L65 55 L70 55 L70 62 L30 62 L30 55 Z"
                  fill="url(#pinGrad)"
                  filter="url(#glowEffect)"
                />
                <rect x="38" y="58" width="6" height="6" rx="3" fill="#1e1e2f" /> {/* Wheel */}
                <rect x="56" y="58" width="6" height="6" rx="3" fill="#1e1e2f" /> {/* Wheel */}
                {/* Windows */}
                <path d="M40 46 L48 46 L48 52 L38 52 Z" fill="#1e1e2f" opacity="0.6" />
                <path d="M52 46 L60 46 L62 52 L52 52 Z" fill="#1e1e2f" opacity="0.6" />
              </g>

              {/* Speed Lines */}
              <path d="M20 45 L10 45" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" className="speed-line sl-1" />
              <path d="M22 52 L12 52" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" className="speed-line sl-2" />
            </svg>
          </div>
          <span className="brand-text">WeeFly Cab</span>
        </div>

        <ul className="nav-links">
          <li>
            <NavLink to="/" className="nav-link">Home</NavLink>
          </li>

          {/* New Feature: About Us (Scroll) */}
          <li>
            <a href="#about" className="nav-link">About Us</a>
          </li>

          {/* Dropdown for Rider */}
          {role === "rider" && (
            <li className="dropdown">
              <span className="dropbtn">Services <span className="arrow">▿</span></span>
              <ul className="dropdown-content">
                <li><NavLink to="/book" className="nav-link">Book Ride</NavLink></li>
                <li><NavLink to="/track" className="nav-link">Track Ride</NavLink></li>
                <li><NavLink to="/history" className="nav-link">Ride History</NavLink></li>
              </ul>
            </li>
          )}

          {/* Dropdown for Driver */}
          {role === "driver" && (
            <li className="dropdown">
              <span className="dropbtn">Driver Portal <span className="arrow">▿</span></span>
              <ul className="dropdown-content">
                <li><NavLink to="/driver/dashboard" className="nav-link">Dashboard</NavLink></li>
                <li><NavLink to="/earnings" className="nav-link">Earnings</NavLink></li>
                <li><NavLink to="/availability" className="nav-link">Availability</NavLink></li>
              </ul>
            </li>
          )}

          {/* Dropdown for Admin */}
          {role === "admin" && (
            <li className="dropdown">
              <span className="dropbtn">Admin Panel <span className="arrow">▿</span></span>
              <ul className="dropdown-content">
                <li><NavLink to="/admin/dashboard" className="nav-link">Dashboard</NavLink></li>
                <li><NavLink to="/reports" className="nav-link">Ride Reports</NavLink></li>
                <li><NavLink to="/drivers" className="nav-link">Manage Drivers</NavLink></li>
              </ul>
            </li>
          )}
        </ul>

        <div className="navbar-actions">
          {/* New Feature: Notifications Tooltip/Icon */}
          {role && (
            <div className="nav-icon-btn notifications" title="Notifications">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="#fbbf24" style={{ filter: 'drop-shadow(0 0 5px rgba(251, 191, 36, 0.3))' }}>
                <path d="M12 22a2.98 2.98 0 0 0 2.818-2H9.182A2.98 2.98 0 0 0 12 22zm7-7.485V8a7 7 0 1 0-14 0v6.515l-1.445 1.446A1 1 0 0 0 4.268 18h15.464a1 1 0 0 0 .713-1.707L19 14.515z" />
              </svg>
            </div>
          )}

          {role ? (
            <div className="user-profile">
              <div className="user-avatar">
                {username ? username[0].toUpperCase() : "U"}
              </div>
              <div className="user-info">
                <span className="username">{username || "User"}</span>
                <span className="user-role">{role}</span>
              </div>
              <button className="logout-btn" onClick={logout}>Logout</button>
            </div>
          ) : (
            <button className="login-btn-premium" onClick={() => navigate("/")}>
              Get Started
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
