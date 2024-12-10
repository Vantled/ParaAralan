import React, { useState, useEffect } from 'react';
import useHistory from '../hooks/useHistory';
import algoliaService from '../services/algoliaService';

function SchoolForm({ onSubmit, onCancel, showNotification }) {
  const {
    state: formData,
    setState: setFormData,
    undo,
    redo,
    canUndo,
    canRedo
  } = useHistory({
    name: '',
    type: '',
    location: '',
    contact: '',
    websiteUrl: '',
    academicPrograms: [],
    admissionRequirements: {},
    tuitionFees: {},
    scholarships: [],
    campusLife: { organizations: [], facilities: [] }
  });

  const [showConfirm, setShowConfirm] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const validTypes = ['University', 'College', 'State University'];
      if (!validTypes.includes(formData.type)) {
        alert('Please select a valid school type');
        return;
      }
      await onSubmit(formData);
      showNotification('School added successfully!');
    } catch (error) {
      console.error('Error adding school:', error);
      showNotification(error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="school-edit-form">
      <h2>Add School Information</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-group">
            <label>School Name:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Type:</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
            >
              <option value="">Select Type</option>
              <option value="University">University</option>
              <option value="College">College</option>
              <option value="State University">State University</option>
            </select>
          </div>
          <div className="form-group">
            <label>Location:</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Contact:</label>
            <input
              type="text"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Website URL:</label>
            <input
              type="url"
              value={formData.websiteUrl}
              onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Academic Programs</h3>
          {formData.academicPrograms.map((program, index) => (
            <div key={index} className="program-entry">
              <input
                type="text"
                value={program.name}
                onChange={(e) => {
                  const newPrograms = [...formData.academicPrograms];
                  newPrograms[index].name = e.target.value;
                  setFormData({ ...formData, academicPrograms: newPrograms });
                }}
                placeholder="College Name"
              />
              <textarea
                value={program.programs.join('\n')}
                onChange={(e) => {
                  const newPrograms = [...formData.academicPrograms];
                  newPrograms[index].programs = e.target.value.split('\n');
                  setFormData({ ...formData, academicPrograms: newPrograms });
                }}
                placeholder="Enter programs (one per line)"
              />
              <div className="remove-button-container">
                <button
                  type="button"
                  onClick={() => setShowConfirm(index)}
                >
                  Remove
                </button>
                <div className={`remove-confirm-popup ${showConfirm === index ? 'show' : ''}`}>
                  <p>Are you sure you want to remove this program?</p>
                  <div className="buttons">
                    <button 
                      className="confirm"
                      onClick={() => {
                        const newPrograms = formData.academicPrograms.filter((_, i) => i !== index);
                        setFormData({ ...formData, academicPrograms: newPrograms });
                        setShowConfirm(null);
                      }}
                    >
                      Yes
                    </button>
                    <button 
                      className="cancel"
                      onClick={() => setShowConfirm(null)}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              setFormData({
                ...formData,
                academicPrograms: [...formData.academicPrograms, { name: '', programs: [] }]
              });
            }}
          >
            Add Program
          </button>
        </div>

        <div className="form-section">
          <h3>Admission Requirements</h3>
          {Object.entries(formData.admissionRequirements).map(([type, requirements], index) => (
            <div key={index} className="requirement-entry">
              <input
                type="text"
                value={type}
                onChange={(e) => {
                  const newRequirements = { ...formData.admissionRequirements };
                  const oldType = type;
                  delete newRequirements[oldType];
                  newRequirements[e.target.value] = requirements;
                  setFormData({ ...formData, admissionRequirements: newRequirements });
                }}
                placeholder="Requirement Type (e.g., Freshmen)"
              />
              <textarea
                value={requirements.join('\n')}
                onChange={(e) => {
                  const newRequirements = { ...formData.admissionRequirements };
                  newRequirements[type] = e.target.value.split('\n');
                  setFormData({ ...formData, admissionRequirements: newRequirements });
                }}
                placeholder="Enter requirements (one per line)"
              />
              <button
                type="button"
                onClick={() => {
                  const newRequirements = { ...formData.admissionRequirements };
                  delete newRequirements[type];
                  setFormData({ ...formData, admissionRequirements: newRequirements });
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const newRequirements = { ...formData.admissionRequirements };
              newRequirements[`Type ${Object.keys(newRequirements).length + 1}`] = [];
              setFormData({ ...formData, admissionRequirements: newRequirements });
            }}
          >
            Add Requirement Type
          </button>
        </div>

        <div className="form-section">
          <h3>Tuition Fees</h3>
          <div className="form-group">
            <label>Tuition Range (per semester):</label>
            <select
              value={formData.tuitionRange}
              onChange={(e) => {
                const range = e.target.value;
                const ranges = {
                  'Under ₱30,000': 25000,
                  '₱30,000 - ₱50,000': 40000,
                  '₱50,000 - ₱70,000': 60000,
                  '₱70,000 - ₱100,000': 85000,
                  'Above ₱100,000': 120000
                };
                setFormData({
                  ...formData,
                  tuitionRange: range,
                  tuitionFees: { 'Per Semester': ranges[range] || 0 }
                });
              }}
              required
            >
              <option value="">Select Tuition Range</option>
              {algoliaService.filterOptions.tuitionRange.options.map((range, index) => (
                <option key={index} value={range}>{range}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-section">
          <h3>Scholarships</h3>
          <div className="scholarship-options">
            {algoliaService.filterOptions.scholarships.options.map((scholarship, index) => (
              <label key={index} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.scholarships.includes(scholarship)}
                  onChange={(e) => {
                    const updatedScholarships = e.target.checked
                      ? [...formData.scholarships, scholarship]
                      : formData.scholarships.filter(s => s !== scholarship);
                    setFormData({ ...formData, scholarships: updatedScholarships });
                  }}
                />
                {scholarship}
              </label>
            ))}
          </div>
        </div>

        <div className="form-buttons">
          <button 
            type="button" 
            onClick={onCancel}
            className="cancel-button"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="button-spinner"></span>
                Adding School...
              </>
            ) : (
              'Add School'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SchoolForm; 