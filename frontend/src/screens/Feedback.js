import React, { useState, useEffect, useRef } from "react";
import profileImg from "../assets/profile.jpeg";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

function Feedback() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const toastShown = useRef(false);

  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState("General");
  const [comment, setComment] = useState("");

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));

    if (!userData) {
      if (!toastShown.current) {
        toast.info(
          "Please log in to the website to share your feedback and tell us about your service experience.",
          {
            position: "top-center",
            autoClose: 3000,
            style: {
              background: "#dc9b56ff",
              color: "#0e0d0dff",
              fontWeight: "500",
            },
          },
        );

        toastShown.current = true;
      }

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } else {
      setUser(userData);
    }
  }, [navigate]);

  if (!user) return null;

  const submitFeedback = async () => {
    if (!rating) {
      toast.warn("Please select a rating to continue", {
        style: { background: "#ebdfccff", color: "#121212ff" },
      });
      return;
    }

    if (!comment.trim()) {
      toast.warn("Please write a short comment before submitting", {
        style: { background: "#ebdfccff", color: "#121212ff" },
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");

      await axios.post(
        "/api/feedback/submit",
        {
          userId: user._id,
          firstName: user.firstName,
          userEmail: user.email,
          rating,
          category,
          comment,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success(
        "Thank you for your feedback! Your experience helps us improve our service.",
        {
          style: { background: "#2ecc71", color: "#fff" },
        },
      );

      setRating(0);
      setCategory("General");
      setComment("");
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Something went wrong. Please try again later.",
        {
          style: { background: "#e74c3c", color: "#fff" },
        },
      );
    }
  };

  return (
    <div className="feedback-container">
      <br />
      <h4>We value your feedback 💬</h4>
      <p className="subtitle">
        Your thoughts help us improve our services and give you a better
        experience.
      </p>

      <div className="feedback-card">
        {/* LEFT */}
        <div className="user-section">
          <img
            src={user.profilePhoto || profileImg}
            alt="User"
            className="user-avatar"
          />
          <p className="username">{user.firstName}</p>
        </div>

        {/* RIGHT */}
        <div className="form-section">
          {/* Rating */}
          <div className="rating">
            <p>Rating</p>
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={star <= rating ? "star active" : "star"}
                onClick={() => setRating(star)}
              >
                ★
              </span>
            ))}
          </div>

          {/* Category */}
          <div className="input-group">
            <label>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="General">General</option>
              <option value="Service">Service</option>
              <option value="Rooms">Rooms</option>
              <option value="Staff">Staff</option>
              <option value="Facilities">Facilities</option>
            </select>
          </div>

          {/* Comment */}
          <div className="input-group">
            <label>Comment</label>
            <textarea
              placeholder="Write your feedback..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <button className="submit-btn" onClick={submitFeedback}>
            Submit Feedback
          </button>
        </div>
      </div>
    </div>
  );
}

export default Feedback;
