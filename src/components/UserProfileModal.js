import React, { useState, useEffect, useCallback } from 'react';
import { getAuth, updateProfile } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import defaultAvatar from '../assets/default-avatar.svg';
import ProfileNotification from './ProfileNotification';

function UserProfileModal({ onClose }) {
  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [notification, setNotification] = useState(null);

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
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showNotification('Image size should be less than 5MB', 'warning');
        return;
      }
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      showNotification('You must be logged in to update your profile', 'error');
      return;
    }

    setLoading(true);
    let photoURL = userData.photoURL;

    try {
      // Upload new profile image if selected
      if (profileImage) {
        try {
          const imageRef = ref(storage, `profile-images/${auth.currentUser.uid}`);
          await uploadBytes(imageRef, profileImage);
          photoURL = await getDownloadURL(imageRef);
        } catch (error) {
          console.error('Error uploading profile image:', error);
          showNotification('Failed to upload profile image. Other changes will still be saved.', 'warning');
        }
      }

      // Update auth profile
      try {
        await updateProfile(auth.currentUser, {
          displayName: `${userData.firstName} ${userData.lastName}`,
          photoURL
        });
      } catch (error) {
        console.error('Error updating auth profile:', error);
        showNotification('Failed to update display name', 'warning');
      }

      // Update Firestore profile
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const updatedData = {
        ...userData,
        photoURL,
        updatedAt: new Date().toISOString()
      };

      try {
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          await updateDoc(userRef, updatedData);
        } else {
          await setDoc(userRef, {
            ...updatedData,
            createdAt: new Date().toISOString()
          });
        }
        showNotification('Profile updated successfully!', 'success');
        setTimeout(onClose, 1500); // Close after showing success message
      } catch (error) {
        console.error('Error updating Firestore profile:', error);
        showNotification('Failed to save profile changes. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showNotification('An error occurred while saving changes. Please try again.', 'error');
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

        <form onSubmit={handleSubmit}>
          <div className="profile-content">
            <div className="profile-image-section">
              <div className="profile-image-container">
                <img 
                  src={imagePreview || userData.photoURL || defaultAvatar} 
                  alt="Profile" 
                  className="profile-image"
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
      </div>
    </div>
  );
}

export default UserProfileModal; 