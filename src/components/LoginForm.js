import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail, fetchSignInMethodsForEmail } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import LoadingSpinner from './LoadingSpinner';

function LoginForm({ setUser, setUserType, onClose, showNotification, setShowRegisterModal }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      const userData = userDoc.data();

      // Update user state
      setUser(userCredential.user);
      setUserType(userData?.userType || 'student');
      
      // Close modal first
      onClose();
      
      // Then show success notification
      showNotification('Successfully logged in!', 'success');
      
    } catch (error) {
      if (error.code === 'auth/invalid-credential') {
        setError('Incorrect email or password.');
      } else {
        setError('An error occurred. Please try again.');
        showNotification('An error occurred. Please try again.', 'error');
      }
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsResetting(true);
    setError('');
    const auth = getAuth();
    const db = getFirestore();

    try {
      // First check if the email is valid
      if (!resetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
        setError('Please enter a valid email address');
        setIsResetting(false);
        return;
      }

      // Check Firestore for the email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', resetEmail));
      const querySnapshot = await getDocs(q);
      const existsInFirestore = !querySnapshot.empty;

      // Check Firebase Auth for the email
      const signInMethods = await fetchSignInMethodsForEmail(auth, resetEmail);
      const existsInAuth = signInMethods.length > 0;

      // Email exists if it's found in either Auth or Firestore
      const emailExists = existsInAuth || existsInFirestore;

      if (!emailExists) {
        setError('No account found with this email address.');
        showNotification('No account found with this email address.', 'error');
        setIsResetting(false);
        return;
      }

      // If email exists, send reset email
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
      showNotification('Password reset email sent! Please check your inbox.', 'success');

    } catch (error) {
      console.error('Reset password error:', error);
      // Handle specific Firebase error codes
      switch (error.code) {
        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          showNotification('Please enter a valid email address.', 'error');
          break;
        case 'auth/too-many-requests':
          setError('Too many attempts. Please try again later.');
          showNotification('Too many attempts. Please try again later.', 'error');
          break;
        default:
          setError('An error occurred. Please try again.');
          showNotification('An error occurred. Please try again.', 'error');
      }
    } finally {
      setIsResetting(false);
    }
  };

  const handleCreateAccount = () => {
    onClose(); // Close login modal
    setShowRegisterModal(true); // Open register modal
  };

  if (showForgotPassword) {
    return (
      <div className="login-form">
        <h2>Reset Password</h2>
        {resetSent ? (
          <div className="reset-message success">
            <i className="fas fa-check-circle"></i>
            Password reset email has been sent! Please check your email.
          </div>
        ) : error ? (
          <div className="reset-message error">
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        ) : null}
        
        <form onSubmit={handleForgotPassword}>
          <input
            type="email"
            placeholder="Enter your email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            required
            disabled={isResetting || resetSent}
          />
          <div className="reset-buttons">
            {!resetSent && (
              <button type="submit" disabled={isResetting}>
                {isResetting ? (
                  <>
                    <span className="button-spinner"></span>
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            )}
            <button 
              type="button" 
              onClick={() => {
                setShowForgotPassword(false);
                setResetSent(false);
                setResetEmail('');
                setError('');
              }}
              className="back-button"
              disabled={isResetting}
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="login-form">
      <h2>Login</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="button-spinner"></span>
              Logging in...
            </>
          ) : (
            'Login'
          )}
        </button>
        <div className="form-links">
          <button 
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-link"
            disabled={isLoading}
          >
            Forgot Password?
          </button>
          <div className="register-link">
            Don't have an account? 
            <button 
              type="button"
              onClick={handleCreateAccount}
              className="text-link"
              disabled={isLoading}
            >
              Create one
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default LoginForm; 