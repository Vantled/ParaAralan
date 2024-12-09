import React, { useState, useEffect, useCallback } from 'react';
import { getAuth, updateProfile } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import defaultAvatar from '../assets/default-avatar.svg';
import ProfileNotification from './ProfileNotification';
import { uploadImage, DEFAULT_AVATAR_URL, dataURLtoFile } from '../utils/imageUpload';
import ImageCropper from './ImageCropper';

function UserProfileModal({ onClose }) {
  const auth = getAuth();
  const db = getFirestore();
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropImage, setCropImage] = useState(null);

  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: auth.currentUser?.email || '',
    phoneNumber: '',
    city: '',
    region: '',
    desiredProgram: '',
    notes: '',
    photoURL: auth.currentUser?.photoURL || defaultAvatar
  });

  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const fetchUserProfile = useCallback(async () => {
    if (!auth.currentUser) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(prevData => ({
          ...prevData,
          ...data,
          email: auth.currentUser.email
        }));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      showNotification('Error loading profile data', 'error');
    }
  }, [auth.currentUser, db]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file
      if (!file.type.startsWith('image/')) {
        showNotification('Please select an image file', 'error');
        return;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        showNotification('Image must be smaller than 10MB', 'error');
        return;
      }

      // Create preview and show cropper
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropImage(reader.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (cropData) => {
    try {
      const file = dataURLtoFile(cropImage, 'profile.jpg');
      if (!file) {
        throw new Error('Failed to process image');
      }
      
      const imageUrl = await uploadImage(file, cropData);
      setUserData(prev => ({
        ...prev,
        photoURL: imageUrl
      }));
      setShowCropper(false);
      setCropImage(null);
      showNotification('Image updated successfully', 'success');
    } catch (error) {
      console.error('Error handling crop:', error);
      showNotification('Failed to update image', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let photoURL = userData.photoURL;

      if (profileImage) {
        try {
          showNotification('Uploading image...', 'info');
          const imageUrl = await uploadImage(profileImage);
          
          if (imageUrl === DEFAULT_AVATAR_URL) {
            showNotification('Failed to upload image. Using default avatar.', 'warning');
          }
          
          photoURL = imageUrl;
        } catch (error) {
          console.error('Error handling image:', error);
          showNotification('Failed to upload image. Using default avatar.', 'warning');
          photoURL = DEFAULT_AVATAR_URL;
        }
      }

      // Update auth profile
      await updateProfile(auth.currentUser, {
        displayName: `${userData.firstName} ${userData.lastName}`,
        photoURL
      });

      // Update Firestore
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        ...userData,
        photoURL,
        updatedAt: new Date().toISOString()
      });

      showNotification('Profile updated successfully!', 'success');
      setTimeout(onClose, 1500);

    } catch (error) {
      console.error('Update error:', error);
      showNotification('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!auth.currentUser) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content user-profile-modal" onClick={e => e.stopPropagation()}>
        {notification && (
          <ProfileNotification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}

        <div className="profile-header">
          <h2>User Profile</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {showCropper ? (
          <ImageCropper
            image={cropImage}
            onCropComplete={handleCropComplete}
            onCancel={() => {
              setShowCropper(false);
              setCropImage(null);
            }}
            aspect={1} // 1:1 aspect ratio for profile pictures
          />
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="profile-content">
              <div className="profile-image-section">
                <div className="profile-image-container">
                  <img 
                    src={imagePreview || userData.photoURL || defaultAvatar} 
                    alt="Profile" 
                    className="profile-image"
                    onError={(e) => {
                      e.target.src = defaultAvatar;
                      showNotification('Error loading image. Using default avatar.', 'warning');
                    }}
                  />
                  <label className="image-upload-label">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                    <i className="fas fa-camera"></i>
                  </label>
                </div>
              </div>

              <div className="form-section">
                <h3>Personal Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={userData.firstName}
                      onChange={handleInputChange}
                      placeholder="Enter first name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={userData.lastName}
                      onChange={handleInputChange}
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Contact Information</h3>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={userData.email}
                    disabled
                    className="disabled-input"
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={userData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Location</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      name="city"
                      value={userData.city}
                      onChange={handleInputChange}
                      placeholder="Enter city"
                    />
                  </div>

                  <div className="form-group">
                    <label>Region</label>
                    <input
                      type="text"
                      name="region"
                      value={userData.region}
                      onChange={handleInputChange}
                      placeholder="Enter region"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Academic Interests</h3>
                <div className="form-group">
                  <label>Desired Course/Program</label>
                  <input
                    type="text"
                    name="desiredProgram"
                    value={userData.desiredProgram}
                    onChange={handleInputChange}
                    placeholder="What course or program are you interested in?"
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>School Notes</h3>
                <div className="form-group">
                  <label>Custom Notes</label>
                  <textarea
                    name="notes"
                    value={userData.notes}
                    onChange={handleInputChange}
                    placeholder="Write your observations about schools here..."
                    rows={4}
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-button" 
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="save-button"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default UserProfileModal; 