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
        },
        {
          enableHighAccuracy: true,  // Request high accuracy
          timeout: 5000,  // Wait up to 5 seconds
          maximumAge: 0  // Always get fresh location
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
    if (userLocation) {
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
              L.latLng(schoolPosition.lat, schoolPosition.lng)
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
            createMarker: function() { return null; } // Remove waypoint markers
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
        bounds={LUZON_VIEW_BOUNDS}  // Show Luzon map tiles
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
        >
          <div className="pin-container" data-school-id={school.id}>
            <Tooltip 
              permanent 
              direction="top" 
              offset={[0, -30]} 
              className="school-name-label"
              opacity={1}
            >
              {school.name}
            </Tooltip>
          </div>
        </Marker>
      ))}
      {selectedSchool && (
        <div className="school-popup-modal active">
          <button 
            className="close-button" 
            onClick={() => {
              setSelectedSchool(null);
              if (routingControl) {
                routingControl.remove();
                setRoutingControl(null);
                setShowingDirections(false);
              }
            }}
          >
            ×
          </button>
          <div className="school-info-container">
            <h2 className="school-title">{selectedSchool.name}</h2>
            
            <div className="location-info">
              <span className="location-icon">📍</span>
              <span>{selectedSchool.location}</span>
            </div>

            <div className="contact-info">
              <div className="contact-item">
                <span>📞</span>
                <a href={`tel:${selectedSchool.contact}`}>{selectedSchool.contact}</a>
              </div>
              <button 
                className="website-button"
                onClick={() => window.open(selectedSchool.websiteUrl, '_blank')}
              >
                Visit Website
              </button>
            </div>

            <div className="info-section">
              <h3><span className="icon">🎓</span> Academic Programs Offered</h3>
              <div className="programs-list">
                {selectedSchool.academicPrograms?.map((college, index) => (
                  <div key={index} className="college-item">
                    <strong>{college.name}:</strong>
                    <ul className="programs-bullet-list">
                      {college.programs.map((program, progIndex) => (
                        <li key={progIndex}>{program}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {Object.keys(selectedSchool.admissionRequirements || {}).length > 0 && (
              <div className="info-section">
                <h3><span className="icon">📝</span> Admission Requirements</h3>
                {Object.entries(selectedSchool.admissionRequirements || {}).map(([type, requirements], index) => (
                  <div key={index} className="requirements-group">
                    <strong>For {type}:</strong>
                    <ul>
                      {requirements.map((req, reqIndex) => (
                        <li key={reqIndex}>{req}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {Object.keys(selectedSchool.tuitionFees || {}).length > 0 && (
              <div className="info-section">
                <h3><span className="icon">💰</span> Tuition Fees</h3>
                <div className="fees-list">
                  {Object.entries(selectedSchool.tuitionFees || {}).map(([fee, amount], index) => (
                    <div key={index} className="fee-item">
                      <span>{fee}:</span> <strong>₱{amount}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedSchool.scholarships?.length > 0 && (
              <div className="info-section">
                <h3><span className="icon">🎯</span> Scholarships Available</h3>
                <ul className="scholarships-list">
                  {selectedSchool.scholarships?.map((scholarship, index) => (
                    <li key={index}>{scholarship}</li>
                  ))}
                </ul>
              </div>
            )}

            {(selectedSchool.campusLife?.organizations?.length > 0 || 
              selectedSchool.campusLife?.facilities?.length > 0) && (
              <div className="info-section">
                <h3><span className="icon">🏫</span> Campus Life</h3>
                <div className="campus-info">
                  {selectedSchool.campusLife?.organizations?.length > 0 && (
                    <div className="campus-item">
                      <strong>Student Organizations:</strong>
                      <ul>
                        {selectedSchool.campusLife?.organizations?.map((org, index) => (
                          <li key={index}>{org}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedSchool.campusLife?.facilities?.length > 0 && (
                    <div className="campus-item">
                      <strong>Facilities:</strong>
                      <ul>
                        {selectedSchool.campusLife?.facilities?.map((facility, index) => (
                          <li key={index}>{facility}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="action-buttons">
              {userLocation && (
                <button
                  onClick={() => showDirections(selectedSchool.position)}
                  className="direction-button"
                >
                  {showingDirections ? 'Hide Directions' : 'Show Directions'}
                </button>
              )}
              {user && isAdmin && (
                <>
                  <button 
                    onClick={() => handleEditSchool(selectedSchool)}
                    className="edit-button"
                  >
                    Edit Information
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="delete-button"
                  >
                    Delete School
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
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
        zoom={15}  // Changed back to original zoom level
        style={{ 
          height: window.innerWidth <= 768 ? 'calc(100vh - 140px)' : 'calc(100vh - 70px)', 
          marginTop: window.innerWidth <= 768 ? '140px' : '70px' 
        }}
        onClick={props.handleMapClick}
        maxBounds={LUZON_VIEW_BOUNDS}
        maxBoundsViscosity={0.8}  // Slightly reduced to make panning smoother
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        doubleClickZoom={false}
        boundsOptions={{ padding: [50, 50] }}
        wheelDebounceTime={100}
        wheelPxPerZoomLevel={100}
        zoomControl={false}
        tap={true}
      >
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

function App() {
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

  return (
    <div className="App">
      <div className="header">
        <div className="header-left">
          <img src={logo} alt="ParaAralan Logo" className="header-logo" />
          <h1 className="app-title">Welcome to ParaAralan!</h1>
        </div>
        {user ? (
          <div className="user-controls">
            <h2>Welcome, {userName}</h2>
            <button onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <div className="auth-buttons">
            <button onClick={() => setShowLoginModal(true)}>Login</button>
            <button onClick={() => setShowRegisterModal(true)}>Register</button>
          </div>
        )}
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
    </div>
  );
}

export default App;
