import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, AlertCircle, Users, Heart, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTeachers } from '../../apis/handlers/getTeachers';
import './FindExpert.css';

const getYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const getYouTubeThumbnail = (url) => {
  const videoId = getYouTubeId(url);
  return videoId
    ? `https://img.youtube.com/vi/${videoId}/0.jpg`
    : 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=600&auto=format&fit=crop';
};

function FindExpert() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [favorites, setFavorites] = useState({});

  useEffect(() => {
    const load = async () => {
      const result = await getTeachers();
      if (result.status === 200) {
        setTeachers(result.response || []);
      } else {
        setError(result.message);
      }
      setLoading(false);
    };

    load();
  }, []);

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [query, selectedSubject, selectedRating]);

  const availableSubjects = useMemo(() => {
    const subs = new Set();
    teachers.forEach((t) => {
      if (t.subject) subs.add(t.subject);
    });
    return Array.from(subs);
  }, [teachers]);

  const filteredTeachers = useMemo(() => {
    let result = teachers;

    // Search query
    const search = query.trim().toLowerCase();
    if (search) {
      result = result.filter((teacher) => {
        const haystack = [teacher.name, teacher.subject, teacher.bio]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(search);
      });
    }

    // Subject filter
    if (selectedSubject) {
      result = result.filter(
        (teacher) => (teacher.subject || 'General').toLowerCase() === selectedSubject.toLowerCase()
      );
    }

    // Rating filter
    if (selectedRating) {
      const minRating = parseFloat(selectedRating);
      result = result.filter(
        (teacher) => (teacher.rating || 0) >= minRating
      );
    }

    return result;
  }, [teachers, query, selectedSubject, selectedRating]);

  const teachersPerPage = 10;
  const totalPages = Math.ceil(filteredTeachers.length / teachersPerPage) || 1;

  const paginatedTeachers = useMemo(() => {
    const startIndex = (currentPage - 1) * teachersPerPage;
    return filteredTeachers.slice(startIndex, startIndex + teachersPerPage);
  }, [filteredTeachers, currentPage]);

  const toggleFavorite = (id) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="fe-page">
      <div className="fe-header-section">
        <div className="fe-search-shell">
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for subject or tutor name..."
            className="fe-search"
          />
        </div>

        <div className="fe-filters-card">
          <div className="fe-filter-item">
            <span className="fe-filter-label">SUBJECT</span>
            <div className="fe-select-wrap">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="fe-select"
              >
                <option value="">All Subjects</option>
                {availableSubjects.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
                {!availableSubjects.includes('Chemistry') && <option value="Chemistry">Chemistry</option>}
                {!availableSubjects.includes('Mathematics') && <option value="Mathematics">Mathematics</option>}
                {!availableSubjects.includes('Physics') && <option value="Physics">Physics</option>}
              </select>
            </div>
          </div>

          <div className="fe-filter-item">
            <span className="fe-filter-label">RATING</span>
            <div className="fe-select-wrap">
              <select
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
                className="fe-select"
              >
                <option value="">All Ratings</option>
                <option value="4.5">4.5+ ★</option>
                <option value="4.0">4.0+ ★</option>
                <option value="3.5">3.5+ ★</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="tp-loading">
          <div className="tp-spinner" />
          <p>Loading teachers…</p>
        </div>
      ) : error ? (
        <div className="fe-state-card">
          <AlertCircle size={28} />
          <h2>Could not load teachers</h2>
          <p>{error}</p>
        </div>
      ) : (
        <>
          <div className="fe-grid">
            {paginatedTeachers.map((teacher) => {
              const videoId = getYouTubeId(teacher.introduction_video);
              const hasVideo = !!videoId;
              return (
                <article key={teacher.id} className="fe-card">
                  <div className="fe-card-left">
                    <div className="fe-card-profile-section">
                      <div className="fe-avatar-wrap">
                        {teacher.photo ? (
                          <img src={teacher.photo} alt={teacher.name} className="fe-avatar" />
                        ) : (
                          <div className="fe-avatar fe-avatar--placeholder">
                            <Users size={28} />
                          </div>
                        )}
                      </div>

                      <div className="fe-profile-info">
                        <h3 className="fe-name">{teacher.name || 'Teacher'}</h3>
                        <p className="fe-bio">{teacher.bio || 'No bio added yet.'}</p>
                      </div>
                    </div>

                    <div className="fe-stats-row">
                      <div className="fe-stat-item">
                        <div className="fe-stat-value">
                          <Star size={16} fill="#fbbf24" color="#fbbf24" style={{ marginRight: '4px' }} />
                          {(teacher.rating || 0).toFixed(1)}
                        </div>
                        <div className="fe-stat-label">
                          {teacher.rating_count || 0} REVIEWS
                        </div>
                      </div>

                      <div className="fe-stat-divider" />

                      <div className="fe-stat-item">
                        <div className="fe-stat-value">
                          {Math.floor((teacher.rating_count || 0) * 8.5 + 12)}
                        </div>
                        <div className="fe-stat-label">LESSONS</div>
                      </div>

                      <div className="fe-stat-divider" />

                      <div className="fe-stat-item">
                        <div className="fe-stat-value">
                          {teacher.years_experience || 0} yrs
                        </div>
                        <div className="fe-stat-label">EXPERIENCE</div>
                      </div>

                      <button
                        type="button"
                        className={`fe-fav-btn ${favorites[teacher.id] ? 'active' : ''}`}
                        onClick={() => toggleFavorite(teacher.id)}
                        title="Add to favorites"
                      >
                        <Heart
                          size={18}
                          fill={favorites[teacher.id] ? '#ef4444' : 'none'}
                          color={favorites[teacher.id] ? '#ef4444' : '#94a3b8'}
                        />
                      </button>
                    </div>

                    <div className="fe-card-buttons">
                      <button className="fe-btn fe-btn--primary" type="button">
                        Send Message
                      </button>
                      <Link className="fe-btn fe-btn--secondary" to={`/teacher-profile/${teacher.id}`}>
                        View Profile
                      </Link>
                    </div>
                  </div>

                  <div className="fe-card-right">
                    <div className={`fe-video-thumbnail-wrap ${!hasVideo ? 'disabled' : ''}`}>
                      <img
                        src={
                          hasVideo
                            ? `https://img.youtube.com/vi/${videoId}/0.jpg`
                            : teacher.photo || 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=600&auto=format&fit=crop'
                        }
                        alt="Intro video thumbnail"
                        className="fe-video-thumbnail"
                      />
                      <div className="fe-video-play-overlay">
                        <div className={`fe-play-button ${!hasVideo ? 'disabled' : ''}`} title={!hasVideo ? 'No introduction video available' : 'Watch introduction'}>
                          <Play size={16} fill="#fff" color="#fff" />
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {filteredTeachers.length === 0 ? (
            <div className="fe-state-card">
              <h2>No matching teachers</h2>
              <p>Try a different subject or teacher name.</p>
            </div>
          ) : (
            totalPages > 1 && (
              <div className="fe-pagination">
                
                <button
                  className="fe-page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`fe-page-btn ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}

                <button
                  className="fe-page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}

export default FindExpert;
