import React from 'react';
import { getFirestore, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import confetti from 'canvas-confetti';

function SchoolDetailsModal({ school, onClose, userLocation, showDirections, isAdmin, handleEditSchool, showingDirections, setShowingDirections, setShowDeleteConfirm, isBookmarked, onToggleBookmark }) {
  const triggerConfetti = (buttonElement) => {
    const rect = buttonElement.getBoundingClientRect();
    const x = (rect.left + rect.right) / 2 / window.innerWidth;
    const y = (rect.top + rect.bottom) / 2 / window.innerHeight;

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { x, y },
      colors: ['#f1c40f', '#f39c12', '#e67e22'],  // Yellow/gold colors
      ticks: 100,
      startVelocity: 30,
      shapes: ['star'],
      scalar: 0.7,
      gravity: 1.2
    });
  };

  const handleBookmarkClick = (e) => {
    if (!isBookmarked) {  // Only trigger confetti when bookmarking, not when removing
      triggerConfetti(e.currentTarget);
    }
    onToggleBookmark(school);
  };

  if (!school) return null;

  return (
    <div className="school-details-modal">
      <button className="close-button" onClick={onClose}>×</button>
      <div className="school-details-content">
        <h2>{school.name}</h2>
        
        <div className="school-info-section">
          <div className="info-row">
            <i className="fas fa-map-marker-alt"></i>
            <span>{school.location}</span>
          </div>
          
          <div className="info-row">
            <i className="fas fa-phone"></i>
            <a href={`tel:${school.contact}`}>{school.contact}</a>
          </div>

          <div className="info-row">
            <i className="fas fa-globe"></i>
            <div className="website-row">
              {school.websiteUrl ? (
                <a href={school.websiteUrl} target="_blank" rel="noopener noreferrer">
                  Visit Website
                </a>
              ) : (
                <span style={{ color: '#7f8c8d' }}>No website available</span>
              )}
              <button 
                className={`bookmark-button ${isBookmarked ? 'bookmarked' : ''}`}
                onClick={handleBookmarkClick}
                title={isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
              >
                <i className={`${isBookmarked ? 'fas' : 'far'} fa-bookmark`}></i>
              </button>
            </div>
          </div>
        </div>

        <div className="school-details-section">
          {/* Academic Programs */}
          {school.academicPrograms?.length > 0 && (
            <div className="detail-group">
              <h3>Academic Programs</h3>
              {school.academicPrograms.map((program, index) => (
                <div key={index} className="program-item">
                  <h4>{program.name}</h4>
                  <ul>
                    {program.programs.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Admission Requirements */}
          {Object.keys(school.admissionRequirements || {}).length > 0 && (
            <div className="detail-group">
              <h3>Admission Requirements</h3>
              {Object.entries(school.admissionRequirements).map(([type, requirements], index) => (
                <div key={index} className="requirement-group">
                  <h4>{type}</h4>
                  <ul>
                    {requirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Tuition Fees */}
          {Object.keys(school.tuitionFees || {}).length > 0 && (
            <div className="detail-group">
              <h3>Tuition Fees</h3>
              {Object.entries(school.tuitionFees).map(([feeName, amount], index) => (
                <div key={index} className="fee-item">
                  <span>{feeName}:</span>
                  <span>{amount}</span>
                </div>
              ))}
            </div>
          )}

          {/* Scholarships */}
          {school.scholarships?.length > 0 && (
            <div className="detail-group">
              <h3>Scholarships</h3>
              <ul>
                {school.scholarships.map((scholarship, index) => (
                  <li key={index}>{scholarship}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="modal-actions">
          {userLocation && (
            <button 
              className={`direction-button ${showingDirections ? 'active' : ''}`}
              onClick={() => showDirections([school.position.lat, school.position.lng], school)}
            >
              <i className="fas fa-directions"></i>
              {showingDirections ? 'Hide Directions' : 'Get Directions'}
            </button>
          )}
          
          {isAdmin && (
            <>
              <button 
                className="edit-button"
                onClick={() => handleEditSchool(school)}
              >
                <i className="fas fa-edit"></i>
                Edit Information
              </button>
              <button 
                className="delete-button"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <i className="fas fa-trash"></i>
                Delete School
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SchoolDetailsModal;
