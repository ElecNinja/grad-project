import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  MapPin, Calendar, Mail, Edit2, Share2, BookOpen,
  Award, TrendingUp, X, Camera, User, Globe, Clock,
  Briefcase, CheckCircle, AlertCircle, FileText, Inbox
} from 'lucide-react';
import { getStudentProfile }   from '../../apis/handlers/getStudentProfile';
import { updateStudentProfile } from '../../apis/handlers/updateStudentProfile';
import { getMyRequests }        from '../../apis/handlers/getMyRequests';
import { getAcceptedOffers }    from '../../apis/handlers/getAcceptedOffers';
import './StudentProfile.css';

/* ── helpers ─────────────────────────────────────────────── */
const fmtDate = (d, opts = { month: 'short', year: 'numeric' }) =>
  d ? new Date(d).toLocaleDateString('en-US', opts) : '';

const STATUS_META = {
  pending_analysis: { label: 'Pending Analysis', cls: 'sp-status--pending'  },
  open:             { label: 'Open',              cls: 'sp-status--open'     },
  matched:          { label: 'Matched',           cls: 'sp-status--matched'  },
  in_progress:      { label: 'In Progress',       cls: 'sp-status--progress' },
  completed:        { label: 'Completed',         cls: 'sp-status--done'     },
  cancelled:        { label: 'Cancelled',         cls: 'sp-status--cancel'   },
  expired:          { label: 'Expired',           cls: 'sp-status--cancel'   },
};

const MODE_LABELS = {
  recorded:  'Recorded',
  live_1on1: 'Live 1-on-1',
  bootcamp:  'Bootcamp',
  any:       'Any',
};

const TIMEZONES = [
  'UTC','America/New_York','America/Chicago','America/Denver',
  'America/Los_Angeles','Europe/London','Europe/Paris','Europe/Berlin',
  'Asia/Dubai','Asia/Riyadh','Africa/Cairo','Asia/Kolkata',
  'Asia/Singapore','Asia/Tokyo','Australia/Sydney',
];


