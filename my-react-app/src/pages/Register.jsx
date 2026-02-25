import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/Auth.css";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Rider",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      alert("Please fill all fields");
      return;
    }

    try {
      await API.post("/auth/register", {
        ...formData,
        role: formData.role.toLowerCase()
      });
      alert("Registration Successful! Please login to continue.");
      navigate("/");
    } catch (error) {
      alert(error.response?.data?.message || "Registration Failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>WeeFly Cab Register</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Name"
            className="auth-input"
            value={formData.name}
            onChange={handleChange}
          />

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

          <select
            name="role"
            className="auth-select"
            value={formData.role}
            onChange={handleChange}
          >
            <option value="Rider">Rider</option>
            <option value="Driver">Driver</option>
            <option value="Admin">Admin</option>
          </select>

          <button type="submit" className="auth-button">
            Register
          </button>
        </form>

        <div className="auth-link">
          Already have an account?{" "}
          <span onClick={() => navigate("/")}>
            Login
          </span>
        </div>
      </div>
    </div>
  );
};

export default Register;
