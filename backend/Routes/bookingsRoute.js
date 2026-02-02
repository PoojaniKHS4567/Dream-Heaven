const express = require("express");
const router = express.Router();
const Booking = require("../Models/booking");
const Room = require("../Models/room");
const moment = require("moment");
const crypto = require("crypto");

router.post("/bookroom", async (req, res) => {
  try {
    console.log("Incoming booking request:", req.body);

    const {
      room,
      checkindate,
      checkoutdate,
      totalamount,
      totaldays,
      user, // This is the full name string
      userid,
      firstName, // Add these
      lastName, // Add these
    } = req.body;

    // Validate required fields
    if (
      !room ||
      !checkindate ||
      !checkoutdate ||
      !totalamount ||
      !totaldays ||
      !userid ||
      !firstName || // Add validation
      !lastName // Add validation
    ) {
      return res
        .status(400)
        .json({ error: "Missing required fields in request" });
    }

    const transactionId = "TXN" + Date.now();

    // Use the constructed name consistently
    const userName = `${firstName} ${lastName}`;

    const newBooking = new Booking({
      room: room.name,
      roomid: room._id,
      user: userName, // Use constructed name
      userid,
      transactionId,
      checkindate: moment(checkindate).format("YYYY-MM-DD"),
      checkoutdate: moment(checkoutdate).format("YYYY-MM-DD"),
      totalamount,
      totaldays,
    });

    await newBooking.save();

    const roomtemp = await Room.findOne({ _id: room._id });
    roomtemp.currentbookings.push({
      booking_id: newBooking._id,
      checkindate: moment(checkindate).format("YYYY-MM-DD"),
      checkoutdate: moment(checkoutdate).format("YYYY-MM-DD"),
      user: userName, // Use the same constructed name
      userid,
      status: newBooking.status,
    });

    await roomtemp.save();

    res.json({ message: "Room booked successfully", booking: newBooking });
  } catch (error) {
    console.error("Error in bookroom route:", error);
    res.status(400).json({ error: error.message });
  }
});

//Get bookings by userid
router.post("/getbookingsbyuserid", async (req, res) => {
  const userid = req.body.userid;
  console.log("Fetching bookings for userid:", userid); // Add this line
  try {
    const bookings = await Booking.find({ userid: userid });
    res.send(bookings);
  } catch (error) {
    return res.status(400).json({ error });
  }
});

// Route to get all bookings
router.get("/getallbookings", async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.json(bookings);
  } catch (error) {
    return res.status(400).json({ error });
  }
});

// ✅ Delete booking by ID
router.delete("/deletebooking/:bookingid", async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.bookingid);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.json({ message: "Booking deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ✅ Update booking status and remove from room's currentbookings
router.put("/updatestatus/:bookingid", async (req, res) => {
  const { status } = req.body;

  try {
    const booking = await Booking.findById(req.params.bookingid);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Update booking status
    booking.status = status;
    await booking.save();

    // If status is cancelled, remove from room's currentbookings
    if (status === "cancelled") {
      const room = await Room.findById(booking.roomid);
      if (room) {
        room.currentbookings = room.currentbookings.filter(
          (b) => b.booking_id.toString() !== booking._id.toString()
        );
        await room.save();
      }
    }

    res.json({ message: "Booking status updated", booking });
  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
