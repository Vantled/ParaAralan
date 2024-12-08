import React, { useState, useEffect, useRef } from 'react';
import { getFirestore, doc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import confetti from 'canvas-confetti';
import { Rating } from '@mui/material';
import ReviewNotification from './ReviewNotification';

function SchoolDetailsModal({ school, onClose, userLocation, showDirections, isAdmin, handleEditSchool, showingDirections, setShowingDirections, setShowDeleteConfirm, isBookmarked, onToggleBookmark }) {
  const [newReview, setNewReview] = useState('');
  const [rating, setRating] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [notification, setNotification] = useState(null);
  const [reviews, setReviews] = useState(school.reviews || []);
  const db = getFirestore();
  const auth = getAuth();
  const reviewFormRef = useRef(null);

  // Set up real-time listener for reviews
  useEffect(() => {
    if (!school?.id) return;

    const schoolRef = doc(db, 'schools', school.id);
    const unsubscribe = onSnapshot(schoolRef, (doc) => {
      if (doc.exists()) {
        const schoolData = doc.data();
        setReviews(schoolData.reviews || []);
      }
    }, (error) => {
      console.error("Error listening to reviews:", error);
      showNotification('Error loading reviews. Please refresh the page.', 'error');
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [school?.id, db]);

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

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const getUserDisplayName = () => {
    const user = auth.currentUser;
    if (!user) return 'Anonymous';

    // If user has a display name set, use their first name
    if (user.displayName) {
      return user.displayName.split(' ')[0];
    }

    // If no display name but has email, extract name from email
    if (user.email) {
      // Get the part before @ and capitalize first letter
      const nameFromEmail = user.email.split('@')[0];
      // Convert potential.dot.notation or potential_underscore to space
      const cleanName = nameFromEmail.replace(/[._]/g, ' ');
      // Get first word and capitalize it
      const firstName = cleanName.split(' ')[0];
      return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    }

    return 'Anonymous';
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      showNotification('Please sign in to leave a review', 'warning');
      return;
    }
    if (rating === 0) {
      showNotification('Please select a rating', 'warning');
      return;
    }
    if (!newReview.trim()) {
      showNotification('Please enter a review', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const review = {
        userId: auth.currentUser.uid,
        userName: isAnonymous ? 'Anonymous' : getUserDisplayName(),
        rating,
        text: newReview.trim(),
        createdAt: new Date().toISOString(),
        isAnonymous
      };

      const schoolRef = doc(db, 'schools', school.id);

      if (editingReview) {
        // Remove the old review and add the new one
        const updatedReviews = reviews.map(r => 
          r.userId === editingReview.userId && r.createdAt === editingReview.createdAt ? review : r
        );
        await updateDoc(schoolRef, { reviews: updatedReviews });
      } else {
        // Add new review to the array
        await updateDoc(schoolRef, {
          reviews: arrayUnion(review)
        });
      }

      setNewReview('');
      setRating(0);
      setIsAnonymous(false);
      setEditingReview(null);
      showNotification(editingReview ? 'Review updated successfully!' : 'Review submitted successfully!', 'success');
    } catch (error) {
      console.error('Error submitting review:', error);
      showNotification('Failed to submit review. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setNewReview(review.text);
    setRating(review.rating);
    setIsAnonymous(review.isAnonymous || false);

    // Scroll to the review form with smooth animation
    setTimeout(() => {
      reviewFormRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }, 100);
  };

  const handleDeleteReview = async (reviewToDelete) => {
    if (!auth.currentUser || reviewToDelete.userId !== auth.currentUser.uid) {
      return;
    }

    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        const schoolRef = doc(db, 'schools', school.id);
        const updatedReviews = reviews.filter(r => 
          !(r.userId === reviewToDelete.userId && r.createdAt === reviewToDelete.createdAt)
        );
        await updateDoc(schoolRef, { reviews: updatedReviews });
        showNotification('Review deleted successfully!', 'success');
      } catch (error) {
        console.error('Error deleting review:', error);
        showNotification('Failed to delete review. Please try again.', 'error');
      }
    }
  };

  // Calculate average rating
  const calculateAverageRating = () => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  if (!school) return null;

  return (
    <div className="school-details-modal">
      {notification && (
        <ReviewNotification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      
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
          <div className="detail-group reviews-section">
            <div className="reviews-header">
              <h3>Reviews</h3>
              {reviews.length > 0 && (
                <div className="reviews-stats">
                  <div className="average-rating">
                    <Rating 
                      value={Number(calculateAverageRating())} 
                      readOnly 
                      precision={0.1} 
                      size="small"
                    />
                    <span className="rating-text">
                      {calculateAverageRating()} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Reviews List - Moved to top */}
            <div className="reviews-list">
              {reviews.length > 0 ? (
                reviews
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Sort by newest first
                  .map((review, index) => (
                    <div key={`${review.userId}-${review.createdAt}`} className="review-item">
                      <div className="review-header">
                        <span className="reviewer-name">{review.userName}</span>
                        <Rating value={review.rating} readOnly precision={0.5} size="small" />
                        <span className="review-date">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                        {auth.currentUser && review.userId === auth.currentUser.uid && (
                          <div className="review-actions">
                            <button 
                              onClick={() => handleEditReview(review)}
                              className="edit-review-button"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button 
                              onClick={() => handleDeleteReview(review)}
                              className="delete-review-button"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="review-text">{review.text}</p>
                    </div>
                  ))
              ) : (
                <p className="no-reviews">No reviews yet. Be the first to review!</p>
              )}
            </div>

            {/* Add Review Form - Moved to bottom */}
            <div className="add-review-section" ref={reviewFormRef}>
              <h4>{editingReview ? 'Edit Review' : 'Write a Review'}</h4>
              <form onSubmit={handleReviewSubmit} className="review-form">
                <div className="rating-input">
                  <label>Your Rating:</label>
                  <Rating
                    value={rating}
                    onChange={(event, newValue) => setRating(newValue)}
                    precision={0.5}
                  />
                </div>
                <textarea
                  value={newReview}
                  onChange={(e) => setNewReview(e.target.value)}
                  placeholder="Write your review here..."
                  rows={4}
                  required
                />
                <div className="review-form-options">
                  <label className="anonymous-option">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                    />
                    Post anonymously
                  </label>
                  <div className="review-form-buttons">
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="submit-review-button"
                    >
                      {isSubmitting ? 'Submitting...' : (editingReview ? 'Update Review' : 'Submit Review')}
                    </button>
                    {editingReview && (
                      <button 
                        type="button"
                        onClick={() => {
                          setEditingReview(null);
                          setNewReview('');
                          setRating(0);
                          setIsAnonymous(false);
                        }}
                        className="cancel-edit-button"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>

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
