import React, { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

function RegisterForm({ setUser, setUserType, showNotification, onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [type, setType] = useState('student');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      const db = getFirestore();
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: email,
        userType: type,
        schoolName: type === 'school' ? schoolName : null,
        createdAt: new Date().toISOString()
      });

      setUser(userCredential.user);
      setUserType(type);
      showNotification('Account successfully created!');
      onClose();
    } catch (error) {
      setError(error.message);
      showNotification(error.message, 'error');
    }
  };

  return (
    <div className="register-form">
      <h2>Register</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="student">Student</option>
          <option value="school">School</option>
        </select>
        
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {type === 'school' && (
          <input
            type="text"
            placeholder="School Name"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            required={type === 'school'}
          />
        )}

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default RegisterForm; 