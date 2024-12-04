import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip } from 'react-leaflet';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Notification from './components/Notification';
import 'leaflet/dist/leaflet.css';
import './App.css';
import L from 'leaflet';
import 'leaflet-routing-machine';
import logo from './logo.png';
import SchoolForm from './components/SchoolForm';
import { onAuthStateChanged } from 'firebase/auth';
import FilterControls from './components/FilterControls';
import SchoolEditForm from './components/SchoolEditForm';
import LoadingSpinner from './components/LoadingSpinner';
import SchoolDetailsModal from './components/SchoolDetailsModal';

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

// Update these constants for showing Luzon
const LUZON_VIEW_BOUNDS = [
  [11.5000, 116.0000], // Southwest coordinates of Luzon (adjusted wider)
  [19.0000, 124.0000]  // Northeast coordinates of Luzon (adjusted wider)
];

const MAX_ZOOM = 18;  // Maximum zoom level (closest)
const MIN_ZOOM = 7;   // Minimum zoom level (adjusted to show more area)
const DEFAULT_CENTER = {
  lat: 14.1746,  // Changed back to Calamba/Los Baños center
  lng: 121.2000
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
  const map = useMap();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLocationClick = async () => {
    setIsLoading(true);
    setError(null);

    // Check if we're in a secure context
    if (!window.isSecureContext) {
      setError("Location requires a secure connection (HTTPS)");
      setIsLoading(false);
      return;
    }

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setIsLoading(false);
      return;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      });

      const { latitude, longitude } = position.coords;
      const location = [latitude, longitude];
      
      setUserLocation(location);
      map.flyTo(location, 16, {
        duration: 2
      });
      
      setIsLoading(false);

    } catch (error) {
      console.error("Location error:", error);
      let errorMessage;
      
      if (error.code === 1) {
        errorMessage = "Location access was denied. Please check your browser settings and ensure you're using HTTPS.";
      } else if (error.code === 2) {
        errorMessage = "Unable to determine your location. Please try again.";
      } else if (error.code === 3) {
        errorMessage = "Location request timed out. Please try again.";
      } else {
        errorMessage = "Unable to access location services. Please try again.";
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        className={`location-button ${isLoading ? 'loading' : ''} ${error ? 'error' : ''}`}
        onClick={handleLocationClick}
        disabled={isLoading}
        title="Click to find your current location"
      >
        {isLoading ? (
          <>
            <span className="button-spinner"></span>
            Getting location...
          </>
        ) : error ? (
          '⚠️ Location Error'
        ) : (
          '📍 My Location'
        )}
      </button>
      {error && (
        <div className="location-error-tooltip">
          {error}
        </div>
      )}
    </>
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

// Add this custom zoom control component
function CustomZoomControl({ map }) {
  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    if (map.getZoom() > MIN_ZOOM) {
      map.zoomOut();
    }
  };

  return (
    <div className="custom-zoom-control">
      <button onClick={handleZoomIn} className="zoom-button">+</button>
      <button onClick={handleZoomOut} className="zoom-button">−</button>
    </div>
  );
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
  mapLayers,
  isAdmin,
  setMapRef,
  setShowDeleteConfirm
}) {
  const map = useMap();
  const [routingControl, setRoutingControl] = useState(null);
  const [showingDirections, setShowingDirections] = useState(false);
  const markerRef = useRef(null);

  // Store map reference when component mounts
  useEffect(() => {
    if (map) {
      setMapRef(map);
    }
  }, [map, setMapRef]);

  // Add cleanup effect for routing control
  useEffect(() => {
    return () => {
      if (routingControl) {
        routingControl.remove();
      }
    };
  }, [routingControl]);

  const showDirections = (schoolPosition) => {
    if (userLocation && map) {
      // Remove existing route if any
      if (routingControl) {
        routingControl.remove();
        setRoutingControl(null);
        setShowingDirections(false);
      } else {
        try {
          // Create new route
          const control = L.Routing.control({
            waypoints: [
              L.latLng(userLocation[0], userLocation[1]),
              L.latLng(schoolPosition[0], schoolPosition[1])
            ],
            router: L.Routing.osrmv1({
              serviceUrl: 'https://router.project-osrm.org/route/v1'
            }),
            routeWhileDragging: false,
            lineOptions: {
              styles: [
                { color: '#3498db', opacity: 0.8, weight: 4 }
              ]
            },
            show: false,
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            createMarker: function() { return null; }
          });

          control.addTo(map);
          setRoutingControl(control);
          setShowingDirections(true);
        } catch (error) {
          console.error('Error showing directions:', error);
        }
      }
    }
  };

  useEffect(() => {
    if (map) {
      // Add or remove modal-active class based on selectedSchool
      if (selectedSchool) {
        map.getContainer().classList.add('modal-active');
      } else {
        map.getContainer().classList.remove('modal-active');
      }
      
      map.on('click', handleMapClick);
    }
    return () => {
      if (map) {
        map.off('click', handleMapClick);
        map.getContainer().classList.remove('modal-active');
      }
    };
  }, [map, handleMapClick, selectedSchool]);

  return (
    <>
      <div className={`modal-overlay ${selectedSchool ? 'active' : ''}`} />
      <TileLayer
        key={currentMapView}
        url={mapLayers[currentMapView].url}
        attribution={mapLayers[currentMapView].attribution}
        bounds={LUZON_VIEW_BOUNDS}
      />
      <div className="map-controls-container">
        <CustomZoomControl map={map} />
        <MapControls setUserLocation={setUserLocation} />
      </div>
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
        >
          <Popup closeButton={true}>
            <div className="info-window" style={{ padding: '0.5rem 1rem' }}>
              <h3 style={{ margin: '0.5rem 0' }}>You are here</h3>
            </div>
          </Popup>
        </Marker>
      )}
      {schools.map((school) => (
        <Marker
          key={school.id}
          position={[school.position.lat, school.position.lng]}
          icon={customPin}
          eventHandlers={{
            click: () => setSelectedSchool(school)
          }}
          data-school-id={school.id}
        >
          <Tooltip>{school.name}</Tooltip>
        </Marker>
      ))}
    </>
  );
}

