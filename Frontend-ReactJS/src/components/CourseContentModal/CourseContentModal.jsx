import React, { useState, useEffect } from 'react';
import { X, FileText, Video, BookOpen, Download } from 'lucide-react';
import { getCourseContent } from '../../apis/handlers/uploadCourseContent';
import './CourseContentModal.css';

function CourseContentModal({ bidId, courseName, onClose }) {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadContent();
  }, [bidId]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const response = await getCourseContent(bidId);
      setContent(response.content || []);
    } catch (err) {
      setError('Failed to load course content');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getContentIcon = (type) => {
    switch (type) {
      case 'video':
        return <Video size={24} />;
      case 'document':
        return <FileText size={24} />;
      case 'text':
        return <BookOpen size={24} />;
      default:
        return <FileText size={24} />;
    }
  };

  const getContentTypeLabel = (type) => {
    switch (type) {
      case 'video':
        return 'Video Lesson';
      case 'document':
        return 'Document';
      case 'text':
        return 'Text Content';
      default:
        return type;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{courseName}</h2>
            <p>Course Materials</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {loading ? (
            <div className="loading">Loading materials...</div>
          ) : content.length === 0 ? (
            <div className="empty-content">
              <BookOpen size={48} />
              <p>No materials available yet</p>
              <p className="empty-subtitle">Your teacher hasn't uploaded any content yet. Check back soon!</p>
            </div>
          ) : (
            <div className="content-list">
              {content.map((item) => (
                <div key={item.id} className="content-item">
                  <div className="content-icon">
                    {getContentIcon(item.content_type)}
                  </div>
                  <div className="content-info">
                    <h3>{item.title}</h3>
                    {item.description && <p>{item.description}</p>}
                    <span className="content-type-label">
                      {getContentTypeLabel(item.content_type)}
                    </span>
                  </div>
                  {item.file_url && (
                    <a href={item.file_url} target="_blank" rel="noreferrer" className="download-btn">
                      <Download size={18} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CourseContentModal;
