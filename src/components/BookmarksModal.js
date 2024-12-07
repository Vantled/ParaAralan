import React from 'react';
import { getFirestore, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

function BookmarksModal({ bookmarkedSchools, user, onClose, onSchoolSelect }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content bookmarks-modal" onClick={e => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        <h2>My Bookmarked Schools</h2>
        
        {bookmarkedSchools.length === 0 ? (
          <p className="no-bookmarks">No bookmarked schools yet</p>
        ) : (
          <div className="bookmarked-schools-list">
            {bookmarkedSchools.map(school => (
              <div key={school.id} className="bookmarked-school-item">
                <div className="school-info">
                  <h3>{school.name}</h3>
                  <p>{school.location}</p>
                </div>
                <div className="bookmark-actions">
                  <button 
                    className="view-school-btn"
                    onClick={() => onSchoolSelect(school)}
                  >
                    <i className="fas fa-eye"></i> View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BookmarksModal; 