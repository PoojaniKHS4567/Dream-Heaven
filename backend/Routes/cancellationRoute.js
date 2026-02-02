const express = require('express');
const router = express.Router();
const Cancellation = require('../Models/cancellation');
const Refund = require("../Models/Refund");

//add cancellations
router.post('/createcancellation', async (req, res) => {
    try {
      const cancellation = new Cancellation(req.body);
      await cancellation.save();
      res.send("Cancellation recorded successfully");
    } catch (err) {
      console.error(err); // Make sure you log errors
      res.status(400).json({ error: err.message });
    }
  });
  

// get all cancellations
router.get("/getallcancellations", async (req, res) => {
    try {
      const cancellations = await Cancellation.find();
      res.json(cancellations);  // Sends cancellations data to the frontend
    } catch (error) {
      res.status(400).json({ error });
    }
  });

  /// PUT /api/cancellations/updatestatus/:id


// Update cancellation status
router.put("/updatestatus/:id", async (req, res) => {
  try {
    const cancellation = await Cancellation.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!cancellation) return res.status(404).json({ message: "Cancellation not found" });

    // After status update, create refund entry
    // Manually assigned values
    const user = "User1";
    const userid = "manualUser123"; // Replace with real user ID if needed  

    if (req.body.status === "cancelled") {
      const refund = new Refund({
        cancellationid: cancellation._id,
        user:user,
        userid:userid, 
        room:cancellation.room,
        bookingid: cancellation.bookingid,
        cancelApprovedDate: new Date(),
        amount: cancellation.totalamount,
        refundDate: new Date(),
        bankName: cancellation.bankName,
        branch: cancellation.branchName,
        bankHolderName: cancellation.accountHolder,
        accountNo: cancellation.bankAccount,
        status: "pending"
      });

      await refund.save();
    }

    res.json(cancellation);
  } catch (err) {
    console.error("Error updating cancellation:", err);
    res.status(500).json({ message: "Server error" });
  }
});

  
  

 // DELETE /api/cancellations/delete/:id
router.delete("/delete/:id", async (req, res) => {
    try {
      const result = await Cancellation.findByIdAndDelete(req.params.id);
      if (!result) return res.status(404).send("Cancellation not found");
      res.send("Cancellation deleted");
    } catch (err) {
      res.status(500).send("Server error");
    }
  });
  
   

module.exports = router;
