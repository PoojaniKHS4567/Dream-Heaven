import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import profileImg from "../assets/profile.jpeg";

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [showEditForm, setShowEditForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    contactNo: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData) navigate("/login");

    setUser(userData);
    setPreviewUrl(userData.profilePhoto || "/default-profile.jpg");

    // Prefill form
    setEditForm({
      firstName: userData.firstName,
      lastName: userData.lastName,
      username: userData.username,
      email: userData.email,
      contactNo: userData.contactNo,
    });

    setLoading(false);
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    setSelectedFile(file); // store file for upload

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(file);
  };

  // Upload button click
  const uploadProfilePhoto = async () => {
    if (!selectedFile) {
      toast.warning("Please select an image first");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("profilePhoto", selectedFile);

      const response = await axios.post("/api/users/upload-photo", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const updatedUser = {
        ...user,
        profilePhoto: response.data.profilePhoto,
      };

      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      // ✅ Dispatch a custom event so Navbar can update
      window.dispatchEvent(
        new CustomEvent("profilePhotoUpdated", {
          detail: { profilePhoto: response.data.profilePhoto },
        }),
      );

      toast.success("Profile photo updated successfully");
      setSelectedFile(null); // reset selected file
    } catch (err) {
      console.error(err);
      toast.error("Photo upload failed");
    }
  };

  const validateEditForm = () => {
    const { firstName, lastName, username, email, contactNo } = editForm;

    if (!firstName || !lastName || !username) {
      toast.error("Please fill all required fields");
      return false;
    }

    // Email validation - allow any email this time (or restrict to gmail if needed)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address (example@gmail.com)");
      return false;
    }

    // Contact number validation - 10 digits
    if (!/^\d{10}$/.test(contactNo)) {
      toast.error("Contact number must be 10 digits");
      return false;
    }

    return true;
  };

  // UPDATE USER DETAILS
  const updateUserDetails = async () => {
    if (!validateEditForm()) return; // ✅ validate before sending

    try {
      const token = localStorage.getItem("token");

      const response = await axios.put("/api/users/update-profile", editForm, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(response.data.user);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      toast.success("User details updated successfully");
      setShowEditForm(false);
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Failed to update user details",
      );
    }
  };

  // UPDATE PASSWORD
  const updatePassword = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(" New Passwords do not match");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      await axios.post(
        "/api/users/update-password",
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      toast.success("Password updated successfully");
      setShowPasswordForm(false);

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch {
      toast.error(
        "Failed to update password as your current password not matching with the existing one",
      );
    }
  };

  // DELETE ACCOUNT
  // DELETE ACCOUNT
  const deleteAccount = async () => {
    try {
      const token = localStorage.getItem("token");

      await axios.delete("/api/users/delete-account", {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Your account has been deleted successfully.");

      // Immediately log out
      localStorage.clear();

      // Dispatch profile photo update to reset Navbar
      window.dispatchEvent(
        new CustomEvent("profilePhotoUpdated", {
          detail: { profilePhoto: profileImg },
        }),
      );

      // Redirect immediately to Sign Up page
      navigate("/register");
    } catch (err) {
      console.error(err);
      toast.error("Account delete failed");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please login</div>;

  return (
    <div className="profile-wrapper">
      <br />
      <br />

      <div className="profile-grid">
        {/* LEFT SIDE - PHOTO + DETAILS */}
        <div className="left-section">
          <div className="photo-box">
            <img src={previewUrl} alt="Profile" className="profile-avatar" />

            <div className="photo-upload-area">
              <input type="file" accept="image/*" onChange={handleFileSelect} />

              {selectedFile && (
                <button onClick={uploadProfilePhoto}>Upload</button>
              )}
            </div>
          </div>

          <div className="details-box">
            <h3>User Details</h3>

            {!showEditForm ? (
              <>
                <p>
                  <strong>First Name&nbsp;&nbsp;:&nbsp;</strong>{" "}
                  {user.firstName}
                </p>
                <p>
                  <strong>Last Name&nbsp;&nbsp;:&nbsp;</strong> {user.lastName}
                </p>
                <p>
                  <strong>Username&nbsp;&nbsp;&nbsp;:&nbsp;</strong>{" "}
                  {user.username}
                </p>
                <p>
                  <strong>
                    Email&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp;
                  </strong>{" "}
                  {user.email}
                </p>
                <p>
                  <strong>
                    Contact&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp;
                  </strong>{" "}
                  {user.contactNo}
                </p>

                <button
                  className="edit-btn"
                  onClick={() => setShowEditForm(true)}
                >
                  Edit Details
                </button>
              </>
            ) : (
              <div className="edit-form">
                <label>
                  <strong>First Name&nbsp;&nbsp;:&nbsp;</strong>
                </label>
                <input
                  type="text"
                  placeholder="First Name"
                  value={editForm.firstName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, firstName: e.target.value })
                  }
                />
                <label>
                  <strong>Last Name&nbsp;&nbsp;:&nbsp;</strong>
                </label>
                <input
                  type="text"
                  placeholder="Last Name"
                  value={editForm.lastName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, lastName: e.target.value })
                  }
                />
                <label>
                  <strong>Username&nbsp;&nbsp;&nbsp;:&nbsp;</strong>
                </label>
                <input
                  type="text"
                  placeholder="Username"
                  value={editForm.username}
                  onChange={(e) =>
                    setEditForm({ ...editForm, username: e.target.value })
                  }
                />
                <label>
                  <strong>
                    Email&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp;
                  </strong>
                </label>
                <input
                  type="email"
                  placeholder="Email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                />
                <label>
                  <strong>Contact No&nbsp;:&nbsp;</strong>
                </label>
                <input
                  type="text"
                  placeholder="Contact No"
                  value={editForm.contactNo}
                  onChange={(e) =>
                    setEditForm({ ...editForm, contactNo: e.target.value })
                  }
                />
                <div className="button-row">
                  <button
                    className="cancel-btn"
                    onClick={() => setShowEditForm(false)}
                  >
                    Cancel
                  </button>

                  <button className="update-btn" onClick={updateUserDetails}>
                    Update Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="right-section">
          {/* PASSWORD BOX */}
          <div className="password-box">
            <h3>Change Password</h3>

            {!showPasswordForm ? (
              <button onClick={() => setShowPasswordForm(true)}>
                Change Password
              </button>
            ) : (
              <form onSubmit={updatePassword}>
                <input
                  type="password"
                  placeholder="Current Password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value,
                    })
                  }
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                />

                <button className="update-btn" type="submit">
                  Change Now
                </button>
                <button
                  className="cancel-btn"
                  type="button"
                  onClick={() => setShowPasswordForm(false)}
                >
                  Cancel
                </button>
              </form>
            )}
          </div>

          {/* DELETE ACCOUNT */}
          <div className="danger-box">
            <h3>Danger Zone</h3>

            {!showDeleteConfirm ? (
              <button
                className="delete-btn"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Account
              </button>
            ) : (
              <>
                <p>
                  Are you sure? This cannot be undone and all your details are
                  permanently removed.
                </p>

                <button className="confirm-delete" onClick={deleteAccount}>
                  Yes, Delete My Account
                </button>

                <button
                  className="cancel-btn"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
