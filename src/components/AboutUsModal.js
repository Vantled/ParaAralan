import React from 'react';

function AboutUsModal({ onClose }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-content about-us-modal">
        <button className="close-button" onClick={onClose}>×</button>
        
        <div className="about-us-content">
          <h2>About ParaAralan</h2>
          
          <section className="mission-section">
            <h3>Our Mission</h3>
            <p>
              ParaAralan aims to help students find their ideal educational path by providing 
              comprehensive information about schools in their area. We strive to make education 
              more accessible by connecting students with schools that match their needs and aspirations.
            </p>
          </section>

          <section className="features-section">
            <h3>Key Features</h3>
            <ul>
              <li>Interactive school mapping</li>
              <li>Detailed school information</li>
              <li>School comparison tools</li>
              <li>Scholarship information</li>
              <li>Real-time directions</li>
            </ul>
          </section>

          <section className="team-section">
            <h3>Our Team</h3>
            <div className="team-members">
              <div className="team-member">
                <h4>Andrei Nikolai Limpiada</h4>
                <p>Lead Developer</p>
              </div>
              <div className="team-member">
                <h4>Sean D. Pacanan</h4>
                <p>Developer</p>
              </div>
              <div className="team-member">
                <h4>del Johnver C. Pascual</h4>
                <p>Developer</p>
              </div>
              <div className="team-member">
                <h4>Vince Ardrei Pecayo</h4>
                <p>Developer</p>
              </div>
            </div>
          </section>

          <section className="contact-section">
            <h3>Contact Us</h3>
            <p>Have questions or suggestions? Reach out to us:</p>
            <div className="contact-info">
              <p>Email: support@paraaralan.com</p>
              <p>Phone: (123) 456-7890</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default AboutUsModal; 