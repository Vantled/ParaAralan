import React from 'react';

function DirectionsPanel({ 
  startPoint, 
  destination, 
  route, 
  onClose, 
  isVisible,
  setShowingDirections
}) {
  if (!isVisible) return null;

  const handleClose = () => {
    onClose();
    setShowingDirections(false);
  };

  const getTransportModes = () => {
    return [
      { mode: 'driving', icon: '🚗', label: 'Car' },
      { mode: 'walking', icon: '🚶', label: 'Walking' },
      { mode: 'cycling', icon: '🚲', label: 'Bicycle' },
      { mode: 'transit', icon: '🚌', label: 'Public Transit' }
    ];
  };

  const formatDistance = (meters) => {
    if (!meters) return '0 meters';
    if (meters < 1000) {
      return `${Math.round(meters)} meters`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0 minutes';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} minutes`;
  };

  return (
    <div className="directions-container">
      <div className="school-details-modal">
        <button className="close-button" onClick={handleClose}>×</button>
        <div className="school-details-content">
          <h2>Directions</h2>

          <div className="directions-content">
            <div className="route-points">
              <div className="start-point">
                <i className="fas fa-dot-circle"></i>
                <span>Starting Point: Your Location</span>
              </div>
              <div className="destination">
                <i className="fas fa-map-marker-alt"></i>
                <span>Destination: {destination?.name || 'Selected Location'}</span>
              </div>
            </div>

            <div className="transport-modes">
              {getTransportModes().map(({ mode, icon, label }) => (
                <button 
                  key={mode} 
                  className={`mode-button ${route?.mode === mode ? 'active' : ''}`}
                >
                  <span className="mode-icon">{icon}</span>
                  <span className="mode-label">{label}</span>
                </button>
              ))}
            </div>

            {route && (
              <div className="route-info">
                <div className="route-stats">
                  <div className="distance">
                    <i className="fas fa-road"></i>
                    <span>{formatDistance(route.distance)}</span>
                  </div>
                  <div className="duration">
                    <i className="fas fa-clock"></i>
                    <span>{formatDuration(route.duration)}</span>
                  </div>
                </div>

                {route.instructions && route.instructions.length > 0 && (
                  <div className="landmarks">
                    <h4>Key Landmarks</h4>
                    <ul>
                      {route.instructions.map((instruction, index) => (
                        <li key={index}>
                          <span className="instruction-icon">
                            {instruction.type === 'turn' ? '↱' : '➡️'}
                          </span>
                          <span className="instruction-text">{instruction.text}</span>
                          <span className="instruction-distance">
                            {formatDistance(instruction.distance)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="modal-actions">
              <button 
                className="direction-button active"
                onClick={handleClose}
              >
                <i className="fas fa-times"></i>
                Hide Directions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DirectionsPanel; 