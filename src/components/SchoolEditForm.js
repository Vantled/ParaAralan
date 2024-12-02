import React, { useState } from 'react';

function SchoolEditForm({ school, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: school.name || '',
    type: school.type || '',
    location: school.location || '',
    contact: school.contact || '',
    websiteUrl: school.websiteUrl || '',
    academicPrograms: school.academicPrograms || [],
    admissionRequirements: school.admissionRequirements || {},
    tuitionFees: school.tuitionFees || {},
    scholarships: school.scholarships || [],
    campusLife: school.campusLife || { organizations: [], facilities: [] }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.type !== 'university' && formData.type !== 'college') {
      alert('School type must be either "university" or "college"');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="school-edit-form">
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
              <option value="university">University</option>
              <option value="college">College</option>
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
                value={program.programs.join(', ')}
                onChange={(e) => {
                  const newPrograms = [...formData.academicPrograms];
                  newPrograms[index].programs = e.target.value.split(',').map(p => p.trim());
                  setFormData({ ...formData, academicPrograms: newPrograms });
                }}
                placeholder="Programs (comma-separated)"
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
          {Object.entries(formData.tuitionFees).map(([feeName, amount], index) => (
            <div key={index} className="fee-entry">
              <input
                type="text"
                value={feeName}
                onChange={(e) => {
                  const newFees = { ...formData.tuitionFees };
                  const oldName = feeName;
                  delete newFees[oldName];
                  newFees[e.target.value] = amount;
                  setFormData({ ...formData, tuitionFees: newFees });
                }}
                placeholder="Fee Name"
              />
              <input
                type="text"
                value={amount}
                onChange={(e) => {
                  const newFees = { ...formData.tuitionFees };
                  newFees[feeName] = e.target.value;
                  setFormData({ ...formData, tuitionFees: newFees });
                }}
                placeholder="Amount"
              />
              <button
                type="button"
                onClick={() => {
                  const newFees = { ...formData.tuitionFees };
                  delete newFees[feeName];
                  setFormData({ ...formData, tuitionFees: newFees });
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const newFees = { ...formData.tuitionFees };
              newFees[`Fee ${Object.keys(newFees).length + 1}`] = '';
              setFormData({ ...formData, tuitionFees: newFees });
            }}
          >
            Add Fee
          </button>
        </div>

        <div className="form-section">
          <h3>Scholarships</h3>
          {formData.scholarships.map((scholarship, index) => (
            <div key={index} className="scholarship-entry">
              <input
                type="text"
                value={scholarship}
                onChange={(e) => {
                  const newScholarships = [...formData.scholarships];
                  newScholarships[index] = e.target.value;
                  setFormData({ ...formData, scholarships: newScholarships });
                }}
                placeholder="Scholarship Name"
              />
              <button
                type="button"
                onClick={() => {
                  const newScholarships = formData.scholarships.filter((_, i) => i !== index);
                  setFormData({ ...formData, scholarships: newScholarships });
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
                scholarships: [...formData.scholarships, '']
              });
            }}
          >
            Add Scholarship
          </button>
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
          <button type="button" onClick={onCancel} className="cancel-button">
            Cancel
          </button>
          <button type="submit" className="save-button">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

export default SchoolEditForm; 