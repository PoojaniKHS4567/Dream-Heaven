const mongoose = require("mongoose");

const bookingSchema = mongoose.Schema(
  {
    room: {
      type: String,
      required: true,
    },
    user: {
      type: String,
      required: true,
    },
    userid: {
      type: String,
      required: true,
    },
    roomid: {
      type: String,
      required: true,
    },
    checkindate: {
      type: String,
      required: true,
    },
    checkoutdate: {
      type: String,
      required: true,
    },
    totalamount: {
      type: Number,
      required: true,
    },
    totaldays: {
      type: Number,
      required: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: false, // Not required initially, set after payment
    },
    status: {
      type: String,
      required: true,
      enum: ["booked", "cancelled"],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("bookings", bookingSchema);
