const User = require("../Models/user");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
const { uploadImage, deleteImage } = require("../utils/cloudinary");

/* REGISTER USER */
exports.registerUser = async (req, res) => {
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
      return res.status(400).json({ message: "You must agree to terms." });
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
    res
      .status(201)
      .json({ message: "User registered successfully", user, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* LOGIN USER */
exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user)
      return res.status(400).json({ message: "Invalid username or password." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid username or password." });

    const token = generateToken(user);
    res.json({ message: "Login successful", user, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* UPLOAD PROFILE PHOTO */
exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.profilePhotoId) await deleteImage(user.profilePhotoId);
    const result = await uploadImage(req.file.buffer, "profile_photos", {
      width: 300,
      height: 300,
      crop: "fill",
    });

    user.profilePhoto = result.secure_url;
    user.profilePhotoId = result.public_id;
    await user.save();

    res.json({
      message: "Profile photo updated",
      profilePhoto: result.secure_url,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* UPDATE PROFILE */
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, username, email, contactNo } = req.body;

    const exists = await User.findOne({
      $and: [{ _id: { $ne: req.user.id } }, { $or: [{ username }, { email }] }],
    });
    if (exists)
      return res
        .status(400)
        .json({ message: "Username or email already exists." });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName, username, email, contactNo },
      { new: true },
    );
    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* UPDATE PASSWORD */
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res
        .status(400)
        .json({ message: "Current password is incorrect." });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* DELETE ACCOUNT */
exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.profilePhotoId) await deleteImage(user.profilePhotoId);
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* GET ALL USERS */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false }).select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE a user by admin
exports.deleteUserByAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Safely delete profile photo
    if (user.profilePhotoId) {
      try {
        await deleteImage(user.profilePhotoId);
      } catch (err) {
        console.error("Failed to delete image:", err.message);
      }
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err.message);
    res.status(500).json({ message: "Server error while deleting user" });
  }
};
