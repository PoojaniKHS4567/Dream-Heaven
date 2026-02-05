import React, { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.warn("Please enter your name", {
        style: { background: "#ebdfccff", color: "#121212ff" },
      });
      return;
    }
    if (!formData.email.trim()) {
      toast.warn("Please enter your email", {
        style: { background: "#ebdfccff", color: "#121212ff" },
      });
      return;
    }
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(formData.email)) {
      toast.warn("Please enter a valid Gmail address (example@gmail.com)", {
        style: { background: "#ebdfccff", color: "#121212ff" },
      });
      return;
    }
    if (!formData.message.trim()) {
      toast.warn("Please write your message before sending", {
        style: { background: "#ebdfccff", color: "#121212ff" },
      });
      return;
    }

    try {
      // ✅ Send data to backend
      const res = await axios.post(
        "http://localhost:5000/api/contactus/send",
        formData,
      );

      toast.success(res.data.message, {
        style: { background: "#2ecc71", color: "#fff" },
      });

      setFormData({ name: "", email: "", message: "" });
    } catch (err) {
      console.log(err.response?.data || err);
      toast.error(err.response?.data?.message || "Failed to send message", {
        style: { background: "#e74c3c", color: "#fff" },
      });
    }
  };

  return (
    <div
      style={{
        backgroundColor: "rgba(158, 190, 211, 0.6)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        minHeight: "80vh",
        padding: "60px 20px",
        position: "relative",
        zIndex: 0,
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* Dark Overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: "100%",
          width: "100%",
          zIndex: 1,
        }}
      ></div>

      {/* Main Content */}
      <div
        className="container"
        style={{ position: "relative", zIndex: 2, color: "white" }}
      >
        <h2
          className="text-center mb-2"
          style={{ color: "#0d6efd", fontWeight: "bold", marginTop: "20px" }}
        >
          Contact Us
        </h2>

        <br />

        <div className="row g-4">
          {/* Contact Info Box */}
          <div className="col-md-6">
            <h3
              style={{
                color: "black",
                marginBottom: "20px",
                fontSize: "16px",
                fontStyle: "italic",
                fontWeight: 400,
              }}
            >
              If you have any issues, feel free to contact us. We are available{" "}
              <strong>24/7</strong> to help you!
            </h3>

            <div
              style={{
                backgroundImage: "url('/images12.jpg')",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                marginRight: "30px",
                backgroundPosition: "center",
                padding: "20px 20px",
                borderRadius: "15px",
                color: "black",
                minHeight: "80px",
              }}
            >
              <h4
                style={{
                  fontWeight: "bold",
                  fontSize: "26px",
                  marginBottom: "20px",
                }}
              >
                Dream Heaven Hotel
              </h4>
              <p>
                <strong>Address:</strong> 123 Beachside Road, Galle, Sri Lanka
              </p>
              <p>
                <strong>Phone:</strong> +94 77 123 4567
              </p>
              <p>
                <strong>Email:</strong> info@dreamheaven.com
              </p>
              <p>
                <strong>Facebook:</strong>{" "}
                <a
                  href="https://facebook.com/dreamheaven"
                  target="_blank"
                  style={{ color: "blue", textDecoration: "underline" }}
                >
                  facebook.com/dreamheaven
                </a>
              </p>
              <p>
                <strong>Instagram:</strong>{" "}
                <a
                  href="https://instagram.com/dreamheaven"
                  target="_blank"
                  style={{ color: "blue", textDecoration: "underline" }}
                >
                  instagram.com/dreamheaven
                </a>
              </p>
              <p>
                <strong>TikTok:</strong>{" "}
                <a
                  href="https://tiktok.com/@dreamheaven"
                  target="_blank"
                  style={{ color: "blue", textDecoration: "underline" }}
                >
                  tiktok.com/@dreamheaven
                </a>
              </p>
              <p>
                <strong>Hours:</strong> Mon - Sun: 7:00 AM – 10:00 PM
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="col-md-6">
            <div
              style={{
                backgroundColor: "#a1b8ddff",
                borderRadius: "10px",
                padding: "20px",
                color: "#000",
                border: "2px solid #193d79ff",
                minHeight: "430px",
              }}
            >
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="form-label">Your Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={formData.name}
                    onChange={handleChange}
                    style={{ border: "1px solid #ccc" }}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label">Your Email</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleChange}
                    style={{ border: "1px solid #ccc" }}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label">Your Message</label>
                  <textarea
                    name="message"
                    placeholder="Write your message..."
                    className="form-control"
                    rows="4"
                    value={formData.message}
                    onChange={handleChange}
                    style={{ border: "1px solid #ccc" }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    display: "block",
                    margin: "0 auto",
                    width: "50%",
                    fontWeight: "600",
                    borderRadius: "8px",
                  }}
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactUs;
