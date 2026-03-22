import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";

function AllRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterPriceMin, setFilterPriceMin] = useState("");
  const [filterPriceMax, setFilterPriceMax] = useState("");
  const [filterAmenities, setFilterAmenities] = useState([]);
  const [filterFacilities, setFilterFacilities] = useState([]);
  const [filterMeals, setFilterMeals] = useState("");

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/rooms/getallrooms");
      setRooms(response.data);
      setError(false);
    } catch (err) {
      setError(true);
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleDelete = async (roomId) => {
    if (!window.confirm("Do you want to delete it?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/rooms/deleteroom/${roomId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await fetchRooms();
    } catch (err) {
      console.error("Error deleting room", err);
    }
  };

  const roomNameList = [...new Set(rooms.map((room) => room.name))];

  const filteredRooms = rooms.filter((room) => {
    const price = parseFloat(room.pricepernight);
    const inName = filterName ? room.name === filterName : true;
    const inType = filterType ? room.roomType === filterType : true;
    const minPrice = parseFloat(filterPriceMin);
    const maxPrice = parseFloat(filterPriceMax);
    const inPriceMin =
      !isNaN(minPrice) && minPrice >= 0 ? price >= minPrice : true;
    const inPriceMax =
      !isNaN(maxPrice) && maxPrice >= 0 ? price <= maxPrice : true;
    const hasAmenities =
      filterAmenities.length > 0
        ? filterAmenities.every((a) => room.amenities?.includes(a))
        : true;
    const hasFacilities =
      filterFacilities.length > 0
        ? filterFacilities.every((f) => room.facilities?.includes(f))
        : true;
    const inMeals = filterMeals ? room.mealOptions === filterMeals : true;
    return (
      inName &&
      inType &&
      inPriceMin &&
      inPriceMax &&
      hasAmenities &&
      hasFacilities &&
      inMeals
    );
  });

  const toBase64 = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL("image/jpeg");
        resolve(dataURL);
      };
      img.onerror = (e) => reject(new Error("Image load error: " + url));
      img.src = url;
    });
  };

  const downloadPDF = async () => {
    if (filteredRooms.length === 0) {
      alert("No rooms to include in the PDF report.");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    const title = "All Rooms Report";
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, 16);

    for (let i = 0; i < filteredRooms.length; i++) {
      const room = filteredRooms[i];

      const cardX = 14;
      const cardY = 20;
      const cardWidth = pageWidth - 28;
      const lineHeight = 6;
      const padding = 6;

      const lines = [
        `Name: ${room.name}`,
        `Room ID: ${room._id}`,
        `Room Type: ${room.roomType}`,
        `Description: ${room.description || "N/A"}`,
        `Location: ${room.location || "N/A"}`,
        `Price per Night: $${room.pricepernight || "0"}`,
        `Occupancy: ${room.occupancy || "N/A"}`,
        `Bed Options: ${room.bedOptions || "N/A"}`,
        `Bathrooms: ${room.bathrooms || "N/A"}`,
        `Size: ${room.size || "N/A"}`,
        `View: ${room.view || "N/A"}`,
        `Meal Options: ${room.mealOptions || "N/A"}`,
        `Amenities: ${room.amenities?.join(", ") || "N/A"}`,
        `Facilities: ${room.facilities?.join(", ") || "N/A"}`,
      ];

      const textHeight = padding * 2 + lines.length * lineHeight;
      const imageHeight = 55;
      const totalCardHeight = textHeight + imageHeight + 20;

      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(cardX, cardY, cardWidth, totalCardHeight);

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Room Details", cardX + padding, cardY + padding + 2);

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      let textY = cardY + padding + 10;
      lines.forEach((line) => {
        doc.text(line, cardX + padding, textY);
        textY += lineHeight;
      });

      if (room.imageurls && room.imageurls.length > 0) {
        const images = room.imageurls.slice(0, 3);
        const imgWidth = 50;
        const imgHeight = 50;
        let xPosition = cardX + padding;
        const imgY = cardY + textHeight + 10;

        for (let j = 0; j < images.length; j++) {
          const imageUrl = images[j];
          try {
            const base64Img = await toBase64(imageUrl);
            doc.addImage(
              base64Img,
              "JPEG",
              xPosition,
              imgY,
              imgWidth,
              imgHeight,
            );
            xPosition += imgWidth + 10;
          } catch (err) {
            console.error("Image skipped:", err.message);
          }
        }
      }

      if (i < filteredRooms.length - 1) {
        doc.addPage();
      }
    }

    doc.save("rooms_report.pdf");
  };

  return (
    <div className="container mt-5">
      <h1>
        <b>All Rooms</b>
      </h1>

      <div className="d-flex justify-content-end mb-5">
        <button
          style={{
            backgroundColor: "#6f42c1",
            border: "1px solid #6f42c1",
            color: "white",
            padding: "5px 10px",
            height: "40px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
          onClick={downloadPDF}
        >
          Download PDF
        </button>
      </div>

      {/* Filters Section */}
      <div className="container my-4">
        <div className="row g-3 mb-3">
          <div className="col-md-3">
            <label className="form-label">
              <b>Filter by Room Name:</b>
            </label>
            <select
              className="form-select"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
            >
              <option value="">All</option>
              {roomNameList.map((name, idx) => (
                <option key={idx} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">
              <b>Type:</b>
            </label>
            <select
              className="form-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">All</option>
              <option value="Single">Single</option>
              <option value="Double">Double</option>
              <option value="Suite">Suite</option>
              <option value="Deluxe">Deluxe</option>
              <option value="Family">Family</option>
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">
              <b>Price Min:</b>
            </label>
            <input
              type="number"
              className="form-control"
              value={filterPriceMin}
              onChange={(e) => {
                const value = e.target.value;
                if (
                  value === "" ||
                  (/^\d+(\.\d{0,2})?$/.test(value) && parseFloat(value) >= 0)
                ) {
                  setFilterPriceMin(value);
                }
              }}
              min="0"
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">
              <b>Price Max:</b>
            </label>
            <input
              type="number"
              className="form-control"
              value={filterPriceMax}
              onChange={(e) => {
                const value = e.target.value;
                if (
                  value === "" ||
                  (/^\d+(\.\d{0,2})?$/.test(value) && parseFloat(value) >= 0)
                ) {
                  setFilterPriceMax(value);
                }
              }}
              min="0"
            />
          </div>
        </div>

        <div className="row g-3 align-items-end">
          <div className="col-md-4">
            <label className="form-label">
              <b>Amenities:</b>
            </label>
            <select
              multiple
              className="form-select"
              onChange={(e) =>
                setFilterAmenities(
                  Array.from(e.target.selectedOptions, (o) => o.value),
                )
              }
            >
              <option>WiFi</option>
              <option>TV</option>
              <option>Minibar</option>
              <option>Air Conditioning</option>
              <option>Safe</option>
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label">
              <b>Facilities:</b>
            </label>
            <select
              multiple
              className="form-select"
              onChange={(e) =>
                setFilterFacilities(
                  Array.from(e.target.selectedOptions, (o) => o.value),
                )
              }
            >
              <option>Pool</option>
              <option>Gym</option>
              <option>Spa</option>
              <option>Parking</option>
              <option>Restaurant</option>
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label">
              <b>Meal Options:</b>
            </label>
            <select
              className="form-select"
              value={filterMeals}
              onChange={(e) => setFilterMeals(e.target.value)}
            >
              <option value="">All</option>
              <option value="Breakfast Only">Breakfast Only</option>
              <option value="Half Board">Half Board</option>
              <option value="Full Board">Full Board</option>
              <option value="All Inclusive">All Inclusive</option>
            </select>
          </div>
        </div>

        <div className="d-flex justify-content-between mt-3">
          <button
            className="btn btn-secondary"
            onClick={() => {
              setFilterName("");
              setFilterType("");
              setFilterPriceMin("");
              setFilterPriceMax("");
              setFilterAmenities([]);
              setFilterFacilities([]);
              setFilterMeals("");
            }}
          >
            Reset Filters
          </button>
        </div>
      </div>
      <br></br>
      <br></br>

      {/* Rooms List - Using d-flex flex-wrap gap-4 as in your original */}
      {loading ? (
        <h2>Loading...</h2>
      ) : error ? (
        <h2>Error fetching rooms</h2>
      ) : (
        <div className="d-flex flex-wrap gap-4">
          {filteredRooms.map((room) => (
            <div className="mb-4" key={room._id} style={{ width: "48%" }}>
              <div
                className="card h-100 shadow-sm p-3 d-flex flex-column justify-content-between"
                style={{
                  minHeight: "100%",
                  borderRadius: "1rem",
                  border: "1px solid black",
                }}
              >
                <h4 className="text-center mb-3">Room Details</h4>

                {room.imageurls?.length ? (
                  <div className="d-flex gap-4">
                    {room.imageurls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`${room.name} ${i + 1}`}
                        className="rounded"
                        style={{
                          width: "150px",
                          height: "150px",
                          objectFit: "cover",
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <p>No images</p>
                )}

                <div className="card-body">
                  <h5 className="card-title">{room.name}</h5>
                  <p>
                    <strong>Type:</strong> {room.roomType}
                  </p>
                  <p>
                    <strong>Price:</strong> ${room.pricepernight}
                  </p>
                  <p>
                    <strong>Description:</strong> {room.description}
                  </p>
                  <p>
                    <strong>Location:</strong> {room.location}
                  </p>
                  <p>
                    <strong>Occupancy:</strong> {room.occupancy}
                  </p>
                  <p>
                    <strong>Bed Options:</strong> {room.bedOptions}
                  </p>
                  <p>
                    <strong>Bathrooms:</strong> {room.bathrooms}
                  </p>
                  <p>
                    <strong>Size:</strong> {room.size}
                  </p>
                  <p>
                    <strong>View:</strong> {room.view}
                  </p>
                  <p>
                    <strong>Meal Options:</strong> {room.mealOptions}
                  </p>
                  <p>
                    <strong>Amenities:</strong> {room.amenities?.join(", ")}
                  </p>
                  <p>
                    <strong>Facilities:</strong> {room.facilities?.join(", ")}
                  </p>

                  <div className="d-flex justify-content-end gap-3 mt-auto pt-3">
                    <Link
                      to={`/update/${room._id}`}
                      style={{
                        backgroundColor: "#28a745",
                        color: "white",
                        padding: "8px 14px",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "16px",
                        textDecoration: "none",
                      }}
                    >
                      Update
                    </Link>
                    <button
                      onClick={() => handleDelete(room._id)}
                      style={{
                        backgroundColor: "#dc3545",
                        color: "white",
                        padding: "8px 14px",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "16px",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AllRooms;
