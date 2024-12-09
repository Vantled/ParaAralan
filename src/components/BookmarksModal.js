import React from 'react';
import { getFirestore, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

function BookmarksModal({ bookmarkedSchools, user, onClose, onSchoolSelect, mapRef }) {
  const handleViewSchool = (school) => {
    if (mapRef.current) {
      mapRef.current.flyTo(
        [school.position.lat, school.position.lng],
        16,
        {
          duration: 1.5,
          easeLinearity: 0.25
        }
      );
    }
    onSchoolSelect(school);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content bookmarks-modal">
        <button className="close-button" onClick={onClose}>×</button>
        <h2>My Bookmarked Schools</h2>
        
        <div className="bookmarked-schools-list">
          {bookmarkedSchools.length > 0 ? (
            bookmarkedSchools.map(school => (
              <div key={school.id} className="bookmarked-school-item">
                <div>
                  <h3>{school.name}</h3>
                  <p>{school.location}</p>
                </div>
                <div className="bookmark-actions">
                  <button 
                    className="view-school-btn"
                    onClick={() => handleViewSchool(school)}
                  >
                    <i className="fas fa-eye"></i>
                    View
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="no-bookmarks">You haven't bookmarked any schools yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default BookmarksModal; 