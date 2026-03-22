import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import imageCompression from "browser-image-compression";

function AddRooms() {
  const [roomData, setRoomData] = useState({
    name: "",
    roomType: "",
    description: "",
    location: "",
    occupancy: "",
    bedOptions: "",
    bathrooms: "",
    amenities: [],
    facilities: [],
    size: "",
    view: "",
    mealOptions: "",
    policies: [],
    pricepernight: "",
  });

  // File upload states
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadedPreviews, setUploadedPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);

  const roomTypes = ["Single", "Double", "Suite", "Deluxe", "Family"];
  const bedOptions = [
    "Single Bed",
    "Double Bed",
    "Queen Bed",
    "King Bed",
    "2 Single Beds",
    "2 Double Beds",
  ];
  const bathroomsOptions = ["Shared", "Private"];
  const viewOptions = ["Sea View", "City View", "Garden View", "Mountain View"];
  const mealOptionsList = [
    "Breakfast Only",
    "Half Board",
    "Full Board",
    "All Inclusive",
  ];
  const amenitiesList = ["WiFi", "TV", "Air Conditioning", "Mini Bar", "Safe"];
  const facilitiesList = ["Gym", "Pool", "Spa", "Parking", "Restaurant"];
  const policyOptions = [
    "No Smoking",
    "Smoking Allowed",
    "No Pets",
    "Pets Allowed",
    "No Alcohol",
    "Alcohol Allowed",
  ];

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setRoomData((prevData) => ({
        ...prevData,
        [name]: checked
          ? [...prevData[name], value]
          : prevData[name].filter((item) => item !== value),
      }));
    } else {
      setRoomData((prevData) => ({ ...prevData, [name]: value }));
    }
  };

  // Handle file selection
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);

    const validFiles = [];
    const invalidFiles = [];

    // Limit file count
    if (files.length + uploadedFiles.length > 3) {
      alert("Maximum 3 images allowed");
      return;
    }

    for (let file of files) {
      if (file.size > 5 * 1024 * 1024) {
        invalidFiles.push(`${file.name} (size > 5MB)`);
        continue;
      }

      if (!file.type.startsWith("image/")) {
        invalidFiles.push(`${file.name} (not an image)`);
        continue;
      }

      try {
        // 🔥 Compress image
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        };

        const compressedBlob = await imageCompression(file, options);

        // ✅ Wrap compressed blob into a File so backend sees correct mimetype
        const compressedFile = new File([compressedBlob], file.name, {
          type: compressedBlob.type,
        });

        validFiles.push(compressedFile);
      } catch (err) {
        console.error("Compression error:", err);
        invalidFiles.push(`${file.name} (compression failed)`);
      }
    }

    if (invalidFiles.length > 0) {
      alert(
        `Invalid files:\n${invalidFiles.join(
          "\n",
        )}\n\nPlease upload valid image files under 5MB.`,
      );
    }

    if (validFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...validFiles]);

      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadedPreviews((prev) => [...prev, e.target.result]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeUploadedFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
    setUploadedPreviews(uploadedPreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (roomData.amenities.length === 0) {
      alert("Please select at least one Amenity.");
      return;
    }
    if (roomData.facilities.length === 0) {
      alert("Please select at least one Facility.");
      return;
    }
    if (roomData.policies.length === 0) {
      alert("Please select at least one Policy.");
      return;
    }
    if (uploadedFiles.length === 0) {
      alert("Please upload at least one room image.");
      return;
    }

    setUploading(true);

    const formattedData = {
      ...roomData,
      occupancy: Number(roomData.occupancy),
      size: Number(roomData.size),
      pricepernight: Number(roomData.pricepernight),
    };

    const formData = new FormData();
    formData.append("roomData", JSON.stringify(formattedData));
    uploadedFiles.forEach((file) => formData.append("images", file));

    try {
      const token = localStorage.getItem("token");
      await axios.post("/api/rooms/addroom", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000,
      });
      alert("Room added successfully!");
      navigate("/admin/rooms");
    } catch (error) {
      console.error("Error adding room", error);
      alert(error.response?.data?.message || "Failed to add room");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="room-form">
        <h2>
          <center>
            <b>Add New Room</b>
          </center>
        </h2>

        <input
          type="text"
          name="name"
          placeholder="Room Name"
          onChange={handleChange}
          required
        />

        <select
          name="roomType"
          value={roomData.roomType}
          onChange={handleChange}
          required
          style={{ color: roomData.roomType ? "black" : "gray" }}
        >
          <option value="" disabled hidden>
            Select Room Type
          </option>
          {roomTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <textarea
          name="description"
          placeholder="Description"
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="location"
          placeholder="Location"
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="occupancy"
          placeholder="Occupancy"
          min="1"
          onChange={handleChange}
          required
        />

        <select
          name="bedOptions"
          value={roomData.bedOptions}
          onChange={handleChange}
          required
          style={{ color: roomData.bedOptions ? "black" : "gray" }}
        >
          <option value="" disabled hidden>
            Select Bed Type
          </option>
          {bedOptions.map((bed) => (
            <option key={bed} value={bed}>
              {bed}
            </option>
          ))}
        </select>

        <select
          name="bathrooms"
          value={roomData.bathrooms}
          onChange={handleChange}
          required
          style={{ color: roomData.bathrooms ? "black" : "gray" }}
        >
          <option value="" disabled hidden>
            Select Bathrooms
          </option>
          {bathroomsOptions.map((bath) => (
            <option key={bath} value={bath}>
              {bath}
            </option>
          ))}
        </select>

        <select
          name="view"
          value={roomData.view}
          onChange={handleChange}
          required
          style={{ color: roomData.view ? "black" : "gray" }}
        >
          <option value="" disabled hidden>
            Select View
          </option>
          {viewOptions.map((view) => (
            <option key={view} value={view}>
              {view}
            </option>
          ))}
        </select>

        <select
          name="mealOptions"
          value={roomData.mealOptions}
          onChange={handleChange}
          required
          style={{ color: roomData.mealOptions ? "black" : "gray" }}
        >
          <option value="" disabled hidden>
            Select Meal Option
          </option>
          {mealOptionsList.map((meal) => (
            <option key={meal} value={meal}>
              {meal}
            </option>
          ))}
        </select>

        <input
          type="number"
          name="size"
          min="1"
          placeholder="Room Size (sq ft)"
          onChange={handleChange}
          required
        />

        {/* Amenities */}
        <label>
          <b>Amenities:</b>
        </label>
        <div
          style={{
            display: "flex",
            gap: "30px",
            flexWrap: "wrap",
            marginBottom: "10px",
          }}
        >
          {amenitiesList.map((amenity) => (
            <label
              key={amenity}
              style={{ display: "flex", alignItems: "center", gap: "2px" }}
            >
              <input
                type="checkbox"
                name="amenities"
                value={amenity}
                onChange={handleChange}
              />
              {amenity}
            </label>
          ))}
        </div>

        {/* Facilities */}
        <label>
          <b>Facilities:</b>
        </label>
        <div style={{ display: "flex", gap: "40px", marginBottom: "10px" }}>
          {facilitiesList.map((facility) => (
            <label
              key={facility}
              style={{ display: "flex", alignItems: "center", gap: "2px" }}
            >
              <input
                type="checkbox"
                name="facilities"
                value={facility}
                onChange={handleChange}
              />
              {facility}
            </label>
          ))}
        </div>

        {/* Policies */}
        <label>
          <b>Hotel Policies:</b>
        </label>
        <div
          style={{
            display: "flex",
            gap: "40px",
            marginBottom: "10px",
            flexWrap: "wrap",
          }}
        >
          {policyOptions.map((policy) => (
            <label
              key={policy}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                marginBottom: "5px",
              }}
            >
              <input
                type="checkbox"
                name="policies"
                value={policy}
                onChange={handleChange}
              />
              {policy}
            </label>
          ))}
        </div>

        {/* Image Upload Section */}
        <div className="image-section">
          <label>
            <b>Room Images (Max 3 images):</b>
          </label>
          <div className="image-input-group">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              style={{ marginTop: "10px" }}
            />
            <small
              style={{ display: "block", marginTop: "5px", color: "#666" }}
            >
              Max file size: 5MB per image. Supported formats: JPG, PNG, GIF,
              WebP
            </small>
          </div>

          {/* Uploaded Image Previews */}
          {uploadedPreviews.length > 0 && (
            <div className="uploaded-previews" style={{ marginTop: "15px" }}>
              <label>
                <b>Uploaded Images:</b>
              </label>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  marginTop: "10px",
                }}
              >
                {uploadedPreviews.map((preview, idx) => (
                  <div key={idx} style={{ position: "relative" }}>
                    <img
                      src={preview}
                      alt={`Uploaded ${idx + 1}`}
                      style={{
                        width: "120px",
                        height: "120px",
                        objectFit: "cover",
                        borderRadius: "5px",
                        border: "1px solid #ddd",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeUploadedFile(idx)}
                      style={{
                        position: "absolute",
                        top: "-8px",
                        right: "-8px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "50%",
                        width: "24px",
                        height: "24px",
                        cursor: "pointer",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="input-wrapper">
          <span className="currency-symbol">$</span>
          <input
            type="number"
            name="pricepernight"
            placeholder="Price per Night"
            min="1"
            step="0.01"
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="btn" disabled={uploading}>
          {uploading ? "Adding Room..." : "Add Room"}
        </button>
      </form>

      <style>
        {`
          .image-input-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
            margin-bottom: 10px;
          }
          .preview-image {
            width: 120px;
            height: 120px;
            object-fit: cover;
            border-radius: 5px;
            aspect-ratio: 1 / 1;
          }
        `}
      </style>
    </div>
  );
}

export default AddRooms;
