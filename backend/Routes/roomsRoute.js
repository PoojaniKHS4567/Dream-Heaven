const express = require("express");
const router = express.Router();
const {
  getAllRooms,
  getRoomById,
  addRoom,
  updateRoom,
  deleteRoom,
  getAvailableRooms,
} = require("../Controllers/roomController");
const { uploadMultiple } = require("../middleware/imageUploads");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

// Public routes
router.get("/getallrooms", getAllRooms);
router.post("/getroombyid/:roomid", getRoomById);
router.post("/getavailable", getAvailableRooms);

// Protected admin routes
router.post("/addroom", auth, adminOnly, uploadMultiple("images", 3), addRoom);
router.put(
  "/updateroom/:roomid",
  auth,
  adminOnly,
  uploadMultiple("images", 3),
  updateRoom,
);
router.delete("/deleteroom/:roomid", auth, adminOnly, deleteRoom);

module.exports = router;
