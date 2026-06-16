import React, { useState, useEffect } from "react";
import { 
  getUserProfile, 
  updateUserProfile, 
  loadUserFromStorage 
} from "../services/api";
import MessagePopup from "./MessagePopup";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Profile.css";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  // Form states
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const currentUser = loadUserFromStorage();

  const showMessage = (text, type = "info") => {
    setMessage({ text, type });
  };

  const closeMessage = () => {
    setMessage({ text: "", type: "" });
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      if (!currentUser?.id) {
        showMessage("❌ Please log in to view profile", "error");
        return;
      }

      const res = await getUserProfile(currentUser.id);
      console.log("Profile Response:",res);
      if (res.success) {
        const userData = res.data;
        console.log("User Data of profile:", userData)
        setUser(userData);
        setFormData({
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          email: userData.email || "",
          password: "",
          confirmPassword: ""
        });
      } else {
        showMessage("❌ Failed to load profile: " + (res.message || "Unknown error"), "error");
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
      showMessage("❌ Failed to load profile: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    // Validate passwords if changing
    if (formData.password && formData.password !== formData.confirmPassword) {
      showMessage("❌ Passwords do not match", "error");
      return;
    }

    if (formData.password && formData.password.length < 6) {
      showMessage("❌ Password must be at least 6 characters", "error");
      return;
    }

    try {
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName
      };

      // Only include password if provided
      if (formData.password) {
        updateData.password = formData.password;
      }

      const res = await updateUserProfile(currentUser.id, updateData);
      
      if (res.success) {
        const updatedUser = res.data;
        setUser(updatedUser);
        
        // Update local storage with new user data
        const updatedCurrentUser = {
          ...currentUser,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email
        };
        localStorage.setItem('csllp_user', JSON.stringify(updatedCurrentUser));
        
        showMessage("✅ Profile updated successfully!", "success");
        setEditing(false);
        setFormData(prev => ({ ...prev, password: "", confirmPassword: "" }));
      } else {
        showMessage("❌ Failed to update profile: " + (res.body?.message || "Unknown error"), "error");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      showMessage("❌ Failed to update profile: " + error.message, "error");
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showMessage("❌ Please select an image file", "error");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showMessage("❌ Image size should be less than 5MB", "error");
      return;
    }

    setUploadingPhoto(true);

    try {
      // In a real application, you would upload the file to a server
      // and get back a URL, then update the profile with that URL
      
      // For now, we'll simulate the upload process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create a local URL for preview (in real app, this would be from your server)
      const localUrl = URL.createObjectURL(file);
      
      // Update profile with the new photo URL
      const updateData = {
        profilePhotoUrl: localUrl
      };

      const res = await updateUserProfile(currentUser.id, updateData);
      
      if (res.ok && res.body && res.body.success) {
        const updatedUser = res.body.data;
        setUser(updatedUser);
        
        // Update local storage
        const updatedCurrentUser = {
          ...currentUser,
          profilePhotoUrl: updatedUser.profilePhotoUrl
        };
        localStorage.setItem('csllp_user', JSON.stringify(updatedCurrentUser));
        
        showMessage("✅ Profile photo updated successfully!", "success");
      } else {
        showMessage("❌ Failed to update profile photo", "error");
      }
    } catch (error) {
      console.error("Photo upload error:", error);
      showMessage("❌ Failed to upload photo: " + error.message, "error");
    } finally {
      setUploadingPhoto(false);
      e.target.value = ''; // Reset file input
    }
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      'ADMIN': { class: 'bg-danger', text: '👑 Admin' },
      'MANAGER': { class: 'bg-warning', text: '💼 Manager' },
      'EMPLOYEE': { class: 'bg-primary', text: '👨‍💼 Employee' },
      'HR': { class: 'bg-info', text: '📊 HR' }
    };
    const config = roleConfig[role] || { class: 'bg-secondary', text: role };
    return <span className={`badge ${config.class} role-badge`}>{config.text}</span>;
  };

  const getInitials = (user) => {
    if (user.profilePhotoUrl) return null;
    const first = user.firstName ? user.firstName.charAt(0).toUpperCase() : '';
    const last = user.lastName ? user.lastName.charAt(0).toUpperCase() : '';
    return first + last;
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-container">
        <div className="alert alert-danger text-center">
          <h5>Unable to load profile</h5>
          <p>Please try refreshing the page or contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Message Popup */}
      <MessagePopup 
        message={message.text} 
        type={message.type} 
        onClose={closeMessage} 
      />

      <div className="profile-card">
        {/* Profile Header with Photo */}
        <div className="profile-header">
          <div className="profile-photo-section">
            <div className="profile-photo-container">
              {user.profilePhotoUrl ? (
                <img 
                  src={user.profilePhotoUrl} 
                  alt="Profile" 
                  className="profile-photo"
                />
              ) : (
                <div className="profile-initials">
                  {getInitials(user)}
                </div>
              )}
              
              <label 
                htmlFor="photo-upload" 
                className="photo-upload-btn"
                title="Change profile photo"
              >
                <span>📷</span>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="d-none"
                />
              </label>
              
              {uploadingPhoto && (
                <div className="photo-upload-overlay">
                  <div className="spinner-border spinner-border-sm text-light" role="status">
                    <span className="visually-hidden">Uploading...</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="profile-info">
              <h2 className="profile-name">{user.firstName} {user.lastName}</h2>
              <p className="profile-email">{user.email}</p>
              <div className="profile-badges">
                {getRoleBadge(user.role)}
                <span className={`badge ${user.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'} status-badge`}>
                  {user.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="profile-content">
          {!editing ? (
            <>
              <div className="section-header">
                <h3>Personal Information</h3>
                <p>View and manage your profile details</p>
              </div>

              <div className="info-grid">
                <div className="info-card">
                  <h4>Basic Information</h4>
                  <div className="info-item">
                    <label>First Name</label>
                    <p>{user.firstName}</p>
                  </div>
                  <div className="info-item">
                    <label>Last Name</label>
                    <p>{user.lastName || 'Not provided'}</p>
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <p>{user.email}</p>
                  </div>
                </div>

                <div className="info-card">
                  <h4>Account Details</h4>
                  <div className="info-item">
                    <label>Role</label>
                    <div>{getRoleBadge(user.role)}</div>
                  </div>
                  <div className="info-item">
                    <label>Status</label>
                    <p>
                      <span className={`badge ${user.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}`}>
                        {user.status}
                      </span>
                    </p>
                  </div>
                  <div className="info-item">
                    <label>Member Since</label>
                    <p>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="action-buttons">
                <button
                  className="btn btn-primary"
                  onClick={() => setEditing(true)}
                >
                  ✏️ Edit Profile
                </button>
              </div>
            </>
          ) : (
            <div className="edit-section">
              <div className="section-header">
                <h3>Edit Profile</h3>
                <p>Update your personal information</p>
              </div>

              <form onSubmit={handleSaveProfile} className="edit-form">
                <div className="info-grid">
                  <div className="info-card">
                    <h4>Basic Information</h4>
                    <div className="form-group">
                      <label>First Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Last Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={user.email}
                        disabled
                      />
                      <small className="text-muted">Email cannot be changed</small>
                    </div>
                  </div>

                  <div className="info-card">
                    <h4>Change Password</h4>
                    <div className="form-group">
                      <label>New Password</label>
                      <input
                        type="password"
                        className="form-control"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Leave empty to keep current"
                        minLength="6"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Confirm Password</label>
                      <input
                        type="password"
                        className="form-control"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    💾 Save Changes
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        firstName: user.firstName || "",
                        lastName: user.lastName || "",
                        email: user.email || "",
                        password: "",
                        confirmPassword: ""
                      });
                    }}
                  >
                    ❌ Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}