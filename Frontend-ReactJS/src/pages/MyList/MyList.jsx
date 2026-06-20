import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Heart, Star, AlertCircle, Users, ChevronLeft, ChevronRight, Filter, ArrowUpDown, ChevronDown, Check } from 'lucide-react';
import { api } from '../../apis/axios';
import { openChat, getOrCreateConversation, setActiveConversation } from '../../redux/chatSlice';
import './MyList.css';

function FilterSelect({ icon: Icon, value, options, onChange, label }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value) || options[0];

  const handleBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsOpen(false);
    }
  };

  const handleChange = (nextValue) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  return (
    <div
      className={`ml-filter-select-wrap ml-custom-select ${isOpen ? 'is-open' : ''}`}
      onBlur={handleBlur}
    >
      <Icon size={16} />
      <button
        type="button"
        className="ml-select-trigger"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>{selectedOption.label}</span>
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <div className="ml-select-menu" role="listbox" aria-label={label}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`ml-select-option ${option.value === value ? 'is-selected' : ''}`}
              role="option"
              aria-selected={option.value === value}
              onClick={() => handleChange(option.value)}
            >
              <span>{option.label}</span>
              {option.value === value && <Check size={15} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MyList() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Sorting state
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSort, setSelectedSort] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSavedTeachers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/api/saved-teachers');
        setTeachers(response.data.teachers || []);
      } catch (err) {
        console.error('Failed to fetch saved teachers:', err);
        setError('Failed to load saved teachers');
      } finally {
        setLoading(false);
      }
    };

    fetchSavedTeachers();
  }, []);

  // Handle removing a teacher from the saved list
  const handleUnsave = async (e, teacherId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await api.delete(`/api/saved-teachers/${teacherId}`);
      if (response.data.success) {
        setTeachers((prev) => prev.filter((t) => t.teacherId !== teacherId));
      }
    } catch (err) {
      console.error('Failed to unsave teacher:', err);
    }
  };

  // Open chat with teacher
  const handleMessage = async (e, teacherId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const conversationId = await dispatch(getOrCreateConversation(teacherId)).unwrap();
      dispatch(setActiveConversation(conversationId));
      dispatch(openChat());
    } catch (error) {
      console.error('Failed to open chat:', error);
    }
  };

  // Extract all unique subjects/specialties from saved teachers
  const availableSubjects = useMemo(() => {
    const subjects = new Set();
    teachers.forEach((t) => {
      (t.specialties || []).forEach((spec) => {
        if (spec.name) subjects.add(spec.name);
      });
    });
    return Array.from(subjects).sort();
  }, [teachers]);

  const subjectOptions = useMemo(
    () => [
      { value: '', label: 'Subject: All' },
      ...availableSubjects.map((subject) => ({ value: subject, label: subject })),
    ],
    [availableSubjects]
  );

  const sortOptions = useMemo(
    () => [
      { value: 'recent', label: 'Sort: Recently Added' },
      { value: 'name', label: 'Sort: Alphabetical' },
      { value: 'rating', label: 'Sort: Highest Rated' },
      { value: 'experience', label: 'Sort: Experience' },
    ],
    []
  );

  // Filter and Sort teachers
  const filteredAndSortedTeachers = useMemo(() => {
    let result = [...teachers];

    // Filter by subject
    if (selectedSubject) {
      result = result.filter((t) =>
        (t.specialties || []).some(
          (spec) => spec.name.toLowerCase() === selectedSubject.toLowerCase()
        )
      );
    }

    // Apply sort
    if (selectedSort === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (selectedSort === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (selectedSort === 'experience') {
      result.sort((a, b) => b.yearsExperience - a.yearsExperience);
    }
    // 'recent' maintains the database order (recently added first)

    return result;
  }, [teachers, selectedSubject, selectedSort]);

  // Pagination (8 items per page)
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredAndSortedTeachers.length / itemsPerPage) || 1;

  // Reset page to 1 if filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSubject, selectedSort]);

  const paginatedTeachers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedTeachers.slice(start, start + itemsPerPage);
  }, [filteredAndSortedTeachers, currentPage]);

  if (loading) {
    return (
      <div className="ml-state-container">
        <div className="ml-spinner" />
        <p style={{ color: '#64748b', fontWeight: 600 }}>Loading saved teachers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ml-state-container">
        <AlertCircle size={40} color="#ef4444" style={{ marginBottom: '16px' }} />
        <h2 style={{ color: '#0f172a', margin: '0 0 8px 0', fontWeight: 800 }}>Error Loading List</h2>
        <p style={{ color: '#64748b', margin: 0 }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="ml-action-btn ml-action-btn--primary"
          style={{ width: 'auto', marginTop: '20px', padding: '10px 24px' }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="ml-page">
      {/* Header section */}
      <div className="ml-header-section">
        <div className="ml-title-block">
          <h1 className="ml-title">Favorites</h1>
          <p className="ml-subtitle">Manage your favorited experts and study resources in one place.</p>
        </div>
        <div className="ml-counter-badge">
          Total Favorites: <span>{teachers.length}</span>
        </div>
      </div>

      {/* Filters bar */}
      <div className="ml-filters-bar">
        <div className="ml-filters-left">
          <FilterSelect
            icon={Filter}
            value={selectedSubject}
            options={subjectOptions}
            onChange={setSelectedSubject}
            label="Filter favorites by subject"
          />

          <FilterSelect
            icon={ArrowUpDown}
            value={selectedSort}
            options={sortOptions}
            onChange={setSelectedSort}
            label="Sort favorites"
          />
        </div>

        <div className="ml-filters-right">
          {filteredAndSortedTeachers.length > 0 ? (
            `Showing ${Math.min(currentPage * itemsPerPage, filteredAndSortedTeachers.length)} of ${filteredAndSortedTeachers.length} favorites`
          ) : (
            'No favorited experts'
          )}
        </div>
      </div>

      {/* Grid of Saved Teachers */}
      {filteredAndSortedTeachers.length === 0 ? (
        <div className="ml-empty-card">
          <Heart size={48} fill="#cbd5e1" color="#cbd5e1" />
          <h2>You haven't favorited any teachers yet</h2>
          <p>
            Browse the directory to discover qualified experts and click the "Add to Favorites" button to keep track of them here.
          </p>
          <button
            onClick={() => navigate('/find-expert')}
            className="ml-action-btn ml-action-btn--primary"
            style={{ width: 'auto', padding: '10px 24px', marginTop: '8px' }}
          >
            Find Experts
          </button>
        </div>
      ) : (
        <>
          <div className="ml-grid">
            {paginatedTeachers.map((teacher) => {
              // Primary specialty category for upper text
              const primarySpecialty = teacher.specialties?.[0]?.name || teacher.headline || 'General Expert';
              
              return (
                <article key={teacher.teacherId} className="ml-card">
                  {/* Card Image and Save Heart Button */}
                  <div className="ml-card-image-wrap">
                    {teacher.avatar ? (
                      <img
                        src={teacher.avatar}
                        alt={teacher.name}
                        className="ml-card-image"
                      />
                    ) : (
                      <div className="ml-card-image" style={{ display: 'grid', placeItems: 'center', backgroundColor: '#e2e8f0', color: '#94a3b8' }}>
                        <Users size={48} />
                      </div>
                    )}
                    {/* Clicking the heart unsaves the teacher */}
                    <button
                      className="ml-heart-btn"
                      onClick={(e) => handleUnsave(e, teacher.teacherId)}
                      title="Remove from saved list"
                    >
                      <Heart />
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="ml-card-body">
                    <div className="ml-card-header">
                      <h3 className="ml-card-name">{teacher.name}</h3>
                      <div className="ml-card-rating">
                        <Star size={14} />
                        <span>{teacher.rating > 0 ? teacher.rating.toFixed(1) : 'NEW'}</span>
                      </div>
                    </div>

                    <span className="ml-card-category">{primarySpecialty}</span>

                    <p className="ml-card-bio">{teacher.bio || 'No description provided by the teacher.'}</p>

                    {/* Tags */}
                    <div className="ml-card-tags">
                      {(teacher.specialties || []).slice(0, 3).map((spec) => (
                        <span key={spec.id} className="ml-card-tag">
                          {spec.name}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="ml-card-actions">
                      <Link
                        to={`/teacher-profile/${teacher.teacherId}`}
                        className="ml-action-btn ml-action-btn--primary"
                      >
                        View Profile
                      </Link>
                      <button
                        onClick={(e) => handleMessage(e, teacher.teacherId)}
                        className="ml-action-btn ml-action-btn--secondary"
                      >
                        Send Message
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="ml-pagination">
              <button
                className="ml-page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`ml-page-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

              <button
                className="ml-page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default MyList;
