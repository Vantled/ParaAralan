import React, { useState, useEffect } from 'react';
import useHistory from '../hooks/useHistory';
import algoliaService from '../services/algoliaService';

// Add these styles for the history buttons
const historyButtonStyles = {
  background: 'white',
  border: '1px solid rgba(0, 0, 0, 0.1)',
  borderRadius: '6px',
  width: '40px',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  color: '#2c3e50',
  fontSize: '1.2rem',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
};

function SchoolEditForm({ school, onSubmit, onCancel, showNotification }) {
  const {
    state: formData,
    setState: setFormData,
    undo,
    redo,
    canUndo,
    canRedo
  } = useHistory(school);

  // Add keyboard shortcuts
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

  // Add loading state
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSubmit(formData);
      showNotification('Changes saved successfully!');
    } catch (error) {
      console.error('Error saving changes:', error);
      showNotification(error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="school-edit-form">
      <div className="history-controls">
        <button
          className="history-button"
          onClick={undo}
          disabled={!canUndo}
          data-tooltip="Undo (Ctrl+Z)"
        >
          ↩
        </button>
        <button
          className="history-button"
          onClick={redo}
          disabled={!canRedo}
          data-tooltip="Redo (Ctrl+Shift+Z)"
        >
          ↪
        </button>
      </div>
      <h2>Edit School Information</h2>
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
              {algoliaService.filterOptions.type.options.map((type, index) => (
                <option key={index} value={type}>{type}</option>
              ))}
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
              <button
                type="button"
                onClick={() => {
                  const newPrograms = formData.academicPrograms.filter((_, i) => i !== index);
                  setFormData({ ...formData, academicPrograms: newPrograms });
                }}
              >
                Remove
              </button>
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
                  newRequirements[type] = e.target.value.split('\n').filter(req => req.trim());
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

        <div className="form-section">
          <h3>Campus Life</h3>
          <div className="form-group">
            <label>Student Organizations:</label>
            <textarea
              value={formData.campusLife.organizations.join('\n')}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  campusLife: {
                    ...formData.campusLife,
                    organizations: e.target.value.split('\n').filter(org => org.trim())
                  }
                });
              }}
              placeholder="Enter organizations (one per line)"
            />
          </div>
          <div className="form-group">
            <label>Facilities:</label>
            <textarea
              value={formData.campusLife.facilities.join('\n')}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  campusLife: {
                    ...formData.campusLife,
                    facilities: e.target.value.split('\n').filter(fac => fac.trim())
                  }
                });
              }}
              placeholder="Enter facilities (one per line)"
            />
          </div>
        </div>

        <div className="form-buttons">
          <button 
            type="button" 
            onClick={onCancel}
            className="cancel-button"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="button-spinner"></span>
                Saving Changes...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SchoolEditForm; 