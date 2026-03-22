const Refund = require("../Models/Refund");

exports.getAllRefunds = async (req, res) => {
  const refunds = await Refund.find();
  res.json(refunds);
};

exports.getRefundById = async (req, res) => {
  const refund = await Refund.findById(req.params.id);

  if (!refund) return res.status(404).json({ message: "Refund not found" });

  res.json(refund);
};

exports.updateRefund = async (req, res) => {
  const updated = await Refund.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  res.json(updated);
};

exports.deleteRefund = async (req, res) => {
  await Refund.findByIdAndDelete(req.params.id);
  res.json({ message: "Refund deleted" });
};
