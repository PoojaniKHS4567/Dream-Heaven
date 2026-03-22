import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import profileImg from "../assets/profile.jpeg";
import logoImg from "../images/logo.png";

function Adminnav() {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(profileImg); // ✅ ADD THIS

  const profileRef = useRef();
  const navRef = useRef();
  const navigate = useNavigate();

  // ✅ LOAD ADMIN DATA + PHOTO
  useEffect(() => {
    const adminData = JSON.parse(localStorage.getItem("user")); // ⚠️ use same key as Profile

    if (!adminData) {
      navigate("/login");
      return;
    }

    if (!adminData.isAdmin) {
      navigate("/");
      return;
    }

    // ✅ SET PROFILE PHOTO
    setProfilePhoto(adminData.profilePhoto || profileImg);

    // ✅ LISTEN FOR PHOTO UPDATE EVENT
    const handleProfilePhotoUpdate = (event) => {
      setProfilePhoto(event.detail.profilePhoto || profileImg);
    };

    window.addEventListener("profilePhotoUpdated", handleProfilePhotoUpdate);

    return () => {
      window.removeEventListener(
        "profilePhotoUpdated",
        handleProfilePhotoUpdate,
      );
    };
  }, [navigate]);

  // CLICK OUTSIDE HANDLER
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (navRef.current && !navRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (menu) =>
    setActiveDropdown((prev) => (prev === menu ? null : menu));

  const handleLogout = () => {
    localStorage.removeItem("user"); // ⚠️ match Profile key
    localStorage.removeItem("token");

    setProfilePhoto(profileImg); // reset photo

    navigate("/login");
  };

  return (
    <nav className="admin-navbar" ref={navRef}>
      <div className="admin-navbar-container">
        <Link to="/admin" className="admin-logo">
          <img src={logoImg} alt="Dream Heaven Logo" className="logo-img" />
          <span>Dream Heaven</span>
        </Link>

        <ul className="admin-nav-links">
          <li>
            <Link to="/admin">Dashboard</Link>
          </li>

          <li className="dropdown">
            <button onClick={() => toggleDropdown("rooms")}>Rooms ▾</button>
            <ul
              className={`dropdown-menu ${activeDropdown === "rooms" ? "show" : ""}`}
            >
              <li>
                <Link to="/admin/addroom">Add Room</Link>
              </li>
              <li>
                <Link to="/admin/rooms">All Room</Link>
              </li>
            </ul>
          </li>

          <li className="dropdown">
            <button onClick={() => toggleDropdown("bookings")}>
              Bookings ▾
            </button>
            <ul
              className={`dropdown-menu ${activeDropdown === "bookings" ? "show" : ""}`}
            >
              <li>
                <Link to="/admin/bookings">All Bookings</Link>
              </li>
              <li>
                <Link to="/admin/cancellations">All Cancellations</Link>
              </li>
              <li>
                <Link to="/admin/refunds">All Refunds</Link>
              </li>
            </ul>
          </li>

          <li>
            <Link to="/admin/users">All Users</Link>
          </li>
          <li>
            <Link to="/admin/inquiries">All Inquiries</Link>
          </li>
          <li>
            <Link to="/admin/payments">All Payments</Link>
          </li>
          <li>
            <Link to="/admin/feedback">All Feedbacks</Link>
          </li>
        </ul>

        {/* ✅ PROFILE SECTION */}
        <div
          className="admin-profile"
          ref={profileRef}
          onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
        >
          <img
            src={profilePhoto} // ✅ DYNAMIC NOW
            alt="Profile"
            className="admin-profile-img"
          />

          {profileDropdownOpen && (
            <div className="admin-dropdown-menu">
              <Link to="/admin/adminprofile">My Profile</Link>
              <a href="#" onClick={handleLogout}>
                Logout
              </a>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Adminnav;
