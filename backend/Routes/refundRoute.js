const express = require("express");
const router = express.Router();

const {
  getAllRefunds,
  getRefundById,
  updateRefund,
  deleteRefund,
} = require("../Controllers/refundController");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

router.get("/getall", auth, adminOnly, getAllRefunds);
router.get("/getbyid/:id", auth, adminOnly, getRefundById);
router.put("/update/:id", auth, adminOnly, updateRefund);
router.delete("/delete/:id", auth, adminOnly, deleteRefund);

module.exports = router;
