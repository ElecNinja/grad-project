import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, ChevronRight, Brain, Tag, BarChart2, FileText, CheckCircle } from 'lucide-react';
import { createStudentRequest, uploadPdfForAnalysis } from '../../apis/axios';
import './Addmaterial.css';

function Addmaterial() {
  const navigate    = useNavigate();
  const fileInputRef = useRef(null);

  const [description,  setDescription]  = useState('');
  const [materialType, setMaterialType] = useState('bootCamp');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [loading,      setLoading]      = useState(false);

  // AI preview state
  const [aiLoading,  setAiLoading]  = useState(false);
  const [aiResult,   setAiResult]   = useState(null);
  const [aiError,    setAiError]    = useState('');

  // ── helpers ────────────────────────────────────────────────────────────────
  const difficultyColor = (level) => {
    if (!level) return '#6b7280';
    const l = level.toLowerCase();
    if (l === 'beginner')     return '#16a34a';
    if (l === 'intermediate') return '#d97706';
    if (l === 'advanced')     return '#dc2626';
    return '#6b7280';
  };

  // ── run AI preview as soon as user picks a PDF ────────────────────────────
  const runAiPreview = async (file) => {
    setAiLoading(true);
    setAiResult(null);
    setAiError('');

    try {
      // No request_id → AI just analyzes and returns result, nothing saved to DB yet
      const res = await uploadPdfForAnalysis(file, null);
      setAiResult(res.data);
    } catch (err) {
      console.error('AI preview failed:', err);
      setAiError('Could not analyze PDF. You can still submit your request.');
    } finally {
      setAiLoading(false);
    }
  };

  // ── file selection ─────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { alert('File size must be less than 50MB'); return; }
    setUploadedFile(file);
    setAiResult(null);
    setAiError('');
    if (file.type === 'application/pdf') runAiPreview(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { alert('File size must be less than 50MB'); return; }
    setUploadedFile(file);
    setAiResult(null);
    setAiError('');
    if (file.type === 'application/pdf') runAiPreview(file);
  };

  const handleDragOver = (e) => e.preventDefault();
  const handleUploadClick = () => fileInputRef.current?.click();

  // ── submit ─────────────────────────────────────────────────────────────────
  const handleNext = async () => {
    if (!description) { alert('Please add a description'); return; }

    setLoading(true);
    try {
      // Step 1: Create the request row in DB + upload file to Supabase Storage
      const requestResult = await createStudentRequest(
        uploadedFile,
        description,
        materialType,
        ''
      );
      const requestId = requestResult?.request_id;

      // Step 2: Send PDF to AI with the real request_id so the result is
      // saved to request_analysis and teacher matching is triggered.
      // Note: this runs the LLM again (no cache from the preview call
      // because that preview used request_id=null and nothing was saved).
      if (uploadedFile?.type === 'application/pdf' && requestId) {
        try {
          await uploadPdfForAnalysis(uploadedFile, requestId);
        } catch (err) {
          console.error('AI save failed (non-fatal):', err);
          // Non-fatal — the request is created, just no AI match yet
        }
      }

      // Step 3: Navigate
      navigate('/dashboard');
    } catch (err) {
      console.error('Submit failed:', err);
      alert('Failed to submit request, please try again');
    } finally {
      setLoading(false);
    }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="addmaterial-container">
      <div className="addmaterial-card">

        {/* ── Upload Zone ── */}
        <div
          className={`upload-zone ${uploadedFile ? 'upload-zone--has-file' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,image/*,video/*,audio/*"
            onChange={handleFileChange}
            hidden
          />
          <button type="button" className="upload-button" onClick={handleUploadClick}>
            <Upload size={20} strokeWidth={2} />
            {uploadedFile ? 'Change File' : 'Upload Material'}
          </button>
          <p className="upload-hint">
            {uploadedFile
              ? uploadedFile.name
              : 'PDF, DOCX, or Media files (Max 50MB) — Optional'}
          </p>
        </div>

        {/* ── AI Analysis Box ── */}
        {(aiLoading || aiResult || aiError) && (
          <div className={`ai-analysis-box ${aiLoading ? 'ai-analysis-box--loading' : aiError ? 'ai-analysis-box--error' : 'ai-analysis-box--done'}`}>

            {/* Loading state */}
            {aiLoading && (
              <div className="ai-analysis-loading">
                <span className="ai-spinner" />
                <div>
                  <p className="ai-analysis-title">Analyzing your PDF...</p>
                  <p className="ai-analysis-sub">AI is reading the content to find the best teachers for you</p>
                </div>
              </div>
            )}

            {/* Error state */}
            {!aiLoading && aiError && (
              <div className="ai-analysis-loading">
                <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                <div>
                  <p className="ai-analysis-title" style={{ color: '#dc2626' }}>Analysis failed</p>
                  <p className="ai-analysis-sub">{aiError}</p>
                </div>
              </div>
            )}

            {/* Result state */}
            {!aiLoading && aiResult && (
              <>
                <div className="ai-analysis-header">
                  <Brain size={16} strokeWidth={2} />
                  <span>PDF Analysis</span>
                  <span className="ai-analysis-tag">AI Detected</span>
                </div>

                {/* Field + Sub-field */}
                <div className="ai-field-row">
                  <div className="ai-field-block">
                    <span className="ai-field-label">Field</span>
                    <span className="ai-field-value">{aiResult.field || '—'}</span>
                  </div>
                  {aiResult.sub_field && (
                    <>
                      <ChevronRight size={18} color="#9ca3af" />
                      <div className="ai-field-block">
                        <span className="ai-field-label">Sub-field</span>
                        <span className="ai-field-value">{aiResult.sub_field}</span>
                      </div>
                    </>
                  )}
                  {aiResult.difficulty_level && (
                    <span
                      className="ai-difficulty"
                      style={{ backgroundColor: difficultyColor(aiResult.difficulty_level) }}
                    >
                      {aiResult.difficulty_level}
                    </span>
                  )}
                </div>

                {/* Keywords */}
                {aiResult.keywords?.length > 0 && (
                  <div className="ai-keywords-row">
                    <Tag size={13} color="#6b7280" />
                    <div className="ai-keywords">
                      {aiResult.keywords.map((kw, i) => (
                        <span key={i} className="ai-keyword-pill">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                {aiResult.summary && (
                  <div className="ai-summary-row">
                    <FileText size={13} color="#6b7280" />
                    <p className="ai-summary">{aiResult.summary}</p>
                  </div>
                )}

                <p className="ai-match-note">
                  ✅ Teachers who specialize in <strong>{aiResult.field}{aiResult.sub_field ? ` → ${aiResult.sub_field}` : ''}</strong> will be matched to your request.
                </p>
              </>
            )}
          </div>
        )}

        {/* ── Description ── */}
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

        {/* ── Material Type ── */}
        <div className="form-section">
          <div className="radio-group">
            {[
              { value: 'bootCamp',    label: 'Boot Camp (2-30)' },
              { value: 'recordVideo', label: 'Record Video' },
              { value: 'meeting',     label: 'Meeting (live)' },
            ].map(({ value, label }) => (
              <label
                key={value}
                className={`radio-option ${materialType === value ? 'selected' : ''}`}
              >
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

        {/* ── Submit ── */}
        <div className="form-actions">
          <button
            type="button"
            className="next-button"
            onClick={handleNext}
            disabled={loading || aiLoading}
          >
            {loading ? 'Submitting...' : aiLoading ? 'Analyzing...' : 'Next'}
            {!loading && !aiLoading && <ChevronRight size={20} strokeWidth={2} />}
          </button>
        </div>

      </div>
    </div>
  );
}

export default Addmaterial;