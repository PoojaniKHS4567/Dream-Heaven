const express = require("express");
const router = express.Router();
const User = require("../Models/user");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const generateToken = require("../utils/generateToken");
const auth = require("../middleware/auth");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      username,
      email,
      contactNo,
      password,
      confirmPassword,
      agree,
    } = req.body;

    if (!agree)
      return res.status(400).json({ message: "You must agree to the terms." });

    if (
      !firstName ||
      !lastName ||
      !username ||
      !email ||
      !contactNo ||
      !password ||
      !confirmPassword
    )
      return res.status(400).json({ message: "All fields are required." });

    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match." });

    const exists = await User.findOne({ $or: [{ username }, { email }] });
    if (exists)
      return res
        .status(400)
        .json({ message: "Username or email already exists." });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      username,
      email,
      contactNo,
      password: hashedPassword,
      isAdmin: false,
    });

    await user.save();

    const token = generateToken(user);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id.toString(),
        _id: user._id,
        username: user.username,
        isAdmin: user.isAdmin,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user)
      return res.status(400).json({ message: "Invalid username or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid username or password" });

    const token = generateToken(user);

    res.json({
      message: "Login successful",
      user: {
        id: user._id.toString(),
        _id: user._id,
        username: user.username,
        isAdmin: user.isAdmin,
        email: user.email,
        contactNo: user.contactNo,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePhoto: user.profilePhoto,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Upload profile photo (simplified version)
router.post(
  "/upload-photo",
  auth,
  upload.single("profilePhoto"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const base64Image = `data:${
        req.file.mimetype
      };base64,${req.file.buffer.toString("base64")}`;

      const user = await User.findByIdAndUpdate(
        req.user.id, // ← from token
        { profilePhoto: base64Image },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: "Profile photo updated successfully",
        profilePhoto: base64Image,
      });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// Update profile
router.put("/update-profile", auth, async (req, res) => {
  try {
    const { firstName, lastName, username, email, contactNo } = req.body;

    // Check if username or email already exists (excluding current user)
    const existingUser = await User.findOne({
      $and: [{ _id: { $ne: req.user.id } }, { $or: [{ username }, { email }] }],
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username or email already exists" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        firstName,
        lastName,
        username,
        email,
        contactNo,
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id.toString(),
        _id: user._id,
        username: user.username,
        isAdmin: user.isAdmin,
        email: user.email,
        contactNo: user.contactNo,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePhoto: user.profilePhoto,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update password
router.post("/update-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id); // from token
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Current password is incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Delete account
router.delete("/delete-account", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndDelete(req.user.id);

    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
