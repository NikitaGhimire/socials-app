import React from 'react';

const UserProfile = ({
  userProfile,
  editingProfile,
  profileUpdates,
  setEditingProfile,
  handleProfileChange,
  handleProfileUpdate,
  handleFileChange,
  handleLogout,
  setShowProfileOverlay,
  setProfileVisible,
  setProfileUpdates,
}) => {
  return (
    <div className="popup-overlay" onClick={() => {
      setShowProfileOverlay(false);
      setProfileVisible(false);
    }}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={() => {
          setShowProfileOverlay(false);
          setProfileVisible(false);
        }}>×</button>
        <div className="profile-section">
          <img
            src={userProfile?.profilePicture 
                ? `${userProfile.profilePicture}?t=${Date.now()}`
                : '/images/default.jpg'
              }
            alt={userProfile?.name || "User"}
            className="profile-picture-icon"
          />
          {!editingProfile ? (
            <div className="profile-details">
              <p>Name: {userProfile?.name}</p>
              <p>Email: {userProfile?.email}</p>
              <p>Bio: {userProfile?.bio}</p>
              <p>Status: {userProfile?.statusMessage}</p>
              <button onClick={() => setEditingProfile(true)} className="edit-profile-button">
                Edit Profile
              </button>
              <button onClick={handleLogout} className="logout-button">Logout</button>
            </div>
          ) : (
            <div className="edit-profile-form">
              <h2>Edit Profile</h2>

              <div className="form-group">
                <label htmlFor="name">Display Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={profileUpdates.name}
                  onChange={handleProfileChange}
                  placeholder="Enter your display name"
                  className="edit-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={profileUpdates.bio}
                  onChange={handleProfileChange}
                  placeholder="Tell us about yourself"
                  className="edit-input"
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label htmlFor="statusMessage">Status</label>
                <input
                  type="text"
                  id="statusMessage"
                  name="statusMessage"
                  value={profileUpdates.statusMessage}
                  onChange={handleProfileChange}
                  placeholder="What's on your mind?"
                  className="edit-input"
                />
              </div>

              <div className="form-group">
                <label>Profile Picture</label>
                <div className="profile-picture-upload">
                  <label htmlFor="profile-picture" className="upload-label">
                    <img
                      src="/images/image-attachment-icon.png"
                      alt="Upload"
                      className="upload-icon"
                    />
                    <span>Choose a new profile picture</span>
                  </label>
                  <input
                    id="profile-picture"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              <div className="edit-profile-buttons">
                <button
                  onClick={handleProfileUpdate}
                  className="save-button"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setEditingProfile(false);
                    setProfileUpdates({
                      name: userProfile?.name || '',
                      bio: userProfile?.bio || '',
                      statusMessage: userProfile?.statusMessage || '',
                      profilePicture: null,
                    });
                  }}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;