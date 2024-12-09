import algoliaService from './algoliaService';

// Helper functions for search and filter operations
const searchApi = {
  // Text matching helpers
  partialMatch: (text, searchTerm) => {
    if (!text) return false;
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  },

  arrayPartialMatch: (array, searchTerm) => {
    if (!array || !Array.isArray(array)) return false;
    return array.some(item => {
      if (typeof item === 'string') {
        return searchApi.partialMatch(item, searchTerm);
      }
      if (typeof item === 'object') {
        return Object.values(item).some(value => 
          typeof value === 'string' && searchApi.partialMatch(value, searchTerm)
        );
      }
      return false;
    });
  },

  // Use Algolia's filter options
  filterOptions: algoliaService.filterOptions,

  // Update search function to use Algolia
  searchSchools: async (query, filters, schools) => {
    if (!query) return [];
    
    try {
      // Use local search if query is short
      if (query.length < 3) {
        return schools.filter(school => {
          const searchTerm = query.toLowerCase();
          return (
            school.name?.toLowerCase().includes(searchTerm) ||
            school.location?.toLowerCase().includes(searchTerm) ||
            school.academicPrograms?.some(p => 
              p.name?.toLowerCase().includes(searchTerm) ||
              p.programs?.some(prog => prog.toLowerCase().includes(searchTerm))
            )
          );
        });
      }

      // Try Algolia search for longer queries
      const results = await algoliaService.search(query, filters, schools);
      return results.length > 0 ? results : schools.filter(school => {
        const searchTerm = query.toLowerCase();
        return (
          school.name?.toLowerCase().includes(searchTerm) ||
          school.location?.toLowerCase().includes(searchTerm) ||
          school.academicPrograms?.some(p => 
            p.name?.toLowerCase().includes(searchTerm) ||
            p.programs?.some(prog => prog.toLowerCase().includes(searchTerm))
          )
        );
      });
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to local search
      return schools.filter(school => {
        const searchTerm = query.toLowerCase();
        return (
          school.name?.toLowerCase().includes(searchTerm) ||
          school.location?.toLowerCase().includes(searchTerm) ||
          school.academicPrograms?.some(p => 
            p.name?.toLowerCase().includes(searchTerm) ||
            p.programs?.some(prog => prog.toLowerCase().includes(searchTerm))
          )
        );
      });
    }
  },

  // Update applyFilters to use Algolia
  applyFilters: async (schools, filters, userLocation) => {
    try {
      // Try Algolia search first
      const algoliaResults = await algoliaService.search('', {
        ...filters,
        _geoloc: userLocation ? {
          lat: userLocation[0],
          lng: userLocation[1]
        } : null
      }, schools);

      if (algoliaResults.length > 0) {
        return algoliaResults;
      }

      // Fallback to local filtering
      return schools.filter(school => {
        // Check scholarships
        if (filters.scholarships && school.scholarships) {
          const selectedScholarship = filters.scholarships.toLowerCase();
          const hasScholarship = school.scholarships.some(scholarship => 
            scholarship.toLowerCase().includes(selectedScholarship)
          );
          if (!hasScholarship) return false;
        }

        // ... other filter checks ...

        return true;
      });
    } catch (error) {
      console.error('Filter error:', error);
      return schools;
    }
  },

  // Utility functions
  getActiveFiltersCount: (filters) => {
    return Object.values(filters).filter(value => value !== '').length;
  },

  clearAllFilters: () => {
    return Object.keys(algoliaService.filterOptions).reduce((acc, key) => ({
      ...acc,
      [key]: ''
    }), {});
  }
};

export default searchApi;