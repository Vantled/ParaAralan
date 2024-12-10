import React, { useState, useEffect, useRef, useCallback } from 'react';
import searchApi from '../services/searchApi';
import debounce from 'lodash/debounce';

function FilterControls({ filters, setFilters, schools, onSchoolSelect, isAdmin, onAddPin, isAddingPin }) {
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const dropdownRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Use filterOptions from the API
  const filterOptions = searchApi.filterOptions;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowFilters(false);
      }
      
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSearchResults([]);
        setSearchTerm('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFilterSelect = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const handleSearch = async (searchTerm) => {
    setSearchTerm(searchTerm);
    try {
      const results = await searchApi.searchSchools(searchTerm, filters, schools);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  };

  // Debounce the search to prevent too many API calls
  const debouncedSearch = useCallback(
    debounce(async (term) => {
      await handleSearch(term);
    }, 300),
    [filters]
  );

  // Update the input handler
  const handleSearchInput = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.trim() === '') {
      setSearchResults([]);
    } else {
      handleSearch(term);
    }
  };

  const handleSchoolSelect = (school) => {
    onSchoolSelect(school);
    setSearchTerm('');
    setSearchResults([]);
  };

  const getActiveFiltersCount = () => {
    return searchApi.getActiveFiltersCount(filters);
  };

  const clearAllFilters = () => {
    setFilters(searchApi.clearAllFilters());
  };

  return (
    <div className="filter-controls" ref={dropdownRef}>
      <div className="search-container" ref={searchContainerRef}>
        <span className="search-icon">⌕</span>
        <input
          type="text"
          className="search-input"
          placeholder="Search schools, programs, or location..."
          value={searchTerm}
          onChange={handleSearchInput}
        />
        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((school) => (
              <div
                key={school.id}
                className="search-result-item"
                onClick={() => handleSchoolSelect(school)}
              >
                <div className="school-name">{school.name}</div>
                <div className="school-details">
                  <span className="location">{school.location}</span>
                  {school.type && <span className="type">{school.type}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="filter-button-container">
        <button 
          className={`filter-button ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <i className="fas fa-filter"></i>
          Filters
          {getActiveFiltersCount() > 0 && (
            <span className="filter-count">{getActiveFiltersCount()}</span>
          )}
        </button>

        {showFilters && (
          <div className="filters-dropdown">
            <div className="filters-header">
              <h3>Filters</h3>
              {getActiveFiltersCount() > 0 && (
                <button className="clear-filters" onClick={clearAllFilters}>
                  Clear all
                </button>
              )}
            </div>
            {Object.entries(filterOptions).map(([filterType, { title, options }]) => (
              <div key={filterType} className="filter-section">
                <h4>{title}</h4>
                <div className="filter-options">
                  <label className="filter-option">
                    <input
                      type="radio"
                      name={filterType}
                      checked={filters[filterType] === ''}
                      onChange={() => handleFilterSelect(filterType, '')}
                    />
                    <span>All {title}</span>
                  </label>
                  {options.map((option, index) => (
                    <label key={index} className="filter-option">
                      <input
                        type="radio"
                        name={filterType}
                        checked={filters[filterType] === option}
                        onChange={() => handleFilterSelect(filterType, option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
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