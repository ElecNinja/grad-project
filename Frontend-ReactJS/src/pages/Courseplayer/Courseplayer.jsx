import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './CoursePlayer.css';

const extractYTId = (url) => {
  if (!url) return '';
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
  return m ? m[1] : '';
};

export default function CoursePlayer() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // item and initialLessonIdx are passed via navigate state
  const item = state?.item;
  const [currentIdx, setCurrentIdx] = useState(state?.initialLessonIdx || 0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!item) {
    // nothing passed, go back
    navigate(-1);
    return null;
  }

  const isBoot = item.type === 'BOOTCAMP' && item.syllabus?.length > 0;
  const lessons = isBoot
    ? item.syllabus
    : [{ id: item.id, title: item.title, url: item.videoUrl }];

  const currentLesson = lessons[currentIdx] || lessons[0];
  const ytId = extractYTId(currentLesson?.url || item.videoUrl);

  return (
    <div className="cp-page">
      {/* Top bar */}
      <div className="cp-topbar">
        <button className="cp-back" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
        <div className="cp-topbar-title">{item.title}</div>
        {isBoot && (
          <button className="cp-toggle" onClick={() => setSidebarOpen(v => !v)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
            </svg>
            Videos ({lessons.length})
          </button>
        )}
      </div>

      {/* Body */}
      <div className="cp-body">
        <div className="cp-main">
          {/* Video */}
          <div className="cp-video-wrap">
            {ytId ? (
              <iframe
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
                title={currentLesson?.title || item.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="cp-iframe"
              />
            ) : currentLesson?.url ? (
              <video src={currentLesson.url} controls autoPlay className="cp-iframe" />
            ) : (
              <div className="cp-no-video">No video available</div>
            )}
          </div>

          {/* Info */}
          <div className="cp-info">
            <h2 className="cp-video-title">{currentLesson?.title || item.title}</h2>
            <div className="cp-meta">
              <span className="cp-badge">{item.type}</span>
              <span className="cp-expert"> {item.expert}</span>
              {isBoot && (
                <span className="cp-count">{currentIdx + 1} / {lessons.length}</span>
              )}
            </div>
            {item.description && <p className="cp-desc">{item.description}</p>}
          </div>

          {/* Prev / Next */}
          {isBoot && (
            <div className="cp-nav">
              <button className="cp-nav-btn"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}>
                ← Previous
              </button>
              <button className="cp-nav-btn primary"
                disabled={currentIdx === lessons.length - 1}
                onClick={() => setCurrentIdx(i => Math.min(lessons.length - 1, i + 1))}>
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        {isBoot && sidebarOpen && (
          <div className="cp-sidebar">
            <div className="cp-sidebar-header">Course Videos</div>
            {lessons.map((lesson, idx) => (
              <button key={lesson.id}
                className={`cp-sidebar-item ${idx === currentIdx ? 'active' : ''}`}
                onClick={() => setCurrentIdx(idx)}>
                <span className="cp-sidebar-num">{idx + 1}</span>
                <span className="cp-sidebar-title">{lesson.title}</span>
                {idx === currentIdx && <span className="cp-sidebar-playing">▶</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}