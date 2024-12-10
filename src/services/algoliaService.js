import algoliasearch from 'algoliasearch';

const client = algoliasearch(
  process.env.REACT_APP_ALGOLIA_APP_ID,
  process.env.REACT_APP_ALGOLIA_SEARCH_KEY
);

const schoolsIndex = client.initIndex('schools');

const algoliaService = {
  // Filter options
  filterOptions: {
    academicPrograms: {
      title: 'Academic Programs',
      options: [
        'Engineering',
        'Business',
        'Arts and Sciences',
        'Information Technology',
        'Education',
        'Medicine',
        'Agriculture',
        'Architecture',
        'Tourism'
      ]
    },
    tuitionRange: {
      title: 'Tuition Range (per semester)',
      options: [
        'Under ₱30,000',
        '₱30,000 - ₱50,000',
        '₱50,000 - ₱70,000',
        '₱70,000 - ₱100,000',
        'Above ₱100,000'
      ]
    },
    scholarships: {
      title: 'Scholarships',
      options: [
        'Academic Scholarship',
        'Athletic Scholarship',
        'Government Scholarship',
        'Need-based Financial Aid',
        'Merit-based Scholarship',
        'Research Grant'
      ]
    },
    location: {
      title: 'Location',
      options: [
        'Los Baños',
        'Calamba',
        'Within 1km radius',
        'Within 3km radius',
        'Within 5km radius'
      ]
    },
    type: {
      title: 'Institution Type',
      options: [
        'University',
        'College',
        'State University'
      ]
    }
  },

  // Local search function as fallback
  localSearch: (schools, query = '', filters = {}) => {
    return schools.filter(school => {
      // Text search
      if (query) {
        const searchTerm = query.toLowerCase();
        const matchesSearch = 
          school.name?.toLowerCase().includes(searchTerm) ||
          school.location?.toLowerCase().includes(searchTerm) ||
          school.academicPrograms?.some(p => 
            p.name?.toLowerCase().includes(searchTerm) ||
            p.programs?.some(prog => prog.toLowerCase().includes(searchTerm))
          );
        if (!matchesSearch) return false;
      }

      // Filter matching with partial word matching
      if (filters.academicPrograms) {
        const searchWords = filters.academicPrograms.toLowerCase()
          .split(' ')
          .filter(word => !['of', 'and', 'the', 'in', 'for'].includes(word));

        const hasProgram = searchWords.some(word => {
          // Special handling for Medicine to include Nursing
          if (word === 'medicine') {
            return school.academicPrograms?.some(p => 
              p.name?.toLowerCase().includes('medicine') ||
              p.name?.toLowerCase().includes('nursing') ||
              p.programs?.some(prog => 
                prog.toLowerCase().includes('medicine') ||
                prog.toLowerCase().includes('nursing')
              )
            );
          }
          
          return (
            school.academicPrograms?.some(p => 
              p.name?.toLowerCase().includes(word) ||
              p.programs?.some(prog => prog.toLowerCase().includes(word))
            ) ||
            school.programs?.some(prog => 
              prog.toLowerCase().includes(word)
            ) ||
            school.name?.toLowerCase().includes(word) ||
            school.departments?.some(dept => 
              dept.toLowerCase().includes(word)
            )
          );
        });

        if (!hasProgram) return false;
      }

      // Tuition Range filter
      if (filters.tuitionRange && school.tuitionFees) {
        const ranges = {
          'Under ₱30,000': [0, 30000],
          '₱30,000 - ₱50,000': [30000, 50000],
          '₱50,000 - ₱70,000': [50000, 70000],
          '₱70,000 - ₱100,000': [70000, 100000],
          'Above ₱100,000': [100000, Infinity]
        };
        const [min, max] = ranges[filters.tuitionRange];
        const fee = Object.values(school.tuitionFees)[0];
        if (fee < min || fee > max) return false;
      }

      // Location filter
      if (filters.location) {
        if (filters.location.includes('Within') && school.position) {
          const radius = parseInt(filters.location.match(/\d+/)[0]);
          const distance = algoliaService.calculateDistance(
            filters._geoloc.lat,
            filters._geoloc.lng,
            school.position.lat,
            school.position.lng
          );
          if (distance > radius) return false;
        } else if (!school.location?.toLowerCase().includes(filters.location.toLowerCase())) {
          return false;
        }
      }

      // Type filter
      if (filters.type && school.type) {
        if (!school.type.toLowerCase().includes(filters.type.toLowerCase())) {
          return false;
        }
      }

      // Scholarship filter
      if (filters.scholarships && school.scholarships) {
        const selectedScholarship = filters.scholarships.toLowerCase();
        const hasScholarship = school.scholarships.some(scholarship => 
          scholarship.toLowerCase().includes(selectedScholarship)
        );
        if (!hasScholarship) return false;
      }

      return true;
    });
  },

  // Combined search function that tries Algolia first, falls back to local
  search: async (query = '', filters = {}, schools = []) => {
    try {
      const searchParams = {
        filters: algoliaService.buildFilters(filters),
        hitsPerPage: 20
      };

      if (filters._geoloc) {
        searchParams.aroundLatLng = `${filters._geoloc.lat}, ${filters._geoloc.lng}`;
        searchParams.aroundRadius = 5000;
      }

      const { hits } = await schoolsIndex.search(query, searchParams);
      
      if (hits && hits.length > 0) {
        return hits;
      }

      return algoliaService.localSearch(schools, query, filters);

    } catch (error) {
      console.error('Search error, falling back to local:', error);
      return algoliaService.localSearch(schools, query, filters);
    }
  },

  buildFilters: (filters) => {
    const filterStrings = [];

    if (filters.academicPrograms) {
      filterStrings.push(`programs:"${filters.academicPrograms}"`);
    }

    if (filters.tuitionRange) {
      const ranges = {
        'Under ₱30,000': [0, 30000],
        '₱30,000 - ₱50,000': [30000, 50000],
        '₱50,000 - ₱70,000': [50000, 70000],
        '₱70,000 - ₱100,000': [70000, 100000],
        'Above ₱100,000': [100000, Infinity]
      };
      const [min, max] = ranges[filters.tuitionRange];
      filterStrings.push(`tuitionFee:${min} TO ${max}`);
    }

    if (filters.type) {
      filterStrings.push(`type:"${filters.type}"`);
    }

    if (filters.scholarships) {
      filterStrings.push(`scholarships:"${filters.scholarships}"`);
    }

    return filterStrings.join(' AND ');
  },

  calculateDistance: (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
};

export default algoliaService;