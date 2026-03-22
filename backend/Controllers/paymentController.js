const Stripe = require("stripe");
const Payment = require("../Models/payment");
const Booking = require("../Models/booking");
const Refund = require("../Models/Refund");
const User = require("../Models/user");
const Room = require("../Models/room");
const { sendSMS } = require("../utils/smsService");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Create Payment Intent for Booking
exports.createBookingPaymentIntent = async (req, res) => {
  try {
    const {
      amount,
      currency = "usd",
      bookingDetails,
      reason = "Room Booking",
    } = req.body;
    const userId = req.user.id;

    if (!amount || !bookingDetails) {
      return res
        .status(400)
        .json({ message: "Amount and Booking Details are required" });
    }

    const amountInCents = Math.round(amount * 100);
    const user = await User.findById(userId);

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: userId.toString(),
        userEmail: user.email,
        paymentType: "booking_payment",
        reason: reason,
      },
      receipt_email: user.email,
      description: `Booking Payment - ${reason}`,
    });

    // Save Payment record
    const payment = await Payment.create({
      user: userId,
      amount,
      currency,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      paymentType: "booking_payment",
      reason: reason,
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id,
      paymentIntentId: paymentIntent.id,
      amount: amount,
      currency: currency,
      bookingDetails: bookingDetails,
    });
  } catch (err) {
    console.error("Error creating payment intent:", err);
    res.status(500).json({ message: err.message });
  }
};

// Create Payment Intent for Refund
exports.createRefundPaymentIntent = async (req, res) => {
  try {
    const {
      amount,
      currency = "usd",
      refundId,
      reason = "Refund Processing",
    } = req.body;
    const userId = req.user.id;

    if (!amount || !refundId) {
      return res
        .status(400)
        .json({ message: "Amount and Refund ID are required" });
    }

    const amountInCents = Math.round(amount * 100);
    const user = await User.findById(userId);
    const refund = await Refund.findById(refundId);

    if (!refund) {
      return res.status(404).json({ message: "Refund not found" });
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: userId.toString(),
        userEmail: user.email,
        refundId: refundId,
        paymentType: "refund_payment",
        reason: reason,
      },
      receipt_email: user.email,
      description: `Refund Payment - ${reason}`,
    });

    // Save Payment record
    const payment = await Payment.create({
      user: userId,
      refund: refundId,
      amount,
      currency,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      paymentType: "refund_payment",
      reason: reason,
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id,
      paymentIntentId: paymentIntent.id,
      amount: amount,
      currency: currency,
      refundId: refundId,
    });
  } catch (err) {
    console.error("Error creating refund payment intent:", err);
    res.status(500).json({ message: err.message });
  }
};

