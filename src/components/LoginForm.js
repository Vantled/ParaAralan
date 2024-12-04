import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail, fetchSignInMethodsForEmail } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import LoadingSpinner from './LoadingSpinner';

function LoginForm({ setUser, setUserType, onClose, showNotification }) {
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

      setUser(userCredential.user);
      setUserType(userData?.userType || 'student');
      showNotification('Successfully logged in!');
      onClose();
      window.location.reload();
    } catch (error) {
      setError(error.message);
      showNotification(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsResetting(true);
    const auth = getAuth();

    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, resetEmail);
      
      if (signInMethods.length === 0) {
        setError('No account found with this email address.');
        showNotification('No account found with this email address.', 'error');
        return;
      }

      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
      setError('');
      showNotification('Password reset email sent! Please check your inbox.', 'success');
    } catch (error) {
      if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
        showNotification('Please enter a valid email address.', 'error');
      } else {
        setError(error.message);
        showNotification(error.message, 'error');
      }
    } finally {
      setIsResetting(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="login-form">
        <h2>Reset Password</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {resetSent ? (
          <div className="reset-success">
            <p>Password reset email has been sent!</p>
            <p>Please check your email and follow the instructions.</p>
            <button onClick={() => {
              setShowForgotPassword(false);
              setResetSent(false);
              setResetEmail('');
            }}>
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword}>
            <input
              type="email"
              placeholder="Enter your email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
              disabled={isResetting}
            />
            <div className="reset-buttons">
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
              <button 
                type="button" 
                onClick={() => setShowForgotPassword(false)}
                className="back-button"
                disabled={isResetting}
              >
                Back to Login
              </button>
            </div>
          </form>
        )}
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
            className="forgot-password-button"
            disabled={isLoading}
          >
            Forgot Password?
          </button>
          <button 
            type="button"
            onClick={onClose}
            className="create-account-button"
            disabled={isLoading}
          >
            Don't have an account? <span className="link-text">Create one</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default LoginForm; 