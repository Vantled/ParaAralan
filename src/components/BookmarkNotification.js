import React from 'react';

function BookmarkNotification({ message, isVisible, type }) {
  return (
    <div className={`bookmark-notification ${isVisible ? 'show' : ''} ${type}`}>
      <i className={`fas ${type === 'remove' ? 'fa-bookmark-remove' : 'fa-bookmark'}`}></i>
      <span>{message}</span>
    </div>
  );
}

export default BookmarkNotification; 