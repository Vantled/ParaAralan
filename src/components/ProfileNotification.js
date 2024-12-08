import React, { useEffect } from 'react';

const ProfileNotification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Auto close after 3 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`profile-notification ${type}`}>
      <div className="profile-notification-content">
        <div className="profile-notification-icon">
          {type === 'success' && <i className="fas fa-check-circle"></i>}
          {type === 'error' && <i className="fas fa-exclamation-circle"></i>}
          {type === 'warning' && <i className="fas fa-exclamation-triangle"></i>}
        </div>
        <p>{message}</p>
      </div>
      <button className="profile-notification-close" onClick={onClose}>
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
};

export default ProfileNotification; 