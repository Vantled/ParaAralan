import React, { useState, useRef, useEffect } from 'react';

function FilterControls({ filters, setFilters, schools, onSchoolSelect }) {
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

  const handleSearch = (term) => {
    setSearchTerm(term);
    setShowSearchResults(term.length > 0);
  };

  const handleSchoolSelect = (school) => {
    onSchoolSelect(school);
    setSearchTerm('');
    setShowSearchResults(false);
  };

  // Move getFilteredSchools outside the component and export it
  const filteredSchools = schools.filter(school => {
    // Type filter
    if (filters.type && !school.type?.toLowerCase().includes(filters.type.toLowerCase())) {
      return false;
    }
    
    // Scholarship filter
    if (filters.hasScholarship !== null) {
      // Check if school has scholarships array and it's not empty
      const hasScholarships = school.scholarships && school.scholarships.length > 0;
      if (filters.hasScholarship !== hasScholarships) {
        return false;
      }
    }
    
    return true;
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
            {filteredSchools.map((school) => (
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
        <button onClick={() => setShowTypeDropdown(!showTypeDropdown)}>
          {filters.type || 'School Type'}
        </button>
        {showTypeDropdown && (
          <div className="dropdown-content">
            <div onClick={() => handleTypeSelect('')}>All Types</div>
            <div onClick={() => handleTypeSelect('university')}>University</div>
            <div onClick={() => handleTypeSelect('college')}>College</div>
          </div>
        )}
      </div>

      <div className="filter-dropdown">
        <button onClick={() => setShowScholarshipDropdown(!showScholarshipDropdown)}>
          {filters.hasScholarship === null
            ? 'Scholarship'
            : filters.hasScholarship
            ? 'Has Scholarship'
            : 'No Scholarship'}
        </button>
        {showScholarshipDropdown && (
          <div className="dropdown-content">
            <div onClick={() => handleScholarshipSelect(null)}>All</div>
            <div onClick={() => handleScholarshipSelect(true)}>Has Scholarship</div>
            <div onClick={() => handleScholarshipSelect(false)}>No Scholarship</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FilterControls; 