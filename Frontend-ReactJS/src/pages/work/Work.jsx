import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { getAcceptedOffers } from '../../apis/handlers/getAcceptedOffers';
import { uploadTeacherVideo } from '../../apis/handlers/uploadTeacherVideo';
import './Work.css';

// ─── YouTube helpers ──────────────────────────────────────────────────────────
const extractYouTubeId = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

const getYouTubeThumbnail = (videoId) =>
  videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;

// ─── Notification store ───────────────────────────────────────────────────────
let _notifListeners = [];
let _notifications = [];

export const notifyStudent = (studentId, payload) => {
  const notif = {
    id: `${Date.now()}_${Math.random()}`,
    studentId,
    ...payload,
    createdAt: new Date().toISOString(),
    read: false,
  };
  _notifications = [notif, ..._notifications];
  _notifListeners.forEach((fn) => fn([..._notifications]));
};

const useNotifications = (userId) => {
  const [notifs, setNotifs] = useState(
    _notifications.filter((n) => n.studentId === userId)
  );
  useEffect(() => {
    const handler = (all) => setNotifs(all.filter((n) => n.studentId === userId));
    _notifListeners.push(handler);
    return () => { _notifListeners = _notifListeners.filter((fn) => fn !== handler); };
  }, [userId]);
  const markAllRead = () => {
    _notifications = _notifications.map((n) =>
      n.studentId === userId ? { ...n, read: true } : n
    );
    setNotifs(_notifications.filter((n) => n.studentId === userId));
  };
  return { notifs, markAllRead };
};

