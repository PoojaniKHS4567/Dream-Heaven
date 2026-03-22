const Feedback = require("../Models/feedback");

exports.submitFeedback = async (req, res) => {
  try {
    const { userId, name, userEmail, rating, comment, category } = req.body;

    if (!userId || !name || !userEmail || !rating || !comment) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const feedback = new Feedback({
      userId,
      name,
      userEmail,
      rating,
      comment,
      category: category || "General",
    });

    await feedback.save();
    res.status(201).json({ message: "Feedback submitted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllFeedback = async (req, res) => {
  const data = await Feedback.find().sort({ createdAt: -1 });
  res.json(data);
};

exports.deleteFeedback = async (req, res) => {
  await Feedback.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted successfully" });
};
