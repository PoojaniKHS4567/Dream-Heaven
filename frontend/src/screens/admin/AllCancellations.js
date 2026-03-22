import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";

function AllCancellations() {
  const [cancellations, setCancellations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [disabledButtons, setDisabledButtons] = useState({});
  const [filters, setFilters] = useState({
    room: "",
    guest: "",
    checkinStart: "",
    checkinEnd: "",
    cancelledDate: "",
    status: "",
  });

  const fetchCancellations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "/api/cancellations/getallcancellations",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setCancellations(response.data);
      setError(false);
    } catch (err) {
      console.error(err);
      setError(true);
    }
    setLoading(false);
  };

  const updateStatus = async (cancel) => {
    setDisabledButtons((prevState) => ({
      ...prevState,
      [cancel._id]: true,
    }));

    const updatedDisabled = {
      ...JSON.parse(localStorage.getItem("disabledCancellations") || "{}"),
      [cancel._id]: true,
    };
    localStorage.setItem(
      "disabledCancellations",
      JSON.stringify(updatedDisabled),
    );

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/cancellations/updatestatus/${cancel._id}`,
        { status: "cancelled" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      await axios.put(
        `/api/bookings/updatestatus/${cancel.bookingid}`,
        { status: "cancelled" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      fetchCancellations();
      alert("Status updated to 'cancelled'");
    } catch (err) {
      console.error(
        "Error updating status:",
        err.response?.data || err.message,
      );
      alert("Update failed");
    } finally {
      setLoading(false);
    }
  };

  const deleteCancellation = async (id) => {
    if (window.confirm("Are you sure you want to delete this cancellation?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`/api/cancellations/delete/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setCancellations((prev) => prev.filter((c) => c._id !== id));

        const updatedDisabled = { ...disabledButtons };
        delete updatedDisabled[id];
        setDisabledButtons(updatedDisabled);
        localStorage.setItem(
          "disabledCancellations",
          JSON.stringify(updatedDisabled),
        );

        alert("Cancellation deleted.");
      } catch (err) {
        alert("Failed to delete cancellation");
      }
    }
  };

  const calculateDays = (checkInDate, cancelDate) => {
    const checkIn = new Date(checkInDate);
    const cancelled = new Date(cancelDate);
    const timeDiff = checkIn - cancelled;
    const dayDiff = timeDiff / (1000 * 3600 * 24);
    return Math.round(dayDiff);
  };

  useEffect(() => {
    fetchCancellations();
    const savedDisabled = JSON.parse(
      localStorage.getItem("disabledCancellations") || "{}",
    );
    setDisabledButtons(savedDisabled);
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const updatedFilters = { ...filters, [name]: value };

    if (
      name === "checkinStart" &&
      filters.checkinEnd &&
      value > filters.checkinEnd
    ) {
      updatedFilters.checkinEnd = "";
    }

    setFilters(updatedFilters);
  };

  const resetFilters = () => {
    setFilters({
      room: "",
      guest: "",
      checkinStart: "",
      checkinEnd: "",
      cancelledDate: "",
      status: "",
    });
  };

  const filteredCancellations = cancellations.filter((c) => {
    const checkin = new Date(c.checkindate);
    const cancelled = new Date(c.cancelleddate);
    const checkinStart = filters.checkinStart
      ? new Date(filters.checkinStart)
      : null;
    const checkinEnd = filters.checkinEnd ? new Date(filters.checkinEnd) : null;
    const cancelledFilter = filters.cancelledDate
      ? new Date(filters.cancelledDate)
      : null;

    const room = c.room || "";
    const guest = c.user || "";
    const status = c.status || "";
    const filterStatus = filters.status || "";

    return (
      (filters.room === "" ||
        room.toLowerCase().includes(filters.room.toLowerCase())) &&
      (filters.guest === "" ||
        guest.toLowerCase().includes(filters.guest.toLowerCase())) &&
      (!checkinStart || checkin >= checkinStart) &&
      (!checkinEnd || checkin <= checkinEnd) &&
      (!cancelledFilter ||
        cancelled.toDateString() === cancelledFilter.toDateString()) &&
      (filterStatus === "" ||
        status.toLowerCase() === filterStatus.toLowerCase())
    );
  });

  const downloadPDF = async () => {
    if (filteredCancellations.length === 0) {
      alert("No cancellations to include in the PDF report.");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    const title = "All Cancellations Report";
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, 16);

    const cardX = 14;
    const cardWidth = pageWidth - 28;
    const lineHeight = 6;
    const padding = 6;
    const linesPerCard = 17;
    const textHeight = padding * 2 + linesPerCard * lineHeight;
    const totalCardHeight = textHeight + 10;

    for (let i = 0; i < filteredCancellations.length; i++) {
      const cancel = filteredCancellations[i];
      const positionInPage = i % 2;

      const cardY = positionInPage === 0 ? 30 : 30 + totalCardHeight + 10;

      const lines = [
        `Room: ${cancel.room || "N/A"}`,
        `Cancellation ID: ${cancel._id || "N/A"}`,
        `Room ID: ${cancel.roomid || "N/A"}`,
        `Booking ID: ${cancel.bookingid || "N/A"}`,
        `Guest: ${cancel.user || "N/A"}`,
        `User ID: ${cancel.userid || "N/A"}`,
        `Check-in: ${new Date(cancel.checkindate).toLocaleDateString("en-CA")}`,
        `Check-out: ${new Date(cancel.checkoutdate).toLocaleDateString("en-CA")}`,
        `Amount: $${cancel.totalamount || "0.00"}`,
        `Booked Date: ${new Date(cancel.bookeddate).toLocaleDateString("en-CA")}`,
        `Cancelled Date: ${new Date(cancel.cancelleddate).toLocaleString("en-CA")}`,
        `Total Days from check-in to cancelled date: ${calculateDays(cancel.checkindate, cancel.cancelleddate)} days`,
        `Bank: ${cancel.bankName || "N/A"}, ${cancel.branchName || "N/A"}`,
        `Account Holder: ${cancel.accountHolder || "N/A"}`,
        `Account No: ${cancel.bankAccount || "N/A"}`,
        `Status: ${cancel.status === "cancelled" ? "Cancelled" : "Pending Approval"}`,
      ];

      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(cardX, cardY, cardWidth, totalCardHeight);

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Cancellation Details", cardX + padding, cardY + padding + 2);

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      let textY = cardY + padding + 10;
      lines.forEach((line) => {
        doc.text(line, cardX + padding, textY);
        textY += lineHeight;
      });

      if (i % 2 === 1 && i < filteredCancellations.length - 1) {
        doc.addPage();
      }
    }

    doc.save("cancellations_report.pdf");
  };

  return (
    <div className="container mt-2">
      <h1 className="mb-4">
        <b>All Cancellations</b>
      </h1>

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

      <div className="mb-4">
        <div className="row">
          <div className="col-md-2 mb-2">
            <label>
              <b>Guest</b>
            </label>
            <input
              type="text"
              className="form-control"
              name="guest"
              value={filters.guest}
              onChange={handleFilterChange}
            />
          </div>
          <div className="col-md-2 mb-2">
            <label>
              <b>Check-in Start</b>
            </label>
            <input
              type="date"
              className="form-control"
              name="checkinStart"
              value={filters.checkinStart}
              onChange={handleFilterChange}
            />
          </div>
          <div className="col-md-2 mb-2">
            <label>
              <b>Check-in End</b>
            </label>
            <input
              type="date"
              className="form-control"
              name="checkinEnd"
              value={filters.checkinEnd}
              min={filters.checkinStart || ""}
              onChange={handleFilterChange}
            />
          </div>
          <div className="col-md-2 mb-2">
            <label>
              <b>Cancelled Date</b>
            </label>
            <input
              type="date"
              className="form-control"
              name="cancelledDate"
              value={filters.cancelledDate}
              onChange={handleFilterChange}
            />
          </div>
          <div className="col-md-2 mb-2">
            <label>
              <b>Status</b>
            </label>
            <select
              className="form-control"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All</option>
              <option value="pending cancellation">Pending Approval</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div
            className="col-md-2 mb-2 d-flex gap-4"
            style={{ marginTop: "30px" }}
          >
            <button
              className="btn btn-dark w-100"
              style={{
                padding: "2px 4px",
                fontSize: "1rem",
                lineHeight: "1",
                height: "40px",
                minHeight: "unset",
              }}
              onClick={resetFilters}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <h2>Loading...</h2>
      ) : error ? (
        <h2>Error fetching cancellations</h2>
      ) : (
        <div className="row">
          {filteredCancellations.map((cancel) => (
            <div key={cancel._id} className="col-md-6 mb-4">
              <div className="card cancellation-card border border-dark">
                <div className="card-body">
                  <p className="card-text">
                    <h1>Cancellation details</h1>
                    <br />
                    <strong>Cancellation ID:</strong> {cancel._id}
                    <br />
                    <strong>Room:</strong> {cancel.room}
                    <br />
                    <strong>Booking ID:</strong> {cancel.bookingid}
                    <br />
                    <strong>Room ID:</strong> {cancel.roomid}
                    <br />
                    <strong>Guest:</strong> {cancel.user}
                    <br />
                    <strong>User ID:</strong> {cancel.userid}
                    <br />
                    <strong>Check-in:</strong>{" "}
                    {new Date(cancel.checkindate).toLocaleDateString("en-CA")}
                    <br />
                    <strong>Check-out:</strong>{" "}
                    {new Date(cancel.checkoutdate).toLocaleDateString("en-CA")}
                    <br />
                    <strong>Amount:</strong> ${cancel.totalamount}
                    <br />
                    <hr />
                    <strong>Booked Date:</strong>{" "}
                    {new Date(cancel.bookeddate).toLocaleDateString("en-CA")}
                    <br />
                    <strong>Cancelled Date:</strong>{" "}
                    {new Date(cancel.cancelleddate).toLocaleString("en-CA")}
                    <br />
                    <strong>
                      Total Days from check-in to cancelled date:
                    </strong>{" "}
                    {calculateDays(cancel.checkindate, cancel.cancelleddate)}{" "}
                    days
                    <br />
                    <strong>Bank:</strong> {cancel.bankName},{" "}
                    {cancel.branchName}
                    <br />
                    <strong>Account Holder:</strong> {cancel.accountHolder}
                    <br />
                    <strong>Account No.:</strong> {cancel.bankAccount}
                  </p>

                  <span className={`badge status-badge ${cancel.status}`}>
                    {cancel.status === "cancelled"
                      ? "Cancelled"
                      : "Pending Approval"}
                  </span>

                  <div className="button-container mt-3">
                    <button
                      className="update-button1"
                      disabled={
                        cancel.status === "cancelled" ||
                        disabledButtons[cancel._id]
                      }
                      style={{
                        backgroundColor:
                          cancel.status === "cancelled" ||
                          disabledButtons[cancel._id]
                            ? "#808080"
                            : "#28a745",
                        cursor:
                          cancel.status === "cancelled" ||
                          disabledButtons[cancel._id]
                            ? "not-allowed"
                            : "pointer",
                      }}
                      onClick={() => updateStatus(cancel)}
                    >
                      Update Status and continue refund
                    </button>
                    <button
                      className="delete-button1 ms-2"
                      onClick={() => deleteCancellation(cancel._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AllCancellations;
