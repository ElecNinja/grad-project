import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import './Videos.css';
import { getMyVideoCourses, getMyVideoBootcamps } from '../../apis/handlers/getStudentVideos';
import { getMyUploadedVideos } from '../../apis/handlers/getMyUploadedVideos';
import { useNotifications } from '../work/notificationStore';

const extractYTId = (url) => {
  if (!url) return '';
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
  return m ? m[1] : '';
};

// A course's watch limit lives in localStorage (same keys CoursePlayer.jsx
// reads/writes), so we can check it here without touching the backend.
const isCourseLimitReached = (course) => {
  const limit = course?.watchLimit || 2;
  const count = Number(localStorage.getItem(`course_watch_count_${course.id}`) || 0);
  return count >= limit;
};

const getLocalBootcamps = (studentId) => {
  if (!studentId) return [];
  try {
    const raw = localStorage.getItem('work_uploadedRows');
    const rows = raw ? JSON.parse(raw) : [];
    return rows
      .filter((r) => r.type === 'bootcamp' && r._studentId === studentId)
      .map((r) => {
        const vids = (r.videos && r.videos.length) ? r.videos : [{ url: r.youtubeUrl, title: r.title }];
        const firstId = extractYTId(vids[0]?.url);
        return {
          id: r.id,
          title: r.title || 'Untitled Bootcamp',
          description: r.description || '',
          thumbnail: firstId ? `https://img.youtube.com/vi/${firstId}/mqdefault.jpg` : null,
          videoUrl: vids[0]?.url || '',
          type: 'BOOTCAMP',
          expert: r.teacherName || 'Your Teacher',
          progress: null,
          syllabus: vids.map((v, idx) => ({
            id: `${r.id}_${idx}`,
            title: v.title?.trim() || `Video ${idx + 1}`,
            duration: '',
            url: v.url,
          })),
        };
      });
  } catch {
    return [];
  }
};

const getLocalOnlineCourses = (studentId) => {
  if (!studentId) return [];
  try {
    const raw = localStorage.getItem('work_uploadedRows');
    const rows = raw ? JSON.parse(raw) : [];
    return rows
      .filter((r) => r.type === 'live_1on1' && r._studentId === studentId)
      .map((r) => ({
        id: r.id,
        title: r.title || 'Live Session',
        description: r.description || `Live session by ${r.teacherName || 'your teacher'}.`,
        expert: r.teacherName || 'Your Teacher',
        type: 'LIVE',
        thumbnail: null,
        isLive: true,
        createdAt: r.createdAt,
        meetingUrl: r.meetingUrl || null,
      }));
  } catch {
    return [];
  }
};

