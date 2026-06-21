import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { openRatingPrompt } from './Ratingstore';
import { submitTeacherRating } from "../../apis/handlers/submitTeacherRating";
import './Courseplayer.css';

const extractYTId = (url) => {
  if (!url) return '';
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
  return m ? m[1] : '';
};

// ── Load the YouTube IFrame API script once, globally ───────────────
let ytApiPromise = null;
const loadYouTubeApi = () => {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve) => {
    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prevCallback?.();
      resolve(window.YT);
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  });
  return ytApiPromise;
};

// A course/video item counts as a "bootcamp" (free viewing — no watch
// limit, no forced rating) if it's flagged as such in any of the common
// shapes the backend might send it in. If your bootcamp items use a
// different field name, just add/adjust a check here.
const isBootcampItem = (item) => {
  if (!item) return false;
  if (item.isBootcamp === true) return true;
  if (item.bootcampId) return true;
  const t = String(item.type || item.kind || '').toLowerCase();
  return t.includes('bootcamp');
};

export default function CoursePlayer() {
  const { state } = useLocation();
  const navigate  = useNavigate();

  const item = state?.item;
  const [currentIdx, setCurrentIdx] = useState(state?.initialLessonIdx || 0);
  const [autoplay, setAutoplay]     = useState(true);
  const [openSections, setOpenSections] = useState({ 0: true }); // first section open by default

  const isBootcamp = isBootcampItem(item);

  // ── Watch limit (per course, persisted across visits) ──────────────
  // Bootcamps are exempt entirely: unlimited free viewing, no rating prompt.
  const WATCH_LIMIT = item?.watchLimit || 2;
  const watchKey = item && !isBootcamp ? `course_watch_count_${item.id}` : null;
  const ratedKey = item && !isBootcamp ? `course_rated_${item.id}` : null;

  const [watchCount, setWatchCount] = useState(() => {
    if (!watchKey) return 0;
    return Number(localStorage.getItem(watchKey) || 0);
  });
  const [ratingGiven, setRatingGiven] = useState(() => {
    if (!ratedKey) return false;
    return localStorage.getItem(ratedKey) === '1';
  });

  // ── YouTube / native-video player refs ──────────────────────────
  const ytContainerRef = useRef(null);
  const ytPlayerRef    = useRef(null);
  const nativeVideoRef = useRef(null);
  const hasFiredEndRef = useRef(false); // guards against double-firing on the same lesson

  if (!item) { navigate(-1); return null; }

  // ── Build a flat lessons list + grouped sections ──────────────────
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
    const vids = item.syllabus?.length
      ? item.syllabus
      : [{ id: item.id, title: item.title, url: item.videoUrl }];
    return [{ id: 'sec_0', title: item.title, lessons: vids }];
  })();

  const allLessons = sections.flatMap((s) => s.lessons);
  const currentLesson = allLessons[currentIdx] || allLessons[0];
  const ytId = extractYTId(currentLesson?.url || item.videoUrl);
  const isLastLesson = currentIdx === allLessons.length - 1;
  const limitReached = !isBootcamp && watchCount >= WATCH_LIMIT;

  const toggleSection = (idx) =>
    setOpenSections((prev) => ({ ...prev, [idx]: !prev[idx] }));

  let sectionStartIdx = 0;
  const sectionStartIndices = sections.map((sec) => {
    const idx = sectionStartIdx;
    sectionStartIdx += sec.lessons.length;
    return idx;
  });

  // ── Called once when the LAST lesson of the course actually finishes ──
  const handleCourseFinished = useCallback(() => {
    if (isBootcamp) return; // bootcamps: free viewing, no limit, no forced rating
    if (!watchKey) return;

    setWatchCount((prev) => {
      const next = prev + 1;
      localStorage.setItem(watchKey, String(next));
      return next;
    });

    if (!ratingGiven) {
      openRatingPrompt({
        teacherId: item.teacherId,
        teacherName: item.expert || 'your teacher',
        contextTitle: item.title,
        onSubmit: async (rating, comment) => {
          const result = await submitTeacherRating({
            teacherId: item.teacherId,
            rating,
            comment,
            sessionId: item.sessionId || null,
            courseId: item.courseId || item.id || null,
          });
          if (!result.response) {
            throw new Error(result.message || 'Failed to submit rating.');
          }
          localStorage.setItem(ratedKey, '1');
          setRatingGiven(true);
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBootcamp, watchKey, ratedKey, ratingGiven, item]);

  // For native <video> tags (non-YouTube URLs)
  const handleVideoEnded = () => {
    if (isLastLesson && !hasFiredEndRef.current) {
      hasFiredEndRef.current = true;
      handleCourseFinished();
    }
  };

  // Keep latest isLastLesson/handleCourseFinished available inside the
  // player's onStateChange callback without forcing the player to be
  // recreated whenever those values change.
  const isLastLessonRef = useRef(isLastLesson);
  isLastLessonRef.current = isLastLesson;
  const handleCourseFinishedRef = useRef(handleCourseFinished);
  handleCourseFinishedRef.current = handleCourseFinished;

  // ── YouTube IFrame API: create the player ONCE, then reuse it ──────────
  // IMPORTANT: the YT API replaces our <div> with its own <iframe> in the
  // real DOM. If we ever unmount/destroy that div (e.g. conditionally
  // remove it from JSX, or give it a changing `key`), React loses track of
  // the node it originally mounted and crashes with "Failed to execute
  // 'removeChild'" the next time it tries to touch it — which is exactly
  // what caused the white-screen bug. So the fix has two parts:
  //   1) the <div ref={ytContainerRef}> below is ALWAYS rendered once ytId
  //      is known — never conditionally swapped out — even after the watch
  //      limit is reached (we just cover it with an overlay + pause it).
  //   2) the player itself is created once, then reused via loadVideoById
  //      whenever the lesson changes.
  useEffect(() => {
    hasFiredEndRef.current = false;

    if (!ytId || limitReached) return;

    let destroyed = false;

    if (ytPlayerRef.current?.loadVideoById) {
      // Player already exists — just swap the video, don't touch the DOM node.
      ytPlayerRef.current.loadVideoById(ytId);
      if (autoplay) ytPlayerRef.current.playVideo?.();
      return;
    }

    loadYouTubeApi().then((YT) => {
      if (destroyed || !ytContainerRef.current || ytPlayerRef.current) return;

      ytPlayerRef.current = new YT.Player(ytContainerRef.current, {
        videoId: ytId,
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          rel: 0,
        },
        events: {
          onStateChange: (e) => {
            // 0 = ENDED
            if (
              e.data === YT.PlayerState.ENDED &&
              isLastLessonRef.current &&
              !hasFiredEndRef.current
            ) {
              hasFiredEndRef.current = true;
              handleCourseFinishedRef.current();
            }
          },
        },
      });
    });

    return () => {
      destroyed = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ytId, limitReached]);

  // Destroy the player only when the whole CoursePlayer unmounts.
  useEffect(() => {
    return () => {
      if (ytPlayerRef.current?.destroy) {
        ytPlayerRef.current.destroy();
        ytPlayerRef.current = null;
      }
    };
  }, []);

  // If the limit gets reached mid-session, actually stop playback. The
  // overlay below blocks clicks/visuals, but we also pause the underlying
  // player so it can't keep playing audio behind it.
  useEffect(() => {
    if (!limitReached) return;
    ytPlayerRef.current?.pauseVideo?.();
    nativeVideoRef.current?.pause?.();
  }, [limitReached]);

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
          <div className="cp-video-wrap" style={{ position: 'relative' }}>
            {ytId ? (
              // Mounted ONCE by the YouTube IFrame API (see useEffect above).
              // Always rendered — never conditionally removed — to avoid the
              // removeChild crash. Locked visually via the overlay below.
              <div ref={ytContainerRef} className="cp-iframe" />
            ) : currentLesson?.url ? (
              <video
                ref={nativeVideoRef}
                key={currentLesson.url}
                src={currentLesson.url}
                controls={!limitReached}
                autoPlay={autoplay && !limitReached}
                className="cp-iframe"
                onEnded={handleVideoEnded}
              />
            ) : (
              <div className="cp-no-video">No video available</div>
            )}

            {limitReached && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(10, 10, 15, 0.94)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: 24,
                  zIndex: 5,
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
               You have reached the maximum number of views (2) for this course.({WATCH_LIMIT}) 
              </div>
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

          {/* Watch limit indicator — bootcamps are exempt, hide entirely */}
          {!isBootcamp && (
            <div style={{ padding: '10px 14px', fontSize: 12, color: '#64748b', textAlign: 'center' }}>
              Watch attempts: {watchCount}/{WATCH_LIMIT}
              {limitReached && (
                <div style={{ color: '#ef4444', fontWeight: 600, marginTop: 4 }}>
                  You've reached the watch limit for this course.
                </div>
              )}
            </div>
          )}

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