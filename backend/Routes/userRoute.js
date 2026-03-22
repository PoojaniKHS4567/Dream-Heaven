const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  uploadProfilePhoto,
  updateProfile,
  updatePassword,
  deleteAccount,
  getAllUsers,
  deleteUserByAdmin,
} = require("../Controllers/userController");

const auth = require("../middleware/auth");
const { uploadSingle } = require("../middleware/imageUploads");
const adminOnly = require("../middleware/adminOnly");

// Public
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected (User & Admin)
router.post(
  "/upload-photo",
  auth,
  uploadSingle("profilePhoto"),
  uploadProfilePhoto,
);
router.put("/update-profile", auth, updateProfile);
router.post("/update-password", auth, updatePassword);
router.delete("/delete-account", auth, deleteAccount);
router.get("/all-users", auth, adminOnly, getAllUsers);
router.delete("/delete/:id", auth, adminOnly, deleteUserByAdmin);

module.exports = router;
