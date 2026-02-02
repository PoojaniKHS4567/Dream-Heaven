import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [disabled, setDisabled] = useState(false); // Disable inputs if already logged in
  const navigate = useNavigate();

  // Check if already logged in
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const loginTime = localStorage.getItem("loginTime");

    if (user) {
      const now = new Date().getTime();
      if (loginTime && now - loginTime > 10 * 60 * 1000) {
        // 10 minutes passed → logout automatically
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("loginTime");
        setDisabled(false);
      } else {
        // Still logged in → disable login inputs
        setDisabled(true);

        toast.info("You are already logged in", {
          toastId: "already-logged-in",
          style: { background: "#B0B0B0", color: "#000" },
          autoClose: 5000,
        });
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!form.username.trim()) {
      toast.error("Username is required");
      return false;
    }
    if (!form.password.trim()) {
      toast.error("Password is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (disabled) return;
    if (!validateForm()) return;

    try {
      const res = await axios.post("/api/users/login", form);

      toast.success("Login Successful!");

      // Save user & token to localStorage
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("loginTime", new Date().getTime());

      setDisabled(true);

      // ✅ Dispatch event to update Navbar profile photo
      window.dispatchEvent(
        new CustomEvent("profilePhotoUpdated", {
          detail: { profilePhoto: res.data.user.profilePhoto },
        }),
      );

      // Redirect after short delay
      setTimeout(() => {
        if (res.data.user.isAdmin) {
          navigate("/admin");
        } else {
          navigate("/"); // Or "/webhome" depending on your routes
        }
      }, 500);
    } catch (err) {
      toast.error("Invalid username or password");
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="login-container">
        <h2>Sign In</h2>
        <br />

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            required
            disabled={disabled}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            disabled={disabled}
          />

          <button type="submit" disabled={disabled}>
            Sign In
          </button>
        </form>

        <div style={{ marginTop: "10px" }}>
          Don't have an account? <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
