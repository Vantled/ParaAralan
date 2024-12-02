import React, { useState } from 'react';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

function RegisterForm({ setUser, setUserType, onClose, showNotification }) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState(null);
  
  // Basic Account Info (Step 1)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Personal Information (Step 2)
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

  // Educational Background (Step 3)
  const [educationInfo, setEducationInfo] = useState({
    currentSchool: '',
    gradeLevel: '',
    graduationYear: '',
    track: '',
    intendedMajor: '',
    preferredLocation: '',
    schoolType: ''
  });

  // Optional Information (Step 4)
  const [optionalInfo, setOptionalInfo] = useState({
    guardianName: '',
    guardianContact: '',
    careerGoals: '',
    preferredJobLocation: '',
    communicationPreference: []
  });

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
        if (!email || !password || !confirmPassword) {
          setError("Please fill in all required fields");
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
    setError(null);

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
    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="form-step">
            <h3>Create Your Account</h3>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
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
      <h2>Register New Account</h2>
      <div className="step-indicator">
        Step {step} of 4
      </div>
      <form onSubmit={step === 4 ? handleSubmit : (e) => e.preventDefault()}>
        {renderStep()}
        {error && <p className="error">{error}</p>}
        <div className="form-buttons">
          {step > 1 && (
            <button type="button" onClick={handleBack} className="back-button">
              Back
            </button>
          )}
          {step < 4 ? (
            <button type="button" onClick={handleNext} className="next-button">
              Next
            </button>
          ) : (
            <button type="submit" className="submit-button">
              Complete Registration
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default RegisterForm; 