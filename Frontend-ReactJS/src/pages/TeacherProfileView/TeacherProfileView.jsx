import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BookOpen, DollarSign, Star, User, ArrowLeft, AlertCircle } from 'lucide-react';
import { getTeacherProfile } from '../../apis/handlers/getTeacherProfile';
import './TeacherProfileView.css';

function TeacherProfileView() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setError('Teacher profile id is missing.');
        setLoading(false);
        return;
      }

      const result = await getTeacherProfile(id);
      if (result.status === 200) {
        setProfile(result.response);
      } else {
        setError(result.message);
      }
      setLoading(false);
    };

    load();
  }, [id]);

  const renderStars = (rating) =>
    [...Array(5)].map((_, index) => (
      <Star
        key={index}
        size={18}
        fill={index < Math.floor(rating) ? '#fbbf24' : 'none'}
        color={index < Math.floor(rating) ? '#fbbf24' : '#d1d5db'}
      />
    ));

  const displayPhoto = profile?.photo || null;

  if (loading) {
    return (
      <div className="tp-loading">
        <div className="tp-spinner" />
        <p>Loading teacher profile…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tp-page tp-page--centered">
        <div className="tp-error-card">
          <AlertCircle size={34} />
          <h1>Teacher profile not available</h1>
          <p>{error}</p>
          <Link className="tp-secondary-btn" to="/find-expert">
            <ArrowLeft size={16} />
            Back to experts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-page">
      <div className="tp-container">
        <aside className="tp-sidebar tp-sidebar--view">
          <div className="tp-avatar-wrap">
            {displayPhoto ? (
              <img src={displayPhoto} alt="Teacher profile" className="tp-avatar" />
            ) : (
              <div className="tp-avatar tp-avatar--placeholder">
                <User size={48} color="#1d4ed8" />
              </div>
            )}
          </div>

          <h2 className="tp-sidebar-name">{profile?.name || 'Teacher'}</h2>
          <p className="tp-sidebar-role">Teacher</p>

          <div className="tp-stars">{renderStars(profile?.rating || 0)}</div>
          <p className="tp-rating-val">
            {profile?.rating ? `${profile.rating} / 5` : 'No ratings yet'}
          </p>

          <div className="tp-sidebar-stats">
            <div className="tp-stat">
              <BookOpen size={18} color="#1d4ed8" />
              <span>{profile?.subject || '—'}</span>
            </div>
            <div className="tp-stat">
              <DollarSign size={18} color="#1d4ed8" />
              <span>
                {profile?.price_per_hour ? `$${profile.price_per_hour}/hr` : 'Price not set'}
              </span>
            </div>
          </div>

          <Link className="tp-secondary-btn tp-secondary-btn--full" to="/find-expert">
            <ArrowLeft size={16} />
            Back to experts
          </Link>
        </aside>

        <main className="tp-main">
          <div className="tp-header">
            <h1 className="tp-title">Teacher Profile</h1>
            <p className="tp-subtitle">
              View the teacher details exactly as students see them.
            </p>
          </div>

          <div className="tp-view-grid">
            <section className="tp-view-card">
              <h3 className="tp-view-card-title">About</h3>
              <p className="tp-view-text">{profile?.bio || 'No bio has been added yet.'}</p>
            </section>

            <section className="tp-view-card">
              <h3 className="tp-view-card-title">Profile details</h3>
              <div className="tp-view-list">
                <div className="tp-view-item">
                  <span className="tp-view-label">Subject</span>
                  <span>{profile?.subject || '—'}</span>
                </div>
                <div className="tp-view-item">
                  <span className="tp-view-label">Hourly rate</span>
                  <span>{profile?.price_per_hour ? `$${profile.price_per_hour}/hr` : 'Not set'}</span>
                </div>
                <div className="tp-view-item">
                  <span className="tp-view-label">Rating</span>
                  <span>{profile?.rating ? `${profile.rating} / 5` : 'No ratings yet'}</span>
                </div>
                <div className="tp-view-item">
                  <span className="tp-view-label">Email</span>
                  <span>{profile?.email || '—'}</span>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default TeacherProfileView;
