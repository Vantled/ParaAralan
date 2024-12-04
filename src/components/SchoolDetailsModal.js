import React from 'react';

function SchoolDetailsModal({ school, onClose, userLocation, showDirections, isAdmin, handleEditSchool, showingDirections, setShowDeleteConfirm }) {
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

          {school.websiteUrl && (
            <div className="info-row">
              <i className="fas fa-globe"></i>
              <a href={school.websiteUrl} target="_blank" rel="noopener noreferrer">
                Visit Website
              </a>
            </div>
          )}
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
              onClick={() => showDirections([school.position.lat, school.position.lng])}
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
                Edit School
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