// Update the Map component
function Map({ mapRef, ...props }) {
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
        center={[DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]}
        zoom={15}
        style={{ 
          height: window.innerWidth <= 768 ? 'calc(100vh - 140px)' : 'calc(100vh - 70px)', 
          marginTop: window.innerWidth <= 768 ? '140px' : '70px' 
        }}
        onClick={props.handleMapClick}
        maxBounds={LUZON_VIEW_BOUNDS}
        maxBoundsViscosity={1.0}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        doubleClickZoom={false}
        boundsOptions={{ padding: [50, 50] }}
        wheelDebounceTime={100}
        wheelPxPerZoomLevel={100}
        zoomControl={false}
        tap={true}
        preferCanvas={true}
        keepBuffer={8}
        updateWhenZooming={false}
        updateWhenIdle={true}
        bounds={LUZON_VIEW_BOUNDS}
        className={props.isAddingPin ? 'adding-pin' : ''}
      >
        <TileLayer
          key={currentMapView}
          url={mapLayers[currentMapView].url}
          attribution={mapLayers[currentMapView].attribution}
          bounds={LUZON_VIEW_BOUNDS}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          tileSize={256}
          keepBuffer={8}
          updateWhenIdle={true}
          updateWhenZooming={false}
          noWrap={true}
          className="map-tiles"
        />
        <MapContent 
          {...props} 
          currentMapView={currentMapView}
          mapLayers={mapLayers}
          isAdmin={props.isAdmin}
          setMapRef={(map) => mapRef.current = map}
          setShowDeleteConfirm={props.setShowDeleteConfirm}
        />
      </MapContainer>
    </>
  );
}

