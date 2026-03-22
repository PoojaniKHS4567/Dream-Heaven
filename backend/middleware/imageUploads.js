const multer = require("multer");
const path = require("path");

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter for images only
const allowedMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/x-png",
];

const fileFilter = (req, file, cb) => {
  const extname = /\.(jpeg|jpg|png|gif|webp)$/i.test(file.originalname);

  if (allowedMimeTypes.includes(file.mimetype) && extname) {
    cb(null, true);
  } else {
    console.log("Rejected file:", file.originalname, file.mimetype); // debug
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
  }
};
// Configure multer with increased limits for better performance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Increase to 10MB for better quality
    files: 5, // Max 5 files
    fieldSize: 10 * 1024 * 1024, // Increase field size
  },
  fileFilter: fileFilter,
});

// Middleware for multiple file upload
const uploadMultiple = (fieldName, maxCount = 5) =>
  upload.array(fieldName, maxCount);

// Middleware for single file upload
const uploadSingle = (fieldName) => upload.single(fieldName);

module.exports = {
  uploadMultiple,
  uploadSingle,
};
