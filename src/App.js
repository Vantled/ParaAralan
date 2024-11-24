import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Notification from './components/Notification';
import 'leaflet/dist/leaflet.css';
import './App.css';
import L from 'leaflet';
import logo from './logo.png';
import SchoolForm from './components/SchoolForm';

const firebaseConfig = {
  apiKey: "AIzaSyDAb6sQNxCsTDBHhgLDDbjPe38IL9T2Twg",
  authDomain: "school-mapping-app-8025b.firebaseapp.com",
  projectId: "school-mapping-app-8025b",
  storageBucket: "school-mapping-app-8025b.firebasestorage.app",
  messagingSenderId: "375851263755",
  appId: "1:375851263755:web:3f658dbe9b9418870ca40e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Update these constants for a wider Calamba-Los Baños area
const CALAMBA_LOSBANOS_BOUNDS = [
  [14.1000, 121.1000], // Southwest coordinates (includes Calamba)
  [14.2500, 121.3000]  // Northeast coordinates (includes Los Baños)
];

const MIN_ZOOM = 12;  // Decreased minimum zoom to show both areas
const MAX_ZOOM = 18;
const DEFAULT_CENTER = {
  lat: 14.1746, // Adjusted center point between Calamba and Los Baños
  lng: 121.2000  // Adjusted to center between both cities
};

// Add this constant for pin types
const SCHOOL_TYPES = {
  UNIVERSITY: 'university',
  COLLEGE: 'college'
};

// Add this custom pin style near the top of your file
const customPin = L.divIcon({
  className: 'custom-pin',
  html: `
    <div class="pin-container">
      <div class="pin-pulse"></div>
      <div class="pin"></div>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

// Create a new MapControls component that will be used inside MapContainer
function MapControls({ setUserLocation }) {
  const map = useMap();  // This is now safe because it's inside MapContainer

  const handleLocationClick = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const location = [latitude, longitude];
          setUserLocation(location);
          map.flyTo(location, 16, {
            duration: 2
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  return (
    <button className="location-button" onClick={handleLocationClick}>
      📍 My Location
    </button>
  );
}

function UserLocationMarker({ position }) {
  return position ? (
    <div>
      <div className="user-location-pulse" style={{
        left: position[0],
        top: position[1]
      }}></div>
      <div className="user-location-arrow" style={{
        left: position[0],
        top: position[1]
      }}></div>
    </div>
  ) : null;
}

// Create a new MapContent component that will be used inside MapContainer
function MapContent({ 
  handleMapClick, 
  schools, 
  setSelectedSchool, 
  selectedSchool, 
  user, 
  userType, 
  handleEditSchool, 
  userLocation, 
  compassHeading,
  setUserLocation,
  currentMapView,
  mapLayers
}) {
  const map = useMap();  // This is now safe because it's inside MapContainer

  useEffect(() => {
    if (map) {
      map.on('click', handleMapClick);
    }
    return () => {
      if (map) {
        map.off('click', handleMapClick);
      }
    };
  }, [map, handleMapClick]);

  return (
    <>
      <TileLayer
        key={currentMapView}
        url={mapLayers[currentMapView].url}
        attribution={mapLayers[currentMapView].attribution}
        bounds={CALAMBA_LOSBANOS_BOUNDS}
      />
      <MapControls setUserLocation={setUserLocation} />
      {userLocation && (
        <Marker 
          position={userLocation}
          icon={L.divIcon({
            className: 'user-location-container',
            html: `
              <div class="user-location-pulse"></div>
              <div class="user-location-arrow" style="transform: translate(-50%, -50%) rotate(${compassHeading}deg)"></div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })}
        />
      )}
      {schools.map((school) => (
        <Marker
          key={school.id}
          position={[school.position.lat, school.position.lng]}
          icon={customPin}
          eventHandlers={{
            click: () => setSelectedSchool(school),
          }}
        >
          {selectedSchool && selectedSchool.id === school.id && (
            <Popup>
              <div className="info-window">
                <img 
                  src={logo} 
                  alt={`${school.name} logo`} 
                  className="school-logo"
                />
                <h3>{school.name}</h3>
                <p><strong>Type:</strong> {school.type.charAt(0).toUpperCase() + school.type.slice(1)}</p>
                <p><strong>Contact:</strong> {school.contact}</p>
                <p><strong>Courses:</strong> {school.courses.join(', ')}</p>
                <p><strong>Requirements:</strong> {school.requirements}</p>
                <p><strong>Tuition Fees:</strong> {school.tuitionFees}</p>
                <p><strong>Scholarships Available:</strong> {school.hasScholarship ? 'Yes' : 'No'}</p>
                <a 
                  href={school.websiteUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="website-link"
                >
                  Visit their website!
                </a>
                {user && userType === 'school' && selectedSchool.createdBy === user.uid && (
                  <button 
                    onClick={() => handleEditSchool(selectedSchool)}
                    className="edit-button"
                  >
                    Edit Information
                  </button>
                )}
              </div>
            </Popup>
          )}
        </Marker>
      ))}
    </>
  );
}

