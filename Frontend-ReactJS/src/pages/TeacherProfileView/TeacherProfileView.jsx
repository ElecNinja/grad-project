import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Star,
  MessageCircle,
  Bookmark,
  Share2,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Clock,
  DollarSign,
  AlertCircle,
  ChevronRight,
  Zap,
  ChevronLeft,
} from 'lucide-react';
import { getTeacherProfile } from '../../apis/handlers/getTeacherProfile';
import { getTeacherReviews } from '../../apis/handlers/getTeacherReviews';
import { getRecommendedTeachers } from '../../apis/handlers/getRecommendedTeachers';
import { useOnlineIds } from '../../context/PresenceContext';
import './TeacherProfileView.css';
import { useDispatch } from 'react-redux';
import { openChat, getOrCreateConversation, setActiveConversation } from '../../redux/chatSlice';
// ── Helpers ────────────────────────────────────────────────────────────────



const getYouTubeId = (url) => {
  if (!url) return null;
  const regExp =
    /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const renderStars = (rating, size = 16) =>
  [...Array(5)].map((_, i) => (
    <Star
      key={i}
      size={size}
      fill={i < Math.floor(rating || 0) ? '#f59e0b' : 'none'}
      color={i < Math.floor(rating || 0) ? '#f59e0b' : '#d1d5db'}
    />
  ));

// ── Sub-components ─────────────────────────────────────────────────────────

function SpecialtyAccordion({ specialties }) {
  const [openId, setOpenId] = useState(null);
  if (!specialties?.length) return null;
  return (
    <div className="tpv-accordion">
      {specialties.map((s) => (
        <div key={s.id} className="tpv-accordion-item">
          <button
            className="tpv-accordion-trigger"
            onClick={() => setOpenId(openId === s.id ? null : s.id)}
          >
            <span>{s.name}</span>
            {openId === s.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {openId === s.id && (
            <div className="tpv-accordion-body">
              <span className={`tpv-proficiency tpv-proficiency--${s.proficiency || 'intermediate'}`}>
                {s.proficiency || 'Intermediate'}
              </span>
              <p className="tpv-accordion-desc">
                Teaching this subject at {s.proficiency || 'intermediate'} level.
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ReviewCard({ review }) {
  const initials = (review.author || 'A')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="tpv-review-card">
      <div className="tpv-review-header">
        {review.avatar ? (
          <img src={review.avatar} alt={review.author} className="tpv-review-avatar tpv-review-avatar--img" />
        ) : (
          <div className="tpv-review-avatar">{initials}</div>
        )}
        <div>
          <p className="tpv-review-name">{review.author}</p>
          <p className="tpv-review-date">{review.date}</p>
        </div>
        <div className="tpv-review-stars">{renderStars(review.rating, 14)}</div>
      </div>
      {review.comment && <p className="tpv-review-text">{review.comment}</p>}
    </div>
  );
}

function RecommendCard({ teacher, isOnline }) {
  return (
    <Link to={`/teacher-profile/${teacher.id}`} className="tpv-recommend-card">
      <div className="tpv-recommend-photo">
        {teacher.photo ? (
          <img src={teacher.photo} alt={teacher.name} />
        ) : (
          <div className="tpv-recommend-placeholder">
            {(teacher.name || 'T')[0].toUpperCase()}
          </div>
        )}
        <span
          className="tpv-recommend-online-dot"
          style={{ background: isOnline ? '#22c55e' : '#94a3b8' }}
          title={isOnline ? 'Online' : 'Offline'}
        />
      </div>
      <div className="tpv-recommend-info">
        <p className="tpv-recommend-name">{teacher.name}</p>
        <p className="tpv-recommend-subject">{teacher.headline || '—'}</p>
        <div className="tpv-recommend-rating">
          <Star size={13} fill="#f59e0b" color="#f59e0b" />
          <span>{teacher.avg_rating ? teacher.avg_rating.toFixed(1) : '—'}</span>
        </div>
      </div>
    </Link>
  );
}

function RecommendCarousel({ teachers, onlineIds }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const CARD_WIDTH = 188; // card width + gap

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      ro.disconnect();
    };
  }, [teachers]);

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * CARD_WIDTH * 2, behavior: 'smooth' });
  };

  return (
    <div className={`tpv-carousel-wrap ${canScrollLeft ? 'tpv-carousel-wrap--fade-left' : ''} ${canScrollRight ? 'tpv-carousel-wrap--fade-right' : ''}`}>
      <button
        className={`tpv-carousel-arrow tpv-carousel-arrow--left ${canScrollLeft ? 'tpv-carousel-arrow--visible' : ''}`}
        onClick={() => scroll(-1)}
        aria-label="Scroll left"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="tpv-carousel-track" ref={scrollRef}>
        {teachers.map((t) => (
          <div key={t.id} className="tpv-carousel-item">
            <RecommendCard teacher={t} isOnline={onlineIds.has(t.id)} />
          </div>
        ))}
      </div>

      <button
        className={`tpv-carousel-arrow tpv-carousel-arrow--right ${canScrollRight ? 'tpv-carousel-arrow--visible' : ''}`}
        onClick={() => scroll(1)}
        aria-label="Scroll right"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

const REVIEWS_PER_PAGE = 6;

function TeacherProfileView() {
  const { id } = useParams();
  const currentUser = useSelector((state) => state.user);

  // ── Global presence — reads from shared PresenceContext (set in Router.jsx) ──
  const onlineIds = useOnlineIds();

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');

  const [reviews, setReviews] = useState([]);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [breakdown, setBreakdown] = useState([]);
  const [reviewPage, setReviewPage] = useState(0);
  const [reviewLoading, setReviewLoading] = useState(false);

  const [recommended, setRecommended] = useState([]);
  const [saved, setSaved] = useState(false);
  const [langFilter, setLangFilter] = useState('All');
  const [bioExpanded, setBioExpanded] = useState(false);



  const dispatch = useDispatch();

const handleMessage = async () => {
  try {
    const conversationId = await dispatch(getOrCreateConversation(id)).unwrap();
    dispatch(setActiveConversation(conversationId));
    dispatch(openChat());
  } catch (error) {
    console.error('Failed to open chat:', error);
  }
};
  // ── Load profile ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) { setProfileError('Teacher ID is missing.'); setProfileLoading(false); return; }
    (async () => {
      const result = await getTeacherProfile(id);
      if (result.status === 200) setProfile(result.response);
      else setProfileError(result.message || 'Could not load teacher profile.');
      setProfileLoading(false);
    })();
  }, [id]);

  // ── Load reviews ──────────────────────────────────────────────────────
  const loadReviews = useCallback(async (page) => {
    if (!id) return;
    setReviewLoading(true);
    try {
      const result = await getTeacherReviews(id, page, REVIEWS_PER_PAGE);
      if (result.status === 200 && result.response) {
        setReviews(result.response.reviews || []);
        setReviewTotal(result.response.total || 0);
        if (page === 0) setBreakdown(result.response.breakdown || []);
      }
    } catch { /* non-critical */ }
    finally { setReviewLoading(false); }
  }, [id]);

  useEffect(() => { loadReviews(reviewPage); }, [loadReviews, reviewPage]);

  // ── Load recommended ──────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const result = await getRecommendedTeachers(id);
        if (result.status === 200 && Array.isArray(result.response))
          setRecommended(result.response);
      } catch { /* non-critical */ }
    })();
  }, [id]);

  // ── Derived values ─────────────────────────────────────────────────────
  const isOwnProfile = currentUser?.id === id;
  const displayPhoto = profile?.photo || null;
  const videoId = getYouTubeId(profile?.introduction_video);
  // id here is the profile UUID — matches what Router.jsx tracks
  const isOnline = onlineIds.has(id);

  const languages = Array.isArray(profile?.teaching_languages)
    ? profile.teaching_languages.map((item) =>
        typeof item === 'string' ? { lang: item, proficiency: 'native' } : item
      )
    : [];

  const langTabs = ['All', ...new Set(languages.map((l) => l.proficiency))];
  const filteredLangs = langFilter === 'All' ? languages : languages.filter((l) => l.proficiency === langFilter);

  const avgRating = profile?.avg_rating || profile?.rating || 0;
  const ratingCount = profile?.rating_count ?? reviewTotal;
  const isPopular = ratingCount >= 10 || avgRating >= 4.5;
  const totalReviewPages = Math.ceil(reviewTotal / REVIEWS_PER_PAGE);
  const bioText = profile?.bio || 'No bio has been added yet.';
  const canExpandBio = bioText.length > 260;

  const handleShare = () => {
    if (navigator.share) navigator.share({ title: profile?.name, url: window.location.href });
    else navigator.clipboard.writeText(window.location.href);
  };

  // ── Loading / Error ────────────────────────────────────────────────────
  if (profileLoading) {
    return (
      <div className="tpv-loading">
        <div className="tpv-spinner" />
        <p>Loading profile…</p>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="tpv-error-page">
        <div className="tpv-error-card">
          <AlertCircle size={36} color="#b91c1c" />
          <h2>Profile not available</h2>
          <p>{profileError}</p>
          <Link className="tpv-btn tpv-btn--primary" to="/find-expert">
            <ArrowLeft size={16} /> Back to experts
          </Link>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="tpv-page">
      <div className="tpv-layout">
        
        {/* ══ LEFT COLUMN (Main Content) ════════════════════════════════ */}
        <div className="tpv-layout-main">
          
          {/* Introduction Video (Moved above the name) */}
          {profile?.introduction_video && (
            <section className="tpv-section tpv-video-section">
              <div className="tpv-video-wrapper">
                {videoId ? (
                  <iframe
                    className="tpv-intro-video"
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&rel=0&modestbranding=1&hd=1&vq=hd1080`}
                    title="Teacher intro video"
                    frameBorder="0"
                    allow="encrypted-media"
                    allowFullScreen
                  />
                ) : (
                  <video
                    className="tpv-intro-video"
                    src={profile.introduction_video}
                    controls
                    preload="metadata"
                    playsInline
                  />
                )}
              </div>
            </section>
          )}

          {/* ══ IDENTITY ROW ═══════════════════════════════════════════════ */}
          <div className="tpv-identity-row">
            <div className="tpv-avatar-wrap">
              {displayPhoto ? (
                <img src={displayPhoto} alt={profile?.name} className="tpv-avatar" />
              ) : (
                <div className="tpv-avatar tpv-avatar--placeholder">
                  {(profile?.name || 'T')[0].toUpperCase()}
                </div>
              )}
              <span
                className="tpv-online-dot"
                style={{ background: isOnline ? '#22c55e' : '#94a3b8' }}
              />
            </div>

            <div className="tpv-identity-info">
              <div className="tpv-name-row">
                <h1 className="tpv-name">{profile?.name || 'Teacher'}</h1>
                {isPopular && (
                  <span className="tpv-popular-badge">
                    <Zap size={12} /> Super popular
                  </span>
                )}
              </div>
              <p className="tpv-headline">{profile?.headline || 'Teacher'}</p>
              <div className="tpv-meta-row">
                <div className="tpv-stars-inline">
                  {renderStars(avgRating, 15)}
                  <span className="tpv-rating-num">
                    {avgRating ? avgRating.toFixed(1) : 'No ratings'}
                  </span>
                </div>
                {profile?.years_experience && (
                  <span className="tpv-meta-chip">
                    <Clock size={13} /> {profile.years_experience} yrs experience
                  </span>
                )}
                {(profile?.hourly_rate_min || profile?.hourly_rate_max) && (
                  <span className="tpv-meta-chip">
                    <DollarSign size={13} />
                    {profile.hourly_rate_min && profile.hourly_rate_max
                      ? `$${profile.hourly_rate_min}–$${profile.hourly_rate_max}/hr`
                      : profile.hourly_rate_min
                      ? `From $${profile.hourly_rate_min}/hr`
                      : `Up to $${profile.hourly_rate_max}/hr`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ══ BODY ════════════════════════════════════════════════════════ */}
          <main className="tpv-main">
            {/* About Me */}
            <section className="tpv-section">
              <h2 className="tpv-section-title">About me</h2>
              <div className={`tpv-bio-wrap ${bioExpanded ? 'tpv-bio-wrap--expanded' : ''}`}>
                <p className="tpv-bio">{bioText}</p>
              </div>
              {canExpandBio && (
                <button
                  type="button"
                  className="tpv-bio-toggle"
                  aria-expanded={bioExpanded}
                  onClick={() => setBioExpanded((open) => !open)}
                >
                  {bioExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </section>

            {/* My Specialties */}
            {profile?.specialties?.length > 0 && (
              <section className="tpv-section">
                <h2 className="tpv-section-title">My Specialties</h2>
                <SpecialtyAccordion specialties={profile.specialties} />
              </section>
            )}

            {/* I Speak */}
            {languages.length > 0 && (
              <section className="tpv-section">
                <h2 className="tpv-section-title">I speak</h2>
                {langTabs.length > 1 && (
                  <div className="tpv-lang-tabs">
                    {langTabs.map((tab) => (
                      <button
                        key={tab}
                        className={`tpv-lang-tab ${langFilter === tab ? 'tpv-lang-tab--active' : ''}`}
                        onClick={() => setLangFilter(tab)}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                )}
                <div className="tpv-lang-list">
                  {filteredLangs.map((l, i) => (
                    <div key={i} className="tpv-lang-item">
                      <span className="tpv-lang-name">{l.lang}</span>
                      <span className={`tpv-lang-badge tpv-lang-badge--${l.proficiency}`}>
                        {l.proficiency}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Reviews */}
            <section className="tpv-section">
              <h2 className="tpv-section-title">What my students say</h2>

              <div className="tpv-rating-summary">
                <div className="tpv-rating-big">
                  <span className="tpv-rating-score">{avgRating ? avgRating.toFixed(1) : '—'}</span>
                  <div className="tpv-rating-stars-big">{renderStars(avgRating, 22)}</div>
                  <span className="tpv-rating-count">Based on {ratingCount} reviews</span>
                </div>
                <div className="tpv-rating-bars">
                  {(breakdown.length > 0 ? breakdown : [5,4,3,2,1].map(s => ({ stars: s, pct: 0 }))).map(({ stars, pct }) => (
                    <div key={stars} className="tpv-bar-row">
                      <span className="tpv-bar-label">{stars}★</span>
                      <div className="tpv-bar-track">
                        <div className="tpv-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="tpv-bar-pct">{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {reviewLoading ? (
                <div className="tpv-reviews-loading"><div className="tpv-spinner tpv-spinner--sm" /></div>
              ) : reviews.length > 0 ? (
                <div className="tpv-reviews-grid">
                  {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
                </div>
              ) : (
                <p className="tpv-no-reviews">No reviews yet — be the first!</p>
              )}

              {totalReviewPages > 1 && (
                <div className="tpv-review-pagination">
                  <button
                    className="tpv-btn tpv-btn--ghost tpv-btn--sm"
                    disabled={reviewPage === 0 || reviewLoading}
                    onClick={() => setReviewPage((p) => p - 1)}
                  >
                    <ChevronLeft size={15} /> Previous
                  </button>
                  <span className="tpv-page-info">Page {reviewPage + 1} of {totalReviewPages}</span>
                  <button
                    className="tpv-btn tpv-btn--ghost tpv-btn--sm"
                    disabled={reviewPage + 1 >= totalReviewPages || reviewLoading}
                    onClick={() => setReviewPage((p) => p + 1)}
                  >
                    Next <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </section>

            {/* Recommended Teachers */}
            {recommended.length > 0 && (
              <section className="tpv-section">
                <div className="tpv-section-head">
                  <h2 className="tpv-section-title">Recommended Teachers</h2>
                  <Link className="tpv-see-all" to="/find-expert">
                    See all <ChevronRight size={14} />
                  </Link>
                </div>
                {recommended.length > 3 ? (
                  <RecommendCarousel teachers={recommended} onlineIds={onlineIds} />
                ) : (
                  <div className="tpv-recommend-grid">
                    {recommended.map((t) => (
                      <RecommendCard key={t.id} teacher={t} isOnline={onlineIds.has(t.id)} />
                    ))}
                  </div>
                )}
              </section>
            )}
          </main>
        </div>

        {/* ══ RIGHT COLUMN (Sticky Sidebar) ══════════════════════════════ */}
        <aside className="tpv-layout-sidebar">
          <div className="tpv-action-card">
            {/* Stats */}
            <div className="tpv-stats-row">
              <div className="tpv-stat-item">
                <span className="tpv-stat-num">{ratingCount}</span>
                <span className="tpv-stat-label">Reviews</span>
              </div>
              <div className="tpv-stat-divider" />
              <div className="tpv-stat-item">
                <span
                  className="tpv-stat-num tpv-stat-num--status"
                  style={{ color: isOnline ? '#22c55e' : '#94a3b8' }}
                >●</span>
                <span className="tpv-stat-label">{isOnline ? 'Available' : 'Offline'}</span>
              </div>
              <div className="tpv-stat-divider" />
              <div className="tpv-stat-item">
                <span className="tpv-stat-num">{profile?.specialties?.length || 0}</span>
                <span className="tpv-stat-label">Subjects</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="tpv-action-buttons">
              <button className="tpv-btn tpv-btn--primary tpv-btn--full" onClick={handleMessage}>
                <MessageCircle size={16} /> Send a Message
              </button>
              <button
                className={`tpv-btn tpv-btn--outline tpv-btn--full ${saved ? 'tpv-btn--saved' : ''}`}
                onClick={() => setSaved((v) => !v)}
              >
                <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
                {saved ? 'Saved' : 'Save to My List'}
              </button>
              <button className="tpv-btn tpv-btn--ghost tpv-btn--full" onClick={handleShare}>
                <Share2 size={16} /> Share a Tutor
              </button>
            </div>

            {isPopular && (
              <div className="tpv-popular-info">
                <Zap size={13} color="#f59e0b" />
                <span>Super popular — usually replies within a few hours</span>
              </div>
            )}

            {isOwnProfile && (
              <Link className="tpv-btn tpv-btn--edit tpv-btn--full" to="/teacher-profile">
                Edit Profile
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default TeacherProfileView;
