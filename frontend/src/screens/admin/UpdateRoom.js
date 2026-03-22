import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

function UpdateRoom() {
  const { roomid } = useParams();
  const navigate = useNavigate();

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

  // Image states
  const [existingImages, setExistingImages] = useState([]); // URLs of existing images
  const [existingImagePublicIds, setExistingImagePublicIds] = useState([]); // Public IDs for deletion
  const [newFiles, setNewFiles] = useState([]); // New files to upload
  const [newPreviews, setNewPreviews] = useState([]); // Previews of new files
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFiles, setUploadingFiles] = useState([]);

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

  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        const response = await axios.post(`/api/rooms/getroombyid/${roomid}`);
        if (response.data) {
          setRoomData({
            name: response.data.name || "",
            roomType: response.data.roomType || "",
            description: response.data.description || "",
            location: response.data.location || "",
            occupancy: response.data.occupancy || "",
            bedOptions: response.data.bedOptions || "",
            bathrooms: response.data.bathrooms || "",
            amenities: response.data.amenities || [],
            facilities: response.data.facilities || [],
            size: response.data.size || "",
            view: response.data.view || "",
            mealOptions: response.data.mealOptions || "",
            policies: response.data.policies || [],
            pricepernight: response.data.pricepernight || "",
          });

          // Store existing images
          setExistingImages(response.data.imageurls || []);
          setExistingImagePublicIds(response.data.imagePublicIds || []);
        }
      } catch (error) {
        console.error("Error fetching room details:", error);
        alert("Failed to fetch room details");
      } finally {
        setLoading(false);
      }
    };

    fetchRoomDetails();
  }, [roomid]);

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

  // Remove existing image
  const removeExistingImage = (index) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
    setExistingImagePublicIds(
      existingImagePublicIds.filter((_, i) => i !== index),
    );
  };

  // Handle new file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);

    // Validate each file
    const validFiles = [];
    const invalidFiles = [];

    // Check total number of files (existing + new should not exceed 5)
    const totalImages = existingImages.length + newFiles.length + files.length;
    if (totalImages > 5) {
      alert(
        `Maximum 5 images allowed. You currently have ${existingImages.length + newFiles.length} images.`,
      );
      return;
    }

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        invalidFiles.push(`${file.name} (size > 5MB)`);
      } else if (!file.type.startsWith("image/")) {
        invalidFiles.push(`${file.name} (not an image)`);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      alert(
        `Invalid files:\n${invalidFiles.join("\n")}\n\nPlease upload image files under 5MB each.`,
      );
    }

    if (validFiles.length > 0) {
      setNewFiles([...newFiles, ...validFiles]);

      // Create previews
      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setNewPreviews((prev) => [...prev, e.target.result]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Remove new uploaded file
  const removeNewFile = (index) => {
    setNewFiles(newFiles.filter((_, i) => i !== index));
    setNewPreviews(newPreviews.filter((_, i) => i !== index));
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
    if (existingImages.length === 0 && newFiles.length === 0) {
      alert("Please add at least one room image.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // Prepare room data
    const formattedData = {
      ...roomData,
      occupancy: Number(roomData.occupancy),
      size: Number(roomData.size),
      pricepernight: Number(roomData.pricepernight),
      imagesToKeep: existingImagePublicIds,
    };

    // Create FormData for file upload
    const formData = new FormData();
    formData.append("roomData", JSON.stringify(formattedData));
    newFiles.forEach((file) => {
      formData.append("images", file);
    });

    try {
      const token = localStorage.getItem("token");
      await axios.put(`/api/rooms/updateroom/${roomid}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          setUploadProgress(percentCompleted);
        },
        timeout: 120000, // 2 minutes timeout
      });

      alert("Room updated successfully!");
      navigate("/admin/rooms");
    } catch (error) {
      console.error("Error updating room", error);
      if (error.code === "ECONNABORTED") {
        alert(
          "Upload timed out. Please try again with smaller images or fewer images.",
        );
      } else {
        alert(error.response?.data?.message || "Failed to update room");
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Add progress bar after the submit button in the JSX
  {
    uploading && uploadProgress > 0 && (
      <div className="progress-container" style={{ marginTop: "20px" }}>
        <div
          style={{
            width: "100%",
            backgroundColor: "#f0f0f0",
            borderRadius: "5px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${uploadProgress}%`,
              backgroundColor: "#28a745",
              height: "30px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              transition: "width 0.3s ease",
            }}
          >
            {uploadProgress}%
          </div>
        </div>
        <p style={{ textAlign: "center", marginTop: "10px" }}>
          Uploading {newFiles.length} image(s)... Please wait
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <h2>Loading room details...</h2>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="room-form">
        <h2>
          <center>
            <b>Update Room</b>
          </center>
        </h2>

        <input
          type="text"
          name="name"
          placeholder="Room Name"
          value={roomData.name}
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
          value={roomData.description}
          onChange={handleChange}
          required
        ></textarea>

        <input
          type="text"
          name="location"
          placeholder="Location"
          value={roomData.location}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="occupancy"
          placeholder="Occupancy"
          min="1"
          value={roomData.occupancy}
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
          value={roomData.size}
          onChange={handleChange}
          required
        />

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
                checked={roomData.amenities?.includes(amenity)}
                onChange={handleChange}
              />
              {amenity}
            </label>
          ))}
        </div>

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
                checked={roomData.facilities?.includes(facility)}
                onChange={handleChange}
              />
              {facility}
            </label>
          ))}
        </div>

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
                whiteSpace: "nowrap",
              }}
            >
              <input
                type="checkbox"
                name="policies"
                value={policy}
                checked={roomData.policies?.includes(policy)}
                onChange={handleChange}
              />
              {policy}
            </label>
          ))}
        </div>

        {/* Existing Images Section */}
        {existingImages.length > 0 && (
          <div className="image-section">
            <label>
              <b>Alltogether Max 3 total images.</b> <br></br>
              <b> Current Images:</b>
            </label>
            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginTop: "10px",
              }}
            >
              {existingImages.map((url, idx) => (
                <div key={idx} style={{ position: "relative" }}>
                  <img
                    src={url}
                    alt={`Existing ${idx + 1}`}
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
                    onClick={() => removeExistingImage(idx)}
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

        {/* Add New Images Section */}
        <div className="image-section">
          <label>
            <b>Add New Images:</b>
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

          {/* New Image Previews */}
          {newPreviews.length > 0 && (
            <div className="uploaded-previews" style={{ marginTop: "15px" }}>
              <label>
                <b>New Images to Upload:</b>
              </label>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  marginTop: "10px",
                }}
              >
                {newPreviews.map((preview, idx) => (
                  <div key={idx} style={{ position: "relative" }}>
                    <img
                      src={preview}
                      alt={`New ${idx + 1}`}
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
                      onClick={() => removeNewFile(idx)}
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
            value={roomData.pricepernight}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="btn" disabled={uploading}>
          {uploading ? "Updating Room..." : "Update Room"}
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
        `}
      </style>
    </div>
  );
}

export default UpdateRoom;
