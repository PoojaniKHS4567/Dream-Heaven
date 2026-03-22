import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import { toast } from "react-toastify";
import Payment from "../../screens/Payment";

function Refunds() {
  const [refunds, setRefunds] = useState([]);
  const [filteredRefunds, setFilteredRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [filters, setFilters] = useState({
    guest: "",
    amount: "",
    bank: "",
    holder: "",
    accountNo: "",
    status: "",
  });

  const navigate = useNavigate();

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/refunds/getall", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRefunds(res.data);
      setFilteredRefunds(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch refunds:", err);
      setError(true);
      setLoading(false);
    }
  };

  const deleteRefund = async (id) => {
    if (window.confirm("Delete this refund?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`/api/refunds/delete/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchRefunds();
        toast.success("Refund deleted successfully");
      } catch (err) {
        console.error("Failed to delete refund:", err);
        toast.error("Failed to delete refund");
      }
    }
  };

  const goToUpdatePage = (id) => {
    navigate(`/admin/updaterefund/${id}`);
  };

  // Process Refund Payment
  const processRefundPayment = (refund) => {
    if (refund.status === "done") {
      toast.info("This refund has already been processed");
      return;
    }
    setSelectedRefund(refund);
    setShowPayment(true);
  };

  const handleRefundPaymentSuccess = async (paymentIntent, paymentData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/payments/confirm-refund-payment",
        {
          paymentIntentId: paymentIntent.id,
          refundId: selectedRefund._id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        toast.success(response.data.message);
        fetchRefunds(); // Refresh the list
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error confirming refund payment:", error);
      toast.error("Refund payment confirmation failed");
    }
    setShowPayment(false);
    setSelectedRefund(null);
  };

  const handleRefundPaymentError = (error) => {
    toast.error("Refund payment failed: " + error);
    setShowPayment(false);
    setSelectedRefund(null);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const applyFilters = () => {
    let filtered = refunds.filter((r) => {
      return (
        r.user.toLowerCase().includes(filters.guest.toLowerCase()) &&
        (filters.amount === "" || r.amount.toString() === filters.amount) &&
        r.bankName.toLowerCase().includes(filters.bank.toLowerCase()) &&
        r.bankHolderName.toLowerCase().includes(filters.holder.toLowerCase()) &&
        r.accountNo.toLowerCase().includes(filters.accountNo.toLowerCase()) &&
        r.status.toLowerCase().includes(filters.status.toLowerCase())
      );
    });
    setFilteredRefunds(filtered);
  };

  const resetFilters = () => {
    setFilters({
      guest: "",
      amount: "",
      bank: "",
      holder: "",
      accountNo: "",
      status: "",
    });
    setFilteredRefunds(refunds);
  };

  const downloadPDF = async () => {
    if (filteredRefunds.length === 0) {
      alert("No refunds to include in the PDF report.");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    const title = "All Refunds Report";
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, 16);

    let yPosition = 30;
    const cardX = 14;
    const cardWidth = pageWidth - 28;
    const lineHeight = 6;
    const padding = 6;

    for (let i = 0; i < filteredRefunds.length; i++) {
      const refund = filteredRefunds[i];

      const lines = [
        `Refund ID: ${refund._id}`,
        `Guest: ${refund.user}`,
        `Guest ID: ${refund.userid}`,
        `Booking ID: ${refund.bookingid}`,
        `Room: ${refund.room}`,
        `Amount: $${refund.amount}`,
        `Refund Date: ${
          refund.refundDate
            ? new Date(refund.refundDate).toLocaleDateString("en-CA")
            : "Pending"
        }`,
        `Bank: ${refund.bankName}`,
        `Branch: ${refund.branch || "N/A"}`,
        `Holder: ${refund.bankHolderName}`,
        `Account No: ${refund.accountNo}`,
        `Status: ${refund.status === "done" ? "Completed" : "Pending"}`,
      ];

      const textHeight = padding * 2 + lines.length * lineHeight;
      const totalCardHeight = textHeight + 20;

      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(cardX, yPosition, cardWidth, totalCardHeight);

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Refund Details", cardX + padding, yPosition + padding + 2);

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      let textY = yPosition + padding + 10;
      lines.forEach((line) => {
        doc.text(line, cardX + padding, textY);
        textY += lineHeight;
      });

      yPosition += totalCardHeight + 10;

      if (yPosition > doc.internal.pageSize.height - 40) {
        doc.addPage();
        yPosition = 20;
      }
    }

    doc.save("refunds_report.pdf");
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, refunds]);

  return (
    <div className="container px-3">
      <div className="d-flex justify-content-between align-items-center">
        <h1>
          <b>All Refunds</b>
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
      </div>

      <div className="card p-3 mb-4 shadow-sm">
        <div className="row g-2">
          <div className="col-md-2">
            <input
              type="text"
              className="form-control"
              name="guest"
              value={filters.guest}
              onChange={handleFilterChange}
              placeholder="Guest"
            />
          </div>
          <div className="col-md-2">
            <input
              type="text"
              className="form-control"
              name="amount"
              value={filters.amount}
              onChange={handleFilterChange}
              placeholder="Refund Amount"
            />
          </div>
          <div className="col-md-2">
            <input
              type="text"
              className="form-control"
              name="bank"
              value={filters.bank}
              onChange={handleFilterChange}
              placeholder="Bank"
            />
          </div>
          <div className="col-md-2">
            <input
              type="text"
              className="form-control"
              name="holder"
              value={filters.holder}
              onChange={handleFilterChange}
              placeholder="Bank Holder"
            />
          </div>
          <div className="col-md-2">
            <input
              type="text"
              className="form-control"
              name="accountNo"
              value={filters.accountNo}
              onChange={handleFilterChange}
              placeholder="Account No"
            />
          </div>
          <div className="col-md-2">
            <select
              className="form-control"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>
        <div className="mt-3">
          <button className="btn btn-secondary me-2" onClick={resetFilters}>
            Reset Filters
          </button>
        </div>
      </div>

      {loading ? (
        <h3>Loading...</h3>
      ) : error ? (
        <h3>Error fetching refunds</h3>
      ) : (
        <div id="refunds-section" className="row">
          {filteredRefunds.map((r) => (
            <div
              key={r._id}
              className="col-md-6 d-flex"
              style={{ marginBottom: "60px" }}
            >
              <div
                className="card flex-fill shadow-sm border border-dark"
                style={{ minHeight: "350px", marginRight: "40px" }}
              >
                <div className="card-body d-flex flex-column justify-content-between">
                  <div>
                    <h5 className="text-center">
                      <b>Refund details</b>
                    </h5>
                    <br></br>
                    <p className="card-text">
                      <b>Refund ID:</b> {r._id}
                      <br />
                      <b>Guest:</b> {r.user}
                      <br />
                      <b>Guest ID:</b> {r.userid}
                      <br />
                      <b>Booking ID:</b> {r.bookingid}
                      <br />
                      <b>Room:</b> {r.room}
                      <br />
                      <b>Amount:</b> ${r.amount}
                      <br />
                      <b>Refund Date:</b>{" "}
                      {r.refundDate
                        ? new Date(r.refundDate).toLocaleDateString("en-CA")
                        : "Pending"}
                      <br />
                      <b>Bank:</b> {r.bankName}
                      <br />
                      <b>Branch:</b> {r.branch}
                      <br />
                      <b>Holder:</b> {r.bankHolderName}
                      <br />
                      <b>Account No:</b> {r.accountNo}
                      <br />
                      <b>Status:</b>{" "}
                      <span
                        className={`badge ${
                          r.status === "done" ? "bg-success" : "bg-warning"
                        }`}
                      >
                        {r.status === "done" ? "Completed" : "Pending"}
                      </span>
                    </p>
                  </div>
                  <div className="d-flex justify-content-end mt-3">
                    <button
                      onClick={() => processRefundPayment(r)}
                      className="btn btn-warning me-2"
                      disabled={r.status === "done"}
                    >
                      {r.status === "done" ? "Refunded" : "Refund Now"}
                    </button>
                    <button
                      onClick={() => goToUpdatePage(r._id)}
                      className="btn btn-update me-2"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => deleteRefund(r._id)}
                      className="btn btn-delete me-2"
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

      {/* Payment Modal for Refund */}
      <Payment
        amount={selectedRefund?.amount}
        paymentType="refund"
        refundId={selectedRefund?._id}
        isOpen={showPayment}
        onSuccess={handleRefundPaymentSuccess}
        onError={handleRefundPaymentError}
        onClose={() => setShowPayment(false)}
      />
    </div>
  );
}

export default Refunds;