function Videos() {
  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [bootcamps, setBootcamps] = useState([]);
  const [selected, setSelected] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [currentLessonIdx, setCurrentLessonIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const userId = user?.id;

  const { notifs } = useNotifications(userId);

  // ── Merge online courses from notifications + localStorage ──
  const notifOnline = (notifs || [])
    .filter((n) => n.type === 'live')
    .map((n) => ({
      id: n.id,
      title: n.title || 'Live Session',
      description: n.description || `Live session announced by ${n.teacherName || 'your teacher'}.`,
      expert: n.teacherName || 'Your Teacher',
      type: 'LIVE',
      thumbnail: null,
      isLive: true,
      createdAt: n.createdAt,
      meetingUrl: n.meetingUrl || null,
    }));

  const localOnline = getLocalOnlineCourses(userId);
  // Deduplicate: localStorage entries that share a title with a notification entry are skipped
  const notifTitles = new Set(notifOnline.map((n) => n.title));
  const dedupedLocal = localOnline.filter((l) => !notifTitles.has(l.title));
  const onlineList = [...notifOnline, ...dedupedLocal];

  useEffect(() => {
    let isMounted = true;
    const loadVideos = async () => {
      setLoading(true);
      setError(null);
      try {
        const [coursesData, bootcampsData, uploadedData] = await Promise.all([
          getMyVideoCourses(),
          getMyVideoBootcamps(),
          getMyUploadedVideos(),
        ]);
        if (!isMounted) return;

        const uploadedCourses = (uploadedData || [])
          .filter((v) => {
            const t = (v.type || v.video_type || '').toUpperCase();
            return t === 'COURSE' || t === 'RECORDED';
          })
          .map((v) => ({
            id: v.id,
            title: v.title || 'Untitled',
            description: v.description || '',
            thumbnail: v.thumbnail || v.thumbnail_url
              || (extractYTId(v.videoUrl || v.video_url)
                ? `https://img.youtube.com/vi/${extractYTId(v.videoUrl || v.video_url)}/mqdefault.jpg`
                : null),
            videoUrl: v.videoUrl || v.video_url || '',
            type: 'COURSE',
            expert: v.expert || v.teacher_name || 'Your Teacher',
            progress: null,
          }));

        const uploadedBootcampsFallback = (uploadedData || [])
          .filter((v) => (v.type || v.video_type || '').toUpperCase() === 'BOOTCAMP')
          .map((v) => ({
            id: v.id,
            title: v.title || 'Untitled',
            description: v.description || '',
            thumbnail: v.thumbnail || v.thumbnail_url
              || (extractYTId(v.videoUrl || v.video_url)
                ? `https://img.youtube.com/vi/${extractYTId(v.videoUrl || v.video_url)}/mqdefault.jpg`
                : null),
            videoUrl: v.videoUrl || v.video_url || '',
            type: 'BOOTCAMP',
            expert: v.expert || v.teacher_name || 'Your Teacher',
            progress: null,
            syllabus: [{ id: v.id, title: v.title || 'Video 1', duration: '', url: v.videoUrl || v.video_url }],
          }));

        const localBootcamps = getLocalBootcamps(userId);
        const localTitles = new Set(localBootcamps.map((b) => b.title));
        const dedupedFallback = uploadedBootcampsFallback.filter((b) => !localTitles.has(b.title));

        const mergedCourses = [...(coursesData || []), ...uploadedCourses];
        const mergedBootcamps = [...(bootcampsData || []), ...localBootcamps, ...dedupedFallback];

        // Courses whose watch limit is already used up are hidden from the
        // list entirely. Bootcamps have no limit, so they're untouched.
        const visibleCourses = mergedCourses.filter((c) => !isCourseLimitReached(c));

        setCourses(visibleCourses);
        setBootcamps(mergedBootcamps);
        setSelected(visibleCourses[0] || null);
      } catch (err) {
        if (!isMounted) return;
        setError('Failed to load your courses and bootcamps. Please try again.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadVideos();
    return () => { isMounted = false; };
  }, [userId]);

  useEffect(() => { setCurrentLessonIdx(0); }, [selected?.id]);

  const getCurrentList = () => {
    if (activeTab === 'courses') return courses;
    if (activeTab === 'bootcamp') return bootcamps;
    if (activeTab === 'online') return onlineList;
    return [];
  };

  const currentList = getCurrentList();

  const handleSelect = (item) => { setSelected(item); setPlaying(false); };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPlaying(false);
    if (tab === 'courses') setSelected(courses[0] || null);
    else if (tab === 'bootcamp') setSelected(bootcamps[0] || null);
    else if (tab === 'online') setSelected(onlineList[0] || null);
  };

  // ── Navigate to full-screen player page ──
  const handleStartCourse = () => {
    if (!selected) return;
    navigate('/course-player', {
      state: { item: selected, initialLessonIdx: currentLessonIdx },
    });
  };

  // ── "Continue Bootcamp" → goes to player page at the selected lesson ──
  const handleContinueBootcamp = () => {
    if (!selected) return;
    navigate('/course-player', {
      state: { item: selected, initialLessonIdx: currentLessonIdx },
    });
  };

  if (loading) return <div className="videos-page"><p>Loading your videos...</p></div>;
  if (error)   return <div className="videos-page"><p>{error}</p></div>;

  const activeVideoUrl = (activeTab === 'bootcamp' && selected?.syllabus?.length)
    ? (selected.syllabus[currentLessonIdx]?.url || selected.videoUrl)
    : selected?.videoUrl;

  return (
    <div className="videos-page">

      <div className="videos-tabs">
        <button className={`videos-tab ${activeTab === 'online'   ? 'active' : ''}`} onClick={() => handleTabChange('online')}>Online</button>
        <button className={`videos-tab ${activeTab === 'courses'  ? 'active' : ''}`} onClick={() => handleTabChange('courses')}>Courses</button>
        <button className={`videos-tab ${activeTab === 'bootcamp' ? 'active' : ''}`} onClick={() => handleTabChange('bootcamp')}>BootCamp</button>
      </div>

      <div className="videos-body">

        {/* Left list */}
        <div className="videos-left">
          <h2 className="videos-select-title">
            <span className="videos-play-icon">▶</span>
            {activeTab === 'online' ? 'Live Sessions' : 'Select a Module'}
          </h2>

          {currentList.length === 0 ? (
            <p className="videos-empty">
              {activeTab === 'courses'  && "You're not enrolled in any courses yet."}
              {activeTab === 'bootcamp' && "You're not enrolled in any bootcamps yet."}
              {activeTab === 'online'   && 'No live sessions announced yet.'}
            </p>
          ) : (
            <div className="videos-list">
              {currentList.map((item) => (
                <div key={item.id}
                  className={`videos-item ${selected?.id === item.id ? 'active' : ''}`}
                  onClick={() => handleSelect(item)}>
                  {item.thumbnail
                    ? <img src={item.thumbnail} alt={item.title} className="videos-item-thumbnail" />
                    : <div className="videos-item-thumb-icon">{item.isLive ? '🔴' : '🎬'}</div>}
                  <div className="videos-item-content">
                    <span className="videos-item-badge">{item.type}</span>
                    <h3 className="videos-item-title">{item.title}</h3>
                    <div className="videos-item-meta">
                      <span>👤 {item.expert}</span>
                      {item.progress != null && (
                        <>
                          <div className="videos-progress-bar">
                            <div className="videos-progress-fill" style={{ width: `${item.progress}%` }} />
                          </div>
                          <span className="videos-progress-text">{item.progress}%</span>
                        </>
                      )}
                      {item.syllabus && <span>🎬 {item.syllabus.length} video{item.syllabus.length > 1 ? 's' : ''}</span>}
                      {item.isLive && item.createdAt && (
                        <span>🕒 {new Date(item.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>
                  </div>
                  <div className={`videos-radio ${selected?.id === item.id ? 'selected' : ''}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right preview */}
        {selected && (
          <div className="videos-right">
            {activeTab === 'online' ? (
              <div className="videos-online-panel">
                <div className="videos-online-icon">🔴</div>
                <h3>{selected.title}</h3>
                <p>{selected.description}</p>
                <div className="videos-online-time">
                  {selected.createdAt ? `Announced at ${new Date(selected.createdAt).toLocaleString()}` : ''}
                </div>
                {/* ── NEW: Join Meeting button ── */}
                {selected.meetingUrl ? (
                  <a
                    href={selected.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="videos-join-btn"
                  >
                    📹 Join Meeting
                  </a>
                ) : (
                  <div className="videos-online-note">No meeting link provided yet.</div>
                )}
              </div>
            ) : (
              <>
                <div className="videos-preview">
                  {playing ? (
                    extractYTId(activeVideoUrl) ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${extractYTId(activeVideoUrl)}?autoplay=1&rel=0`}
                        title={selected.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="videos-player"
                        style={{ width: '100%', height: '100%', borderRadius: 8 }}
                      />
                    ) : (
                      <video src={activeVideoUrl} controls autoPlay className="videos-player" />
                    )
                  ) : (
                    <div className="videos-thumbnail" onClick={() => setPlaying(true)}>
                      <img src={selected.thumbnail} alt={selected.title} />
                      <div className="videos-play-btn">▶</div>
                      {activeTab === 'bootcamp' && selected.syllabus?.length ? (
                        <div className="videos-current-lesson">
                          <h4>{selected.syllabus[currentLessonIdx]?.title}</h4>
                          <p>{selected.title}</p>
                        </div>
                      ) : (
                        <span className="videos-preview-label">PREVIEW</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="videos-info">
                  <h3>{selected.title}</h3>
                  <p>{selected.description}</p>

                  {activeTab === 'bootcamp' && selected.syllabus?.length > 0 && (
                    <div className="videos-syllabus">
                      <div className="videos-syllabus-header">
                        <span>Bootcamp Videos</span>
                        <span className="videos-syllabus-progress">
                          {selected.syllabus.length} video{selected.syllabus.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      {selected.syllabus.map((lesson, idx) => (
                        <div key={lesson.id}
                          className={`videos-lesson ${idx === currentLessonIdx ? 'current' : ''}`}
                          onClick={() => { setCurrentLessonIdx(idx); setPlaying(false); }}>
                          <span className="videos-lesson-icon">{idx === currentLessonIdx ? '🔵' : '⭕'}</span>
                          <span className="videos-lesson-title">{lesson.title}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Action button ── */}
                  {activeTab === 'bootcamp' ? (
                    <button className="videos-start-btn" onClick={handleContinueBootcamp}>
                      Continue Bootcamp →
                    </button>
                  ) : (
                    <button className="videos-start-btn" onClick={handleStartCourse}>
                      Start Course
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Videos;