const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const {
  createBookingPaymentIntent,
  createRefundPaymentIntent,
  confirmBookingPayment,
  confirmRefundPayment,
  getAllPayments,
  stripeWebhook,
} = require("../Controllers/paymentController");

// Webhook endpoint (no auth required)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook,
);

// Protected routes
router.post("/create-booking-payment", auth, createBookingPaymentIntent);
router.post(
  "/create-refund-payment",
  auth,
  adminOnly,
  createRefundPaymentIntent,
);
router.post("/confirm-booking-payment", auth, confirmBookingPayment);
router.post("/confirm-refund-payment", auth, adminOnly, confirmRefundPayment);
router.get("/all", auth, adminOnly, getAllPayments);

module.exports = router;
