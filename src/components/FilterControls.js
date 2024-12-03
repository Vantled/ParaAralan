import React, { useState, useRef, useEffect } from 'react';

function FilterControls({ filters, setFilters, schools, onSchoolSelect, isAdmin, onAddPin, isAddingPin }) {
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showScholarshipDropdown, setShowScholarshipDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);

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
    setShowSearchResults(searchTerm.length > 0);
  };

  const handleSchoolSelect = (school) => {
    onSchoolSelect(school);
    setSearchTerm('');
    setShowSearchResults(false);
  };

  // Filter schools based on search term - match only from the beginning of strings
  const searchResults = schools.filter(school => {
    const term = searchTerm.toLowerCase();
    return (
      school.name.toLowerCase().startsWith(term) ||
      school.location?.toLowerCase().startsWith(term) ||
      school.type?.toLowerCase().startsWith(term)
    );
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="filter-controls">
      <div className="search-container" ref={searchRef}>
        <span className="search-icon">⌕</span>
        <input
          type="text"
          className="search-input"
          placeholder="Search schools..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {showSearchResults && searchTerm && (
          <div className="search-results">
            {searchResults.length > 0 ? (
              searchResults.map((school) => (
                <div
                  key={school.id}
                  className="search-result-item"
                  onClick={() => handleSchoolSelect(school)}
                >
                  {school.name}
                </div>
              ))
            ) : (
              <div className="search-result-item no-results">
                No schools found
              </div>
            )}
          </div>
        )}
      </div>

      <div className="filter-dropdown">
        <button onClick={() => setShowTypeDropdown(!showTypeDropdown)}>
          {filters.type || 'School Type'}
        </button>
        <div className={`dropdown-content ${showTypeDropdown ? 'show' : ''}`}>
          <div style={{'--item-index': 0}} onClick={() => handleTypeSelect('')}>All Types</div>
          <div style={{'--item-index': 1}} onClick={() => handleTypeSelect('university')}>University</div>
          <div style={{'--item-index': 2}} onClick={() => handleTypeSelect('college')}>College</div>
        </div>
      </div>

      <div className="filter-dropdown">
        <button onClick={() => setShowScholarshipDropdown(!showScholarshipDropdown)}>
          {filters.hasScholarship === null
            ? 'Scholarship'
            : filters.hasScholarship
            ? 'Has Scholarship'
            : 'No Scholarship'}
        </button>
        <div className={`dropdown-content ${showScholarshipDropdown ? 'show' : ''}`}>
          <div style={{'--item-index': 0}} onClick={() => handleScholarshipSelect(null)}>All</div>
          <div style={{'--item-index': 1}} onClick={() => handleScholarshipSelect(true)}>Has Scholarship</div>
          <div style={{'--item-index': 2}} onClick={() => handleScholarshipSelect(false)}>No Scholarship</div>
        </div>
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