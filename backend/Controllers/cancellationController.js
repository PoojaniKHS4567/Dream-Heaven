const Cancellation = require("../Models/cancellation");
const Refund = require("../Models/Refund");

/* CREATE CANCELLATION */
exports.createCancellation = async (req, res) => {
  try {
    const cancellation = new Cancellation(req.body);
    await cancellation.save();

    res.json({ message: "Cancellation recorded successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/* GET ALL */
exports.getAllCancellations = async (req, res) => {
  try {
    const cancellations = await Cancellation.find();
    res.json(cancellations);
  } catch (error) {
    res.status(400).json({ error });
  }
};

/* UPDATE STATUS + CREATE REFUND */
exports.updateCancellationStatus = async (req, res) => {
  try {
    const cancellation = await Cancellation.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true },
    );

    if (!cancellation) {
      return res.status(404).json({ message: "Cancellation not found" });
    }

    if (req.body.status === "cancelled") {
      const refund = new Refund({
        cancellationid: cancellation._id,
        user: "User1",
        userid: "manualUser123",
        room: cancellation.room,
        bookingid: cancellation.bookingid,
        cancelApprovedDate: new Date(),
        amount: cancellation.totalamount,
        refundDate: new Date(),
        bankName: cancellation.bankName,
        branch: cancellation.branchName,
        bankHolderName: cancellation.accountHolder,
        accountNo: cancellation.bankAccount,
        status: "pending",
      });

      await refund.save();
    }

    res.json(cancellation);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* DELETE */
exports.deleteCancellation = async (req, res) => {
  try {
    const result = await Cancellation.findByIdAndDelete(req.params.id);

    if (!result)
      return res.status(404).json({ message: "Cancellation not found" });

    res.json({ message: "Cancellation deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
