const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const {
  sendMessage,
  getAllMessages,
  deleteMessage,
  updateReadStatus,
} = require("../Controllers/contactController");
const adminOnly = require("../middleware/adminOnly");

router.post("/send", sendMessage);
router.get("/all", auth, adminOnly, getAllMessages);
router.delete("/delete/:id", auth, adminOnly, deleteMessage);
router.put("/update-read/:id", auth, adminOnly, updateReadStatus);

module.exports = router;
