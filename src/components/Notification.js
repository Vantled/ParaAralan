import React from 'react';

function Notification({ message, type, onClose }) {
  return (
    <div className={`notification ${type}`}>
      {message}
      <button onClick={onClose} className="notification-close">×</button>
    </div>
  );
}

export default Notification; 