import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaStar } from "react-icons/fa";

function Feedback() {
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 0,
    comment: "",
    category: "General",
  });
  const [hoveredStar, setHoveredStar] = useState(0);
  const [approvedFeedbacks, setApprovedFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchApprovedFeedbacks();
    const userData = JSON.parse(localStorage.getItem("user"));
    setUser(userData);
  }, []);

  const fetchApprovedFeedbacks = async () => {
    try {
      const response = await axios.get("/api/feedback/approved");
      setApprovedFeedbacks(response.data);
    } catch (err) {
      console.error("Error fetching feedbacks:", err);
    }
  };

  const handleStarClick = (rating) => {
    setFeedbackForm({ ...feedbackForm, rating });
  };

  const handleStarHover = (rating) => {
    setHoveredStar(rating);
  };

  const handleStarLeave = () => {
    setHoveredStar(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!user) {
      setError("Please log in to submit feedback");
      setLoading(false);
      return;
    }

    if (feedbackForm.rating === 0) {
      setError("Please select a rating");
      setLoading(false);
      return;
    }

    if (!feedbackForm.comment.trim()) {
      setError("Please enter a comment");
      setLoading(false);
      return;
    }

    try {
      await axios.post("/api/feedback/submit", {
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email,
        rating: feedbackForm.rating,
        comment: feedbackForm.comment,
        category: feedbackForm.category,
      });

      setSuccess(
        "Feedback submitted successfully! It will be reviewed by our team."
      );
      setFeedbackForm({ rating: 0, comment: "", category: "General" });

      // Refresh approved feedbacks
      setTimeout(() => {
        fetchApprovedFeedbacks();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating, interactive = false) => {
    return [...Array(5)].map((_, index) => {
      const starValue = index + 1;
      const filled = interactive
        ? (hoveredStar || rating) >= starValue
        : rating >= starValue;

      return (
        <FaStar
          key={index}
          className={`star ${filled ? "filled" : "empty"} ${
            interactive ? "interactive" : ""
          }`}
          onClick={interactive ? () => handleStarClick(starValue) : undefined}
          onMouseEnter={
            interactive ? () => handleStarHover(starValue) : undefined
          }
          onMouseLeave={interactive ? handleStarLeave : undefined}
        />
      );
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      General: "#6c757d",
      Service: "#007bff",
      Rooms: "#28a745",
      Staff: "#ffc107",
      Facilities: "#dc3545",
    };
    return colors[category] || "#6c757d";
  };

  return (
    <div className="feedback-container">
      <div className="feedback-header">
        <h1>Customer Feedback</h1>
        <p>Share your experience with us and help us improve our services</p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="feedback-content">
        {/* Submit Feedback Form */}
        <div className="feedback-form-section">
          <h2>Submit Your Feedback</h2>
          <form onSubmit={handleSubmit} className="feedback-form">
            <div className="form-group">
              <label>Rating:</label>
              <div className="star-rating">
                {renderStars(feedbackForm.rating, true)}
              </div>
            </div>

            <div className="form-group">
              <label>Category:</label>
              <select
                value={feedbackForm.category}
                onChange={(e) =>
                  setFeedbackForm({ ...feedbackForm, category: e.target.value })
                }
                className="category-select"
              >
                <option value="General">General</option>
                <option value="Service">Service</option>
                <option value="Rooms">Rooms</option>
                <option value="Staff">Staff</option>
                <option value="Facilities">Facilities</option>
              </select>
            </div>

            <div className="form-group">
              <label>Comment:</label>
              <textarea
                value={feedbackForm.comment}
                onChange={(e) =>
                  setFeedbackForm({ ...feedbackForm, comment: e.target.value })
                }
                placeholder="Share your experience with us..."
                maxLength={500}
                rows={4}
                className="comment-textarea"
              />
              <div className="char-count">
                {feedbackForm.comment.length}/500 characters
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Submitting..." : "Submit Feedback"}
            </button>
          </form>
        </div>

        {/* Display Approved Feedbacks */}
        <div className="feedbacks-display-section">
          <h2>What Our Customers Say</h2>
          {approvedFeedbacks.length === 0 ? (
            <div className="no-feedbacks">
              <p>
                No feedbacks available yet. Be the first to share your
                experience!
              </p>
            </div>
          ) : (
            <div className="feedbacks-grid">
              {approvedFeedbacks.map((feedback) => (
                <div key={feedback._id} className="feedback-card">
                  <div className="feedback-header-card">
                    <div className="user-info">
                      <h4>{feedback.userName}</h4>
                      <span className="feedback-date">
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="feedback-category">
                      <span
                        className="category-badge"
                        style={{
                          backgroundColor: getCategoryColor(feedback.category),
                        }}
                      >
                        {feedback.category}
                      </span>
                    </div>
                  </div>

                  <div className="feedback-rating">
                    {renderStars(feedback.rating)}
                  </div>

                  <div className="feedback-comment">
                    <p>{feedback.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Feedback;
