import React, { useState, useEffect, useRef, useCallback } from 'react';
import searchApi from '../services/searchApi';
import debounce from 'lodash/debounce';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

function FilterControls({ filters, setFilters, schools, onSchoolSelect, isAdmin, onAddPin, isAddingPin, setShowRecommendations }) {
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const dropdownRef = useRef(null);
  const searchContainerRef = useRef(null);
  const [userProgram, setUserProgram] = useState('');
  const auth = getAuth();

  // Use filterOptions from the API
  const filterOptions = searchApi.filterOptions;

  // Handle outside clicks
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

  // Add effect to fetch user's program
  useEffect(() => {
    const fetchUserProgram = async () => {
      if (!auth.currentUser) return;

      try {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const userData = userDoc.data();
        
        if (userData?.desiredProgram) {
          setUserProgram(userData.desiredProgram);
        }
      } catch (error) {
        console.error('Error fetching user program:', error);
      }
    };

    fetchUserProgram();
  }, [auth.currentUser]);

  const handleSearch = async (term) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await searchApi.searchSchools(term, filters, schools);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  };

  const handleSearchInput = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    handleSearch(term);
  };

  const handleSchoolSelect = (school) => {
    onSchoolSelect(school);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleFilterSelect = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const getActiveFiltersCount = () => {
    return searchApi.getActiveFiltersCount(filters);
  };

  const clearAllFilters = () => {
    setFilters(searchApi.clearAllFilters());
  };

  // Update recommendations button click handler
  const handleRecommendationsClick = () => {
    if (userProgram) {
      setShowRecommendations(true);
    }
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
                className={`search-result-item`}
                onClick={() => handleSchoolSelect(school)}
              >
                <div className="school-name">
                  {school.name}
                </div>
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

        <button 
          className="recommendations-button"
          onClick={handleRecommendationsClick}
          title={userProgram ? "View Schools You Might Like" : "Complete your profile to see recommendations"}
          disabled={!userProgram}
        >
          <i className="fas fa-lightbulb"></i>
          <span className="recommendations-text">Recommendations</span>
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

      <style jsx>{`
        .school-name {
          display: flex;
          align-items: center;
        }

        .filter-button-container {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .recommendations-button {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          border: none;
          border-radius: 8px;
          background: linear-gradient(45deg, #3498db, #2ecc71);
          color: white;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
          overflow: hidden;
          width: 36px;
          height: 36px;
        }

        .recommendations-button i {
          font-size: 1rem;
          color: #ffd700;
          margin: 0;
          transition: margin 0.3s ease;
        }

        .recommendations-text {
          white-space: nowrap;
          opacity: 0;
          width: 0;
          transition: all 0.3s ease;
        }

        .recommendations-button:hover {
          width: 160px;
          padding: 0 1rem;
          justify-content: flex-start;
        }

        .recommendations-button:hover i {
          margin-right: 8px;
        }

        .recommendations-button:hover .recommendations-text {
          opacity: 1;
          width: auto;
        }

        .recommendations-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          background: linear-gradient(45deg, #95a5a6, #7f8c8d);
        }

        .recommendations-button:disabled i {
          color: #ddd;
        }
      `}</style>
    </div>
  );
}

export default FilterControls; 