// Confirm Booking Payment and Create Booking
// Confirm Booking Payment and Create Booking
exports.confirmBookingPayment = async (req, res) => {
  try {
    const { paymentIntentId, bookingDetails } = req.body;

    console.log("Received confirmBookingPayment request:", req.body);

    // Validate input
    if (!paymentIntentId || !bookingDetails) {
      return res
        .status(400)
        .json({ message: "PaymentIntentId and bookingDetails are required" });
    }

    // Retrieve PaymentIntent from Stripe
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      console.log("Stripe paymentIntent retrieved:", paymentIntent);
    } catch (stripeErr) {
      console.error("Stripe retrieve error:", stripeErr);
      return res.status(500).json({
        message: "Stripe PaymentIntent retrieval failed",
        error: stripeErr.message,
      });
    }

    // Find payment record in DB
    const payment = await Payment.findOne({ paymentIntentId });
    if (!payment) {
      console.error("Payment record not found for ID:", paymentIntentId);
      return res.status(404).json({ message: "Payment record not found" });
    }

    // Check payment status
    if (paymentIntent.status !== "succeeded") {
      console.warn("Payment not succeeded. Status:", paymentIntent.status);
      await Payment.findByIdAndDelete(payment._id);
      return res.status(400).json({
        message: "Payment not successful",
        status: paymentIntent.status,
      });
    }

    // Validate bookingDetails.room
    const {
      room,
      firstName,
      lastName,
      user,
      checkindate,
      checkoutdate,
      totalamount,
      totaldays,
    } = bookingDetails;
    const userid = req.user.id; // <-- use logged-in user ID

    if (!room || !room._id || !room.name) {
      console.error("Invalid room data in bookingDetails:", room);
      return res
        .status(400)
        .json({ message: "Invalid room data in bookingDetails" });
    }

    // Fetch room from DB
    const roomRecord = await Room.findById(room._id);
    if (!roomRecord) {
      console.error("Room not found in DB:", room._id);
      return res.status(404).json({ message: "Room not found in database" });
    }

    // Create new booking
    const newBooking = new Booking({
      room: room.name,
      userid,
      user,
      roomid: room._id,
      checkindate,
      checkoutdate,
      totalamount,
      totaldays,
      payment: payment._id,
      transactionId: paymentIntent.id,
      status: "booked",
    });

    const savedBooking = await newBooking.save();
    console.log("Booking saved:", savedBooking._id);

    // Update payment record
    payment.booking = savedBooking._id;
    payment.status = "succeeded";
    payment.paymentMethod = paymentIntent.payment_method || "card";
    await payment.save();
    console.log("Payment updated with booking ID:", payment._id);

    // Update room current bookings
    roomRecord.currentbookings.push({
      booking_id: savedBooking._id,
      checkindate,
      checkoutdate,
      user: `${firstName} ${lastName}`,
      userid,
      status: "booked",
    });
    await roomRecord.save();
    console.log("Room currentbookings updated:", roomRecord._id);

    return res.json({
      success: true,
      message: "Booking confirmed successfully!",
      booking: savedBooking,
      payment,
    });
  } catch (err) {
    console.error("Confirm Booking Payment Error:", err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
      stack: err.stack,
    });
  }
};
// Confirm Refund Payment and Update Refund
exports.confirmRefundPayment = async (req, res) => {
  try {
    const { paymentIntentId, refundId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const payment = await Payment.findOne({ paymentIntentId });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (paymentIntent.status === "succeeded") {
      // Update refund status to done and set refund date
      const refund = await Refund.findById(refundId);
      if (!refund) {
        return res.status(404).json({ message: "Refund not found" });
      }

      refund.status = "done";
      refund.refundDate = new Date();
      refund.payment = payment._id;
      await refund.save();

      // Update payment with refund reference
      payment.refund = refund._id;
      payment.status = "succeeded";
      payment.paymentMethod = paymentIntent.payment_method;
      await payment.save();

      // Send SMS notification
      const user = await User.findById(refund.userid);
      if (user && user.contactNo) {
        const smsMessage = `Dear ${user.firstName}, your refund of LKR ${refund.amount} for booking ${refund.bookingid} has been processed successfully. Amount will be credited to your bank account (${refund.bankName}) within 3-5 business days. Thank you for choosing Dream Heaven!`;
        sendSMS(user.contactNo, smsMessage).catch((err) => {
          console.error("SMS sending failed:", err);
        });
      }

      res.json({
        success: true,
        message: "Refund processed successfully! SMS notification sent.",
        refund: refund,
        payment: payment,
      });
    } else {
      // Payment failed - delete the payment record
      await Payment.findByIdAndDelete(payment._id);
      res.json({
        success: false,
        message: "Refund payment failed",
        status: paymentIntent.status,
      });
    }
  } catch (err) {
    console.error("Error confirming refund payment:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get All Payments
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("user", "firstName lastName email")
      .populate("booking", "room checkindate checkoutdate totalamount")
      .populate("refund", "amount status refundDate")
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Webhook for Stripe Events
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      await Payment.findOneAndUpdate(
        { paymentIntentId: paymentIntent.id },
        { status: "succeeded" },
        { new: true },
      );
      console.log(`Payment succeeded: ${paymentIntent.id}`);
      break;

    case "payment_intent.payment_failed":
      const failedPayment = event.data.object;
      await Payment.findOneAndUpdate(
        { paymentIntentId: failedPayment.id },
        { status: "failed" },
        { new: true },
      );
      console.log(`Payment failed: ${failedPayment.id}`);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};