// ─── NotificationBell ─────────────────────────────────────────────────────────
function NotificationBell({ userId, onNavigateToVideos }) {
  const { notifs, markAllRead } = useNotifications(userId);
  const [open, setOpen] = useState(false);
  const unread = notifs.filter((n) => !n.read).length;
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open && unread > 0) markAllRead();
  };

  return (
    <div className="notif-bell-wrap" ref={ref}>
      <button className="notif-bell-btn" onClick={handleOpen} title="Notifications">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <span>Notifications</span>
            {notifs.length > 0 && (
              <button className="notif-clear" onClick={() => {
                _notifications = _notifications.filter((n) => n.studentId !== userId);
                markAllRead();
              }}>Clear all</button>
            )}
          </div>
          {notifs.length === 0 ? (
            <div className="notif-empty">No notifications yet</div>
          ) : (
            notifs.slice(0, 10).map((n) => (
              <button key={n.id} className="notif-item"
                onClick={() => { setOpen(false); onNavigateToVideos?.(); }}>
                <div className="notif-dot" style={{ background: n.type === 'live' ? '#ef4444' : '#6366f1' }} />
                <div className="notif-content">
                  <div className="notif-title">
                    {n.type === 'live'
                      ? `🔴 ${n.teacherName} is going live: ${n.title}`
                      : `📹 New video from ${n.teacherName}: ${n.title}`}
                  </div>
                  <div className="notif-time">
                    {new Date(n.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── VideoWatchModal ──────────────────────────────────────────────────────────
function VideoWatchModal({ offer, maxWatches, onClose, onWatchComplete }) {
  const [watched, setWatched] = useState(offer.watchCount || 0);
  const [currentVideoIdx, setCurrentVideoIdx] = useState(0);

  const videos = offer.videos || [{ url: offer.youtubeUrl || offer.videoUrl, title: offer.title }];
  const currentVideo = videos[currentVideoIdx];
  const videoId = extractYouTubeId(currentVideo?.url);

  const handleWatch = () => {
    if (watched < maxWatches) {
      const next = watched + 1;
      setWatched(next);
      onWatchComplete?.(offer.id, next);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{currentVideo?.title || offer.title || 'Untitled'}</div>
            <div className="modal-sub">
              Watched {watched} / {maxWatches} times
              {watched >= maxWatches && <span className="modal-limit-warn"> · Watch limit reached</span>}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="watch-bar-wrap">
          {Array.from({ length: maxWatches }).map((_, i) => (
            <div key={i} className="watch-bar-seg"
              style={{ background: i < watched ? '#6366f1' : '#e2e8f0' }} />
          ))}
        </div>
        {videos.length > 1 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {videos.map((v, i) => (
              <button key={i} onClick={() => setCurrentVideoIdx(i)}
                style={{
                  padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  border: '1.5px solid',
                  borderColor: i === currentVideoIdx ? 'var(--primary, #4f46e5)' : '#e2e8f0',
                  background: i === currentVideoIdx ? '#eef2ff' : 'white',
                  color: i === currentVideoIdx ? '#4f46e5' : '#64748b',
                  cursor: 'pointer',
                }}>
                {v.title || `Video ${i + 1}`}
              </button>
            ))}
          </div>
        )}
        {videoId ? (
          <div className="yt-embed-wrap">
            <iframe src={`https://www.youtube.com/embed/${videoId}?rel=0`}
              title={currentVideo?.title} frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen style={{ width: '100%', height: '100%', borderRadius: '8px' }} />
          </div>
        ) : (
          <div className="yt-no-embed">No valid YouTube link attached to this video.</div>
        )}
        <button className="btn-watched" onClick={handleWatch} disabled={watched >= maxWatches}>
          {watched >= maxWatches ? '✓ Watch limit reached' : 'Mark as Watched'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Work Component ──────────────────────────────────────────────────────
export default function Work({ onNavigateToStudentVideos }) {
  const [activeContentTab, setActiveContentTab] = useState('Videos');
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [listOpen, setListOpen] = useState(true);
  const [filterType, setFilterType] = useState('All Categories');
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  // Upload-in-flight / feedback state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Videos form state
  const [videoTitle, setVideoTitle] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [tags, setTags] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [watchLimit, setWatchLimit] = useState(2);

  // Live form state
  const [liveTitle, setLiveTitle] = useState('');
  const [liveInfo, setLiveInfo] = useState('');

  // Bootcamp playlist state
  const [bootcampTitle, setBootcampTitle] = useState('');
  const [bootcampDesc, setBootcampDesc] = useState('');
  const [bootcampTags, setBootcampTags] = useState('');
  const [bootcampWatchLimit, setBootcampWatchLimit] = useState(2);
  const [bootcampVideos, setBootcampVideos] = useState([{ url: '', title: '' }]);

  // Watch modal
  const [watchModal, setWatchModal] = useState(null);
  const [watchCounts, setWatchCounts] = useState({});
  const [hasUploadedThisSession, setHasUploadedThisSession] = useState(false);

  const user = useSelector((state) => state.user);
  const userRole = user?.role || 'student';
  const userName = user?.name || 'Username';
  const userId = user?.id;

  useEffect(() => { fetchAcceptedOffers(); }, [userRole]);

  // reset selected student when tab changes
  useEffect(() => { setSelectedStudentId(null); }, [activeContentTab]);

  const fetchAcceptedOffers = async () => {
    setLoading(true);
    setError('');
    const result = await getAcceptedOffers(userRole);
    if (result.response) {
      setOffers(result.data || []);
    } else {
      setError(result.message);
      setOffers([]);
    }
    setLoading(false);
  };

  const groupedOffers = {
    all: offers,
    bootcamp: offers.filter((o) => o.type === 'bootcamp'),
    recorded: offers.filter((o) => o.type === 'recorded'),
    live_1on1: offers.filter((o) => o.type === 'live_1on1'),
  };

  const stats = {
    online: groupedOffers.live_1on1.length,
    bootcamp: groupedOffers.bootcamp.length,
    live: groupedOffers.recorded.length,
  };

  const getListOffers = () => {
    if (activeContentTab === 'Online Course') return groupedOffers.live_1on1;
    if (activeContentTab === 'Videos') return groupedOffers.recorded;
    if (activeContentTab === 'Bootcamp') return groupedOffers.bootcamp;
    return offers;
  };

  const listOffers = getListOffers();

  const getStatusBadge = (status) =>
    (status === 'accepted' || status === 'published') ? 'badge-status badge-published' : 'badge-status badge-processing';

  const getStatusLabel = (status) => {
    if (status === 'accepted') return 'Published';
    if (status === 'pending') return 'Processing';
    return status || 'Pending';
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'bootcamp': return 'Bootcamp';
      case 'recorded': return 'Recorded';
      case 'live_1on1': return 'Live';
      default: return type || '—';
    }
  };

  const tableOffers = offers.filter((o) => o.type === 'recorded' || o.type === 'bootcamp');
  const filteredTableOffers = tableOffers.filter((o) => {
    if (filterType === 'All Categories') return true;
    return getTypeLabel(o.type).toLowerCase() === filterType.toLowerCase();
  });

  // ── Upload Video ──
  const handleUploadVideo = async () => {
    if (activeContentTab === 'Bootcamp') { handleUploadBootcamp(); return; }

    const yId = extractYouTubeId(youtubeUrl);
    if (!videoTitle.trim()) { setUploadError('Please add a video title.'); return; }
    if (!yId) { setUploadError('Please enter a valid YouTube URL.'); return; }
    if (!selectedStudentId) { setUploadError('Please select a student from My Lists first.'); return; }

    setUploadError('');
    setUploadSuccess('');
    setUploading(true);

    try {
      await uploadTeacherVideo({
        studentId: selectedStudentId,
        title: videoTitle,
        description: additionalInfo,
        videoUrl: youtubeUrl,
        videoType: 'recorded',
        thumbnailUrl: getYouTubeThumbnail(yId),
      });

      notifyStudent(selectedStudentId, { teacherName: userName, type: 'video', title: videoTitle });

      setVideoTitle(''); setAdditionalInfo(''); setTags(''); setYoutubeUrl(''); setWatchLimit(2);
      setHasUploadedThisSession(true);
      setUploadSuccess('Video uploaded and published to the student.');
    } catch (err) {
      console.error('uploadTeacherVideo error:', err);
      setUploadError(err?.response?.data?.error || 'Failed to upload video. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ── Upload Bootcamp ──
  const handleUploadBootcamp = async () => {
    if (!bootcampTitle.trim()) { setUploadError('Please add a bootcamp title.'); return; }
    const validVideos = bootcampVideos.filter((v) => v.url.trim() && extractYouTubeId(v.url));
    if (validVideos.length === 0) { setUploadError('Please add at least one valid YouTube URL.'); return; }
    if (!selectedStudentId) { setUploadError('Please select a student from My Lists first.'); return; }

    setUploadError('');
    setUploadSuccess('');
    setUploading(true);

    try {
      // Save each playlist video as its own row, all tied to the same student.
      for (const v of validVideos) {
        const yId = extractYouTubeId(v.url);
        await uploadTeacherVideo({
          studentId: selectedStudentId,
          title: v.title?.trim() || bootcampTitle,
          description: bootcampDesc,
          videoUrl: v.url,
          videoType: 'bootcamp',
          thumbnailUrl: getYouTubeThumbnail(yId),
        });
      }

      notifyStudent(selectedStudentId, { teacherName: userName, type: 'video', title: bootcampTitle });

      setBootcampTitle(''); setBootcampDesc(''); setBootcampTags('');
      setBootcampVideos([{ url: '', title: '' }]); setBootcampWatchLimit(2);
      setHasUploadedThisSession(true);
      setUploadSuccess('Bootcamp uploaded and published to the student.');
    } catch (err) {
      console.error('uploadTeacherVideo (bootcamp) error:', err);
      setUploadError(err?.response?.data?.error || 'Failed to upload bootcamp. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ── Go Live ──
  const handleGoLive = () => {
    if (!liveTitle.trim()) { setUploadError('Please add a live session title.'); return; }
    if (!selectedStudentId) { setUploadError('Please select a student from My Lists first.'); return; }

    setUploadError('');
    notifyStudent(selectedStudentId, { teacherName: userName, type: 'live', title: liveTitle });
    setUploadSuccess('Live session announced to the student.');
    setLiveTitle(''); setLiveInfo('');
  };

  const handleWatchComplete = (offerId, count) => {
    setWatchCounts((prev) => ({ ...prev, [offerId]: count }));
  };

  // ── Student view ──────────────────────────────────────────────────────────
  if (userRole === 'student') {
    return (
      <div className="page-container">
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1>Welcome back, {userName}</h1>
              <p>View your active courses and learning materials.</p>
            </div>
            <NotificationBell userId={userId} onNavigateToVideos={onNavigateToStudentVideos} />
          </div>
        </div>
        <div className="stats-row">
          <div className="stat-card"><div className="stat-label">Online</div><div className="stat-value">{stats.online} Courses</div></div>
          <div className="stat-card"><div className="stat-label">Bootcamp</div><div className="stat-value">{stats.bootcamp} Programs</div></div>
          <div className="stat-card"><div className="stat-label">Record</div><div className="stat-value">{stats.live} Videos</div></div>
        </div>
        {!loading && offers.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h2>No Active Courses</h2>
            <p style={{ color: 'var(--text-light)', marginTop: 8 }}>You haven't enrolled in any courses yet.</p>
          </div>
        ) : (
          <div className="card">
            <div className="card-title">Your Videos</div>
            {offers.filter((o) => o.type === 'recorded' || o.type === 'bootcamp').map((offer, i) => {
              const videos = offer.videos || [{ url: offer.youtubeUrl || offer.videoUrl }];
              const firstVideo = videos[0];
              const yId = extractYouTubeId(firstVideo?.url);
              const thumb = getYouTubeThumbnail(yId);
              const limit = offer.watchLimit || 2;
              const watched = watchCounts[offer.id] ?? offer.watchCount ?? 0;
              const atLimit = watched >= limit;
              return (
                <div key={offer.id || i} className="student-video-item">
                  <div className="student-video-thumb">
                    {thumb ? <img src={thumb} alt={offer.title} /> : (
                      <div className="student-video-thumb-placeholder">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="2">
                          <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="student-video-title">{offer.title || 'Untitled'}</div>
                    <div className="student-video-meta">
                      {getTypeLabel(offer.type)}
                      {videos.length > 1 && ` · ${videos.length} videos`}
                      {` · Watched ${watched}/${limit}`}
                    </div>
                    <div className="watch-bar-wrap" style={{ marginTop: 6 }}>
                      {Array.from({ length: limit }).map((_, idx) => (
                        <div key={idx} className="watch-bar-seg"
                          style={{ background: idx < watched ? '#6366f1' : '#e2e8f0' }} />
                      ))}
                    </div>
                  </div>
                  <button
                    className={`btn-watch ${atLimit ? 'btn-watch-disabled' : ''}`}
                    onClick={() => !atLimit && setWatchModal({ ...offer, watchCount: watched, watchLimit: limit })}
                    disabled={atLimit}>
                    {atLimit ? 'Limit reached' : 'Watch'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {watchModal && (
          <VideoWatchModal offer={watchModal} maxWatches={watchModal.watchLimit || 2}
            onClose={() => setWatchModal(null)} onWatchComplete={handleWatchComplete} />
        )}
      </div>
    );
  }

  // ── Teacher view ──────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>Welcome back, {userName}</h1>
            <p>Manage your course content and student materials from your professional dashboard.</p>
          </div>
          <NotificationBell userId={userId} onNavigateToVideos={onNavigateToStudentVideos} />
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card"><div className="stat-label">Online</div><div className="stat-value">{stats.online} Courses</div></div>
        <div className="stat-card"><div className="stat-label">Bootcamp</div><div className="stat-value">{stats.bootcamp} Programs</div></div>
        <div className="stat-card"><div className="stat-label">Record</div><div className="stat-value">{stats.live} Videos</div></div>
      </div>

      {/* ── Upload New Content ── */}
      <div className="card">
        <div className="card-title">
          <svg className="upload-new-content-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Upload New Content
        </div>

        <div className="content-type-label">Choose Content Type</div>
        <div className="type-tabs">
          {['Online Course', 'Videos', 'Bootcamp'].map((tab) => (
            <button key={tab}
              className={`type-tab ${activeContentTab === tab ? 'active' : ''}`}
              onClick={() => setActiveContentTab(tab)}>
              {tab === 'Online Course' && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                </svg>
              )}
              {tab === 'Videos' && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                </svg>
              )}
              {tab === 'Bootcamp' && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                </svg>
              )}
              {tab}
            </button>
          ))}
        </div>

        {/* Videos Tab — form only, no drop zone */}
        {activeContentTab === 'Videos' && (
          <div className="form-fields" style={{ maxWidth: 520 }}>
            <div>
              <div className="field-label">Video Title</div>
              <input className="field-input" placeholder="Add a title that describes your video"
                value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} />
            </div>
            <div>
              <div className="field-label">YouTube URL</div>
              <input className="field-input" placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} />
              {youtubeUrl && !extractYouTubeId(youtubeUrl) && (
                <div style={{ color: '#ef4444', fontSize: '11px', marginTop: 4 }}>Invalid YouTube URL</div>
              )}
              {extractYouTubeId(youtubeUrl) && (
                <img src={getYouTubeThumbnail(extractYouTubeId(youtubeUrl))} alt="preview"
                  style={{ marginTop: 8, width: '100%', borderRadius: 6, maxHeight: 120, objectFit: 'cover' }} />
              )}
            </div>
            <div>
              <div className="field-label">Additional Information</div>
              <textarea className="field-textarea" placeholder="Video description or notes for students..."
                value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} />
            </div>
            <div>
              <div className="field-label">Tags</div>
              <input className="field-input" placeholder="e.g. tutorial, python, basic"
                value={tags} onChange={(e) => setTags(e.target.value)} />
            </div>
            <div>
              <div className="field-label">Watch Limit (per student)</div>
              <div className="watch-limit-row">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} className={`watch-limit-btn ${watchLimit === n ? 'active' : ''}`}
                    onClick={() => setWatchLimit(n)}>{n}×</button>
                ))}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: 4 }}>
                Students can watch this video up to {watchLimit} time{watchLimit > 1 ? 's' : ''}
              </div>
            </div>
          </div>
        )}

        {/* Online Course Tab */}
        {activeContentTab === 'Online Course' && (
          <div className="simple-form">
            <div>
              <div className="field-label">Live Session Title</div>
              <input className="field-input" placeholder="Add a title for your live session"
                value={liveTitle} onChange={(e) => setLiveTitle(e.target.value)} />
            </div>
            <div>
              <div className="field-label">Description</div>
              <textarea className="field-textarea" placeholder="Describe what you'll cover in this live session..."
                value={liveInfo} onChange={(e) => setLiveInfo(e.target.value)} />
            </div>
          </div>
        )}

        {/* Bootcamp Tab */}
        {activeContentTab === 'Bootcamp' && (
          <div className="form-fields">
            <div>
              <div className="field-label">Bootcamp Title</div>
              <input className="field-input" placeholder="Add a title for your bootcamp"
                value={bootcampTitle} onChange={(e) => setBootcampTitle(e.target.value)} />
            </div>
            <div>
              <div className="field-label">Description</div>
              <textarea className="field-textarea" placeholder="Describe your bootcamp..."
                value={bootcampDesc} onChange={(e) => setBootcampDesc(e.target.value)} />
            </div>
            <div>
              <div className="field-label">Tags</div>
              <input className="field-input" placeholder="e.g. web dev, intensive, fullstack"
                value={bootcampTags} onChange={(e) => setBootcampTags(e.target.value)} />
            </div>
            <div>
              <div className="field-label">Bootcamp Videos</div>
              {bootcampVideos.map((v, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <input className="field-input" placeholder={`Video ${i + 1} Title`}
                      value={v.title}
                      onChange={(e) => {
                        const updated = [...bootcampVideos];
                        updated[i] = { ...updated[i], title: e.target.value };
                        setBootcampVideos(updated);
                      }} style={{ marginBottom: 6 }} />
                    <input className="field-input" placeholder="YouTube URL"
                      value={v.url}
                      onChange={(e) => {
                        const updated = [...bootcampVideos];
                        updated[i] = { ...updated[i], url: e.target.value };
                        setBootcampVideos(updated);
                      }} />
                    {v.url && !extractYouTubeId(v.url) && (
                      <div style={{ color: '#ef4444', fontSize: '11px', marginTop: 2 }}>Invalid YouTube URL</div>
                    )}
                    {extractYouTubeId(v.url) && (
                      <img src={getYouTubeThumbnail(extractYouTubeId(v.url))} alt="preview"
                        style={{ marginTop: 6, width: '100%', borderRadius: 6, maxHeight: 80, objectFit: 'cover' }} />
                    )}
                  </div>
                  {bootcampVideos.length > 1 && (
                    <button onClick={() => setBootcampVideos(bootcampVideos.filter((_, idx) => idx !== i))}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 18, marginTop: 8 }}>✕</button>
                  )}
                </div>
              ))}
              <button onClick={() => setBootcampVideos([...bootcampVideos, { url: '', title: '' }])}
                style={{ fontSize: 13, color: 'var(--primary)', background: 'none',
                  border: '1.5px dashed var(--primary)', borderRadius: 8,
                  padding: '6px 16px', cursor: 'pointer', marginTop: 4 }}>
                + Add Video
              </button>
            </div>
            <div>
              <div className="field-label">Watch Limit (per student)</div>
              <div className="watch-limit-row">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} className={`watch-limit-btn ${bootcampWatchLimit === n ? 'active' : ''}`}
                    onClick={() => setBootcampWatchLimit(n)}>{n}×</button>
                ))}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: 4 }}>
                Students can watch each video up to {bootcampWatchLimit} time{bootcampWatchLimit > 1 ? 's' : ''}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── My Lists ── */}
      <div className="card">
        <div className="list-card-header">
          <span className="list-card-title">My Lists</span>
          <button className="chevron-btn" onClick={() => setListOpen(!listOpen)}>
            {listOpen ? '▲' : '▼'}
          </button>
        </div>

        {/* hint */}
        {listOpen && listOffers.length > 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 10 }}>
            Click on a student to select them before uploading
          </div>
        )}

        {/* upload feedback */}
        {uploadError && (
          <div style={{
            background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca',
            borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 10,
          }}>
            {uploadError}
          </div>
        )}
        {uploadSuccess && (
          <div style={{
            background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0',
            borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 10,
          }}>
            {uploadSuccess}
          </div>
        )}

        {loading && (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-light)' }}>Loading...</div>
        )}

        {!loading && listOpen && (
          <>
            {listOffers.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-light)' }}>
                No students for {activeContentTab} yet
              </div>
            ) : (
              listOffers.map((offer, index) => {
                const isSelected = selectedStudentId === offer.studentId;
                return (
                  <div
                    key={offer.id || index}
                    className="list-item"
                    onClick={() => { setSelectedStudentId(isSelected ? null : offer.studentId); setUploadError(''); setUploadSuccess(''); }}
                    style={{
                      cursor: 'pointer',
                      background: isSelected ? 'var(--primary-light)' : 'white',
                      borderRadius: 8,
                      padding: '10px 12px',
                      border: isSelected ? '1.5px solid var(--primary)' : '1.5px solid transparent',
                      transition: 'all 0.15s',
                    }}>
                    <div className="list-user">
                      {/* Avatar */}
                      <div className="list-avatar" style={{
                        background: offer.studentPhoto
                          ? `url(${offer.studentPhoto}) center/cover`
                          : `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
                        backgroundSize: 'cover',
                      }}>
                        {!offer.studentPhoto && (
                          <span style={{ color: 'white', fontSize: '13px', fontWeight: 700 }}>
                            {offer.studentName?.charAt(0) || 'S'}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div>
                        <div className="list-user-name" style={{ color: isSelected ? 'var(--primary)' : '' }}>
                          {offer.studentName || 'Student'}
                        </div>
                        <div className="list-course">
                          {offer.title || 'Untitled'} · {getTypeLabel(offer.type)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {/* Selected checkmark */}
                      {isSelected && (
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%',
                          background: 'var(--primary)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                            stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </div>
                      )}

                      {/* PDF badge */}
                      {offer.fileUrl && (
                        <a href={offer.fileUrl} target="_blank" rel="noopener noreferrer"
                          className="badge-pdf badge-pdf-link" title="View Student PDF"
                          onClick={(e) => e.stopPropagation()}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                            viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="9" y1="13" x2="15" y2="13"/>
                            <line x1="9" y1="17" x2="13" y2="17"/>
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* Upload button */}
        <button
          className="btn-publish"
          disabled={uploading || (listOffers.length > 0 && !selectedStudentId)}
          style={{ opacity: uploading || (listOffers.length > 0 && !selectedStudentId) ? 0.5 : 1 }}
          onClick={activeContentTab === 'Online Course' ? handleGoLive : handleUploadVideo}>
          {activeContentTab === 'Online Course' ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
              </svg>
              Go Live
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                <path d="M5 21h14"/>
              </svg>
              {uploading ? 'Uploading...' : 'Upload and Publish'}
              {!uploading && selectedStudentId && listOffers.find(o => o.studentId === selectedStudentId) && (
                <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.85 }}>
                  → {listOffers.find(o => o.studentId === selectedStudentId)?.studentName}
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* ── Video Management ── */}
      {(activeContentTab === 'Videos' || activeContentTab === 'Bootcamp') && hasUploadedThisSession && (
        <div className="card">
          <div className="vm-header">
            <span className="vm-title">Video Management</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>Filter:</span>
              <select className="filter-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option>All Categories</option>
                <option>Recorded</option>
                <option>Bootcamp</option>
              </select>
            </div>
          </div>
          <table className="vm-table">
            <thead>
              <tr>
                <th>Video Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Date</th>
                <th>Watches</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTableOffers.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-light)', padding: '24px' }}>No content yet</td></tr>
              )}
              {filteredTableOffers.map((offer, index) => {
                const videos = offer.videos || [{ url: offer.youtubeUrl || offer.videoUrl }];
                const yId = extractYouTubeId(videos[0]?.url);
                const thumb = getYouTubeThumbnail(yId);
                const limit = offer.watchLimit || 2;
                return (
                  <tr key={offer.id || index}>
                    <td>
                      <div className="video-cell">
                        <div className="video-thumb">
                          {thumb ? (
                            <img src={thumb} alt="" style={{ width: '100%', height: '100%', borderRadius: 8, objectFit: 'cover' }} />
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="2">
                              <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                            </svg>
                          )}
                        </div>
                        <div>
                          <span className="video-name">{offer.title || 'Untitled'}</span>
                          {videos.length > 1 && (
                            <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>{videos.length} videos</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{getTypeLabel(offer.type)}</td>
                    <td><span className={getStatusBadge(offer.bidStatus)}>{getStatusLabel(offer.bidStatus)}</span></td>
                    <td style={{ fontSize: '12px' }}>
                      {offer.createdAt
                        ? new Date(offer.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 3 }}>
                        {Array.from({ length: limit }).map((_, i) => (
                          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#e2e8f0' }} />
                        ))}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-light)', marginTop: 2 }}>Limit: {limit}×</div>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="action-btn" title="Delete"
                          onClick={() => setOffers((prev) => prev.filter((o) => o.id !== offer.id))}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {watchModal && (
        <VideoWatchModal offer={watchModal} maxWatches={watchModal.watchLimit || 2}
          onClose={() => setWatchModal(null)} onWatchComplete={handleWatchComplete} />
      )}
    </div>
  );
}