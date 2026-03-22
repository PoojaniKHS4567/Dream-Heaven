const Room = require("../Models/room");
const {
  uploadImage,
  uploadMultipleImages,
  deleteMultipleImages,
} = require("../utils/cloudinary");

/* GET ALL ROOMS */
exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* GET ROOM BY ID */
exports.getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomid);
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ADD ROOM WITH PARALLEL IMAGE UPLOADS */
exports.addRoom = async (req, res) => {
  try {
    const roomData = JSON.parse(req.body.roomData);
    const files = req.files;

    // Validate required fields
    if (!roomData.name || !roomData.roomType || !roomData.pricepernight) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Upload images in parallel
    const uploadedImages = [];
    if (files && files.length > 0) {
      const { uploaded, failed } = await uploadMultipleImages(files, "rooms", {
        width: 800,
        height: 600,
        crop: "limit",
      });

      uploadedImages.push(...uploaded);

      if (failed.length > 0) {
        console.warn(`${failed.length} images failed to upload`);
      }
    }

    // Create room with uploaded image URLs
    const newRoom = new Room({
      ...roomData,
      imageurls: uploadedImages.map((img) => img.url),
      imagePublicIds: uploadedImages.map((img) => img.publicId),
      currentbookings: [],
      occupancy: Number(roomData.occupancy),
      size: Number(roomData.size),
      pricepernight: Number(roomData.pricepernight),
    });

    const saved = await newRoom.save();
    res.status(201).json({
      message: "Room added successfully",
      room: saved,
      uploadStats: {
        total: files?.length || 0,
        uploaded: uploadedImages.length,
      },
    });
  } catch (error) {
    console.error("Error adding room:", error);
    res.status(500).json({ message: error.message });
  }
};

/* UPDATE ROOM WITH PARALLEL IMAGE HANDLING */
exports.updateRoom = async (req, res) => {
  try {
    const { roomid } = req.params;
    const roomData = JSON.parse(req.body.roomData);
    const files = req.files;
    const imagesToKeep = roomData.imagesToKeep || [];

    const existingRoom = await Room.findById(roomid);
    if (!existingRoom) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Delete images that were removed (in parallel)
    const imagesToDelete = existingRoom.imagePublicIds.filter(
      (publicId) => !imagesToKeep.includes(publicId),
    );

    if (imagesToDelete.length > 0) {
      const { deleted, failed } = await deleteMultipleImages(imagesToDelete);
      console.log(`Deleted ${deleted.length} images, ${failed.length} failed`);
    }

    // Upload new images in parallel
    const newImages = [];
    if (files && files.length > 0) {
      const { uploaded, failed } = await uploadMultipleImages(files, "rooms", {
        width: 800,
        height: 600,
        crop: "limit",
      });
      newImages.push(...uploaded);

      if (failed.length > 0) {
        console.warn(`${failed.length} new images failed to upload`);
      }
    }

    // Keep existing images that weren't deleted
    const keptImages = existingRoom.imageurls.filter((_, index) =>
      imagesToKeep.includes(existingRoom.imagePublicIds[index]),
    );
    const keptImageIds = existingRoom.imagePublicIds.filter((id) =>
      imagesToKeep.includes(id),
    );

    // Update room
    const updatedRoom = await Room.findByIdAndUpdate(
      roomid,
      {
        ...roomData,
        imageurls: [...keptImages, ...newImages.map((img) => img.url)],
        imagePublicIds: [
          ...keptImageIds,
          ...newImages.map((img) => img.publicId),
        ],
        occupancy: Number(roomData.occupancy),
        size: Number(roomData.size),
        pricepernight: Number(roomData.pricepernight),
      },
      { new: true },
    );

    res.json({
      message: "Room updated successfully",
      room: updatedRoom,
      uploadStats: {
        total: files?.length || 0,
        uploaded: newImages.length,
        deleted: imagesToDelete.length,
      },
    });
  } catch (error) {
    console.error("Error updating room:", error);
    res.status(500).json({ message: error.message });
  }
};

/* DELETE ROOM WITH IMAGES */
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomid);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Delete all associated images from Cloudinary in parallel
    if (room.imagePublicIds && room.imagePublicIds.length > 0) {
      const { deleted, failed } = await deleteMultipleImages(
        room.imagePublicIds,
      );
      console.log(`Deleted ${deleted.length} images, ${failed.length} failed`);
    }

    await Room.findByIdAndDelete(req.params.roomid);
    res.json({ message: "Room and associated images deleted successfully" });
  } catch (error) {
    console.error("Error deleting room:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getAvailableRooms = async (req, res) => {
  try {
    const { checkindate, checkoutdate } = req.body;

    if (!checkindate || !checkoutdate) {
      return res
        .status(400)
        .json({ message: "Check-in and check-out required" });
    }

    const start = new Date(checkindate);
    const end = new Date(checkoutdate);

    // Find rooms that do NOT have a booking overlapping with selected dates
    const rooms = await Room.find({
      $or: [
        { currentbookings: { $exists: false } },
        {
          currentbookings: {
            $not: {
              $elemMatch: {
                checkindate: { $lt: end },
                checkoutdate: { $gt: start },
              },
            },
          },
        },
      ],
    });

    res.json(rooms);
  } catch (error) {
    console.error("Error fetching available rooms:", error);
    res.status(500).json({ message: error.message });
  }
};
