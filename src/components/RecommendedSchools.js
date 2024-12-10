import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import searchApi from '../services/searchApi';

/**
 * @typedef {Object} RecommendedSchoolsProps
 * @property {string} desiredProgram
 * @property {() => void} onClose
 * @property {(school: Object) => void} onViewMap
 */

/**
 * @param {RecommendedSchoolsProps} props
 */
function RecommendedSchools({ desiredProgram, onClose, onViewMap }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      const db = getFirestore();
      
      try {
        const schoolsRef = collection(db, 'schools');
        const schoolsSnapshot = await getDocs(schoolsRef);
        const allSchools = schoolsSnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('School data:', data);
          return {
            id: doc.id,
            ...data,
            websiteUrl: data.websiteUrl || data.website || ''
          };
        });

        const searchResults = await searchApi.searchSchools(
          desiredProgram,
          {}, 
          allSchools
        );

        setRecommendations(searchResults.slice(0, 5));
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [desiredProgram]);

  const handleNext = () => {
    if (currentIndex < recommendations.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleViewMap = (school) => {
    onViewMap(school);
    onClose();
  };

  const handleVisitWebsite = (website) => {
    if (!website) return;

    let url = website.trim();
    
    try {
      // Create URL object to validate
      const urlObject = new URL(url.startsWith('http') ? url : `https://${url}`);
      
      // Only allow http or https protocols
      if (urlObject.protocol !== 'http:' && urlObject.protocol !== 'https:') {
        console.error('Invalid protocol');
        return;
      }

      window.open(urlObject.href, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Invalid URL:', error);
    }
  };

  if (loading) {
    return (
      <div className="recommendations-loading">
        <div className="loading-spinner"></div>
        <p>Finding your perfect school match...</p>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="recommendations-modal empty-state">
        <h3>No Matches Found</h3>
        <p>We couldn't find schools matching "{desiredProgram}"</p>
        <p>Try updating your interests or explore all schools</p>
        <button onClick={onClose} className="close-button">
          Explore All Schools
        </button>
      </div>
    );
  }

  const currentSchool = recommendations[currentIndex];

  return (
    <div className="recommendations-modal" onClick={(e) => e.stopPropagation()}>
      {showConfetti && <div className="confetti-container"></div>}
      
      <div className="recommendations-header">
        <h3>✨ Schools You Might Like ✨</h3>
        <p className="subtitle">Based on your interest in {desiredProgram}</p>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((currentIndex + 1) / recommendations.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="school-card">
        <div className="school-content">
          <div className="school-title">
            <h4>{currentSchool.name}</h4>
            <div className="school-details">
              <span className="location">{currentSchool.location}</span>
              {currentSchool.type && <span className="type">{currentSchool.type}</span>}
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button 
            onClick={() => handleVisitWebsite(currentSchool?.websiteUrl)}
            className="website-button"
            disabled={!currentSchool?.websiteUrl}
            title={!currentSchool?.websiteUrl ? 'Website not available' : 'Visit school website'}
          >
            <i className="fas fa-globe"></i> Visit Website
          </button>
          <button 
            onClick={() => handleViewMap(currentSchool)}
            className="view-map-button"
          >
            <i className="fas fa-map-marker-alt"></i> View on Map
          </button>
        </div>
      </div>

      <div className="navigation-controls">
        <button 
          onClick={handlePrev} 
          disabled={currentIndex === 0}
          className="nav-button prev"
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        <span className="school-counter">
          {currentIndex + 1} of {recommendations.length}
        </span>
        <button 
          onClick={handleNext}
          disabled={currentIndex === recommendations.length - 1}
          className="nav-button next"
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>

      <button onClick={onClose} className="close-modal">
        <i className="fas fa-check-circle"></i> Done Exploring
      </button>

      <style jsx>{`
        .recommendations-modal {
          background: white;
          padding: 1.5rem;
          border-radius: 20px;
          max-width: 600px;
          width: 90%;
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          overflow: hidden;
          opacity: 0;
          animation: modalFadeIn 0.3s ease-out forwards;
        }

        @keyframes modalFadeIn {
          0% {
            opacity: 0;
            transform: translate(-50%, -60%);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }

        .confetti-container {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          background: linear-gradient(
            45deg,
            rgba(255, 215, 0, 0.1) 25%,
            rgba(255, 192, 203, 0.1) 50%,
            rgba(135, 206, 235, 0.1) 75%
          );
          animation: confettiFade 3s forwards;
        }

        .recommendations-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .recommendations-header h3 {
          font-size: 1.5rem;
          color: #2c3e50;
          margin: 0 0 0.5rem 0;
        }

        .subtitle {
          color: #7f8c8d;
          font-size: 0.9rem;
          margin: 0 0 1rem 0;
        }

        .progress-bar {
          height: 4px;
          background: rgba(52, 152, 219, 0.1);
          border-radius: 4px;
          margin: 1rem 0 0.5rem 0;
          overflow: hidden;
          position: relative;
        }

        .progress-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: linear-gradient(45deg, #3498db, #2ecc71);
          transition: width 0.3s ease-out;
          border-radius: 4px;
          box-shadow: 0 0 8px rgba(52, 152, 219, 0.3);
        }

        .school-card {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 12px;
          margin: 1rem 0;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .school-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .school-title h4 {
          font-size: 1.2rem;
          color: #2c3e50;
          margin: 0 0 0.5rem 0;
          line-height: 1.4;
        }

        .school-details {
          display: flex;
          flex-wrap: wrap;
          gap: 0.8rem;
          margin-top: 0.5rem;
        }

        .location {
          display: flex;
          align-items: center;
          color: #666;
          font-size: 0.9rem;
        }

        .location::before {
          content: "📍";
          margin-right: 4px;
        }

        .type {
          padding: 4px 12px;
          background: rgba(52, 152, 219, 0.1);
          border-radius: 20px;
          color: #3498db;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .divider {
          height: 1px;
          background: #e0e0e0;
          margin: 0.5rem 0;
        }

        .programs {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }

        .programs h5 {
          color: #2c3e50;
          font-size: 1rem;
          margin: 0;
          font-weight: 600;
        }

        .programs-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .program-item {
          background: rgba(52, 152, 219, 0.05);
          padding: 4px 12px;
          border-radius: 16px;
          color: #666;
          font-size: 0.85rem;
        }

        .action-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-top: 0.5rem;
        }

        .action-buttons button {
          padding: 0.8rem;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-weight: 500;
        }

        .website-button {
          background: #3498db;
          color: white;
          opacity: 1;
          transition: all 0.2s ease;
        }

        .website-button:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .website-button:not(:disabled):hover {
          background: #2980b9;
          transform: translateY(-1px);
        }

        .view-map-button {
          background: rgba(52, 152, 219, 0.1);
          color: #3498db;
        }

        .view-map-button:hover {
          background: rgba(52, 152, 219, 0.2);
          transform: translateY(-1px);
        }

        .navigation-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin: 2rem 0;
        }

        .nav-button {
          background: none;
          border: 2px solid #eee;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .nav-button:not(:disabled):hover {
          background: #f8f9fa;
          border-color: #3498db;
          color: #3498db;
        }

        .nav-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .school-counter {
          font-size: 0.9rem;
          color: #666;
        }

        .close-modal {
          width: 100%;
          padding: 1rem;
          border: none;
          border-radius: 12px;
          background: linear-gradient(45deg, #3498db, #2ecc71);
          color: white;
          font-weight: 500;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1.5rem;
          box-shadow: 0 4px 15px rgba(52, 152, 219, 0.2);
        }

        .close-modal:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(52, 152, 219, 0.3);
        }

        .close-modal i {
          font-size: 1.1rem;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes cardPop {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes confettiFade {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @media (max-width: 768px) {
          .recommendations-modal {
            width: 95%;
            padding: 1rem;
          }

          .school-card {
            padding: 1rem;
          }

          .action-buttons {
            grid-template-columns: 1fr;
          }

          .programs-list {
            max-height: 120px;
            overflow-y: auto;
            padding-right: 0.5rem;
          }
        }

        .recommendations-loading {
          background: white;
          padding: 2rem;
          border-radius: 20px;
          max-width: 600px;
          width: 90%;
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          opacity: 0;
          animation: modalFadeIn 0.3s ease-out forwards;
        }

        .recommendations-modal.empty-state {
          background: white;
          padding: 2rem;
          border-radius: 20px;
          max-width: 600px;
          width: 90%;
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          opacity: 0;
          animation: modalFadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default RecommendedSchools; 