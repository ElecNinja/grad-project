import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Camera, Save, BookOpen, DollarSign, User, FileText, Star, AlertCircle, CheckCircle } from 'lucide-react';
import { getTeacherProfile } from '../../apis/handlers/getTeacherProfile';
import { updateTeacherProfile } from '../../apis/handlers/updateTeacherProfile';
import './TeacherProfile.css';

function TeacherProfile() {
  const reduxUser = useSelector((state) => state.user);

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    bio: '',
    subject: '',
    price_per_hour: '',
    photo: '',
    rating: 0,
  });

  const [form, setForm] = useState({ ...profile });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, type: '', message: '' });
  const fileInputRef = useRef(null);

  // ── Load profile on mount ──────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      if (!reduxUser?.id) {
        setLoading(false);
        return;
      }
      const result = await getTeacherProfile(reduxUser.id);
      if (result.status === 200) {
        setProfile(result.response);
        setForm(result.response);
      } else {
        showToast('error', result.message);
      }
      setLoading(false);
    };
    load();
  }, [reduxUser?.id]);

  // ── Toast helper ───────────────────────────────────────────────────────────
  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: '', message: '' }), 3500);
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    const updates = {
      name: form.name,
      bio: form.bio,
      subject: form.subject,
      price_per_hour: parseFloat(form.price_per_hour) || 0,
    };
    if (photoFile) updates.photo = photoFile;

    const result = await updateTeacherProfile(updates);
    setSaving(false);

    if (result.status === 200) {
      setProfile(result.response);
      setPhotoFile(null);
      showToast('success', 'Profile saved successfully!');
    } else {
      showToast('error', result.message);
    }
  };

  const displayPhoto = photoPreview || profile.photo || null;
  const publicProfilePath = reduxUser?.id ? `/teacher-profile/${reduxUser.id}` : '/find-expert';

  // ── Render stars ───────────────────────────────────────────────────────────
  const renderStars = (rating) =>
    [...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={18}
        fill={i < Math.floor(rating) ? '#fbbf24' : 'none'}
        color={i < Math.floor(rating) ? '#fbbf24' : '#d1d5db'}
      />
    ));

  if (loading) {
    return (
      <div className="tp-loading">
        <div className="tp-spinner" />
        <p>Loading your profile…</p>
      </div>
    );
  }

  return (
    <div className="tp-page">
      {/* Toast */}
      {toast.show && (
        <div className={`tp-toast tp-toast--${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="tp-container">
        {/* ── Left sidebar: avatar + stats ── */}
        <aside className="tp-sidebar">
          <div className="tp-avatar-wrap">
            {displayPhoto ? (
              <img src={displayPhoto} alt="Profile" className="tp-avatar" />
            ) : (
              <div className="tp-avatar tp-avatar--placeholder">
                <User size={48} color="#1d4ed8" />
              </div>
            )}
            <button
              className="tp-avatar-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Change photo"
            >
              <Camera size={16} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />
          </div>

          <h2 className="tp-sidebar-name">{profile.name || 'Your Name'}</h2>
          <p className="tp-sidebar-role">Teacher</p>

          <div className="tp-stars">{renderStars(profile.rating || 0)}</div>
          <p className="tp-rating-val">{profile.rating ? `${profile.rating} / 5` : 'No ratings yet'}</p>

          <div className="tp-sidebar-stats">
            <div className="tp-stat">
              <BookOpen size={18} color="#1d4ed8" />
              <span>{profile.subject || '—'}</span>
            </div>
            <div className="tp-stat">
              <DollarSign size={18} color="#1d4ed8" />
              <span>
                {profile.price_per_hour ? `$${profile.price_per_hour}/hr` : 'Price not set'}
              </span>
            </div>
          </div>
        </aside>

        {/* ── Main form ── */}
        <main className="tp-main">
          <div className="tp-header">
            <h1 className="tp-title">Edit Profile</h1>
            <p className="tp-subtitle">Keep your profile up to date so students can find you.</p>
          </div>

          <div className="tp-form">
            {/* Name */}
            <div className="tp-field">
              <label className="tp-label">
                <User size={15} /> Full Name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="tp-input"
                placeholder="Your full name"
              />
            </div>

            {/* Email (read-only) */}
            <div className="tp-field">
              <label className="tp-label">Email</label>
              <input
                type="email"
                value={profile.email}
                className="tp-input tp-input--readonly"
                readOnly
              />
            </div>

            {/* Subject */}
            <div className="tp-field">
              <label className="tp-label">
                <BookOpen size={15} /> Subject / Specialty
              </label>
              <input
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                className="tp-input"
                placeholder="e.g. Mathematics, Chemistry, Physics…"
              />
            </div>

            {/* Price */}
            <div className="tp-field">
              <label className="tp-label">
                <DollarSign size={15} /> Price per Hour (USD)
              </label>
              <input
                type="number"
                name="price_per_hour"
                value={form.price_per_hour}
                onChange={handleChange}
                className="tp-input"
                placeholder="e.g. 25"
                min="0"
              />
            </div>

            {/* Bio */}
            <div className="tp-field tp-field--full">
              <label className="tp-label">
                <FileText size={15} /> Bio
              </label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                className="tp-textarea"
                placeholder="Tell students about yourself, your experience, and teaching style…"
                rows={5}
              />
            </div>

            {/* Save button */}
            <div className="tp-actions">
              <Link className="tp-secondary-btn" to={publicProfilePath}>
                Preview Profile
              </Link>
              <button
                className="tp-save-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <span className="tp-btn-spinner" />
                ) : (
                  <Save size={18} />
                )}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default TeacherProfile;