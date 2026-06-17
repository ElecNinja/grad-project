import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Camera,
  CheckCircle,
  AlertCircle,
  Save,
  Trash2,
  Plus,
  X,
  Upload,
  Pencil,
  Video,
  Award,
  DollarSign,
  Globe,
  Clock,
} from 'lucide-react';
import { getTeacherProfile } from '../../apis/handlers/getTeacherProfile';
import { updateTeacherProfile } from '../../apis/handlers/updateTeacherProfile';
import { getSubjects } from '../../apis/handlers/getSubjects';
import { setAvatar } from '../../redux/userSlice';
import './TeacherProfile.css';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const PROFICIENCY_OPTIONS = [
  { value: 'native', label: 'Native / Bilingual' },
  { value: 'fluent', label: 'Fluent' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'basic', label: 'Basic' },
];

const LANGUAGE_LIST = [
  'English', 'Spanish', 'Arabic', 'French', 'German',
  'Italian', 'Portuguese', 'Turkish', 'Russian', 'Chinese', 'Japanese',
  'Korean', 'Hindi', 'Urdu', 'Persian',
];

const getYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

function TeacherProfile() {
  const reduxUser = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [profile, setProfile] = useState(null);
  const [subjects, setSubjects] = useState([]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    bio: '',
    headline: '',
    introduction_video: '',
    hourly_rate_min: '',
    hourly_rate_max: '',
    years_experience: '',
    teaching_languages: [{ lang: 'English', proficiency: 'native' }],
    specialties: [],
    photo: '',
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, type: '', message: '' });
  const photoInputRef = useRef(null);

  const [subjectPickerOpen, setSubjectPickerOpen] = useState(false);
  const [subjectSearch, setSubjectSearch] = useState('');

  const filteredSubjects = useMemo(() => {
    const q = subjectSearch.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter((s) => (s.name || '').toLowerCase().includes(q));
  }, [subjectSearch, subjects]);

  useEffect(() => {
    const load = async () => {
      if (!reduxUser?.id) {
        setLoading(false);
        return;
      }
      try {
        const [profileRes, subjectsRes] = await Promise.all([
          getTeacherProfile(reduxUser.id),
          getSubjects(),
        ]);

        if (subjectsRes.status === 200) setSubjects(subjectsRes.response || []);

        if (profileRes.status === 200) {
          const p = profileRes.response;
          setProfile(p);

          let langs = [{ lang: 'English', proficiency: 'native' }];
          if (Array.isArray(p?.teaching_languages) && p.teaching_languages.length > 0) {
            langs = p.teaching_languages.map((item) =>
              typeof item === 'string'
                ? { lang: item, proficiency: 'native' }
                : item
            );
          }

          setForm({
            name: p?.name || '',
            email: p?.email || '',
            bio: p?.bio || '',
            headline: p?.headline || '',
            introduction_video: p?.introduction_video || '',
            hourly_rate_min: p?.hourly_rate_min ?? '',
            hourly_rate_max: p?.hourly_rate_max ?? '',
            years_experience: p?.years_experience ?? '',
            teaching_languages: langs,
            specialties: Array.isArray(p?.specialties) ? p.specialties : [],
            photo: p?.photo || '',
          });
        } else {
          showToast('error', profileRes.message || 'Failed to load profile');
        }
      } catch (err) {
        console.error('Load profile error:', err);
        showToast('error', 'Something went wrong while loading your profile');
      }
      setLoading(false);
    };
    load();
  }, [reduxUser?.id]);

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: '', message: '' }), 3500);
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setForm((prev) => ({ ...prev, photo: '' }));
  };

  const removeVideo = () => {
    setForm((prev) => ({ ...prev, introduction_video: '' }));
  };

  const addLanguage = () => {
    setForm((prev) => ({
      ...prev,
      teaching_languages: [...(prev.teaching_languages || []), { lang: '', proficiency: 'conversational' }],
    }));
  };

  const updateLanguage = (index, field, value) => {
    setForm((prev) => {
      const next = [...(prev.teaching_languages || [])];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, teaching_languages: next };
    });
  };

  const removeLanguage = (index) => {
    setForm((prev) => {
      const next = [...(prev.teaching_languages || [])];
      next.splice(index, 1);
      return { ...prev, teaching_languages: next.length ? next : [{ lang: '', proficiency: 'native' }] };
    });
  };

  const addSpecialty = (subject) => {
    setForm((prev) => {
      const exists = (prev.specialties || []).some((s) => s.id === subject.id);
      if (exists) return prev;
      return {
        ...prev,
        specialties: [
          ...(prev.specialties || []),
          { id: subject.id, name: subject.name, proficiency: 'intermediate' },
        ],
      };
    });
    setSubjectPickerOpen(false);
    setSubjectSearch('');
  };

  const removeSpecialty = (id) => {
    setForm((prev) => ({
      ...prev,
      specialties: (prev.specialties || []).filter((s) => s.id !== id),
    }));
  };

  const validateForm = () => {
    if (!form.name?.trim()) {
      showToast('error', 'Name is required');
      return false;
    }
    if (
      form.hourly_rate_min !== '' &&
      form.hourly_rate_max !== '' &&
      Number(form.hourly_rate_min) > Number(form.hourly_rate_max)
    ) {
      showToast('error', 'Min rate cannot be greater than max rate');
      return false;
    }
    if (form.years_experience !== '' && Number(form.years_experience) < 0) {
      showToast('error', 'Years of experience cannot be negative');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);

    try {
      const updates = {
        name: form.name,
        bio: form.bio,
        headline: form.headline,
        introduction_video: form.introduction_video || '',
        hourly_rate_min: form.hourly_rate_min === '' ? null : Number(form.hourly_rate_min),
        hourly_rate_max: form.hourly_rate_max === '' ? null : Number(form.hourly_rate_max),
        years_experience: form.years_experience === '' ? null : Number(form.years_experience),
        teaching_languages: (form.teaching_languages || [])
          .filter((l) => l.lang?.trim())
          .map((l) => ({ lang: l.lang.trim(), proficiency: l.proficiency || 'native' })),
        specialties: (form.specialties || []).map((s) => ({
          subject_id: s.id,
          proficiency: s.proficiency || 'intermediate',
        })),
      };

      if (photoFile instanceof File) {
        const fileName = `teacher_${reduxUser.id}_${Date.now()}`;
        const { error: uploadError } = await supabase.storage
          .from('avatar')
          .upload(fileName, photoFile, { upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('avatar')
            .getPublicUrl(fileName);
          updates.photo = urlData.publicUrl;
        } else {
          console.error('Photo upload error:', uploadError);
        }
      } else if (form.photo === '') {
        updates.photo = '';
      }

      const result = await updateTeacherProfile(updates);

      if (result.status === 200) {
        const updated = result.response;
        setProfile(updated);

        setForm((prev) => ({
          ...prev,
          photo: updates.photo ?? updated?.photo ?? prev.photo,
          introduction_video: updated?.introduction_video ?? prev.introduction_video,
          specialties: Array.isArray(updated?.specialties)
            ? updated.specialties
            : prev.specialties,
          teaching_languages:
            Array.isArray(updated?.teaching_languages) && updated.teaching_languages.length
              ? updated.teaching_languages.map((item) =>
                  typeof item === 'string' ? { lang: item, proficiency: 'native' } : item
                )
              : prev.teaching_languages,
        }));

        if (updates.photo) {
          dispatch(setAvatar(updates.photo));
        }

        setPhotoFile(null);
        setPhotoPreview(null);
        showToast('success', 'Profile saved successfully!');
      } else {
        showToast('error', result.message || 'Failed to save profile. Please try again.');
        console.error('Save profile error response:', result);
      }
    } catch (err) {
      console.error('Save profile exception:', err);
      showToast('error', 'Something went wrong. Please try again.');
    }

    setSaving(false);
  };

  const displayPhoto = photoPreview || form.photo || profile?.photo || null;
  const displayVideo = form.introduction_video || '';
  const publicProfilePath = reduxUser?.id ? `/teacher-profile/${reduxUser.id}` : '/find-expert';

  if (loading) {
    return (
      <div className="tp-loading">
        <div className="tp-spinner" />
        <p>Loading your profile…</p>
      </div>
    );
  }

  return (
    <div className="tp-edit-page">
      {toast.show && (
        <div className={`tp-toast tp-toast--${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="tp-edit-container">
        <header className="tp-edit-header">
          <div>
            <h1 className="tp-edit-title">{profile?.name || form.name || 'Teacher Profile'}</h1>
            <p className="tp-edit-subtitle">Update your teacher profile and public information.</p>
          </div>
          <div className="tp-edit-header-actions">
            <button className="tp-btn tp-btn--ghost" type="button" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button
              className="tp-btn tp-btn--primary"
              type="button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <span className="tp-btn-spinner" /> : <Save size={16} />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </header>

        {/* Profile Photo */}
        <section className="tp-card">
          <div className="tp-card-head">
            <div className="tp-section-icon tp-section-icon--blue">
              <Camera size={16} />
            </div>
            <div>
              <h2>Profile Photo</h2>
              <p className="tp-help">This photo will be visible to all.</p>
            </div>
          </div>

          <div className="tp-photo-row">
            <div className="tp-photo-preview">
              {displayPhoto ? (
                <img src={displayPhoto} alt="Profile" />
              ) : (
                <div className="tp-photo-placeholder" aria-label="No photo">
                  <Camera size={26} />
                </div>
              )}
            </div>

            <div className="tp-photo-actions">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoChange}
              />
              <button
                className="tp-btn tp-btn--soft"
                type="button"
                onClick={() => photoInputRef.current?.click()}
              >
                <Upload size={15} />
                Update Photo
              </button>
              <button className="tp-btn tp-btn--ghost" type="button" onClick={removePhoto}>
                Remove
              </button>
            </div>
          </div>
        </section>

        {/* Video Introduction */}
        <section className="tp-card">
          <div className="tp-card-head">
            <div className="tp-section-icon tp-section-icon--purple">
              <Video size={16} />
            </div>
            <div>
              <h2>Video Introduction</h2>
              <p className="tp-help">Add a YouTube video link to introduce yourself to prospective students.</p>
            </div>
          </div>

          <div className="tp-video-grid">
            <div className="tp-video-left">
              {displayVideo ? (
                (() => {
                  const videoId = getYouTubeId(displayVideo);
                  if (videoId) {
                    return (
                      <iframe
                        className="tp-video"
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      ></iframe>
                    );
                  } else {
                    return (
                      <div className="tp-video-empty tp-video-empty--error">
                        Invalid YouTube URL. Please enter a valid link.
                      </div>
                    );
                  }
                })()
              ) : (
                <div className="tp-video-empty">No video set yet.</div>
              )}
            </div>

            <div className="tp-video-right">
              <div className="tp-field">
                <label className="tp-label" htmlFor="introduction_video">
                  YouTube URL
                </label>
                <input
                  id="introduction_video"
                  type="text"
                  name="introduction_video"
                  className="tp-input"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={form.introduction_video}
                  onChange={handleChange}
                />
              </div>

              {displayVideo && (
                <button
                  className="tp-btn tp-btn--ghost tp-btn--danger"
                  style={{ marginTop: '8px' }}
                  type="button"
                  onClick={removeVideo}
                >
                  <Trash2 size={15} />
                  Clear Video
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Description */}
        <section className="tp-card">
          <div className="tp-card-head tp-card-head--split">
            <div className="tp-card-head-left">
              <div className="tp-section-icon tp-section-icon--green">
                <Pencil size={16} />
              </div>
              <div>
                <h2>Description</h2>
              </div>
            </div>
            <span className="tp-chip">
              <Pencil size={13} />
              Edit
            </span>
          </div>

          <textarea
            className="tp-textarea"
            name="bio"
            value={form.bio}
            onChange={handleChange}
            placeholder="Write your profile description..."
            rows={6}
          />
        </section>

        {/* Headline */}
        <section className="tp-card">
          <div className="tp-card-head">
            <div className="tp-section-icon tp-section-icon--orange">
              <Globe size={16} />
            </div>
            <div>
              <h2>Headline</h2>
              <p className="tp-help">A short tagline shown on your public profile.</p>
            </div>
          </div>
          <input
            className="tp-input tp-input--mt"
            name="headline"
            value={form.headline}
            onChange={handleChange}
            placeholder="e.g. Expert Chemistry Tutor with 10+ years experience"
          />
        </section>

        {/* Rate & Experience */}
        <section className="tp-card">
          <div className="tp-card-head">
            <div className="tp-section-icon tp-section-icon--emerald">
              <DollarSign size={16} />
            </div>
            <div>
              <h2>Rate & Experience</h2>
              <p className="tp-help">Set your hourly rate range and years of experience.</p>
            </div>
          </div>

          <div className="tp-rate-grid">
            <div className="tp-field">
              <label className="tp-label">Min Rate (USD / hr)</label>
              <input
                className="tp-input"
                name="hourly_rate_min"
                type="number"
                min="0"
                value={form.hourly_rate_min}
                onChange={handleChange}
                placeholder="e.g. 20"
              />
            </div>
            <div className="tp-field">
              <label className="tp-label">Max Rate (USD / hr)</label>
              <input
                className="tp-input"
                name="hourly_rate_max"
                type="number"
                min="0"
                value={form.hourly_rate_max}
                onChange={handleChange}
                placeholder="e.g. 80"
              />
            </div>
            <div className="tp-field">
              <label className="tp-label">Years of Experience</label>
              <input
                className="tp-input"
                name="years_experience"
                type="number"
                min="0"
                value={form.years_experience}
                onChange={handleChange}
                placeholder="e.g. 5"
              />
            </div>
          </div>
        </section>

        {/* Specialties */}
        <section className="tp-card">
          <div className="tp-card-head tp-card-head--split">
            <div className="tp-card-head-left">
              <div className="tp-section-icon tp-section-icon--indigo">
                <Award size={16} />
              </div>
              <div>
                <h2>Specialties</h2>
                <p className="tp-help">Add subjects you are qualified to teach.</p>
              </div>
            </div>
            <button
              className="tp-btn tp-btn--soft tp-btn--sm"
              type="button"
              onClick={() => setSubjectPickerOpen((v) => !v)}
            >
              <Plus size={15} />
              Add New
            </button>
          </div>

          {(form.specialties || []).length === 0 && !subjectPickerOpen && (
            <p className="tp-muted tp-muted--center">Tell us about your specialties</p>
          )}

          {subjectPickerOpen && (
            <div className="tp-subject-picker">
              <input
                className="tp-input"
                placeholder="Search subjects..."
                value={subjectSearch}
                onChange={(e) => setSubjectSearch(e.target.value)}
                autoFocus
              />
              <div className="tp-subject-list">
                {filteredSubjects.slice(0, 20).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="tp-subject-item"
                    onClick={() => addSpecialty(s)}
                  >
                    {s.name}
                  </button>
                ))}
                {filteredSubjects.length === 0 && (
                  <div className="tp-muted">No subjects found.</div>
                )}
              </div>
            </div>
          )}

          <div className="tp-chip-row">
            {(form.specialties || []).map((s) => (
              <span key={s.id} className="tp-tag">
                {s.name}
                <button
                  type="button"
                  className="tp-tag-x"
                  onClick={() => removeSpecialty(s.id)}
                  aria-label="Remove specialty"
                >
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        </section>

        {/* Languages */}
        <section className="tp-card">
          <div className="tp-card-head">
            <div className="tp-section-icon tp-section-icon--teal">
              <Globe size={16} />
            </div>
            <div>
              <h2>Languages Spoken</h2>
              <p className="tp-help">List languages you can conduct lessons in.</p>
            </div>
          </div>

          <div className="tp-lang-table">
            <div className="tp-lang-head">
              <span>LANGUAGE</span>
              <span>PROFICIENCY</span>
              <span />
            </div>

            {(form.teaching_languages || []).map((entry, idx) => (
              <div className="tp-lang-row" key={idx}>
                <select
                  className="tp-input"
                  value={entry.lang || ''}
                  onChange={(e) => updateLanguage(idx, 'lang', e.target.value)}
                >
                  <option value="">Select language</option>
                  {LANGUAGE_LIST.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>

                <select
                  className="tp-input"
                  value={entry.proficiency || 'native'}
                  onChange={(e) => updateLanguage(idx, 'proficiency', e.target.value)}
                >
                  {PROFICIENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

                <button
                  className="tp-icon-btn"
                  type="button"
                  onClick={() => removeLanguage(idx)}
                  aria-label="Remove language"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            <button
              className="tp-btn tp-btn--ghost tp-btn--sm tp-add-row"
              type="button"
              onClick={addLanguage}
            >
              <Plus size={15} />
              Add another language
            </button>
          </div>
        </section>

        {/* Bottom Actions */}
        <div className="tp-bottom-actions">
          <Link className="tp-btn tp-btn--ghost" to={publicProfilePath}>
            Preview Profile
          </Link>
          <button
            className="tp-btn tp-btn--primary"
            type="button"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <span className="tp-btn-spinner" /> : <Save size={16} />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TeacherProfile;