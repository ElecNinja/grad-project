import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { getAcceptedOffers } from '../../apis/handlers/getAcceptedOffers';
import { uploadTeacherVideo } from '../../apis/handlers/uploadTeacherVideo';
import { createPublicBootcamp } from '../../apis/handlers/Createpublicbootcamp';
import { addBootcampSection, makeBootcampPublic } from '../../apis/handlers/Publicbootcamphandlers';
import './Work.css';

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

export const useNotifications = (userId) => {
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

// ── Edit Modal ──────────────────────────────────────────────────────────────
function EditVideoModal({ offer, onClose, onSave }) {
  const [title, setTitle] = useState(offer.title || '');
  const [description, setDescription] = useState(offer.description || '');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Edit Video</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div className="field-label">Title</div>
            <input className="field-input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <div className="field-label">Description</div>
            <textarea className="field-textarea" value={description}
              onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn-watched" onClick={() => onSave({ ...offer, title, description })}>
            Save Changes
          </button>
          <button onClick={onClose}
            style={{ flex: 1, padding: 10, borderRadius: 10, border: '1.5px solid #e2e8f0',
              background: 'white', cursor: 'pointer', fontSize: 13 }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Section Modal ─────────────────────────────────────────────────────
// Lets the teacher add a new section (e.g. "CSS", "JavaScript") with its
// own videos to an existing bootcamp.
function AddSectionModal({ bootcampId, onClose, onSaved }) {
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionVideos, setSectionVideos] = useState([{ url: '', title: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!sectionTitle.trim()) { setError('Please add a section title.'); return; }

    const validVideos = sectionVideos
      .filter((v) => v.url.trim() && extractYouTubeId(v.url))
      .map((v) => ({ title: v.title?.trim() || '', url: v.url.trim() }));

    if (validVideos.length === 0) { setError('Please add at least one valid YouTube URL.'); return; }

    setError('');
    setSubmitting(true);
    try {
      const result = await addBootcampSection({
        bootcampId,
        sectionTitle,
        videos: validVideos,
      });

      if (!result.response) {
        setError(result.message || 'Failed to add section.');
        return;
      }

      onSaved?.(result.data);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to add section. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Add Section</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div className="field-label">Section Title</div>
            <input className="field-input" placeholder="e.g. CSS, JavaScript, Deeper Analysis"
              value={sectionTitle} onChange={(e) => setSectionTitle(e.target.value)} />
          </div>
          <div>
            <div className="field-label">Videos for this Section</div>
            {sectionVideos.map((v, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <input className="field-input" placeholder={`Video ${i + 1} Title`}
                    value={v.title}
                    onChange={(e) => {
                      const updated = [...sectionVideos];
                      updated[i] = { ...updated[i], title: e.target.value };
                      setSectionVideos(updated);
                    }} style={{ marginBottom: 6 }} />
                  <input className="field-input" placeholder="YouTube URL"
                    value={v.url}
                    onChange={(e) => {
                      const updated = [...sectionVideos];
                      updated[i] = { ...updated[i], url: e.target.value };
                      setSectionVideos(updated);
                    }} />
                  {v.url && !extractYouTubeId(v.url) && (
                    <div style={{ color: '#ef4444', fontSize: '11px', marginTop: 2 }}>Invalid YouTube URL</div>
                  )}
                </div>
                {sectionVideos.length > 1 && (
                  <button onClick={() => setSectionVideos(sectionVideos.filter((_, idx) => idx !== i))}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 18, marginTop: 8 }}>✕</button>
                )}
              </div>
            ))}
            <button onClick={() => setSectionVideos([...sectionVideos, { url: '', title: '' }])}
              style={{ fontSize: 13, color: 'var(--primary)', background: 'none',
                border: '1.5px dashed var(--primary)', borderRadius: 8,
                padding: '6px 16px', cursor: 'pointer', marginTop: 4 }}>
              + Add Video
            </button>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca',
              borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
              {error}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn-watched" disabled={submitting} style={{ opacity: submitting ? 0.5 : 1 }}
            onClick={handleSubmit}>
            {submitting ? 'Adding...' : 'Add Section'}
          </button>
          <button onClick={onClose}
            style={{ flex: 1, padding: 10, borderRadius: 10, border: '1.5px solid #e2e8f0',
              background: 'white', cursor: 'pointer', fontSize: 13 }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Make Public Modal ─────────────────────────────────────────────────────
// Lets the teacher convert a private bootcamp into a public, self-enroll
// bootcamp with a chosen capacity.
function MakePublicModal({ bootcampId, onClose, onSaved }) {
  const [capacity, setCapacity] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!capacity || Number(capacity) <= 0) { setError('Please set how many students can join.'); return; }

    setError('');
    setSubmitting(true);
    try {
      const result = await makeBootcampPublic({ bootcampId, capacity: Number(capacity) });

      if (!result.response) {
        setError(result.message || 'Failed to make bootcamp public.');
        return;
      }

      onSaved?.(result.data);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to make bootcamp public. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Make Public</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div className="field-label">Capacity (how many students can join)</div>
            <input className="field-input" type="number" min="1" placeholder="e.g. 20"
              value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: 4 }}>
              Any student can join instantly until this number is reached — no approval needed.
            </div>
          </div>
          {error && (
            <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca',
              borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
              {error}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn-watched" disabled={submitting} style={{ opacity: submitting ? 0.5 : 1 }}
            onClick={handleSubmit}>
            {submitting ? 'Publishing...' : 'Make Public'}
          </button>
          <button onClick={onClose}
            style={{ flex: 1, padding: 10, borderRadius: 10, border: '1.5px solid #e2e8f0',
              background: 'white', cursor: 'pointer', fontSize: 13 }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Work({ onNavigateToStudentVideos }) {
  const [activeContentTab, setActiveContentTab] = useState('Videos');
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [listOpen, setListOpen] = useState(true);
  const [filterType, setFilterType] = useState('All Categories');
  const [selectedOfferId, setSelectedOfferId] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // uploaded videos list (shown in Video Management after upload)
  // FIX 1: initialize from localStorage so they survive page refresh
  const [uploadedRows, setUploadedRows] = useState(() => {
    try {
      const saved = localStorage.getItem('work_uploadedRows');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // edit modal
  const [editOffer, setEditOffer] = useState(null);

  // add-section / make-public modals (bootcamp management)
  const [sectionModalBootcampId, setSectionModalBootcampId] = useState(null);
  const [makePublicBootcampId, setMakePublicBootcampId] = useState(null);

  const [videoTitle, setVideoTitle] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [tags, setTags] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [watchLimit, setWatchLimit] = useState(2);

  const [liveTitle, setLiveTitle] = useState('');
  const [liveInfo, setLiveInfo] = useState('');

  const [bootcampTitle, setBootcampTitle] = useState('');
  const [bootcampDesc, setBootcampDesc] = useState('');
  const [bootcampTags, setBootcampTags] = useState('');
  const [bootcampSectionTitle, setBootcampSectionTitle] = useState('');
  const [bootcampVideos, setBootcampVideos] = useState([{ url: '', title: '' }]);

  const [watchModal, setWatchModal] = useState(null);
  const [watchCounts, setWatchCounts] = useState({});

  const user = useSelector((state) => state.user);
  const userRole = user?.role || 'student';
  const userName = user?.name || 'Username';
  const userId = user?.id;

  useEffect(() => { fetchAcceptedOffers(); }, [userRole]);
  useEffect(() => { setSelectedOfferId(null); }, [activeContentTab]);

  // FIX 1: persist uploadedRows so refresh doesn't bring students back
  useEffect(() => {
    try {
      localStorage.setItem('work_uploadedRows', JSON.stringify(uploadedRows));
    } catch {}
  }, [uploadedRows]);

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

  // Stats: count uploaded rows by type so numbers update after upload
  const uploadedRecorded = uploadedRows.filter((r) => r.type === 'recorded').length;
  const uploadedBootcamp = uploadedRows.filter((r) => r.type === 'bootcamp').length;

  const stats = {
    online: groupedOffers.live_1on1.length,
    bootcamp: groupedOffers.bootcamp.length + uploadedBootcamp,
    live: groupedOffers.recorded.length + uploadedRecorded,
  };

  const getListOffers = () => {
    if (activeContentTab === 'Online Course') return groupedOffers.live_1on1;
    if (activeContentTab === 'Videos') return groupedOffers.recorded;
    if (activeContentTab === 'Bootcamp') return groupedOffers.bootcamp;
    return offers;
  };

  // FIX 1: exclude students who already got an upload this session
  const uploadedStudentIds = uploadedRows.map((r) => r._studentId).filter(Boolean);
  const listOffers = getListOffers().filter((o) => !uploadedStudentIds.includes(o.studentId));

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

  // Video Management only shows uploadedRows (things uploaded this session)
  const filteredTableOffers = uploadedRows.filter((o) => {
    if (filterType === 'All Categories') return true;
    return getTypeLabel(o.type).toLowerCase() === filterType.toLowerCase();
  });

  // ── Upload Video ──
  const handleUploadVideo = async () => {
    if (activeContentTab === 'Bootcamp') { handleUploadBootcamp(); return; }

    const yId = extractYouTubeId(youtubeUrl);
    const selectedOffer = listOffers.find(o => o.id === selectedOfferId);
    const studentIdToUpload = selectedOffer?.studentId;

    if (!videoTitle.trim()) { setUploadError('Please add a video title.'); return; }
    if (!yId) { setUploadError('Please enter a valid YouTube URL.'); return; }
    if (!studentIdToUpload) { setUploadError('Please select a student from My Lists first.'); return; }

    setUploadError('');
    setUploadSuccess('');
    setUploading(true);

    try {
      await uploadTeacherVideo({
        studentId: studentIdToUpload,
        title: videoTitle,
        description: additionalInfo,
        videoUrl: youtubeUrl,
        videoType: 'recorded',
        thumbnailUrl: getYouTubeThumbnail(yId),
      });

      notifyStudent(studentIdToUpload, { teacherName: userName, type: 'video', title: videoTitle });

      // FIX 1: add to uploadedRows (appears in Video Management), remove student from My Lists
      setUploadedRows((prev) => [...prev, {
        id: `uploaded_${Date.now()}`,
        title: videoTitle,
        description: additionalInfo,
        youtubeUrl,
        type: 'recorded',
        bidStatus: 'accepted',
        createdAt: new Date().toISOString(),
        watchLimit,
        _studentId: studentIdToUpload,
      }]);

      setVideoTitle(''); setAdditionalInfo(''); setTags(''); setYoutubeUrl(''); setWatchLimit(2);
      setSelectedOfferId(null);
      setUploadSuccess('Video uploaded and published to the student.');
    } catch (err) {
      setUploadError(err?.response?.data?.error || 'Failed to upload video. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ── Create Bootcamp (starts private — first section + its videos) ──
  const handleUploadBootcamp = async () => {
    if (!bootcampTitle.trim()) { setUploadError('Please add a bootcamp title.'); return; }
    if (!bootcampSectionTitle.trim()) { setUploadError('Please add a title for the first section (e.g. HTML, Intro).'); return; }

    const validVideos = bootcampVideos
      .filter((v) => v.url.trim() && extractYouTubeId(v.url))
      .map((v) => ({ title: v.title?.trim() || '', url: v.url.trim() }));

    if (validVideos.length === 0) { setUploadError('Please add at least one valid YouTube URL.'); return; }

    setUploadError('');
    setUploadSuccess('');
    setUploading(true);

    try {
      const result = await createPublicBootcamp({
        title: bootcampTitle,
        description: bootcampDesc,
        sectionTitle: bootcampSectionTitle,
        videos: validVideos,
      });

      if (!result.response) {
        setUploadError(result.message || 'Failed to create bootcamp.');
        return;
      }

      // Reflect it in Video Management immediately (private until "Make Public")
      setUploadedRows((prev) => [...prev, {
        id: result.data?.id || `bootcamp_${Date.now()}`,
        title: bootcampTitle,
        description: bootcampDesc,
        type: 'bootcamp',
        bidStatus: 'accepted',
        createdAt: result.data?.created_at || new Date().toISOString(),
        videos: validVideos,
        sections: result.data?.section ? [{ id: result.data.section.id, title: result.data.section.title, lessons: validVideos }] : [],
        isPublic: false,
        capacity: null,
        enrolledCount: 0,
      }]);

      setBootcampTitle(''); setBootcampDesc(''); setBootcampTags('');
      setBootcampSectionTitle(''); setBootcampVideos([{ url: '', title: '' }]);
      setUploadSuccess('Bootcamp created. Add more sections or use "Make Public" from Video Management when ready.');
    } catch (err) {
      setUploadError(err?.response?.data?.error || 'Failed to create bootcamp. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ── Go Live ──
  const handleGoLive = () => {
    const selectedOffer = listOffers.find(o => o.id === selectedOfferId);
    const studentIdToUpload = selectedOffer?.studentId;

    if (!liveTitle.trim()) { setUploadError('Please add a live session title.'); return; }
    if (!studentIdToUpload) { setUploadError('Please select a student from My Lists first.'); return; }

    setUploadError('');
    notifyStudent(studentIdToUpload, { teacherName: userName, type: 'live', title: liveTitle });
    setUploadSuccess('Live session announced to the student.');
    setLiveTitle(''); setLiveInfo('');
  };

  const handleWatchComplete = (offerId, count) => {
    setWatchCounts((prev) => ({ ...prev, [offerId]: count }));
  };

  // FIX 3: edit handler
  const handleEditSave = (updated) => {
    setUploadedRows((prev) => prev.map((o) => o.id === updated.id ? updated : o));
    setEditOffer(null);
  };

  // called when AddSectionModal succeeds — append the new section locally
  const handleSectionAdded = (bootcampId, newSection) => {
    setUploadedRows((prev) => prev.map((o) => {
      if (o.id !== bootcampId) return o;
      const sections = [...(o.sections || []), newSection];
      return { ...o, sections };
    }));
  };

  // called when MakePublicModal succeeds — flip the row to public locally
  const handleMadePublic = (bootcampId, data) => {
    setUploadedRows((prev) => prev.map((o) => {
      if (o.id !== bootcampId) return o;
      return {
        ...o,
        isPublic: true,
        capacity: data?.max_students ?? o.capacity,
        enrolledCount: data?.enrolled_count ?? o.enrolledCount ?? 0,
      };
    }));
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

      {/* Upload New Content */}
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
              <div className="field-label">First Section Title</div>
              <input className="field-input" placeholder="e.g. HTML, Intro, Getting Started"
                value={bootcampSectionTitle} onChange={(e) => setBootcampSectionTitle(e.target.value)} />
              <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: 4 }}>
                Your bootcamp starts with this one section. You can add more sections (CSS, JavaScript, ...) after creating it.
              </div>
            </div>
            <div>
              <div className="field-label">Videos for this Section</div>
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

            {uploadError && (
              <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca',
                borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
                {uploadError}
              </div>
            )}
            {uploadSuccess && (
              <div style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0',
                borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
                {uploadSuccess}
              </div>
            )}

            <button className="btn-publish" disabled={uploading}
              style={{ opacity: uploading ? 0.5 : 1 }} onClick={handleUploadBootcamp}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                <path d="M5 21h14"/>
              </svg>
              {uploading ? 'Creating...' : 'Create Bootcamp'}
            </button>
          </div>
        )}
      </div>

      {/* My Lists — only relevant for Videos / Online Course (per-student flow). Bootcamp is managed from Video Management below. */}
      {activeContentTab !== 'Bootcamp' && (
      <div className="card">
        <div className="list-card-header">
          <span className="list-card-title">My Lists</span>
          <button className="chevron-btn" onClick={() => setListOpen(!listOpen)}>
            {listOpen ? '▲' : '▼'}
          </button>
        </div>

        {listOpen && listOffers.length > 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 10 }}>
            Click on a student to select them before uploading
          </div>
        )}

        {uploadError && (
          <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca',
            borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 10 }}>
            {uploadError}
          </div>
        )}
        {uploadSuccess && (
          <div style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0',
            borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 10 }}>
            {uploadSuccess}
          </div>
        )}

        {loading && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-light)' }}>Loading...</div>}

        {!loading && listOpen && (
          <>
            {listOffers.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-light)' }}>
                No students for {activeContentTab} yet
              </div>
            ) : (
              listOffers.map((offer, index) => {
                const isSelected = selectedOfferId === offer.id;
                return (
                  <div key={offer.id || index} className="list-item"
                    onClick={() => { setSelectedOfferId(isSelected ? null : offer.id); setUploadError(''); setUploadSuccess(''); }}
                    style={{
                      cursor: 'pointer',
                      background: isSelected ? 'var(--primary-light)' : 'white',
                      borderRadius: 8, padding: '10px 12px',
                      border: isSelected ? '1.5px solid var(--primary)' : '1.5px solid transparent',
                      transition: 'all 0.15s',
                    }}>
                    <div className="list-user">
                      <div className="list-avatar" style={{
                        background: offer.studentPhoto
                          ? `url(${offer.studentPhoto}) center/cover` : `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
                        backgroundSize: 'cover',
                      }}>
                        {!offer.studentPhoto && (
                          <span style={{ color: 'white', fontSize: '13px', fontWeight: 700 }}>
                            {offer.studentName?.charAt(0) || 'S'}
                          </span>
                        )}
                      </div>
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
                      {isSelected && (
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                            stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </div>
                      )}
                      {/* FIX 2: show "PDF" text instead of only icon */}
                      {offer.fileUrl && (
                        <a href={offer.fileUrl} target="_blank" rel="noopener noreferrer"
                          className="badge-pdf badge-pdf-link" title="View Student PDF"
                          onClick={(e) => e.stopPropagation()}
                          style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
                            viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="9" y1="13" x2="15" y2="13"/>
                            <line x1="9" y1="17" x2="13" y2="17"/>
                          </svg>
                          <span style={{ fontSize: '11px', fontWeight: 700 }}>PDF</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        <button className="btn-publish"
          disabled={uploading || (listOffers.length > 0 && !selectedOfferId)}
          style={{ opacity: uploading || (listOffers.length > 0 && !selectedOfferId) ? 0.5 : 1 }}
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
              {!uploading && selectedOfferId && listOffers.find(o => o.id === selectedOfferId) && (
                <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.85 }}>
                  → {listOffers.find(o => o.id === selectedOfferId)?.studentName}
                </span>
              )}
            </>
          )}
        </button>
      </div>
      )}

      {/* Video Management — shows only after upload, Videos & Bootcamp tabs only */}
      {(activeContentTab === 'Videos' || activeContentTab === 'Bootcamp') && uploadedRows.length > 0 && (
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
                const isBootcamp = offer.type === 'bootcamp';
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
                          {isBootcamp && (offer.sections?.length > 0) && (
                            <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                              {offer.sections.length} section{offer.sections.length > 1 ? 's' : ''}
                            </div>
                          )}
                          {!isBootcamp && videos.length > 1 && (
                            <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>{videos.length} videos</div>
                          )}
                          {isBootcamp && (
                            offer.isPublic ? (
                              <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>
                                {offer.enrolledCount ?? 0}/{offer.capacity} joined
                              </div>
                            ) : (
                              <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>Private</div>
                            )
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
                      {isBootcamp ? (
                        <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>—</span>
                      ) : (
                        <>
                          <div style={{ display: 'flex', gap: 3 }}>
                            {Array.from({ length: limit }).map((_, i) => (
                              <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#e2e8f0' }} />
                            ))}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-light)', marginTop: 2 }}>Limit: {limit}×</div>
                        </>
                      )}
                    </td>
                    <td>
                      <div className="actions-cell" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {isBootcamp && (
                          <>
                            <button
                              style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)', background: 'none',
                                border: '1.5px dashed var(--primary)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}
                              onClick={() => setSectionModalBootcampId(offer.id)}>
                              + Add Section
                            </button>
                            {!offer.isPublic && (
                              <button
                                style={{ fontSize: 11, fontWeight: 600, color: '#15803d', background: '#f0fdf4',
                                  border: '1.5px solid #bbf7d0', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}
                                onClick={() => setMakePublicBootcampId(offer.id)}>
                                Make Public
                              </button>
                            )}
                          </>
                        )}
                        {/* FIX 3: Edit button */}
                        <button className="action-btn" title="Edit" onClick={() => setEditOffer(offer)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button className="action-btn" title="Delete"
                          onClick={() => setUploadedRows((prev) => prev.filter((o) => o.id !== offer.id))}>
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

      {/* FIX 3: Edit modal */}
      {editOffer && (
        <EditVideoModal offer={editOffer} onClose={() => setEditOffer(null)} onSave={handleEditSave} />
      )}

      {/* Bootcamp management modals */}
      {sectionModalBootcampId && (
        <AddSectionModal
          bootcampId={sectionModalBootcampId}
          onClose={() => setSectionModalBootcampId(null)}
          onSaved={(newSection) => handleSectionAdded(sectionModalBootcampId, newSection)}
        />
      )}
      {makePublicBootcampId && (
        <MakePublicModal
          bootcampId={makePublicBootcampId}
          onClose={() => setMakePublicBootcampId(null)}
          onSaved={(data) => handleMadePublic(makePublicBootcampId, data)}
        />
      )}
    </div>
  );
}
