const Booking = require("../Models/booking");
const Room = require("../Models/room");
const mongoose = require("mongoose");

// ---------------- GET BOOKINGS BY USER ----------------
exports.getBookingsByUserId = async (req, res) => {
  try {
    const userId = req.params.id;
    console.log("Fetching bookings for user:", userId);

    // Query directly as string
    const bookings = await Booking.find({ userid: userId }).populate("payment");

    console.log("Bookings fetched:", bookings.length);
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- GET ALL BOOKINGS (ADMIN) ----------------
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate("room").populate("payment");

    res.json(bookings);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ---------------- DELETE BOOKING ----------------
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.bookingid);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    res.json({ message: "Booking deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ---------------- UPDATE STATUS ----------------
exports.updateBookingStatus = async (req, res) => {
  const { status } = req.body;

  try {
    const booking = await Booking.findById(req.params.bookingid);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = status;
    await booking.save();

    // Remove booking from room if cancelled
    if (status === "cancelled") {
      const room = await Room.findById(booking.roomid);
      if (room) {
        room.currentbookings = room.currentbookings.filter(
          (b) => b.booking_id.toString() !== booking._id.toString(),
        );
        await room.save();
      }
    }

    res.json({ message: "Booking status updated", booking });
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({ message: "Server error" });
  }
};
