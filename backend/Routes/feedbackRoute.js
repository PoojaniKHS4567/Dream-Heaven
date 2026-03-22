const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const {
  submitFeedback,
  getAllFeedback,
  deleteFeedback,
} = require("../Controllers/feedbackController");
const adminOnly = require("../middleware/adminOnly");

router.post("/submit", auth, submitFeedback);
router.get("/all", auth, adminOnly, getAllFeedback);
router.delete("/delete/:id", auth, adminOnly, deleteFeedback);

module.exports = router;
