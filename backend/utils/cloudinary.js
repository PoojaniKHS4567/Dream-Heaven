const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 60000, // 60 seconds timeout
});

// Optimized parallel upload function
const uploadImage = (fileBuffer, folder, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: folder,
      width: options.width || 800,
      height: options.height || 600,
      crop: "limit",
      quality: "auto:good", // Better quality vs speed balance
      format: "webp", // Convert to WebP for smaller file size
      ...options,
    };

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
    stream.end(fileBuffer);
  });
};

// Upload multiple images in parallel
const uploadMultipleImages = async (files, folder, options = {}) => {
  const uploadPromises = files.map((file) =>
    uploadImage(file.buffer, folder, options),
  );
  const results = await Promise.allSettled(uploadPromises);

  const uploaded = [];
  const failed = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      uploaded.push({
        url: result.value.secure_url,
        publicId: result.value.public_id,
      });
    } else {
      console.error(`Failed to upload image ${index + 1}:`, result.reason);
      failed.push({ index, error: result.reason });
    }
  });

  return { uploaded, failed };
};

// Helper function to delete image
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    throw error;
  }
};

// Helper function to delete multiple images in parallel
const deleteMultipleImages = async (publicIds) => {
  try {
    const deletePromises = publicIds.map((id) => deleteImage(id));
    const results = await Promise.allSettled(deletePromises);

    const deleted = [];
    const failed = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        deleted.push(publicIds[index]);
      } else {
        console.error(
          `Failed to delete image ${publicIds[index]}:`,
          result.reason,
        );
        failed.push({ id: publicIds[index], error: result.reason });
      }
    });

    return { deleted, failed };
  } catch (error) {
    console.error("Error deleting multiple images:", error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  deleteMultipleImages,
};
