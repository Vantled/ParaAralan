import React, { useEffect, useRef } from 'react';

function ProfilePromptNotification({ onClose }) {
  const notificationRef = useRef(null);
  let touchStartX = 0;

  useEffect(() => {
    // Handle menu icon click
    const handleMenuClick = (e) => {
      if (e.target.closest('.hamburger-menu')) {
        onClose();
      }
    };

    // Handle add pin click
    const handleAddPinClick = (e) => {
      if (e.target.closest('.add-pin-button')) {
        onClose();
      }
    };

    // Handle footer links click
    const handleFooterClick = (e) => {
      if (e.target.closest('.policy-link')) {
        onClose();
      }
    };

    // Add event listeners
    document.addEventListener('click', handleMenuClick);
    document.addEventListener('click', handleAddPinClick);
    document.addEventListener('click', handleFooterClick);

    return () => {
      document.removeEventListener('click', handleMenuClick);
      document.removeEventListener('click', handleAddPinClick);
      document.removeEventListener('click', handleFooterClick);
    };
  }, [onClose]);

  // Touch handlers for swipe
  const handleTouchStart = (e) => {
    touchStartX = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!touchStartX) return;

    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX;

    // If swiped right more than 100px
    if (diff > 100) {
      const notification = notificationRef.current;
      if (notification) {
        notification.style.transform = `translateX(${diff}px)`;
        notification.style.opacity = `${1 - (diff / 300)}`;
      }
    }
  };

  const handleTouchEnd = (e) => {
    const currentX = e.changedTouches[0].clientX;
    const diff = currentX - touchStartX;

    if (diff > 100) {
      onClose();
    } else {
      // Reset position if not swiped enough
      const notification = notificationRef.current;
      if (notification) {
        notification.style.transform = '';
        notification.style.opacity = '';
      }
    }
    touchStartX = 0;
  };

  return (
    <div 
      ref={notificationRef}
      className="profile-prompt-notification"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <i className="fas fa-arrow-right"></i>
      <div className="notification-content">
        <p>Hey there! Complete your profile to discover schools that match your interests.</p>
        <p className="notification-hint">Click the menu icon <i className="fas fa-bars"></i> to access your profile</p>
      </div>
      <button onClick={onClose} className="notification-close">×</button>
      <style jsx>{`
        .profile-prompt-notification {
          position: fixed;
          top: 80px;
          right: 20px;
          background: linear-gradient(45deg, #3498db, #2980b9);
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: flex-start;
          gap: 12px;
          max-width: 300px;
          z-index: 2000;
          animation: slideIn 0.3s ease-out;
          transition: transform 0.3s ease, opacity 0.3s ease;
          touch-action: pan-x;
        }

        .notification-content {
          flex: 1;
        }

        .profile-prompt-notification i {
          font-size: 1.2rem;
          margin-top: 3px;
        }

        .notification-hint {
          font-size: 0.8rem !important;
          opacity: 0.9;
          margin-top: 4px !important;
          font-style: italic;
        }

        .notification-hint i {
          font-size: 0.8rem;
          margin: 0 2px;
        }

        .notification-close {
          background: none;
          border: none;
          color: white;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0;
          opacity: 0.8;
          transition: opacity 0.2s;
          margin-top: -4px;
        }

        .notification-close:hover {
          opacity: 1;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .profile-prompt-notification {
            top: 70px;
            right: 10px;
            left: 10px;
            max-width: none;
            touch-action: pan-x;
            will-change: transform, opacity;
          }
        }
      `}</style>
    </div>
  );
}

export default ProfilePromptNotification; 