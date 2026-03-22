import axios from "axios";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import moment from "moment";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Payment from "../screens/Payment";

function Bookingscreen() {
  const { roomid, checkindate, checkoutdate } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const fetchRoom = async () => {
      setLoading(true);
      try {
        const response = await axios.post(
          `http://localhost:5000/api/rooms/getroombyid/${roomid}`,
        );
        setRoom(response.data);
      } catch (err) {
        setError(true);
        toast.error("Error fetching room data");
      }
      setLoading(false);
    };

    fetchRoom();
  }, [roomid]);

  const checkInDate = moment(checkindate, "DD-MM-YYYY");
  const checkOutDate = moment(checkoutdate, "DD-MM-YYYY");
  const totalDays = checkOutDate.diff(checkInDate, "days");
  const totalAmount = totalDays * (room?.pricepernight || 0);

  const proceedToPayment = () => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
      toast.error("You must be logged in to book.");
      navigate("/login");
      return;
    }

    if (!room || !room.pricepernight) {
      toast.error("Room details are missing.");
      return;
    }

    const bookingData = {
      room,
      userid: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      user: `${user.firstName} ${user.lastName}`,
      checkindate: checkInDate.toISOString(),
      checkoutdate: checkOutDate.toISOString(),
      totalamount: totalAmount,
      totaldays: totalDays,
    };

    setBookingDetails(bookingData);
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (paymentIntent, paymentData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/payments/confirm-booking-payment",
        {
          paymentIntentId: paymentIntent.id,
          bookingDetails: bookingDetails,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        setPaymentSuccess(true);
        setShowPayment(false);
        toast.success(response.data.message);
        setTimeout(() => {
          navigate("/bookings");
        }, 2000);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Payment confirmation failed");
    }
  };

  const handlePaymentError = (error) => {
    toast.error("Payment failed: " + error);
    setShowPayment(false);
  };

  if (paymentSuccess) {
    return (
      <div className="container mt-5 text-center">
        <h2 className="text-success">✓ Payment Successful!</h2>
        <p>Your booking has been confirmed.</p>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/bookings")}
        >
          View My Bookings
        </button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#f0f8ff", minHeight: "100vh" }}>
      <ToastContainer position="top-center" />

      {loading ? (
        <h1>Loading...</h1>
      ) : error ? (
        <h1>Error fetching room data</h1>
      ) : room ? (
        <div
          className="container"
          style={{ width: "80%", maxWidth: "800px", padding: "80px" }}
        >
          <div className="row justify-content-center mt-5 bs">
            <div className="col-md-6">
              {room.imageurls?.length > 0 ? (
                <img
                  src={room.imageurls[0]}
                  alt="Room"
                  className="w-100 bigimg"
                  onError={(e) => (e.target.src = "/default-room.jpg")}
                />
              ) : (
                <p>No image available</p>
              )}
            </div>

            <div className="col-md-6" style={{ textAlign: "right" }}>
              <h1>Booking Details</h1>
              <hr />
              <p>
                <strong>Room Name:</strong> {room.name}
              </p>
              <p>
                <strong>Room Type:</strong> {room.roomType}
              </p>
              <p>
                <strong>Occupancy:</strong> {room.occupancy}
              </p>
              <p>
                <strong>Check-in Date:</strong>{" "}
                {checkInDate.format("DD-MM-YYYY")}
              </p>
              <p>
                <strong>Check-out Date:</strong>{" "}
                {checkOutDate.format("DD-MM-YYYY")}
              </p>
              <br />
              <h1>Amount</h1>
              <hr />
              <p>
                <strong>Total Days:</strong> {totalDays}
              </p>
              <p>
                <strong>Price per Night:</strong> ${room.pricepernight}
              </p>
              <p>
                <strong>Total Price:</strong> ${totalAmount}
              </p>
            </div>

            <div>
              <button
                className="btn btn-primary btn-lg"
                onClick={proceedToPayment}
              >
                Pay Now
              </button>
            </div>
          </div>
        </div>
      ) : (
        <h1>No room data available</h1>
      )}

      <Payment
        amount={totalAmount}
        paymentType="booking"
        bookingDetails={bookingDetails}
        isOpen={showPayment}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
        onClose={() => setShowPayment(false)}
      />
    </div>
  );
}

export default Bookingscreen;
