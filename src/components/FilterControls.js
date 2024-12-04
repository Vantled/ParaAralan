import React, { useState, useEffect, useRef } from 'react';

function FilterControls({ filters, setFilters, schools, onSchoolSelect, isAdmin, onAddPin, isAddingPin }) {
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showScholarshipDropdown, setShowScholarshipDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const dropdownRef = useRef(null);

  // Handle clicks outside dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowTypeDropdown(false);
        setShowScholarshipDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTypeClick = () => {
    setShowTypeDropdown(!showTypeDropdown);
    setShowScholarshipDropdown(false); // Close scholarship dropdown
  };

  const handleScholarshipClick = () => {
    setShowScholarshipDropdown(!showScholarshipDropdown);
    setShowTypeDropdown(false); // Close type dropdown
  };

  const handleTypeSelect = (type) => {
    setFilters({ ...filters, type });
    setShowTypeDropdown(false);
  };

  const handleScholarshipSelect = (hasScholarship) => {
    setFilters({ ...filters, hasScholarship });
    setShowScholarshipDropdown(false);
  };

  const handleSearch = (searchTerm) => {
    setSearchTerm(searchTerm);
    setSearchResults(schools.filter(school => {
      const term = searchTerm.toLowerCase();
      return (
        school.name.toLowerCase().startsWith(term) ||
        school.location?.toLowerCase().startsWith(term) ||
        school.type?.toLowerCase().startsWith(term)
      );
    }));
  };

  const handleSchoolSelect = (school) => {
    onSchoolSelect(school);
    setSearchTerm('');
    setSearchResults([]);
  };

  return (
    <div className="filter-controls" ref={dropdownRef}>
      <div className="search-container">
        <span className="search-icon">⌕</span>
        <input
          type="text"
          className="search-input"
          placeholder="Search schools..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((school) => (
              <div
                key={school.id}
                className="search-result-item"
                onClick={() => handleSchoolSelect(school)}
              >
                {school.name}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="filter-dropdown">
        <button onClick={handleTypeClick}>
          {filters.type || 'School Type'}
        </button>
        {showTypeDropdown && (
          <div className="dropdown-content show">
            <div onClick={() => handleTypeSelect('')}>All Types</div>
            <div onClick={() => handleTypeSelect('university')}>University</div>
            <div onClick={() => handleTypeSelect('college')}>College</div>
          </div>
        )}
      </div>

      <div className="filter-dropdown">
        <button onClick={handleScholarshipClick}>
          {filters.hasScholarship === null
            ? 'Scholarship'
            : filters.hasScholarship
            ? 'Has Scholarship'
            : 'No Scholarship'}
        </button>
        {showScholarshipDropdown && (
          <div className="dropdown-content show">
            <div onClick={() => handleScholarshipSelect(null)}>All</div>
            <div onClick={() => handleScholarshipSelect(true)}>Has Scholarship</div>
            <div onClick={() => handleScholarshipSelect(false)}>No Scholarship</div>
          </div>
        )}
      </div>

      {isAdmin && (
        <button 
          className={`add-pin-button ${isAddingPin ? 'canceling' : ''}`}
          onClick={onAddPin}
        >
          {isAddingPin ? 'Cancel Adding Pin' : 'Add School Pin'}
        </button>
      )}
    </div>
  );
}

export default FilterControls; 