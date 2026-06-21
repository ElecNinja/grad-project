import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Upload, X, FileText, Video, BookOpen, Plus } from 'lucide-react';
import { uploadCourseContent, getCourseContent } from '../../apis/handlers/uploadCourseContent';
import './TeacherCourseUpload.css';

function TeacherCourseUpload() {
  const { bidId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.user);
  const fileInputRef = useRef(null);

  const [course, setCourse] = useState(location.state?.course || null);
  const [courseContent, setCourseContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [contentTitle, setContentTitle] = useState('');
  const [contentDescription, setContentDescription] = useState('');
  const [contentType, setContentType] = useState('video');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (bidId && user?.id) {
      loadCourseContent();
    }
  }, [bidId, user?.id]);

  const loadCourseContent = async () => {
    try {
      setLoading(true);
      const response = await getCourseContent(bidId);
      setCourseContent(response.content || []);
    } catch (err) {
      setError('Failed to load course content');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) { // 500MB limit
        setError('File size must be less than 500MB');
        return;
      }
      setUploadedFile(file);
      setError('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        setError('File size must be less than 500MB');
        return;
      }
      setUploadedFile(file);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!contentTitle) {
      setError('Please enter a title');
      return;
    }

    if (!uploadedFile && contentType !== 'text') {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    try {
      const response = await uploadCourseContent(
        bidId,
        contentTitle,
        contentDescription,
        contentType,
        uploadedFile
      );

      if (response.success) {
        setContentTitle('');
        setContentDescription('');
        setUploadedFile(null);
        setContentType('video');
        await loadCourseContent();
      } else {
        setError(response.error || 'Failed to upload');
      }
    } catch (err) {
      setError('Upload failed');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const getContentIcon = (type) => {
    switch (type) {
      case 'video':
        return <Video size={20} />;
      case 'document':
        return <FileText size={20} />;
      case 'text':
        return <BookOpen size={20} />;
      default:
        return <FileText size={20} />;
    }
  };

  const getContentTypeLabel = (type) => {
    switch (type) {
      case 'video':
        return 'Video Lesson';
      case 'document':
        return 'Document/Resource';
      case 'text':
        return 'Text Content';
      default:
        return type;
    }
  };

  return (
    <div className="course-upload-container">
      <div className="course-upload-header">
        <button className="back-btn" onClick={() => navigate('/work')}>
          ← Back to Courses
        </button>
        <h1>Upload Course Content</h1>
        <p className="course-upload-subtitle">
          Add lessons, materials, and resources for your students
        </p>
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError('')}><X size={16} /></button>
        </div>
      )}

      {course && (
        <div className="course-info-card">
          <div className="course-info-header">
            <h2>{course.title || 'Course'}</h2>
            <span className={`course-type-badge ${course.type}`}>
              {getContentTypeLabel(course.type)}
            </span>
          </div>
          <p className="course-info-description">{course.description}</p>
          <div className="course-info-details">
            <span>Student: {course.studentName || 'N/A'}</span>
            <span>Price: ${course.pricePerHour}/hr</span>
          </div>
        </div>
      )}

      <div className="upload-section">
        <div className="upload-form-card">
          <h3>
            <Plus size={20} /> Add New Content
          </h3>

          <div className="form-group">
            <label>Content Title *</label>
            <input
              type="text"
              placeholder="e.g., Lesson 1: Introduction to Python"
              value={contentTitle}
              onChange={(e) => setContentTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Content Type *</label>
            <select value={contentType} onChange={(e) => setContentType(e.target.value)}>
              <option value="video">Video Lesson</option>
              <option value="document">Document/PDF</option>
              <option value="text">Text Content</option>
            </select>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              placeholder="Add a description for this content..."
              value={contentDescription}
              onChange={(e) => setContentDescription(e.target.value)}
              rows="3"
            />
          </div>

          {contentType !== 'text' && (
            <div className="file-upload-group">
              <label>Upload File *</label>
              <div
                className="file-drop-zone"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={32} />
                <p>Drag and drop your file here, or click to browse</p>
                <p className="file-size-info">Max 500MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </div>
              {uploadedFile && (
                <div className="file-selected">
                  <span>{uploadedFile.name}</span>
                  <button onClick={() => setUploadedFile(null)}>
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            className="upload-btn"
            onClick={handleUpload}
            disabled={uploading || !contentTitle}
          >
            {uploading ? 'Uploading...' : 'Upload Content'}
          </button>
        </div>
      </div>

      <div className="content-list-section">
        <h3>Course Materials ({courseContent.length})</h3>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : courseContent.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} />
            <p>No content uploaded yet. Add your first lesson above!</p>
          </div>
        ) : (
          <div className="content-grid">
            {courseContent.map((item) => (
              <div key={item.id} className="content-item">
                <div className="content-icon">
                  {getContentIcon(item.content_type)}
                </div>
                <div className="content-details">
                  <h4>{item.title}</h4>
                  <p>{item.description || 'No description'}</p>
                  <span className="content-type">
                    {getContentTypeLabel(item.content_type)}
                  </span>
                  {item.file_url && (
                    <a href={item.file_url} target="_blank" rel="noreferrer" className="file-link">
                      Download File →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherCourseUpload;
