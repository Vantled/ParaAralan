import React, { useState } from 'react';
import { createUserWithEmailAndPassword, getAuth, fetchSignInMethodsForEmail } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import emailjs from '@emailjs/browser';

function RegisterForm({ setUser, setUserType, onClose, showNotification, setShowLoginModal }) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Email and OTP states
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  
  // Password states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Other form states remain the same
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    nickname: '',
    gender: '',
    birthdate: '',
    address: {
      street: '',
      barangay: '',
      city: '',
      province: ''
    },
    phone: ''
  });

  const [educationInfo, setEducationInfo] = useState({
    currentSchool: '',
    gradeLevel: '',
    graduationYear: '',
    track: '',
    intendedMajor: '',
    preferredLocation: '',
    schoolType: ''
  });

  const [optionalInfo, setOptionalInfo] = useState({
    guardianName: '',
    guardianContact: '',
    careerGoals: '',
    preferredJobLocation: '',
    communicationPreference: []
  });

  // Add new state for email validation
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);

  // Function to generate OTP
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Function to check if email exists
  const checkEmailExists = async (email) => {
    const auth = getAuth();
    const db = getFirestore();
    console.log('Checking email:', email);
    
    try {
      // Check Firebase Authentication
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      console.log('Auth sign in methods:', signInMethods);
      const existsInAuth = signInMethods.length > 0;
      console.log('Exists in Auth:', existsInAuth);

      // Check Firestore Database
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      const existsInFirestore = !querySnapshot.empty;
      console.log('Exists in Firestore:', existsInFirestore);

      // Email exists if it's found in either Auth or Firestore
      const emailExists = existsInAuth || existsInFirestore;
      console.log('Final email exists check:', emailExists);

      return emailExists;

    } catch (error) {
      console.error("Error checking email:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      return false;
    }
  };

  // Function to validate email format
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Function to handle email input with existence check
  const handleEmailChange = async (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setIsEmailValid(false);
    setError(null);

    // Clear previous states when email changes
    setIsOtpSent(false);
    setIsOtpVerified(false);
    setOtp('');

    if (!isValidEmail(newEmail)) {
      return;
    }

    setIsCheckingEmail(true);
    try {
      const exists = await checkEmailExists(newEmail);
      if (exists) {
        setError('This email is already registered. Please login instead.');
      } else {
        setIsEmailValid(true);
      }
    } catch (error) {
      console.error("Error checking email:", error);
      setError('Error checking email availability');
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Updated sendOTP function with email existence check
  const sendOTP = async () => {
    setIsVerifying(true);
    setError(null);

    if (!email || !isValidEmail(email)) {
      setError("Please enter a valid email address");
      setIsVerifying(false);
      return;
    }

    try {
      // Check if email exists before sending OTP
      const exists = await checkEmailExists(email);
      
      if (exists) {
        setError('This email is already registered. Please login instead.');
        setIsVerifying(false);
        return;
      }

      // Only proceed with OTP if email doesn't exist
      const newOtp = generateOTP();
      setGeneratedOtp(newOtp);

      const templateParams = {
        to_email: email,
        otp: newOtp,
      };

      await emailjs.send(
        'service_7damv5c',
        'template_mb7uu6z',
        templateParams,
        'vJVkTjl2-yufZAdOY'
      );

      setIsOtpSent(true);
      showNotification('OTP sent to your email!', 'success');
    } catch (error) {
      console.error("Error:", error);
      showNotification('Failed to send OTP. Please try again.', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  // Function to verify OTP
  const verifyOTP = () => {
    if (otp === generatedOtp) {
      setIsOtpVerified(true);
      showNotification('Email verified successfully!', 'success');
    } else {
      showNotification('Invalid OTP. Please try again.', 'error');
    }
  };

  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setPersonalInfo(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setPersonalInfo(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleEducationInfoChange = (e) => {
    const { name, value } = e.target;
    setEducationInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOptionalInfoChange = (e) => {
    const { name, value } = e.target;
    setOptionalInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateStep = () => {
    setError(null);
    switch (step) {
      case 1:
        if (!email || !isOtpVerified || !password || !confirmPassword) {
          setError("Please complete email verification and password fields");
          return false;
        }
        if (password !== confirmPassword) {
          setError("Passwords don't match");
          return false;
        }
        if (password.length < 6) {
          setError("Password must be at least 6 characters long");
          return false;
        }
        return true;

      case 2:
        if (!personalInfo.firstName || !personalInfo.lastName || !personalInfo.birthdate) {
          setError("Please fill in all required fields");
          return false;
        }
        return true;

      case 3:
        if (!educationInfo.currentSchool || !educationInfo.gradeLevel) {
          setError("Please fill in all required fields");
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const auth = getAuth();
      const db = getFirestore();
      
      // Create authentication account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Store additional user data in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        ...personalInfo,
        ...educationInfo,
        ...optionalInfo,
        email,
        userType: 'student',
        createdAt: new Date().toISOString()
      });

      setUser(userCredential.user);
      setUserType('student');
      showNotification('Registration successful!');
      onClose();
      window.location.reload();
    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    onClose(); // Close register modal
    setShowLoginModal(true); // Open login modal
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="form-step">
            <h3>Create Your Account</h3>
            <div className="form-group">
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={handleEmailChange}
                disabled={isOtpVerified}
                required
              />
              {isCheckingEmail && (
                <div className="email-checking">
                  <span className="button-spinner"></span>
                  Checking email...
                </div>
              )}
              {!isOtpVerified && isEmailValid && (
                <button
                  type="button"
                  onClick={sendOTP}
                  disabled={isVerifying || !email || isOtpSent || !isEmailValid}
                  className="send-otp-button"
                >
                  {isVerifying ? (
                    <>
                      <span className="button-spinner"></span>
                      Sending OTP...
                    </>
                  ) : isOtpSent ? (
                    'OTP Sent'
                  ) : (
                    'Send OTP'
                  )}
                </button>
              )}
            </div>

            {isOtpSent && !isOtpVerified && (
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={verifyOTP}
                  className="verify-otp-button"
                >
                  Verify OTP
                </button>
              </div>
            )}

            {isOtpVerified && (
              <>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </>
            )}
          </div>
        );

      case 2:
        return (
          <div className="form-step">
            <h3>Personal Information</h3>
            
            <div className="name-fields">
              <div>
                <label className="form-field-label">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={personalInfo.firstName}
                  onChange={handlePersonalInfoChange}
                  required
                />
              </div>
              <div>
                <label className="form-field-label">Middle Name</label>
                <input
                  type="text"
                  name="middleName"
                  placeholder="Middle Name (Optional)"
                  value={personalInfo.middleName}
                  onChange={handlePersonalInfoChange}
                />
              </div>
              <div>
                <label className="form-field-label">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={personalInfo.lastName}
                  onChange={handlePersonalInfoChange}
                  required
                />
              </div>
            </div>

            <div>
              <label className="form-field-label">Nickname (Optional)</label>
              <input
                type="text"
                name="nickname"
                placeholder="Nickname"
                value={personalInfo.nickname}
                onChange={handlePersonalInfoChange}
              />
            </div>

            <div>
              <label className="form-field-label">Gender (Optional)</label>
              <select
                name="gender"
                value={personalInfo.gender}
                onChange={handlePersonalInfoChange}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Prefer not to say</option>
              </select>
            </div>

            <div className="date-field">
              <label className="form-field-label">Birthdate</label>
              <input
                type="date"
                name="birthdate"
                value={personalInfo.birthdate}
                onChange={handlePersonalInfoChange}
                required
              />
              <span className="field-hint">Click to select your date of birth</span>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="form-step">
            <h3>Educational Background</h3>
            <input
              type="text"
              name="currentSchool"
              placeholder="Current School"
              value={educationInfo.currentSchool}
              onChange={handleEducationInfoChange}
              required
            />
            <select
              name="gradeLevel"
              value={educationInfo.gradeLevel}
              onChange={handleEducationInfoChange}
              required
            >
              <option value="">Select Grade Level</option>
              <option value="grade12">Grade 12</option>
              <option value="grade11">Grade 11</option>
              <option value="grade10">Grade 10</option>
            </select>
            <select
              name="track"
              value={educationInfo.track}
              onChange={handleEducationInfoChange}
            >
              <option value="">Select Track/Strand</option>
              <option value="stem">STEM</option>
              <option value="humss">HUMSS</option>
              <option value="abm">ABM</option>
              <option value="gas">GAS</option>
              <option value="tvl">TVL</option>
            </select>
          </div>
        );

      case 4:
        return (
          <div className="form-step">
            <h3>Additional Information (Optional)</h3>
            <input
              type="text"
              name="guardianName"
              placeholder="Parent/Guardian Name"
              value={optionalInfo.guardianName}
              onChange={handleOptionalInfoChange}
            />
            <input
              type="text"
              name="guardianContact"
              placeholder="Parent/Guardian Contact"
              value={optionalInfo.guardianContact}
              onChange={handleOptionalInfoChange}
            />
            <textarea
              name="careerGoals"
              placeholder="Career Goals"
              value={optionalInfo.careerGoals}
              onChange={handleOptionalInfoChange}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="register-form">
      <h2>Register</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        {renderStep()}
        <button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="button-spinner"></span>
              Registering...
            </>
          ) : (
            'Register'
          )}
        </button>
        
        <div className="form-links">
          <div className="login-link">
            Already have an account? 
            <button 
              type="button"
              onClick={handleLogin}
              className="text-link"
              disabled={isLoading}
            >
              Login here
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default RegisterForm; 