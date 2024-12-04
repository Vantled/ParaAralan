import React, { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

function UserProfileModal({ user, onClose, showNotification }) {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    fullName: '',
    email: '',
    contactNumber: '',
    school: '',
    birthdate: '',
    currentSchool: '',
    gradeLevel: '',
    trackStrand: '',
    guardianName: '',
    guardianContact: '',
    careerGoals: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        showNotification("Error loading profile data", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const db = getFirestore();
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, userData);
      
      setIsEditing(false);
      showNotification("Profile updated successfully!", "success");
    } catch (error) {
      console.error("Error updating profile:", error);
      showNotification("Error updating profile", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="modal-content profile-modal">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-content profile-modal">
      <button className="close-button" onClick={onClose}>×</button>
      <h2>User Profile</h2>

      <form onSubmit={handleSubmit} className="profile-form">
        <section className="profile-section">
          <h3>Personal Information</h3>
          
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              placeholder="Enter your full name"
              value={userData.fullName}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email address"
              value={userData.email}
              disabled={true}
            />
          </div>

          <div className="form-group">
            <label>Contact Number</label>
            <input
              type="tel"
              name="contactNumber"
              placeholder="Enter your contact number"
              value={userData.contactNumber}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
          </div>

          <div className="form-group">
            <label>School</label>
            <input
              type="text"
              name="school"
              placeholder="Enter your school name"
              value={userData.school}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
          </div>

          <div className="form-group">
            <label>Birthdate</label>
            <input
              type="date"
              name="birthdate"
              value={userData.birthdate}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
          </div>
        </section>

        <section className="profile-section">
          <h3>Educational Background</h3>
          
          <div className="form-group">
            <label>Current School</label>
            <input
              type="text"
              name="currentSchool"
              placeholder="Enter your current school"
              value={userData.currentSchool}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
          </div>

          <div className="form-group">
            <label>Grade Level</label>
            <input
              type="text"
              name="gradeLevel"
              placeholder="Enter your grade level"
              value={userData.gradeLevel}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
          </div>

          <div className="form-group">
            <label>Track/Strand</label>
            <input
              type="text"
              name="trackStrand"
              placeholder="Enter your track or strand"
              value={userData.trackStrand}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
          </div>
        </section>

        <section className="profile-section">
          <h3>Additional Information</h3>
          
          <div className="form-group">
            <label>Parent/Guardian Name</label>
            <input
              type="text"
              name="guardianName"
              placeholder="Enter parent/guardian name"
              value={userData.guardianName}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
          </div>

          <div className="form-group">
            <label>Parent/Guardian Contact Number</label>
            <input
              type="tel"
              name="guardianContact"
              placeholder="Enter parent/guardian contact number"
              value={userData.guardianContact}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
          </div>

          <div className="form-group">
            <label>Career Goals</label>
            <input
              type="text"
              name="careerGoals"
              placeholder="Enter your career goals"
              value={userData.careerGoals}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
          </div>
        </section>

        <div className="profile-buttons">
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="edit-button"
            >
              Edit Profile
            </button>
          ) : (
            <>
              <button
                type="submit"
                className="save-button"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <span className="button-spinner"></span>
                    Saving...
                  </>
                ) : (
                  'Save Profile'
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="cancel-button"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

export default UserProfileModal; 