// Update the Map component
function Map(props) {
  const [currentMapView, setCurrentMapView] = useState('default');
  const [initialPosition, setInitialPosition] = useState([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]);

  const mapLayers = {
    default: {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>'
    },
    complete: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',  // OpenStreetMap with all POIs
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setInitialPosition([latitude, longitude]);
          props.setUserLocation([latitude, longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
          setInitialPosition([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]);
        }
      );
    }
  }, []);

  return (
    <>
      <div className="map-view-control">
        <select
          value={currentMapView}
          onChange={(e) => setCurrentMapView(e.target.value)}
        >
          <option value="default">Default View</option>
          <option value="satellite">Satellite View</option>
          <option value="complete">Complete View</option>
        </select>
      </div>

      <MapContainer
        center={initialPosition}
        zoom={13}
        style={{ height: 'calc(100vh - 70px)', marginTop: '70px' }}
        maxBounds={CALAMBA_LOSBANOS_BOUNDS}
        maxBoundsViscosity={1.0}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        doubleClickZoom={false}
        boundsOptions={{ padding: [50, 50] }}
        wheelDebounceTime={100}
        wheelPxPerZoomLevel={100}
        zoomControl={false}
      >
        <MapContent 
          {...props} 
          currentMapView={currentMapView}
          mapLayers={mapLayers}
        />
      </MapContainer>
    </>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [isAddingPin, setIsAddingPin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [filters, setFilters] = useState({
    course: '',
    hasScholarship: null
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [newSchoolData, setNewSchoolData] = useState(null);
  const [mapView, setMapView] = useState('default');
  const [notification, setNotification] = useState(null);
  const [isLoginClosing, setIsLoginClosing] = useState(false);
  const [isRegisterClosing, setIsRegisterClosing] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [compassHeading, setCompassHeading] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSchoolForm, setShowSchoolForm] = useState(false);
  const [newPinLocation, setNewPinLocation] = useState(null);

  useEffect(() => {
    // Fetch schools from Firebase
    const fetchSchools = async () => {
      const schoolsCollection = collection(db, 'schools');
      const schoolSnapshot = await getDocs(schoolsCollection);
      const schoolList = schoolSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSchools(schoolList);
    };

    fetchSchools();
  }, []);

  const handleMapClick = async (event) => {
    if (isAddingPin && userType === 'school' && user) {
      const clickedPosition = event.latlng;
      setNewPinLocation(clickedPosition);
      setShowSchoolForm(true);
      setIsAddingPin(false);
    }
  };

  const handleSchoolFormSubmit = async (schoolData) => {
    const newSchool = {
      ...schoolData,
      position: {
        lat: newPinLocation.lat,
        lng: newPinLocation.lng
      },
      createdBy: user.uid,
      createdAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, 'schools'), newSchool);
      setSchools([...schools, { ...newSchool, id: docRef.id }]);
      setIsAddingPin(false);
      setShowSchoolForm(false);
      setNewPinLocation(null);
      showNotification('School added successfully!');
    } catch (error) {
      showNotification('Error adding school: ' + error.message, 'error');
    }
  };

  const handleScholarshipConfirm = async (hasScholarship) => {
    if (newSchoolData) {
      const schoolWithScholarship = {
        ...newSchoolData,
        hasScholarship
      };

      const docRef = await addDoc(collection(db, 'schools'), schoolWithScholarship);
      setSchools([...schools, { ...schoolWithScholarship, id: docRef.id }]);
      setIsAddingPin(false);
      setShowConfirmDialog(false);
      setNewSchoolData(null);
    }
  };

  const handleEditSchool = async (school) => {
    if (userType === 'school' && school.createdBy === user.uid) {
      const schoolType = prompt('Enter school type (university/college):', school.type).toLowerCase();
      
      if (schoolType !== 'university' && schoolType !== 'college') {
        showNotification('Please enter either "university" or "college"', 'error');
        return;
      }

      const updatedSchool = {
        ...school,
        type: schoolType,
        name: prompt('Enter school name:', school.name),
        logo: prompt('Enter logo URL:', school.logo),
        contact: prompt('Enter contact information:', school.contact),
        courses: prompt('Enter courses offered (comma-separated):', school.courses.join(',')).split(',').map(course => course.trim()),
        requirements: prompt('Enter enrollment requirements:', school.requirements),
        tuitionFees: prompt('Enter tuition fees:', school.tuitionFees),
        websiteUrl: prompt('Enter school website URL:', school.websiteUrl)
      };

      try {
        const schoolRef = doc(db, 'schools', school.id);
        await updateDoc(schoolRef, updatedSchool);
        
        setSchools(schools.map(s => 
          s.id === school.id ? updatedSchool : s
        ));
        
        setSelectedSchool(updatedSchool);
        showNotification('School information updated successfully!');
      } catch (error) {
        console.error("Error updating school: ", error);
        showNotification('Failed to update school information', 'error');
      }
    }
  };

  const filteredSchools = schools.filter(school => {
    if (filters.course && !school.courses.some(course => 
      course.toLowerCase().includes(filters.course.toLowerCase())
    )) {
      return false;
    }
    if (filters.hasScholarship !== null && school.hasScholarship !== filters.hasScholarship) {
      return false;
    }
    return true;
  });

  const FilterControls = () => {
    return (
      <div className="filter-controls">
        <input
          type="text"
          placeholder="Search by course (e.g., CCS)"
          value={filters.course}
          onChange={(e) => setFilters(prev => ({ ...prev, course: e.target.value }))}
        />
        <select
          value={filters.hasScholarship === null ? '' : filters.hasScholarship}
          onChange={(e) => setFilters(prev => ({
            ...prev,
            hasScholarship: e.value === '' ? null : e.value === 'true'
          }))}
        >
          <option value="">All Schools</option>
          <option value="true">With Scholarship</option>
          <option value="false">Without Scholarship</option>
        </select>
      </div>
    );
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000); // Hide after 3 seconds
  };

  const handleCloseLogin = () => {
    setIsLoginClosing(true);
    setTimeout(() => {
      setShowLoginModal(false);
      setIsLoginClosing(false);
    }, 300);
  };

  const handleCloseRegister = () => {
    setIsRegisterClosing(true);
    setTimeout(() => {
      setShowRegisterModal(false);
      setIsRegisterClosing(false);
    }, 300);
  };

  useEffect(() => {
    let watchId;

    const handleOrientation = (event) => {
      let heading;
      
      if (event.webkitCompassHeading) {
        // For iOS devices
        heading = event.webkitCompassHeading;
      } else if (event.alpha) {
        // For Android devices
        heading = 360 - event.alpha;
      }

      if (heading !== undefined) {
        setCompassHeading(heading);
      }
    };

    if (userLocation) {
      if (window.DeviceOrientationEvent) {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
          // iOS 13+ devices
          DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
              if (permissionState === 'granted') {
                window.addEventListener('deviceorientation', handleOrientation);
              }
            })
            .catch(console.error);
        } else {
          // Non iOS 13+ devices
          window.addEventListener('deviceorientation', handleOrientation);
        }
      }

      // Watch position for more accurate location updates
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
        },
        null,
        { enableHighAccuracy: true }
      );
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [userLocation]);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setUser(null);
    setUserType(null);
    setShowLogoutConfirm(false);
    showNotification('Successfully logged out!');
  };

  return (
    <div className="App">
      <div className="header">
        <div className="header-left">
          <img src={logo} alt="ParaAralan Logo" className="header-logo" />
          <h1 className="app-title">Welcome to ParaAralan!</h1>
        </div>
        {user ? (
          <div className="user-controls">
            <h2>Welcome, {user.email}</h2>
            {userType === 'school' && (
              <button onClick={() => setIsAddingPin(!isAddingPin)}>
                {isAddingPin ? 'Cancel Adding Pin' : 'Add School Pin'}
              </button>
            )}
            <button onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <div className="auth-buttons">
            <button onClick={() => setShowLoginModal(true)}>Login</button>
            <button onClick={() => setShowRegisterModal(true)}>Register</button>
          </div>
        )}
      </div>

      {userType === 'student' && <FilterControls />}

      {/* Add modal states and components */}
      {showLoginModal && (
        <div className={`modal-backdrop ${isLoginClosing ? 'closing' : ''}`} 
             onClick={handleCloseLogin}>
          <div className={`modal-content ${isLoginClosing ? 'closing' : ''}`} 
               onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={handleCloseLogin}>×</button>
            <LoginForm 
              setUser={setUser} 
              setUserType={setUserType}
              onClose={handleCloseLogin}
              showNotification={showNotification}
            />
          </div>
        </div>
      )}

      {showRegisterModal && (
        <div className={`modal-backdrop ${isRegisterClosing ? 'closing' : ''}`} 
             onClick={handleCloseRegister}>
          <div className={`modal-content ${isRegisterClosing ? 'closing' : ''}`} 
               onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={handleCloseRegister}>×</button>
            <RegisterForm 
              setUser={setUser} 
              setUserType={setUserType}
              onClose={handleCloseRegister}
              showNotification={showNotification}
            />
          </div>
        </div>
      )}

      {showConfirmDialog && (
        <div className="modal-backdrop" onClick={() => setShowConfirmDialog(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Does this school offer scholarships?</h3>
            <div className="confirmation-buttons">
              <button onClick={() => handleScholarshipConfirm(true)}>Yes</button>
              <button onClick={() => handleScholarshipConfirm(false)}>No</button>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="modal-backdrop" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={() => setShowLogoutConfirm(false)}>×</button>
            <h3>Are you sure you want to logout?</h3>
            <div className="confirmation-buttons">
              <button className="logout-yes" onClick={confirmLogout}>Yes, Logout</button>
              <button onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showSchoolForm && (
        <div className="modal-backdrop" onClick={() => setShowSchoolForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={() => setShowSchoolForm(false)}>×</button>
            <SchoolForm
              onSubmit={handleSchoolFormSubmit}
              onCancel={() => {
                setShowSchoolForm(false);
                setNewPinLocation(null);
                setIsAddingPin(false);
              }}
            />
          </div>
        </div>
      )}

      <Map
        handleMapClick={handleMapClick}
        schools={filteredSchools}
        setSelectedSchool={setSelectedSchool}
        selectedSchool={selectedSchool}
        user={user}
        userType={userType}
        handleEditSchool={handleEditSchool}
        userLocation={userLocation}
        compassHeading={compassHeading}
        setUserLocation={setUserLocation}
      />

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}

export default App;
