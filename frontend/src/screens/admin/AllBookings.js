import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import html2canvas from "html2canvas";

function AllBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [filterRoom, setFilterRoom] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const bookingsResponse = await axios.get("/api/bookings/getallbookings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setBookings(bookingsResponse.data);
      setError(false);
    } catch (err) {
      console.error(err);
      setError(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleDelete = async (bookingId) => {
    if (!window.confirm("Are you sure you want to delete this booking?"))
      return;
    try {
      await axios.delete(`/api/bookings/deletebooking/${bookingId}`);
      await fetchBookings();
    } catch (err) {
      console.error("Error deleting booking:", err);
    }
  };

  const isDateInRange = (dateStr) => {
    if (!filterStartDate && !filterEndDate) return true;
    const date = new Date(dateStr);
    const start = filterStartDate ? new Date(filterStartDate) : null;
    const end = filterEndDate ? new Date(filterEndDate) : null;
    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
  };

  const roomsList = [...new Set(bookings.map((b) => b.room))];

  const filteredBookings = bookings.filter((booking) => {
    return (
      (filterRoom === "all" || booking.room === filterRoom) &&
      (filterStatus === "all" || booking.status === filterStatus) &&
      isDateInRange(booking.checkindate)
    );
  });

  const resetFilters = () => {
    setFilterRoom("all");
    setFilterStatus("all");
    setFilterStartDate("");
    setFilterEndDate("");
  };

  const statusCounts = filteredBookings.reduce((acc, booking) => {
    acc[booking.status] = (acc[booking.status] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  const COLORS = ["#28a745", "#dc3545", "#ffc107", "#6c757d"];

  const downloadPDF = async () => {
    if (filteredBookings.length === 0) {
      alert("No bookings to include in the PDF report.");
      return;
    }

    const chartElement = document.getElementById("hidden-pie-chart");
    if (!chartElement) return;

    await new Promise((resolve) => setTimeout(resolve, 500));
    const canvas = await html2canvas(chartElement, { useCORS: true, scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const doc = new jsPDF();
    doc.text("Bookings Report", 14, 16);

    const imgWidth = 80;
    const imgHeight = 80;
    const pageWidth = doc.internal.pageSize.getWidth();
    const x = (pageWidth - imgWidth) / 2;
    const y = 20;

    doc.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);

    let startY = 120;

    filteredBookings.forEach((booking, index) => {
      doc.setFontSize(12);
      doc.setFont("helvetica");

      const cardX = 14;
      const cardY = startY;
      const cardWidth = pageWidth - 28;
      const lineHeight = 6;
      const padding = 5;

      const lines = [
        `Room: ${booking.room}`,
        `Booking ID: ${booking._id}`,
        `Guest: ${booking.user}`,
        `Guest ID: ${booking.userid}`,
        `Check-in: ${booking.checkindate}`,
        `Check-out: ${booking.checkoutdate}`,
        `Amount: $${booking.totalamount}`,
        `Days: ${booking.totaldays}`,
        `Transaction ID: ${booking.transactionId}`,
        `Status: ${booking.status}`,
      ];

      const cardHeight = padding * 2 + lines.length * lineHeight;

      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(cardX, cardY, cardWidth, cardHeight);

      let textY = cardY + padding + 2;
      lines.forEach((line) => {
        doc.text(line, cardX + padding, textY);
        textY += lineHeight;
      });

      startY += cardHeight + 10;

      if (startY > doc.internal.pageSize.height - 30) {
        doc.addPage();
        startY = 20;
      }
    });

    doc.save("bookings_report.pdf");
  };

  return (
    <div className="container mt-5">
      <h1 className="text-center">
        <b>All Bookings</b>
      </h1>
      <br />
      <br />

      <div className="row mb-3">
        <div className="col-md-3">
          <label>Filter by Room:</label>
          <select
            className="form-select"
            value={filterRoom}
            onChange={(e) => setFilterRoom(e.target.value)}
          >
            <option value="all">All</option>
            {roomsList.map((room, idx) => (
              <option key={idx} value={room}>
                {room}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-3">
          <label>Filter by Status:</label>
          <select
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All</option>
            <option value="booked">Booked</option>
            <option value="cancelled">Cancelled</option>
            <option value="pending cancellation">Pending</option>
          </select>
        </div>

        <div className="col-md-3">
          <label>Start Date:</label>
          <input
            type="date"
            className="form-control"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
          />
        </div>

        <div className="col-md-3">
          <label>End Date:</label>
          <input
            type="date"
            className="form-control"
            value={filterEndDate}
            min={filterStartDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
          />
        </div>

        <div className="col-md-12 d-flex justify-content-end mt-3">
          <button className="btn btn-secondary" onClick={resetFilters}>
            Reset Filters
          </button>
        </div>
      </div>

      <h4 className="mt-5">Booking Status Summary</h4>

      <div className="d-flex justify-content-center mb-4">
        <div style={{ width: "400px", height: "300px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="d-flex justify-content-end mb-5">
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

      {/* Hidden chart for PDF */}
      <div
        id="hidden-pie-chart"
        style={{
          position: "absolute",
          left: "-9999px",
          width: "300px",
          height: "300px",
        }}
      >
        <ResponsiveContainer width={300} height={300}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              label
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-pdf-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {loading ? (
        <h2>Loading...</h2>
      ) : error ? (
        <h2>Error fetching bookings</h2>
      ) : (
        <div className="row">
          {filteredBookings.map((booking) => (
            <div className="col-12 col-md-6 mb-4" key={booking._id}>
              <div className="booking-card shadow-sm">
                <h1>
                  <center>Booking details</center>
                </h1>
                <br></br>
                <h5 className="booking-room">{booking.room}</h5>
                <p>
                  <strong>Booking ID:</strong> {booking._id}
                </p>
                <p>
                  <strong>Guest:</strong> {booking.user}
                </p>
                <p>
                  <strong>Guest ID:</strong> {booking.userid}
                </p>
                <p>
                  <strong>Check-in:</strong> {booking.checkindate}
                </p>
                <p>
                  <strong>Check-out:</strong> {booking.checkoutdate}
                </p>
                <p>
                  <strong>Amount:</strong> ${booking.totalamount}
                </p>
                <p>
                  <strong>Days:</strong> {booking.totaldays}
                </p>
                <p>
                  <strong>Transaction ID:</strong> {booking.transactionId}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span className={`badge ${booking.status.replace(" ", "-")}`}>
                    {booking.status}
                  </span>
                </p>
                <button
                  className="btn btn-delete btn-md delete-btn"
                  onClick={() => handleDelete(booking._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AllBookings;