/* ════════════════════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════════════════════ */
function StudentProfile() {
  const reduxUser = useSelector((s) => s.user);

  /* ── core data ── */
  const [profile,  setProfile]  = useState(null);
  const [requests, setRequests] = useState([]);
  const [offers,   setOffers]   = useState([]);
  const [loading,  setLoading]  = useState(true);

  /* ── edit modal ── */
  const [showEdit,      setShowEdit]      = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [form,          setForm]          = useState({});
  const [photoFile,     setPhotoFile]     = useState(null);
  const [photoPreview,  setPhotoPreview]  = useState(null);
  const fileRef = useRef(null);

  /* ── toast ── */
  const [toast, setToast] = useState({ show: false, type: '', msg: '' });
  const showToast = (type, msg) => {
    setToast({ show: true, type, msg });
    setTimeout(() => setToast({ show: false, type: '', msg: '' }), 3500);
  };

  /* ── cleanup blob ── */
  useEffect(() => () => { if (photoPreview) URL.revokeObjectURL(photoPreview); }, [photoPreview]);
  const handleShare = () => {
    if (navigator.share) navigator.share({ title: profile?.name, url: window.location.href });
    else navigator.clipboard.writeText(window.location.href);
  };
  /* ── load all data ── */
  useEffect(() => {
    if (!reduxUser?.id) { setLoading(false); return; }

    (async () => {
      const [profileRes, requestsRes, offersRes] = await Promise.all([
        getStudentProfile(reduxUser.id),
        getMyRequests(),
        getAcceptedOffers('student'),
      ]);

      if (profileRes.status === 200) setProfile(profileRes.response);
      else showToast('error', profileRes.message);

      if (requestsRes.status === 200) setRequests(requestsRes.response || []);
      if (offersRes.response)         setOffers(offersRes.data || []);

      setLoading(false);
    })();
  }, [reduxUser?.id]);

  /* ── derived stats (all from real data) ── */
  const totalRequests    = requests.length;
  const completedReqs    = requests.filter(r => r.status === 'completed').length;
  const acceptedSessions = offers.filter(o => o.bidStatus === 'accepted').length;

  const stats = [
    {
      icon:  <BookOpen  size={20} />,
      value: totalRequests,
      label: 'Total Requests',
      color: '#1d4ed8',
      pct:   totalRequests ? Math.min(totalRequests * 10, 100) : 0,
    },
    {
      icon:  <Award     size={20} />,
      value: acceptedSessions,
      label: 'Accepted Sessions',
      color: '#f59e0b',
      pct:   acceptedSessions ? Math.min(acceptedSessions * 20, 100) : 0,
    },
    {
      icon:  <TrendingUp size={20} />,
      value: completedReqs,
      label: 'Completed Requests',
      color: '#10b981',
      pct:   totalRequests ? Math.round((completedReqs / totalRequests) * 100) : 0,
    },
  ];

  /* ── open edit ── */
  const openEdit = () => {
    setForm({
      name:       profile?.name       || '',
      bio:        profile?.bio        || '',
      country:    profile?.country    || '',
      timezone:   profile?.timezone   || '',
      field:      profile?.field      || '',
      specialist: profile?.specialist || '',
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setShowEdit(true);
  };

  const handleFormChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handlePhotoChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    setSaving(true);
    const updates = {
      name:       form.name,
      bio:        form.bio,
      country:    form.country,
      timezone:   form.timezone,
      field:      form.field,
      specialist: form.specialist,
    };
    if (photoFile) updates.photo = photoFile;

    const res = await updateStudentProfile(updates);
    setSaving(false);
    if (res.status === 200) {
      setProfile(res.response);
      setShowEdit(false);
      showToast('success', 'Profile updated successfully!');
    } else {
      showToast('error', res.message);
    }
  };

  /* ── display helpers ── */
  const avatar   = photoPreview || profile?.photo || null;
  const initials = (profile?.name || reduxUser?.name || 'S').charAt(0).toUpperCase();
  const headline = [profile?.field, profile?.specialist].filter(Boolean).join(' & ');
  const joinDate = profile?.created_at ? `Joined ${fmtDate(profile.created_at)}` : '';

  /* ── recent requests for the timeline (most recent 5) ── */
  const recentRequests = requests.slice(0, 5);

  /* ── loading ── */
  if (loading) {
    return (
      <div className="sp-loading">
        <div className="sp-spinner" />
        <p>Loading your profile…</p>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════ */
  return (
    <div className="sp-page">

      {/* toast */}
      {toast.show && (
        <div className={`sp-toast sp-toast--${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ══ HERO CARD ══════════════════════════════════════ */}
      <div className="sp-hero-card">
        <div className="sp-hero-inner">

          {/* Avatar */}
          <div className="sp-avatar-wrap">
            {avatar
              ? <img src={avatar} alt="avatar" className="sp-avatar" />
              : <div className="sp-avatar sp-avatar--placeholder">{initials}</div>}
          </div>

          {/* Identity */}
          <div className="sp-identity">
            <div className="sp-name-row">
              <h1 className="sp-name">{profile?.name || reduxUser?.name || 'Your Name'}</h1>
              {profile?.role && (
                <span className="sp-badge">{profile.role.toUpperCase()}</span>
              )}
            </div>

            {headline && <p className="sp-headline">{headline}</p>}

            <div className="sp-meta-row">
              {profile?.country && (
                <span className="sp-meta-item"><MapPin size={13}/> {profile.country}</span>
              )}
              {joinDate && (
                <span className="sp-meta-item"><Calendar size={13}/> {joinDate}</span>
              )}
              {profile?.email && (
                <span className="sp-meta-item"><Mail size={13}/> {profile.email}</span>
              )}
              {profile?.timezone && (
                <span className="sp-meta-item"><Clock size={13}/> {profile.timezone}</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="sp-hero-actions">
            <button className="sp-btn-edit" id="edit-profile-btn" onClick={openEdit}>
              <Edit2 size={14}/> Edit Profile
            </button>
            <button className="sp-btn-share" onClick={handleShare}>
              <Share2 size={16}/>
            </button>
          </div>

        </div>
      </div>

      {/* ══ BODY ═══════════════════════════════════════════ */}
      <div className="sp-body">

        {/* ── LEFT ── */}
        <aside className="sp-left">

          {/* About Me */}
          <section className="sp-card">
            <div className="sp-card-heading">
              <User size={16} className="sp-card-icon"/>
              <h2>About Me</h2>
            </div>
            <p className="sp-bio">
              {profile?.bio ||
                'No bio added yet. Click "Edit Profile" to tell teachers about yourself.'}
            </p>
          </section>

          {/* Quick Stats — driven by real API data */}
          <section className="sp-card">
            <p className="sp-quick-label">QUICK STATS</p>
            <div className="sp-stats">
              {stats.map((s, i) => (
                <div className="sp-stat-item" key={i}>
                  <div className="sp-stat-icon" style={{ color: s.color }}>{s.icon}</div>
                  <div className="sp-stat-body">
                    <span className="sp-stat-value">{s.value}</span>
                    <span className="sp-stat-label">{s.label}</span>
                  </div>
                  <div className="sp-stat-bar">
                    <div
                      className="sp-stat-bar-fill"
                      style={{ background: s.color, width: `${s.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Accepted Sessions mini-list */}
          {offers.length > 0 && (
            <section className="sp-card">
              <div className="sp-card-heading">
                <Award size={16} className="sp-card-icon"/>
                <h2>Active Sessions</h2>
              </div>
              <div className="sp-offers-list">
                {offers.slice(0, 4).map((o) => (
                  <div className="sp-offer-item" key={o.id}>
                    <div className="sp-offer-avatar">
                      {o.teacherPhoto
                        ? <img src={o.teacherPhoto} alt={o.teacherName}/>
                        : <span>{(o.teacherName || 'T').charAt(0)}</span>}
                    </div>
                    <div className="sp-offer-info">
                      <span className="sp-offer-title">{o.title}</span>
                      <span className="sp-offer-teacher">{o.teacherName}</span>
                    </div>
                    <span className={`sp-status ${o.bidStatus === 'accepted' ? 'sp-status--done' : 'sp-status--pending'}`}>
                      {o.bidStatus}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

        </aside>

        {/* ── RIGHT ── */}
        <main className="sp-right">
          <section className="sp-card">
            <div className="sp-timeline-header">
              <div className="sp-card-heading">
                <FileText size={16} className="sp-card-icon"/>
                <h2>My Requests</h2>
              </div>
              <span className="sp-total-count">{totalRequests} total</span>
            </div>

            {recentRequests.length === 0 ? (
              <div className="sp-empty">
                <Inbox size={40} className="sp-empty-icon"/>
                <p>No requests yet. Go to <strong>Requests</strong> to create your first one.</p>
              </div>
            ) : (
              <div className="sp-timeline">
                {recentRequests.map((req, i) => {
                  const meta   = STATUS_META[req.status] || { label: req.status, cls: 'sp-status--pending' };
                  const mode   = MODE_LABELS[req.preferred_mode] || req.preferred_mode || '—';
                  const date   = fmtDate(req.created_at, { day: 'numeric', month: 'short', year: 'numeric' });
                  const bidCount = req.bids?.length || 0;

                  return (
                    <div className="sp-tl-item" key={req.id}>
                      <div className="sp-tl-dot-wrap">
                        <div className={`sp-tl-dot ${req.status === 'in_progress' || req.status === 'matched' ? 'sp-tl-dot--active' : ''}`}/>
                        {i < recentRequests.length - 1 && <div className="sp-tl-line"/>}
                      </div>

                      <div className="sp-tl-content">
                        <div className="sp-tl-top-row">
                          <span className="sp-tl-period">{date}</span>
                          <span className={`sp-status ${meta.cls}`}>{meta.label}</span>
                        </div>

                        <h3 className="sp-tl-title">{req.title || 'Untitled Request'}</h3>

                        {req.description && (
                          <p className="sp-tl-desc">
                            {req.description.length > 140
                              ? req.description.slice(0, 140) + '…'
                              : req.description}
                          </p>
                        )}

                        <div className="sp-tl-tags">
                          <span className="sp-tag">{mode}</span>
                          {bidCount > 0 && (
                            <span className="sp-tag sp-tag--accent">
                              {bidCount} bid{bidCount !== 1 ? 's' : ''}
                            </span>
                          )}
                          {req.budget_min && (
                            <span className="sp-tag">
                              ${req.budget_min}
                              {req.budget_max ? ` – $${req.budget_max}` : '+'}
                            </span>
                          )}
                          {req.deadline && (
                            <span className="sp-tag">
                              Due {fmtDate(req.deadline, { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>

      </div>

      {/* ══ EDIT MODAL ═════════════════════════════════════ */}
      {showEdit && (
        <div
          className="sp-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowEdit(false)}
        >
          <div className="sp-modal" role="dialog" aria-modal="true" aria-label="Edit Profile">

            {/* header */}
            <div className="sp-modal-header">
              <h2 className="sp-modal-title">Edit Profile</h2>
              <button className="sp-modal-close" onClick={() => setShowEdit(false)} aria-label="Close">
                <X size={20}/>
              </button>
            </div>

            {/* body */}
            <div className="sp-modal-body">

              {/* avatar picker */}
              <div className="sp-modal-avatar-row">
                <div className="sp-modal-avatar-wrap">
                  {photoPreview || profile?.photo
                    ? <img src={photoPreview || profile?.photo} alt="avatar" className="sp-modal-avatar"/>
                    : <div className="sp-modal-avatar sp-modal-avatar--ph">{initials}</div>}
                  <button
                    className="sp-modal-cam-btn"
                    onClick={() => fileRef.current?.click()}
                    title="Change photo"
                  >
                    <Camera size={14}/>
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handlePhotoChange}
                  />
                </div>
                <div>
                  <p className="sp-modal-avatar-hint">Upload a new profile photo</p>
                  <p className="sp-modal-avatar-sub">JPG, PNG or GIF · max 5 MB</p>
                </div>
              </div>

              <div className="sp-modal-grid">

                {/* Full Name */}
                <div className="sp-mfield">
                  <label className="sp-mlabel"><User size={13}/> Full Name</label>
                  <input
                    id="edit-full-name"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    className="sp-minput"
                    placeholder="Your full name"
                  />
                </div>

                {/* Email — read-only */}
                <div className="sp-mfield">
                  <label className="sp-mlabel"><Mail size={13}/> Email</label>
                  <input
                    id="edit-email"
                    value={profile?.email || ''}
                    className="sp-minput sp-minput--ro"
                    readOnly
                  />
                </div>

                {/* Country */}
                <div className="sp-mfield">
                  <label className="sp-mlabel"><MapPin size={13}/> Country</label>
                  <input
                    id="edit-country"
                    name="country"
                    value={form.country}
                    onChange={handleFormChange}
                    className="sp-minput"
                    placeholder="e.g. Egypt"
                  />
                </div>

                {/* Timezone */}
                <div className="sp-mfield">
                  <label className="sp-mlabel"><Clock size={13}/> Timezone</label>
                  <select
                    id="edit-timezone"
                    name="timezone"
                    value={form.timezone}
                    onChange={handleFormChange}
                    className="sp-mselect"
                  >
                    <option value="">Select timezone</option>
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>

                {/* Field of Study */}
                <div className="sp-mfield">
                  <label className="sp-mlabel"><Briefcase size={13}/> Field of Study</label>
                  <input
                    id="edit-field"
                    name="field"
                    value={form.field}
                    onChange={handleFormChange}
                    className="sp-minput"
                    placeholder="e.g. Computer Science"
                  />
                </div>

                {/* Specialisation */}
                <div className="sp-mfield">
                  <label className="sp-mlabel"><Globe size={13}/> Specialisation</label>
                  <input
                    id="edit-specialist"
                    name="specialist"
                    value={form.specialist}
                    onChange={handleFormChange}
                    className="sp-minput"
                    placeholder="e.g. AI Researcher"
                  />
                </div>

                {/* Bio — full width */}
                <div className="sp-mfield sp-mfield--full">
                  <label className="sp-mlabel">Bio</label>
                  <textarea
                    id="edit-bio"
                    name="bio"
                    value={form.bio}
                    onChange={handleFormChange}
                    className="sp-mtextarea"
                    rows={5}
                    placeholder="Tell teachers what you are studying or what kind of help you need…"
                  />
                </div>

              </div>
            </div>

            {/* footer */}
            <div className="sp-modal-footer">
              <button className="sp-mcancel" onClick={() => setShowEdit(false)}>Cancel</button>
              <button
                className="sp-msave"
                id="save-profile-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving && <span className="sp-btn-spin"/>}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default StudentProfile;
