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
    target: '.map-view-control',
    title: 'Map View Options',
    content: 'Switch between different map views: Default, Satellite, or Complete view to see different map details.',
    placement: 'left',
    offset: { top: -100, left: -100 }
  },
  {
    target: '.custom-zoom-control',
    title: 'Navigation Controls',
    content: 'Use these controls to zoom in/out and locate your current position on the map.',
    placement: 'left',
    offset: { top: -100, left: -100 }
  },
  {
    target: '.location-button',
    title: 'My Location',
    content: 'Click here to find and center the map on your current location.',
    placement: 'left',
    offset: { top: -50, left: -100 }
  },
  {
    target: '.school-details-container',
    title: 'School Information',
    content: 'View detailed information about schools, including programs, requirements, and directions.',
    placement: 'right',
    offset: { top: 0, left: 20 },
    beforeShow: async (setSelectedSchool, schools, currentStep) => {
      if (currentStep === steps.length - 1) {
        const lspuLB = schools.find(school => 
          school.name.includes("Laguna State Polytechnic University")
        );
        
        if (lspuLB) {
          setSelectedSchool(lspuLB);
        }
      }
    },
    onHide: (setSelectedSchool) => {
      setSelectedSchool(null);
    }
  }
];

function HowItWorksTour({ onClose, isVisible, setSelectedSchool, schools }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [pointerPosition, setPointerPosition] = useState({ top: 0, left: 0 });

  // Reset function
  const resetTour = () => {
    // Always clear selected school when resetting
    setSelectedSchool(null);
    
    // Then handle current step cleanup
    const currentStepData = steps[currentStep];
    if (currentStepData.onHide) {
      currentStepData.onHide(setSelectedSchool);
    }
    
    setCurrentStep(0);
    onClose();
  };

  useEffect(() => {
    if (isVisible) {
      // Initialize tour when it becomes visible
      setCurrentStep(0);
      positionTooltip();
    } else {
      // Clean up when tour becomes invisible
      setSelectedSchool(null);
    }
  }, [isVisible, setSelectedSchool]);

  useEffect(() => {
    if (isVisible) {
      const currentStepData = steps[currentStep];
      // Only execute beforeShow for the last step
      if (currentStepData.beforeShow && currentStep === steps.length - 1) {
        currentStepData.beforeShow(setSelectedSchool, schools, currentStep);
      } else {
        // Clear selected school for all other steps
        setSelectedSchool(null);
      }
      
      setTimeout(positionTooltip, 50);
    }
  }, [currentStep, isVisible, schools]);

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
    const currentStepData = steps[currentStep];
    if (currentStepData.onHide) {
      currentStepData.onHide(setSelectedSchool);
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="tour-overlay" onClick={resetTour} />
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
        <div className="tour-tooltip-content" onClick={e => e.stopPropagation()}>
          <h3>{steps[currentStep].title}</h3>
          <p>{steps[currentStep].content}</p>
          
          <div className="tour-controls">
            <div className="tour-progress">
              {Array.from({ length: 7 }).map((_, index) => (
                <span 
                  key={index} 
                  className={`tour-dot ${index === currentStep ? 'active' : ''}`}
                />
              ))}
            </div>
            
            <div className="tour-buttons">
              <button onClick={resetTour} className="tour-skip-btn">
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