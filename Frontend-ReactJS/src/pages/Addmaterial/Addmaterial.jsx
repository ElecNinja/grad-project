import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, ChevronRight } from 'lucide-react';
import { createStudentRequest, uploadPdfForAnalysis } from '../../apis/axios';
import './Addmaterial.css';

function Addmaterial() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [description, setDescription] = useState('');
  const [materialType, setMaterialType] = useState('bootCamp');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB');
      return;
    }
    setUploadedFile(file);
    setAiResult(null);

    if (file.type === 'application/pdf') {
      setAnalyzing(true);
      try {
        const res = await uploadPdfForAnalysis(file);
        setAiResult(res.data);
        // Don't auto-fill description - let the user write their own
      } catch (error) {
        
        console.error('AI analysis failed:', error);
        alert('AI analysis failed, you can continue manually');
      } finally {
        setAnalyzing(false);
      }
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB');
      return;
    }
    const mockEvent = { target: { files: [file] } };
    await handleFileChange(mockEvent);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleNext = async () => {
    if (!description) {
      alert('Please add a description');
      return;
    }
    setLoading(true);
    try {
      const subject = aiResult?.field || aiResult?.sub_field || '';
      await createStudentRequest(uploadedFile, description, materialType, subject);
      navigate('/requests');
    } catch {
      alert('Failed to submit request, please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="addmaterial-container">
      <div className="addmaterial-card">

        {/* Upload Section */}
        <div className="upload-zone" onDrop={handleDrop} onDragOver={handleDragOver}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,image/*,video/*,audio/*"
            onChange={handleFileChange}
            hidden
          />
          <button type="button" className="upload-button" onClick={handleUploadClick}>
            <Upload size={20} strokeWidth={2} />
            Upload Material
          </button>
          <p className="upload-hint">
            {uploadedFile ? uploadedFile.name : 'PDF, DOCX, or Media files (Max 50MB) - Optional'}
          </p>
        </div>

        {/* AI analyzing indicator */}
        {analyzing && (
          <div className="ai-status analyzing">
             AI is analyzing your PDF...
          </div>
        )}

        {/* AI result */}
        {aiResult && !analyzing && (
          <div className="ai-status success">
            Detected: <strong>{aiResult.field}</strong>
            {aiResult.sub_field && <> → <strong>{aiResult.sub_field}</strong></>}
          </div>
        )}

        {/* Description */}
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

        {/* Material Type */}
        <div className="form-section">
          <div className="radio-group">
            {[
              { value: 'bootCamp', label: 'Boot Camp (2-30)' },
              { value: 'recordVideo', label: 'Record Video' },
              { value: 'meeting', label: 'Meeting (live)' },
            ].map(({ value, label }) => (
              <label key={value} className={`radio-option ${materialType === value ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="materialType"
                  value={value}
                  checked={materialType === value}
                  onChange={() => setMaterialType(value)}
                />
                <span className="radio-label">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Next Button */}
        <div className="form-actions">
          <button
            type="button"
            className="next-button"
            onClick={handleNext}
            disabled={loading || analyzing}
          >
            {loading ? 'Submitting...' : 'Next'}
            {!loading && <ChevronRight size={20} strokeWidth={2} />}
          </button>
        </div>

      </div>
    </div>
  );
}

export default Addmaterial;