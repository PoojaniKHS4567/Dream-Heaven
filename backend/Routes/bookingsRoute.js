const express = require("express");
const router = express.Router();

const {
  bookRoom,
  getBookingsByUserId,
  getAllBookings,
  deleteBooking,
  updateBookingStatus,
} = require("../Controllers/bookingController");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

/* -------- ROUTES -------- */

// Get bookings by user
router.get("/getbookingsbyuserid", auth, getBookingsByUserId);

// Get all bookings
router.get("/getallbookings", auth, adminOnly, getAllBookings);

// Delete booking
router.delete("/deletebooking/:bookingid", auth, deleteBooking);

// Update booking status
router.put("/updatestatus/:bookingid", auth, updateBookingStatus);

module.exports = router;
