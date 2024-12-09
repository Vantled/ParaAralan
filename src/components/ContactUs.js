import React, { useState } from 'react';

function ContactUs({ onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');

    // Simulate sending email (replace with actual email service)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setStatus('error');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content contact-modal">
        <button className="close-button" onClick={onClose}>×</button>
        <div className="contact-content">
          <h2>Contact Us</h2>
          <p className="contact-intro">Have questions or suggestions? We'd love to hear from you.</p>

          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="5"
              />
            </div>

            <button 
              type="submit" 
              className={`submit-button ${status}`}
              disabled={status === 'sending'}
            >
              {status === 'sending' ? 'Sending...' : 'Send Message'}
            </button>

            {status === 'success' && (
              <p className="success-message">Message sent successfully!</p>
            )}
            {status === 'error' && (
              <p className="error-message">Failed to send message. Please try again.</p>
            )}
          </form>

          <div className="contact-info">
            <h3>Other Ways to Reach Us</h3>
            <p><strong>Email:</strong> support@paraaralan.com</p>
            <p><strong>Phone:</strong> (123) 456-7890</p>
            <p><strong>Address:</strong> Los Baños, Laguna, Philippines</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactUs; 