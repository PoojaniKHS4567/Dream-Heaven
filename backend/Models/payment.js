const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: false,
    },
    refund: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Refund",
      required: false,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "usd",
    },
    paymentIntentId: {
      type: String,
      required: true,
      unique: true, // Stripe payment intents are unique
    },
    clientSecret: {
      type: String,
      required: true,
    },
    paymentType: {
      type: String,
      enum: ["booking_payment", "refund_payment"],
      default: "booking_payment",
    },
    reason: {
      type: String,
      required: false,
      default: "",
    },
    paymentMethod: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Payment", paymentSchema);
