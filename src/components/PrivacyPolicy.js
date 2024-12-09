import React from 'react';

function PrivacyPolicy({ onClose }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-content policy-modal">
        <button className="close-button" onClick={onClose}>×</button>
        <div className="policy-content">
          <h2>Privacy Policy</h2>
          <p className="last-updated">Last Updated: March 14, 2024</p>

          <section className="policy-section">
            <h3>1. Information We Collect</h3>
            <p>We collect information that you provide directly to us, including:</p>
            <ul>
              <li>Name and contact information when you create an account</li>
              <li>Location data when using our mapping features</li>
              <li>Information about schools you bookmark or review</li>
              <li>Communications you have with us</li>
            </ul>
          </section>

          <section className="policy-section">
            <h3>2. How We Use Your Information</h3>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide and improve our school mapping services</li>
              <li>Personalize your experience</li>
              <li>Send you important updates and notifications</li>
              <li>Maintain the security of our platform</li>
            </ul>
          </section>

          <section className="policy-section">
            <h3>3. Data Security</h3>
            <p>We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.</p>
          </section>

          <section className="policy-section">
            <h3>4. Your Rights</h3>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of certain data collection</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy; 