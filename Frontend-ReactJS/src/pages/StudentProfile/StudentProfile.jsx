import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Camera, Save, BookOpen, User, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { getStudentProfile } from '../../apis/handlers/getStudentProfile';
import { updateStudentProfile } from '../../apis/handlers/updateStudentProfile';
import './StudentProfile.css';

function StudentProfile() {
  const reduxUser = useSelector((state) => state.user);

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    bio: '',
    photo: '',
  });
  const [form, setForm] = useState({ ...profile });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, type: '', message: '' });
  const fileInputRef = useRef(null);

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: '', message: '' }), 3500);
  };

  useEffect(() => {
    const load = async () => {
      if (!reduxUser?.id) {
        setLoading(false);
        return;
      }

      const result = await getStudentProfile(reduxUser.id);
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

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

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
    };
    if (photoFile) updates.photo = photoFile;

    const result = await updateStudentProfile(updates);
    setSaving(false);

    if (result.status === 200) {
      setProfile(result.response);
      setForm(result.response);
      setPhotoFile(null);
      showToast('success', 'Profile saved successfully!');
    } else {
      showToast('error', result.message);
    }
  };

  const displayPhoto = photoPreview || profile.photo || null;

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
      {toast.show && (
        <div className={`tp-toast tp-toast--${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="tp-container">
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
          <p className="tp-sidebar-role">Student</p>

          <div className="tp-sidebar-stats">
            <div className="tp-stat">
              <BookOpen size={18} color="#1d4ed8" />
              <span>Find expert help faster</span>
            </div>
            <div className="tp-stat">
              <FileText size={18} color="#1d4ed8" />
              <span>Keep your bio current</span>
            </div>
          </div>
        </aside>

        <main className="tp-main">
          <div className="tp-header">
            <h1 className="tp-title">Student Profile</h1>
            <p className="tp-subtitle">Update your details so teachers can recognise you quickly.</p>
          </div>

          <div className="tp-form">
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

            <div className="tp-field">
              <label className="tp-label">Email</label>
              <input
                type="email"
                value={profile.email}
                className="tp-input tp-input--readonly"
                readOnly
              />
            </div>

            <div className="tp-field tp-field--full">
              <label className="tp-label">
                <FileText size={15} /> Bio
              </label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                className="tp-textarea"
                placeholder="Tell teachers what you are studying or what kind of help you need…"
                rows={5}
              />
            </div>

            <div className="tp-actions">
              <Link className="tp-secondary-btn" to="/find-expert">
                Find Expert
              </Link>
              <button className="tp-save-btn" onClick={handleSave} disabled={saving}>
                {saving ? <span className="tp-btn-spinner" /> : <Save size={18} />}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default StudentProfile;
