import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, ChevronRight } from 'lucide-react';
import './Addmaterial.css';

function Addmaterial() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [description, setDescription] = useState('');
  const [materialType, setMaterialType] = useState('bootCamp');
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert('File size must be less than 50MB');
        return;
      }
      setUploadedFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert('File size must be less than 50MB');
        return;
      }
      setUploadedFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleNext = () => {
    // TODO: Handle form submission/navigation
    navigate('/dashboard');
  };

  return (
    <div className="addmaterial-container">
      <div className="addmaterial-card">
        {/* Upload Section */}
        <div
          className="upload-zone"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,image/*,video/*,audio/*"
            onChange={handleFileChange}
            className="upload-input"
            hidden
          />
          <button
            type="button"
            className="upload-button"
            onClick={handleUploadClick}
          >
            <Upload size={20} strokeWidth={2} />
            Upload Material
          </button>
          <p className="upload-hint">
            {uploadedFile ? uploadedFile.name : 'PDF, DOCX, or Media files (Max 50MB)'}
          </p>
        </div>

        {/* Description Section */}
        <div className="form-section">
          <label htmlFor="description" className="section-label">
            Description of the material
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter details about your educational material..."
            className="description-textarea"
            rows={4}
          />
        </div>

        {/* Material Type Section */}
        <div className="form-section">
          <div className="radio-group">
            <label className={`radio-option ${materialType === 'bootCamp' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="materialType"
                value="bootCamp"
                checked={materialType === 'bootCamp'}
                onChange={() => setMaterialType('bootCamp')}
              />
              <span className="radio-label">Boot Camp (2-30)</span>
            </label>
            <label className={`radio-option ${materialType === 'recordVideo' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="materialType"
                value="recordVideo"
                checked={materialType === 'recordVideo'}
                onChange={() => setMaterialType('recordVideo')}
              />
              <span className="radio-label">Record Video</span>
            </label>
            <label className={`radio-option ${materialType === 'meeting' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="materialType"
                value="meeting"
                checked={materialType === 'meeting'}
                onChange={() => setMaterialType('meeting')}
              />
              <span className="radio-label">meeting (live)</span>
            </label>
          </div>
        </div>

        {/* Next Button */}
        <div className="form-actions">
          <button type="button" className="next-button" onClick={handleNext}>
            Next
            <ChevronRight size={20} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Addmaterial;
