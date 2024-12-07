import React, { useState, useEffect } from 'react';

const TRANSPORT_SPEEDS = {
  driving: 40,    // 40 km/h average city speed
  walking: 4.5,   // 4.5 km/h average walking speed
  cycling: 12,    // 12 km/h average cycling speed
  transit: 25     // 25 km/h average transit speed
};

function DirectionsPanel({ 
  startPoint, 
  destination, 
  route, 
  onClose, 
  isVisible,
  setShowingDirections
}) {
  const [selectedMode, setSelectedMode] = useState('driving');
  const [isLoading, setIsLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState(route);

  // Initialize with the route prop when component mounts
  useEffect(() => {
    if (route) {
      setRouteInfo({
        ...route,
        mode: 'driving' // Set initial mode
      });
    }
  }, [route]);

  // Handle mode changes
  const handleModeChange = async (mode) => {
    setIsLoading(true);
    setSelectedMode(mode);

    try {
      // Keep the same distance but recalculate duration based on mode
      const distanceInKm = routeInfo.distance / 1000;
      const speedInKmh = TRANSPORT_SPEEDS[mode];
      const durationInHours = distanceInKm / speedInKmh;
      const durationInSeconds = Math.round(durationInHours * 3600);

      const newRouteInfo = {
        ...routeInfo,
        mode: mode,
        duration: durationInSeconds,
        instructions: routeInfo.instructions.map(instruction => {
          const stepDistanceKm = instruction.distance / 1000;
          const stepDurationHours = stepDistanceKm / speedInKmh;
          const stepDurationSeconds = Math.round(stepDurationHours * 3600);

          return {
            ...instruction,
            duration: stepDurationSeconds
          };
        })
      };

      setRouteInfo(newRouteInfo);
    } catch (error) {
      console.error('Error updating route:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
    const minutes = Math.ceil((seconds % 3600) / 60);
    
    if (hours > 0) {
      if (minutes === 0) {
        return `${hours}h`;
      }
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


            <div className="transport-modes">
              {getTransportModes().map(({ mode, icon, label }) => (
                <button 
                  key={mode} 
                  className={`mode-button ${selectedMode === mode ? 'active' : ''}`}
                  onClick={() => handleModeChange(mode)}
                  disabled={isLoading}
                >
                  <span className="mode-icon">{icon}</span>
                  <span className="mode-label">{label}</span>
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="loading-indicator">
                <div className="spinner"></div>
                <p>Calculating route...</p>
              </div>
            ) : routeInfo && (
              <div className="route-info">
                <div className="route-stats">
                  <div className="distance">
                    <i className="fas fa-road"></i>
                    <span>{formatDistance(routeInfo.distance)}</span>
                  </div>
                  <div className="duration">
                    <i className="fas fa-clock"></i>
                    <span>{formatDuration(routeInfo.duration)}</span>
                  </div>
                </div>

                {routeInfo.instructions && routeInfo.instructions.length > 0 && (
                  <div className="landmarks">
                    <h4>Key Landmarks</h4>
                    <ul>
                      {routeInfo.instructions.map((instruction, index) => (
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