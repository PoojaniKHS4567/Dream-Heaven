const express = require("express");
const router = express.Router();
const Feedback = require("../Models/feedback");

// Submit feedback
router.post("/submit", async (req, res) => {
  try {
    const { userId, firstName, userEmail, rating, comment, category } =
      req.body;

    if (!userId || !firstName || !userEmail || !rating || !comment) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    if (comment.length > 500) {
      return res
        .status(400)
        .json({ message: "Comment must be less than 500 characters" });
    }

    const feedback = new Feedback({
      userId,
      firstName,
      userEmail,
      rating,
      comment,
      category: category || "General",
    });

    await feedback.save();
    res.status(201).json({ message: "Feedback submitted successfully" });
  } catch (err) {
    console.error("Feedback submission error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get all feedback (for admin)
router.get("/all", async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Delete feedback (admin only)
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findByIdAndDelete(id);

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    res.json({ message: "Feedback deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
