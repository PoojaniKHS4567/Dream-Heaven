import React, { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import profileImg from "../.././assets/profile.jpeg"; // Correct path

function AllUsers() {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/users/all-users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Delete user
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`/api/users/delete/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("User deleted successfully!");
        fetchUsers(); // Important! refresh user list after each deletion
      } catch (err) {
        console.error("Error deleting user:", err);
        alert(err.response?.data?.message || "Failed to delete user");
      }
    }
  };

  // Filters
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const resetFilters = () => {
    setFilters({ firstName: "", lastName: "", email: "" });
  };

  const filteredUsers = users.filter((user) => {
    const firstNameMatch =
      user.firstName?.toLowerCase().includes(filters.firstName.toLowerCase()) ??
      false;
    const lastNameMatch =
      user.lastName?.toLowerCase().includes(filters.lastName.toLowerCase()) ??
      false;
    const emailMatch =
      user.email?.toLowerCase().includes(filters.email.toLowerCase()) ?? false;

    return firstNameMatch && lastNameMatch && emailMatch;
  });

  // Generate PDF
  const downloadPDF = () => {
    if (filteredUsers.length === 0) {
      alert("No users to include in the PDF report.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("All Users Report", 14, 16);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 25);

    // Prepare table data (we’ll leave first column empty for images)
    const tableData = filteredUsers.map((user) => [
      "", // placeholder for profile photo
      user.firstName,
      user.lastName,
      user.email,
      user.contactNo,
    ]);

    autoTable(doc, {
      head: [["Profile", "First Name", "Last Name", "Email", "Contact"]],
      body: tableData,
      startY: 30,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: {
        fillColor: [106, 66, 193],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      didDrawCell: (data) => {
        // Only add image in body, first column
        if (data.column.index === 0 && data.cell.section === "body") {
          const user = filteredUsers[data.row.index];
          const img = user.profilePhoto || profileImg;

          const imgProps = doc.getImageProperties(img);
          const cellWidth = data.cell.width;
          const cellHeight = data.cell.height;
          const ratio = Math.min(
            cellWidth / imgProps.width,
            cellHeight / imgProps.height,
          );

          // center image in cell
          const xOffset =
            data.cell.x + (cellWidth - imgProps.width * ratio) / 2;
          const yOffset =
            data.cell.y + (cellHeight - imgProps.height * ratio) / 2;

          doc.addImage(
            img,
            "JPEG",
            xOffset,
            yOffset,
            imgProps.width * ratio,
            imgProps.height * ratio,
          );
        }
      },
    });

    doc.save("users_report.pdf");
  };
  return (
    <div className="container mt-8">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-5" style={{ flex: 1, textAlign: "center" }}>
          <b>All Users</b>
        </h1>
        <button className="pdf-btn" onClick={downloadPDF}>
          Download PDF
        </button>
      </div>

      {/* Filters */}
      <div className="card p-3 mb-4 shadow-sm">
        <div className="row g-3">
          <div className="col-md-3">
            <label className="form-label">
              <b>Filter by First Name:</b>
            </label>
            <input
              type="text"
              className="form-control"
              name="firstName"
              value={filters.firstName}
              onChange={handleFilterChange}
              placeholder="Enter first name..."
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">
              <b>Filter by Last Name:</b>
            </label>
            <input
              type="text"
              className="form-control"
              name="lastName"
              value={filters.lastName}
              onChange={handleFilterChange}
              placeholder="Enter last name..."
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
          <div className="col-md-3 d-flex align-items-end">
            <button className="btn btn-secondary w-100" onClick={resetFilters}>
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="users-table">
          <thead>
            <tr>
              <th>Profile</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Email</th>
              <th>Contact</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user._id}>
                <td>
                  <img
                    src={user.profilePhoto || profileImg}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="profile-photo"
                  />
                </td>
                <td>{user.firstName}</td>
                <td>{user.lastName}</td>
                <td>{user.email}</td>
                <td>{user.contactNo}</td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(user._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AllUsers;
