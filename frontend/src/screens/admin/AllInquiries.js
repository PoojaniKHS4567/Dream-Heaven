import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function AllInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    name: "",
    email: "",
    contactNo: "",
  });

  const API_BASE = "http://localhost:5000/api/contact";
  const token = localStorage.getItem("token");

  // Fetch inquiries from backend
  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const dataWithRead = res.data.map((msg) => ({
        ...msg,
        read: msg.read ?? false,
      }));

      setInquiries(dataWithRead);
    } catch (err) {
      console.error(err.response?.data || err);
      toast.error("Failed to fetch inquiries");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  // Delete inquiry
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this inquiry?"))
      return;

    try {
      await axios.delete(`${API_BASE}/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInquiries((prev) => prev.filter((inq) => inq._id !== id));
      toast.success("Inquiry deleted");
    } catch (err) {
      console.error(err.response?.data || err);
      toast.error("Failed to delete inquiry");
    }
  };

  // ✅ UPDATED FUNCTION (popup + DB update)
  const handleMarkRead = async (id, currentStatus) => {
    const confirmMessage = currentStatus
      ? "Are you marking this as NOT resolved?"
      : "Are you marking this as resolved?";

    if (!window.confirm(confirmMessage)) return;

    try {
      await axios.put(
        `${API_BASE}/update-read/${id}`,
        { read: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      fetchInquiries();
      toast.success("Status updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update read status");
    }
  };

  // ✅ NEW: Filter handler
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  // ✅ NEW: Reset filters
  const resetFilters = () => {
    setFilters({
      name: "",
      email: "",
      contactNo: "",
    });
  };

  // Filtering
  const filteredInquiries = inquiries.filter(
    (inq) =>
      (inq.name?.toLowerCase().includes(filters.name.toLowerCase()) ?? false) &&
      (inq.email?.toLowerCase().includes(filters.email.toLowerCase()) ??
        false) &&
      (inq.contactNo?.includes(filters.contactNo) ?? false),
  );

  return (
    <div className="container mt-8">
      <h2 className="text-center mb-5">
        <b>All Inquiries</b>
      </h2>

      {/* ✅ UPDATED FILTER UI (same as AllFeedbacks) */}
      <div className="card p-3 mb-4 shadow-sm">
        <div className="row g-3">
          <div className="col-md-3">
            <label className="form-label">
              <b>Filter by Name:</b>
            </label>
            <input
              type="text"
              className="form-control"
              name="name"
              value={filters.name}
              onChange={handleFilterChange}
              placeholder="Enter name..."
            />
          </div>

          <div className="col-md-3">
            <label className="form-label">
              <b>Filter by Email:</b>
            </label>
            <input
              type="text"
              className="form-control"
              name="email"
              value={filters.email}
              onChange={handleFilterChange}
              placeholder="Enter email..."
            />
          </div>

          <div className="col-md-3">
            <label className="form-label">
              <b>Filter by Contact No:</b>
            </label>
            <input
              type="text"
              className="form-control"
              name="contactNo"
              value={filters.contactNo}
              onChange={handleFilterChange}
              placeholder="Enter contact..."
            />
          </div>

          <div className="col-md-3 d-flex align-items-end">
            <button className="btn btn-secondary w-100" onClick={resetFilters}>
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <h4>Loading inquiries...</h4>
      ) : filteredInquiries.length === 0 ? (
        <h4>No inquiries found.</h4>
      ) : (
        <table className="inquiries-table">
          <thead>
            <tr>
              <th>Read</th>
              <th>Name</th>
              <th>Email</th>
              <th>Contact No</th>
              <th>Message</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInquiries.map((inq) => (
              <tr key={inq._id} className={inq.read ? "read" : ""}>
                <td>
                  <button
                    className={`tick-button ${inq.read ? "read" : ""}`}
                    onClick={() => handleMarkRead(inq._id, inq.read)}
                  >
                    {inq.read ? "✔️" : "❌"}
                  </button>
                </td>
                <td>{inq.name}</td>
                <td>{inq.email}</td>
                <td>{inq.contactNo}</td>
                <td>{inq.message}</td>
                <td>{new Date(inq.createdAt).toLocaleString()}</td>
                <td>
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(inq._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AllInquiries;