// Add this new component near the top of your file
function HamburgerMenu({ user, handleLogout, setShowLoginModal, setShowRegisterModal }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleMenuClick = (action) => {
    setIsOpen(false);
    if (action === 'login') setShowLoginModal(true);
    if (action === 'register') setShowRegisterModal(true);
    if (action === 'logout') handleLogout();
  };

  return (
    <div className="hamburger-menu">
      <button 
        className={`menu-icon ${isOpen ? 'active' : ''}`} 
        onClick={toggleMenu}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div className={`menu-items ${isOpen ? 'active' : ''}`}>
        {user ? (
          <>
            <button onClick={() => handleMenuClick('profile')}>
              <i className="fas fa-user"></i> User Profile
            </button>
            <button onClick={() => handleMenuClick('bookmarks')}>
              <i className="fas fa-bookmark"></i> Bookmarks
            </button>
            <div className="divider"></div>
          </>
        ) : (
          <>
            <button onClick={() => handleMenuClick('login')}>
              <i className="fas fa-sign-in-alt"></i> Login
            </button>
            <button onClick={() => handleMenuClick('register')}>
              <i className="fas fa-user-plus"></i> Register
            </button>
            <div className="divider"></div>
          </>
        )}
        <button onClick={() => handleMenuClick('about')}>
          <i className="fas fa-info-circle"></i> About Us
        </button>
        <button onClick={() => handleMenuClick('howItWorks')}>
          <i className="fas fa-question-circle"></i> How it works
        </button>
        {user && (
          <>
            <div className="divider"></div>
            <button onClick={() => handleMenuClick('logout')}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function App() {
  const [routingControl, setRoutingControl] = useState(null);
  const [showingDirections, setShowingDirections] = useState(false);
  const mapRef = useRef(null);
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState('student');
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [isAddingPin, setIsAddingPin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState('');
  const [showEditForm, setShowEditForm] = useState(false);
  const [schoolToEdit, setSchoolToEdit] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch schools from Firebase
    const fetchSchools = async () => {
      setIsLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'schools'));
        const schoolsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSchools(schoolsData);
      } catch (error) {
        console.error("Error fetching schools:", error);
        showNotification('Error loading schools. Please try again.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchools();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Check admin status
        checkAdminStatus(user);
        
        // Fetch user data from Firestore
        const db = getFirestore();
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserName(userData.firstName || user.email);
            setUserType(userData.userType);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserName(user.email);
        }
      } else {
        setUser(null);
        setUserName('');
        setUserType(null);
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleMapClick = async (event) => {
    if (isAddingPin && isAdmin) {
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

  const handleEditSchool = (school) => {
    if (isAdmin) {
      setSchoolToEdit(school);
      setShowEditForm(true);
    }
  };

  const handleEditSubmit = async (updatedData) => {
    try {
      const schoolRef = doc(db, 'schools', schoolToEdit.id);
      await updateDoc(schoolRef, updatedData);
      
      setSchools(schools.map(s => 
        s.id === schoolToEdit.id ? { ...s, ...updatedData } : s
      ));
      
      setSelectedSchool({ ...schoolToEdit, ...updatedData });
      setShowEditForm(false);
      setSchoolToEdit(null);
      showNotification('School information updated successfully!');
    } catch (error) {
      console.error("Error updating school: ", error);
      showNotification('Failed to update school information', 'error');
    }
  };

  const handleDeleteSchool = async (schoolId) => {
    try {
      // Delete the school document from Firestore
      await deleteDoc(doc(db, 'schools', schoolId));
      
      // Update local state
      setSchools(schools.filter(school => school.id !== schoolId));
      
      // Close the edit form and selected school
      setShowEditForm(false);
      setSelectedSchool(null);
      setSchoolToEdit(null);
      
      // Close the delete confirmation modal
      setShowDeleteConfirm(false);
      
      // Show success notification
      showNotification('School deleted successfully!');
    } catch (error) {
      console.error("Error deleting school: ", error);
      showNotification('Failed to delete school', 'error');
      // Close the confirmation modal even if there's an error
      setShowDeleteConfirm(false);
    }
  };

  // Get filtered schools based on current filters
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

  const showNotification = (message, type = 'success', duration = 3000) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), duration);
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
    let orientationHandler;  // Define a reference to store the handler

    const handleOrientation = (event) => {  // Define the handler
      let heading;
      if (event.webkitCompassHeading) {
        heading = event.webkitCompassHeading;
      } else if (event.alpha) {
        heading = 360 - event.alpha;
      }
      if (heading !== undefined) {
        setCompassHeading(heading);
      }
    };
    orientationHandler = handleOrientation;  // Store the reference

    if (userLocation) {
      if (window.DeviceOrientationEvent) {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
          DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
              if (permissionState === 'granted') {
                window.addEventListener('deviceorientation', handleOrientation);
              }
            })
            .catch(console.error);
        } else {
          window.addEventListener('deviceorientation', handleOrientation);
        }
      }

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
        },
        null,
        { enableHighAccuracy: true }
      );
    }

    // Cleanup function
    return () => {
      if (window.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', orientationHandler);
      }
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [userLocation]);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      setUser(null);
      setUserType(null);
      setShowLogoutConfirm(false);
      showNotification('Successfully logged out!', 'success');
      
      // Add delay before refresh to show notification
      setTimeout(() => {
        window.location.reload();
      }, 1500); // 1.5 second delay
    } catch (error) {
      console.error("Logout error:", error);
      showNotification('Error logging out. Please try again.', 'error');
    }
  };

  // Add this function to check if the logged-in user is an admin
  const checkAdminStatus = async (user) => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    // You can store admin UIDs in Firebase or check against a specific email domain
    const adminEmails = ['andrei@admin.com']; // Change this to your actual admin email
    setIsAdmin(adminEmails.includes(user.email));
  };

  // Add this function to handle location button click
  const handleLocationRequest = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          
          // Define handleOrientation function
          const handleOrientation = (event) => {
            let heading;
            if (event.webkitCompassHeading) {
              heading = event.webkitCompassHeading;
            } else if (event.alpha) {
              heading = 360 - event.alpha;
            }
            if (heading !== undefined) {
              setCompassHeading(heading);
            }
          };
          
          // Request device orientation permission only after location is granted
          if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
              .then(permissionState => {
                if (permissionState === 'granted') {
                  window.addEventListener('deviceorientation', handleOrientation);
                }
              })
              .catch(console.error);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          showNotification("Unable to access location. Please enable location services.", "error");
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      showNotification("Geolocation is not supported by your browser", "error");
    }
  };

  const handleSchoolSearch = (school) => {
    console.log('handleSchoolSearch called with:', school);
    if (school && school.position && mapRef.current) {
      mapRef.current.flyTo([school.position.lat, school.position.lng], 16, {
        duration: 1.5,
        easeLinearity: 0.25
      });
      
      setSelectedSchool(school);
      
      const marker = document.querySelector(`[data-school-id="${school.id}"]`);
      if (marker) {
        marker.classList.add('highlight-pin');
        setTimeout(() => {
          marker.classList.remove('highlight-pin');
        }, 2000);
      }
    }
  };

  // Add this function near your other handlers
  const handleAddPinClick = () => {
    setIsAddingPin(!isAddingPin);
    if (!isAddingPin) {
      showNotification(
        "Click on the exact location of your school. Please be as precise as possible to ensure accurate mapping.", 
        "info",
        5000  // Show for 5 seconds
      );
    }
  };

  const showDirections = (schoolPosition) => {
    if (userLocation && mapRef.current) {
      // Remove existing route if any
      if (routingControl) {
        routingControl.remove();
        setRoutingControl(null);
        setShowingDirections(false);
      } else {
        try {
          // Create new route
          const control = L.Routing.control({
            waypoints: [
              L.latLng(userLocation[0], userLocation[1]),
              L.latLng(schoolPosition[0], schoolPosition[1])
            ],
            router: L.Routing.osrmv1({
              serviceUrl: 'https://router.project-osrm.org/route/v1'
            }),
            routeWhileDragging: false,
            lineOptions: {
              styles: [
                { color: '#3498db', opacity: 0.8, weight: 4 }
              ]
            },
            show: false,
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            createMarker: function() { return null; }
          });

          control.addTo(mapRef.current);
          setRoutingControl(control);
          setShowingDirections(true);
        } catch (error) {
          console.error('Error showing directions:', error);
        }
      }
    }
  };

  return (
    <div className="App">
      <div className="header">
        <div className="header-left">
          <img src={logo} alt="ParaAralan Logo" className="header-logo" />
          <h1 className="app-title">Welcome to ParaAralan!</h1>
        </div>
        {user && (
          <div className="user-welcome">
            <h2>Welcome, {userName}</h2>
          </div>
        )}
        <HamburgerMenu
          user={user}
          handleLogout={handleLogout}
          setShowLoginModal={setShowLoginModal}
          setShowRegisterModal={setShowRegisterModal}
        />
      </div>

      <FilterControls 
        filters={filters} 
        setFilters={setFilters}
        schools={schools}
        onSchoolSelect={handleSchoolSearch}
        isAdmin={isAdmin}
        onAddPin={handleAddPinClick}  // Changed from the inline function
        isAddingPin={isAddingPin}
      />

      {showDeleteConfirm && (
        <div className="delete-confirmation-modal">
          <div className="delete-confirmation-content">
            <h3>Delete School</h3>
            <p>Are you sure you want to delete this school? This action cannot be undone.</p>
            <div className="confirmation-buttons">
              <button 
                onClick={() => handleDeleteSchool(selectedSchool.id)}
                className="confirm-delete-button"
              >
                Yes, Delete
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="cancel-delete-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
          <div className="modal-content school-form-modal" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={() => setShowSchoolForm(false)}>×</button>
            <SchoolForm
              onSubmit={handleSchoolFormSubmit}
              onCancel={() => {
                setShowSchoolForm(false);
                setNewPinLocation(null);
                setIsAddingPin(false);
              }}
              showNotification={showNotification}
            />
          </div>
        </div>
      )}

      {showEditForm && (
        <div className="modal-backdrop">
          <div className="modal-content large-modal">
            <button className="close-button" onClick={() => setShowEditForm(false)}>×</button>
            <SchoolEditForm
              school={schoolToEdit}
              onSubmit={handleEditSubmit}
              onCancel={() => setShowEditForm(false)}
              onDelete={handleDeleteSchool}
              showNotification={showNotification}
            />
          </div>
        </div>
      )}

      <Map
        mapRef={mapRef}
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
        isAdmin={isAdmin}
        setShowDeleteConfirm={setShowDeleteConfirm}
      />

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {selectedSchool && (
        <div className="school-details-container">
          <SchoolDetailsModal
            school={selectedSchool}
            onClose={() => {
              setSelectedSchool(null);
              if (routingControl) {
                routingControl.remove();
                setRoutingControl(null);
                setShowingDirections(false);
              }
            }}
            userLocation={userLocation}
            showDirections={(position) => {
              if (userLocation) {
                showDirections(position);
              }
            }}
            isAdmin={isAdmin}
            handleEditSchool={handleEditSchool}
            showingDirections={showingDirections}
            setShowDeleteConfirm={setShowDeleteConfirm}
          />
        </div>
      )}
    </div>
  );
}

export default App;
