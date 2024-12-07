import React, { useState, useEffect } from 'react';

const steps = [
  {
    target: '.filter-controls',
    title: 'Search and Filter',
    content: 'Use these controls to search for schools and filter them by type, location, and other criteria.',
    placement: 'bottom',
    offset: { top: 10, left: 0 }
  },
  {
    target: '.leaflet-container',
    title: 'Interactive Map',
    content: 'Explore schools on the map. Click on pins to view school details.',
    placement: 'left',
    offset: { top: 0, left: 20 }
  },
  {
    target: '.hamburger-menu',
    title: 'Main Menu',
    content: 'Access your profile, bookmarks, and other features from here.',
    placement: 'left',
    offset: { top: 0, left: 10 }
  },
  {
    target: '.school-details-container',
    title: 'School Information',
    content: 'View detailed information about schools, including programs, requirements, and directions.',
    placement: 'left',
    offset: { top: 0, left: 20 }
  }
];

function HowItWorksTour({ onClose, isVisible }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [pointerPosition, setPointerPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isVisible) {
      setCurrentStep(0);
      positionTooltip();
    }
  }, [isVisible]);

  useEffect(() => {
    if (isVisible) {
      positionTooltip();
    }
  }, [currentStep]);

  const positionTooltip = () => {
    const targetElement = document.querySelector(steps[currentStep].target);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const placement = steps[currentStep].placement;
      const offset = steps[currentStep].offset || { top: 0, left: 0 };
      
      setPointerPosition({
        top: rect.top + (rect.height / 2),
        left: rect.left + (rect.width / 2)
      });

      let top, left;
      switch (placement) {
        case 'bottom':
          top = rect.bottom + offset.top;
          left = rect.left + (rect.width / 2) - 150 + offset.left;
          break;
        case 'top':
          top = rect.top - 160 + offset.top;
          left = rect.left + (rect.width / 2) - 150 + offset.left;
          break;
        case 'left':
          top = rect.top + (rect.height / 2) - 75 + offset.top;
          left = rect.left - 310 + offset.left;
          break;
        case 'right':
          top = rect.top + (rect.height / 2) - 75 + offset.top;
          left = rect.right + offset.left;
          break;
        default:
          top = rect.bottom + offset.top;
          left = rect.left + offset.left;
      }

      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const tooltipWidth = 300;
      const tooltipHeight = 150;

      if (left < 20) left = 20;
      if (left + tooltipWidth > windowWidth - 20) {
        left = windowWidth - tooltipWidth - 20;
      }

      if (top < 70) top = 70;
      if (top + tooltipHeight > windowHeight - 20) {
        top = windowHeight - tooltipHeight - 20;
      }

      setPosition({ top, left });
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="tour-overlay" onClick={() => onClose()} />
      <div 
        className="tour-pointer"
        style={{
          top: `${pointerPosition.top}px`,
          left: `${pointerPosition.left}px`
        }}
      />
      <div 
        className="tour-tooltip"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`
        }}
      >
        <div className="tour-tooltip-content">
          <h3>{steps[currentStep].title}</h3>
          <p>{steps[currentStep].content}</p>
          
          <div className="tour-controls">
            <div className="tour-progress">
              {steps.map((_, index) => (
                <span 
                  key={index} 
                  className={`tour-dot ${index === currentStep ? 'active' : ''}`}
                />
              ))}
            </div>
            
            <div className="tour-buttons">
              <button onClick={onClose} className="tour-skip-btn">
                Skip
              </button>
              <button onClick={handleNext} className="tour-next-btn">
                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default HowItWorksTour; 