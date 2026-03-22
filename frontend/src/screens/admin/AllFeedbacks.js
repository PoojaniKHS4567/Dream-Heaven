import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function AllFeedbacks() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filters, setFilters] = useState({
    name: "",
    rating: "",
    date: "",
  });

  // Fetch all feedbacks
  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      console.log("Fetching feedbacks with token:", token);
      const response = await axios.get("/api/feedback/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Feedbacks received:", response.data);
      setFeedbacks(response.data);
      setError(false);
    } catch (err) {
      console.error("Error fetching feedbacks:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  // Delete feedback
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this feedback?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`/api/feedback/delete/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Feedback deleted successfully!");
        fetchFeedbacks();
      } catch (err) {
        console.error("Error deleting feedback:", err);
        alert("Failed to delete feedback");
      }
    }
  };

  // Filters
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const resetFilters = () => {
    setFilters({ name: "", rating: "", date: "" });
  };

  // Filtered feedbacks
  const filteredFeedbacks = feedbacks.filter((feedback) => {
    const nameMatch =
      feedback.name?.toLowerCase().includes(filters.name.toLowerCase()) ??
      false;

    const ratingMatch =
      filters.rating === "" || feedback.rating?.toString() === filters.rating;

    const dateMatch =
      filters.date === "" ||
      new Date(feedback.createdAt).toLocaleDateString("en-CA") === filters.date;

    return nameMatch && ratingMatch && dateMatch;
  });

  // Generate PDF (ALL fields)
  const downloadPDF = () => {
    if (filteredFeedbacks.length === 0) {
      alert("No feedbacks to include in the PDF report.");
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("All Feedbacks Report", 14, 16);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 25);

    const tableData = filteredFeedbacks.map((feedback) => [
      feedback.name,
      feedback.userEmail,
      feedback.rating,
      feedback.category,
      feedback.comment,
      new Date(feedback.createdAt).toLocaleDateString("en-CA"),
    ]);

    autoTable(doc, {
      head: [["Name", "Email", "Rating", "Category", "Comment", "Date"]],
      body: tableData,
      startY: 30,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: {
        fillColor: [106, 66, 193],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save("feedbacks_report.pdf");
  };

  // Display stars with larger font
  const getRatingStars = (rating) => {
    const fullStars = "★".repeat(rating);
    const emptyStars = "☆".repeat(5 - rating);
    return (
      <span style={{ fontSize: "24px", color: "#f1c40f" }}>
        {fullStars + emptyStars}
      </span>
    );
  };

  return (
    <div className="container mt-8">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-5" style={{ flex: 1, textAlign: "center" }}>
          <b>All Feedbacks</b>
        </h1>
        <button
          style={{
            backgroundColor: "#6f42c1",
            border: "1px solid #6f42c1",
            color: "white",
            padding: "5px 10px",
            height: "40px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
          onClick={downloadPDF}
        >
          Download PDF
        </button>
      </div>
      <br />
      {/* Filters */}
      <div className="card p-3 mb-4 shadow-sm">
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label">
              <b>Filter by Name:</b>
            </label>
            <input
              type="text"
              className="form-control"
              name="name"
              value={filters.name}
              onChange={handleFilterChange}
              placeholder="Enter guest name..."
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">
              <b>Filter by Rating:</b>
            </label>
            <select
              className="form-control"
              name="rating"
              value={filters.rating}
              onChange={handleFilterChange}
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">
              <b>Filter by Date:</b>
            </label>
            <input
              type="date"
              className="form-control"
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
            />
          </div>
          <div className="col-md-2 d-flex align-items-end">
            <button className="btn btn-secondary w-100" onClick={resetFilters}>
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* TABLE VIEW */}
      {loading ? (
        <div className="text-center">
          <h3>Loading feedbacks...</h3>
        </div>
      ) : error ? (
        <div className="alert alert-danger">
          <h3>Error fetching feedbacks</h3>
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="alert alert-info">
          <h3>No feedbacks found</h3>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="feedback-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Rating</th>
                <th>Category</th>
                <th>Comment</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeedbacks.map((feedback) => (
                <tr key={feedback._id}>
                  <td>{feedback.name}</td> {/* Full name now */}
                  <td>{feedback.userEmail}</td>
                  <td className="text-warning">
                    {getRatingStars(feedback.rating)}
                  </td>
                  <td>{feedback.category}</td>
                  <td>{feedback.comment}</td>
                  <td>
                    {new Date(feedback.createdAt).toLocaleDateString("en-CA")}
                  </td>
                  <td>
                    <button
                      className="delete-button"
                      style={{
                        backgroundColor: "#e74c3c",
                        color: "#fff",
                        border: "none",
                        padding: "5px 10px",
                        borderRadius: "5px",
                        cursor: "pointer",
                      }}
                      onClick={() => handleDelete(feedback._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AllFeedbacks;
