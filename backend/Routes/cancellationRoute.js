const express = require("express");
const router = express.Router();

const {
  createCancellation,
  getAllCancellations,
  updateCancellationStatus,
  deleteCancellation,
} = require("../Controllers/cancellationController");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

router.post("/createcancellation", auth, createCancellation);
router.get("/getallcancellations", auth, adminOnly, getAllCancellations);
router.put("/updatestatus/:id", auth, adminOnly, updateCancellationStatus);
router.delete("/delete/:id", auth, adminOnly, deleteCancellation);

module.exports = router;
