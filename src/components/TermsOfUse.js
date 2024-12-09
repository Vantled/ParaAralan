import React from 'react';

function TermsOfUse({ onClose }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-content policy-modal">
        <button className="close-button" onClick={onClose}>×</button>
        <div className="policy-content">
          <h2>Terms of Use</h2>
          <p className="last-updated">Last Updated: March 14, 2024</p>

          <section className="policy-section">
            <h3>1. Acceptance of Terms</h3>
            <p>By accessing and using ParaAralan, you accept and agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use our service.</p>
          </section>

          <section className="policy-section">
            <h3>2. User Responsibilities</h3>
            <p>As a user of ParaAralan, you agree to:</p>
            <ul>
              <li>Provide accurate information when creating an account</li>
              <li>Maintain the confidentiality of your account credentials</li>
              <li>Use the service in compliance with all applicable laws</li>
              <li>Not misuse or attempt to harm the platform</li>
            </ul>
          </section>

          <section className="policy-section">
            <h3>3. Content Guidelines</h3>
            <p>When contributing content (reviews, comments, etc.), you must:</p>
            <ul>
              <li>Provide truthful and accurate information</li>
              <li>Respect intellectual property rights</li>
              <li>Not post harmful or offensive content</li>
              <li>Not spam or misuse the platform</li>
            </ul>
          </section>

          <section className="policy-section">
            <h3>4. Service Modifications</h3>
            <p>We reserve the right to modify or discontinue any part of our service at any time without notice.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default TermsOfUse; 