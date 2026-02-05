const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      maxlength: 500,
    },
    category: {
      type: String,
      enum: ["General", "Service", "Rooms", "Staff", "Facilities"],
      default: "General",
    },
  },
  { timestamps: true, strict: true },
);

const Feedback = mongoose.model("Feedback", feedbackSchema);

module.exports = Feedback;
