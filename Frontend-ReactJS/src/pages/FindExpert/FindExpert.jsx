import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, BookOpen, DollarSign, AlertCircle, Users } from 'lucide-react';
import { getTeachers } from '../../apis/handlers/getTeachers';
import './FindExpert.css';

function FindExpert() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

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

  const filteredTeachers = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return teachers;

    return teachers.filter((teacher) => {
      const haystack = [teacher.name, teacher.subject, teacher.bio]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [teachers, query]);

  const renderStars = (rating) =>
    [...Array(5)].map((_, index) => (
      <Star
        key={index}
        size={15}
        fill={index < Math.floor(rating) ? '#fbbf24' : 'none'}
        color={index < Math.floor(rating) ? '#fbbf24' : '#d1d5db'}
      />
    ));

  return (
    <div className="fe-page">
      <div className="fe-hero">
        <div>
          <p className="fe-kicker">Teacher Directory</p>
          <h1 className="fe-title">Find a teacher by subject, rate, or style</h1>
          <p className="fe-subtitle">
            Browse the live teacher profiles stored in the backend and open any profile page for details.
          </p>
        </div>

        <div className="fe-search-shell">
          <Search size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search teachers, subjects, or bios"
            className="fe-search"
          />
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
          <div className="fe-summary">
            <Users size={18} />
            <span>{filteredTeachers.length} teachers available</span>
          </div>

          <div className="fe-grid">
            {filteredTeachers.map((teacher) => (
              <article key={teacher.id} className="fe-card">
                <div className="fe-card-top">
                  <div className="fe-avatar-wrap">
                    {teacher.photo ? (
                      <img src={teacher.photo} alt={teacher.name} className="fe-avatar" />
                    ) : (
                      <div className="fe-avatar fe-avatar--placeholder">
                        <Users size={28} />
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="fe-name">{teacher.name || 'Teacher'}</h3>
                    <p className="fe-role">Teacher</p>
                  </div>
                </div>

                <div className="fe-rating-row">{renderStars(teacher.rating || 0)}</div>

                <p className="fe-bio">{teacher.bio || 'No bio added yet.'}</p>

                <div className="fe-meta">
                  <span className="fe-chip">
                    <BookOpen size={14} />
                    {teacher.subject || 'General'}
                  </span>
                  <span className="fe-chip">
                    <DollarSign size={14} />
                    {teacher.price_per_hour ? `$${teacher.price_per_hour}/hr` : 'Rate not set'}
                  </span>
                </div>

                <div className="fe-card-actions">
                  <Link className="tp-secondary-btn tp-secondary-btn--full" to={`/teacher-profile/${teacher.id}`}>
                    View Profile
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {filteredTeachers.length === 0 && (
            <div className="fe-state-card">
              <h2>No matching teachers</h2>
              <p>Try a different subject or teacher name.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default FindExpert;
