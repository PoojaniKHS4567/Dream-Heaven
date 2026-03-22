import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [disabled, setDisabled] = useState(false);
  const navigate = useNavigate();

  // Auto-check login expiration & redirect admins immediately
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (user) {
      if (user.isAdmin) {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [navigate]);

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
    if (!validateForm()) return;

    try {
      const res = await axios.post("/api/users/login", form);
      const currentUser = JSON.parse(localStorage.getItem("user"));

      // If same user is logged in
      if (currentUser && currentUser.username === form.username) {
        toast.info("You are already logged in with this account", {
          toastId: "already-logged-in",
        });
        setDisabled(true);
        return;
      }

      // If different user → log out previous user first
      if (currentUser && currentUser.username !== form.username) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("loginTime");
      }

      // Save new user & token
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("loginTime", new Date().getTime());

      setDisabled(true);

      // Update Navbar profile photo
      window.dispatchEvent(
        new CustomEvent("profilePhotoUpdated", {
          detail: { profilePhoto: res.data.user.profilePhoto },
        }),
      );

      toast.success("Login Successful!");

      // Redirect based on role
      setTimeout(() => {
        if (res.data.user.isAdmin) {
          navigate("/admin", { replace: true });
        } else {
          navigate("/", { replace: true });
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
