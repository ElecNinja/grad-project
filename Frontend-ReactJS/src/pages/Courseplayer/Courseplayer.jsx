import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Courseplayer.css';

const extractYTId = (url) => {
  if (!url) return '';
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
  return m ? m[1] : '';
};

export default function CoursePlayer() {
  const { state } = useLocation();
  const navigate  = useNavigate();

  const item = state?.item;
  const [currentIdx, setCurrentIdx] = useState(state?.initialLessonIdx || 0);
  const [autoplay, setAutoplay]     = useState(true);
  const [openSections, setOpenSections] = useState({ 0: true }); // first section open by default

  if (!item) { navigate(-1); return null; }

  // ── Build a flat lessons list + grouped sections ──────────────────
  // Priority: item.sections (from DB) → fallback: one section from item.syllabus
  const sections = (() => {
    if (item.sections?.length) {
      return item.sections.map((sec) => ({
        id:      sec.id,
        title:   sec.title,
        lessons: (sec.lessons || sec.videos || []).map((l) => ({
          id:    l.id,
          title: l.title || l.name || 'Untitled',
          url:   l.url || l.video_url || '',
          duration: l.duration || '',
        })),
      }));
    }
    // fallback: single section from syllabus
    const vids = item.syllabus?.length
      ? item.syllabus
      : [{ id: item.id, title: item.title, url: item.videoUrl }];
    return [{ id: 'sec_0', title: item.title, lessons: vids }];
  })();

  // Flat list for easy index access
  const allLessons = sections.flatMap((s) => s.lessons);
  const currentLesson = allLessons[currentIdx] || allLessons[0];
  const ytId = extractYTId(currentLesson?.url || item.videoUrl);

  const toggleSection = (idx) =>
    setOpenSections((prev) => ({ ...prev, [idx]: !prev[idx] }));

  // Global index of first lesson in each section (for highlighting)
  let sectionStartIdx = 0;
  const sectionStartIndices = sections.map((sec) => {
    const idx = sectionStartIdx;
    sectionStartIdx += sec.lessons.length;
    return idx;
  });

  return (
    <div className="cp-page">

      {/* ── Top bar ── */}
      <div className="cp-topbar">
        <button className="cp-back" onClick={() => navigate(-1)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </button>
        <span className="cp-topbar-title">{item.title}</span>
      </div>

      {/* ── Body ── */}
      <div className="cp-body">

        {/* LEFT ─ video + info */}
        <div className="cp-main">

          {/* Breadcrumb */}
          <div className="cp-breadcrumb">
            <span>{item.title}</span>
            <span className="cp-sep">›</span>
            <span>{item.expert || 'Your Teacher'}</span>
            <span className="cp-sep">›</span>
            <span className="cp-bc-active">{currentLesson?.title}</span>
          </div>

          {/* Video */}
          <div className="cp-video-wrap">
            {ytId ? (
              <iframe
                key={ytId}
                src={`https://www.youtube.com/embed/${ytId}?${autoplay ? 'autoplay=1&' : ''}rel=0`}
                title={currentLesson?.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="cp-iframe"
              />
            ) : currentLesson?.url ? (
              <video key={currentLesson.url} src={currentLesson.url} controls autoPlay={autoplay} className="cp-iframe" />
            ) : (
              <div className="cp-no-video">No video available</div>
            )}
          </div>

          {/* Info */}
          <div className="cp-info">
            <h2 className="cp-video-title">{currentLesson?.title || item.title}</h2>
            <div className="cp-meta">
              <span className="cp-badge">{item.type}</span>
              <span className="cp-expert">{item.expert || 'Your Teacher'}</span>
              <span className="cp-count">{currentIdx + 1} / {allLessons.length}</span>
            </div>
            {item.description && <p className="cp-desc">{item.description}</p>}

            <div className="cp-nav">
              <button className="cp-nav-btn"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(i => i - 1)}>
                ← Previous
              </button>
              <button className="cp-nav-btn primary"
                disabled={currentIdx === allLessons.length - 1}
                onClick={() => setCurrentIdx(i => i + 1)}>
                Next →
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT ─ sidebar */}
        <div className="cp-sidebar">

          {/* Autoplay */}
          <div className="cp-autoplay-row">
            <span>Autoplay</span>
            <button
              className={`cp-toggle-btn ${autoplay ? 'on' : ''}`}
              onClick={() => setAutoplay(v => !v)}
            >
              <span className="cp-knob" />
            </button>
          </div>

          {/* Sections */}
          {sections.map((sec, sIdx) => {
            const startIdx = sectionStartIndices[sIdx];
            const isOpen   = !!openSections[sIdx];
            const hasActive = currentIdx >= startIdx && currentIdx < startIdx + sec.lessons.length;

            return (
              <div key={sec.id || sIdx} className="cp-sec">

                {/* Section header */}
                <button
                  className={`cp-sec-header ${hasActive ? 'has-active' : ''}`}
                  onClick={() => toggleSection(sIdx)}
                >
                  <div className="cp-sec-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <path d="M9 3v18M3 9h6"/>
                    </svg>
                  </div>
                  <div className="cp-sec-text">
                    <span className="cp-sec-title">{sec.title}</span>
                    <span className="cp-sec-sub">{sec.lessons.length} TOPICS</span>
                  </div>
                  <svg
                    className={`cp-chevron ${isOpen ? 'open' : ''}`}
                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {/* Lesson items */}
                {isOpen && (
                  <div className="cp-lessons">
                    {sec.lessons.map((lesson, lIdx) => {
                      const gIdx    = startIdx + lIdx;
                      const active  = gIdx === currentIdx;
                      const done    = gIdx < currentIdx;
                      return (
                        <button
                          key={lesson.id || lIdx}
                          className={`cp-lesson ${active ? 'active' : ''} ${done ? 'done' : ''}`}
                          onClick={() => setCurrentIdx(gIdx)}
                        >
                          <span className={`cp-dot ${active ? 'active' : done ? 'done' : ''}`} />
                          <div className="cp-lesson-text">
                            <span className="cp-lesson-title">{lesson.title}</span>
                            {lesson.duration && <span className="cp-lesson-dur">{lesson.duration}</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}