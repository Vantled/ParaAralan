import React, { useState } from 'react';

function SchoolForm({ onSubmit, onCancel }) {
  const [schoolData, setSchoolData] = useState({
    name: '',
    type: 'university',
    requirements: '',
    courses: '',
    hasScholarship: false,
    websiteUrl: '',
    contact: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...schoolData,
      courses: schoolData.courses.split(',').map(course => course.trim())
    });
  };

  return (
    <div className="school-form">
      <h3>Add School Information</h3>
      <form onSubmit={handleSubmit}>
        <select
          value={schoolData.type}
          onChange={(e) => setSchoolData({ ...schoolData, type: e.target.value })}
          required
        >
          <option value="university">University</option>
          <option value="college">College</option>
        </select>

        <input
          type="text"
          placeholder="School Name"
          value={schoolData.name}
          onChange={(e) => setSchoolData({ ...schoolData, name: e.target.value })}
          required
        />

        <textarea
          placeholder="Admission Requirements"
          value={schoolData.requirements}
          onChange={(e) => setSchoolData({ ...schoolData, requirements: e.target.value })}
          required
        />

        <input
          type="text"
          placeholder="Courses Offered (comma-separated)"
          value={schoolData.courses}
          onChange={(e) => setSchoolData({ ...schoolData, courses: e.target.value })}
          required
        />

        <input
          type="text"
          placeholder="Contact Information"
          value={schoolData.contact}
          onChange={(e) => setSchoolData({ ...schoolData, contact: e.target.value })}
          required
        />

        <input
          type="url"
          placeholder="School Website URL"
          value={schoolData.websiteUrl}
          onChange={(e) => setSchoolData({ ...schoolData, websiteUrl: e.target.value })}
          required
        />

        <div className="scholarship-checkbox">
          <label>
            <input
              type="checkbox"
              checked={schoolData.hasScholarship}
              onChange={(e) => setSchoolData({ ...schoolData, hasScholarship: e.target.checked })}
            />
            Scholarships Available
          </label>
        </div>

        <div className="form-buttons">
          <button type="submit">Add School</button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default SchoolForm; 