import React, { useState, useEffect, useMemo } from "react";
import { getMyRequests } from "../../apis/axios";
import "./requests.css";

// ─── Filter UI constants (backend-independent) ────────────────────────────────
const PRICE_RANGES = [
  { label: "All Prices",  min: 0,   max: Infinity },
  { label: "£€ 100–300",  min: 100, max: 300 },
  { label: "£€ 300–500",  min: 300, max: 500 },
  { label: "£€ 500–700",  min: 500, max: 700 },
  { label: "£€ 700–900",  min: 700, max: 900 },
];
const RATINGS = [
  { label: "Any Rating", min: 0   },
  { label: "4.5+ ★",     min: 4.5 },
  { label: "4.3+ ★",     min: 4.3 },
  { label: "4.0+ ★",     min: 4.0 },
  { label: "3.5+ ★",     min: 3.5 },
];
const PER_PAGE = 3;

// ─── Normalise API response ───────────────────────────────────────────────────
// Maps any backend shape into a consistent object the UI can rely on.
// Returns [] when the API sends nothing — no fake fallback data.
function normalise(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return raw.map((item, i) => ({
    id:             item.id             ?? item["id-pdf"]       ?? i,
    teacherName:    item.teacherName    ?? item.teacher?.name   ?? "Unknown Teacher",
    teacherBio:     item.teacherBio     ?? item.teacher?.bio    ?? item.description ?? "",
    teacherAvatar:  item.teacherPhoto   ?? item.teacher?.photo  ?? null,
    teacherCover:   item.teacherCover   ?? item.teacher?.cover  ?? null,
    subject:        item.subject        ?? item.specialties     ?? "General",
    rating:         Number(item.rating  ?? item.teacher?.rating ?? 0),
    reviews:        item.reviews        ?? item.teacher?.reviews ?? 0,
    lessons:        item.lessons        ?? item.teacher?.lessons ?? "—",
    experience:     item.experience     ?? item.teacher?.experience ?? "—",
    pricePerLesson: Number(item.pricePerLesson ?? item.price ?? item.teacher?.price ?? 0),
    pdfUrl:         item.pdfUrl         ?? item["pdf-url"]      ?? null,
  }));
}

// ─── Star row ─────────────────────────────────────────────────────────────────
function Stars({ rating }) {
  return (
    <span className="rq-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          className={`rq-star ${n <= Math.round(rating) ? "rq-star--on" : "rq-star--off"}`}
          viewBox="0 0 20 20"
          width="12"
          height="12"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

// ─── Single teacher offer card ────────────────────────────────────────────────
function RequestCard({ offer }) {
  const [accepted, setAccepted] = useState(false);
  const [msgOpen,  setMsgOpen]  = useState(false);
  const [msgText,  setMsgText]  = useState("");

  const handleSend = () => {
    if (msgText.trim()) {
      // TODO: wire to real message API
      setMsgOpen(false);
      setMsgText("");
    }
  };

  return (
    <article className={`rq-card ${accepted ? "rq-card--accepted" : ""}`}>

      {/* ── LEFT: teacher info ────────────────────────────────────── */}
      <div className="rq-card__left">
        {offer.teacherAvatar ? (
          <img
            src={offer.teacherAvatar}
            alt={offer.teacherName}
            className="rq-card__avatar"
          />
        ) : (
          <div className="rq-card__avatar rq-card__avatar--initials" aria-label={offer.teacherName}>
            {offer.teacherName.trim().split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
          </div>
        )}

        <div className="rq-card__body">
          <h2 className="rq-card__name">{offer.teacherName}</h2>
          <p  className="rq-card__bio">{offer.teacherBio}</p>

          {/* stats */}
          <div className="rq-card__stats">
            <div className="rq-stat">
              <span className="rq-stat__val">
                <Stars rating={offer.rating} />
                <span className="rq-stat__num">{offer.rating.toFixed(1)}</span>
              </span>
              <span className="rq-stat__lbl">{offer.reviews} Reviews</span>
            </div>

            <div className="rq-stat__sep" />

            <div className="rq-stat">
              <span className="rq-stat__val rq-stat__num">{offer.lessons}</span>
              <span className="rq-stat__lbl">Lessons</span>
            </div>

            <div className="rq-stat__sep" />

            <div className="rq-stat">
              <span className="rq-stat__val rq-stat__num">{offer.experience}</span>
              <span className="rq-stat__lbl">Experience</span>
            </div>

            <div className="rq-stat__price-block">
              <span className="rq-stat__price">£€{offer.pricePerLesson}</span>
              <span className="rq-stat__price-lbl">Per Lesson</span>
            </div>
          </div>

          {/* action buttons */}
          <div className="rq-card__actions">
            <button
              id={`send-msg-${offer.id}`}
              className="rq-btn rq-btn--primary"
              onClick={() => setMsgOpen((v) => !v)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Send Message
            </button>

            <button
              id={`view-profile-${offer.id}`}
              className="rq-btn rq-btn--outline"
            >
              View Profile
            </button>

            <button
              id={`accept-${offer.id}`}
              className={`rq-btn rq-btn--outline ${accepted ? "rq-btn--accepted" : ""}`}
              onClick={() => !accepted && setAccepted(true)}
              disabled={accepted}
            >
              {accepted ? "Accepted ✓" : "Accept"}
            </button>
          </div>

          {/* inline message composer */}
          {msgOpen && (
            <div className="rq-msg-composer">
              <textarea
                id={`msg-area-${offer.id}`}
                className="rq-msg-composer__textarea"
                rows={3}
                placeholder={`Message ${offer.teacherName.split(" ")[0]}…`}
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
              />
              <div className="rq-msg-composer__footer">
                <button
                  id={`msg-send-${offer.id}`}
                  className="rq-btn rq-btn--primary rq-btn--sm"
                  onClick={handleSend}
                >
                  Send
                </button>
                <button
                  id={`msg-cancel-${offer.id}`}
                  className="rq-btn rq-btn--ghost rq-btn--sm"
                  onClick={() => { setMsgOpen(false); setMsgText(""); }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: cover thumbnail ────────────────────────────── */}
      <div className={`rq-card__cover ${!offer.teacherCover ? "rq-card__cover--placeholder" : ""}`}>
        {offer.teacherCover ? (
          <img
            src={offer.teacherCover}
            alt="lesson preview"
            className="rq-card__cover-img"
          />
        ) : (
          <div className="rq-card__cover-fallback">
            <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" width="48" height="48">
              <path d="M15 10l4.553-2.277A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
            <span className="rq-card__cover-fallback-text">Preview unavailable</span>
          </div>
        )}
        <button className="rq-card__play" aria-label="Play preview">
          <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      </div>

    </article>
  );
}

// ─── Skeleton loader card ─────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rq-skeleton">
      <div className="rq-skeleton__avatar" />
      <div className="rq-skeleton__lines">
        <div className="rq-skeleton__line rq-skeleton__line--title" />
        <div className="rq-skeleton__line" />
        <div className="rq-skeleton__line rq-skeleton__line--short" />
        <div className="rq-skeleton__line rq-skeleton__line--stats" />
        <div className="rq-skeleton__line rq-skeleton__line--btns" />
      </div>
      <div className="rq-skeleton__cover" />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
function Requests() {
  const [allOffers, setAllOffers] = useState([]);
  const [loading,   setLoading]   = useState(true);

  // filters
  const [search,    setSearch]    = useState("");
  const [subject,   setSubject]   = useState("All");
  const [priceIdx,  setPriceIdx]  = useState(0);
  const [ratingIdx, setRatingIdx] = useState(0);
  const [page,      setPage]      = useState(1);

  // ── fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    getMyRequests()
      .then((data) => setAllOffers(normalise(data)))
      .catch(()    => setAllOffers([]))
      .finally(()  => setLoading(false));
  }, []);

  // ── derive subject list from real data ───────────────────────────────────
  const subjectOptions = useMemo(() => {
    const unique = ["All", ...new Set(allOffers.map((o) => o.subject).filter(Boolean))];
    return unique;
  }, [allOffers]);

  // ── filter + paginate ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const pr = PRICE_RANGES[priceIdx];
    const mr = RATINGS[ratingIdx].min;
    return allOffers.filter((o) => {
      const q = search.toLowerCase();
      const matchSearch  = !q || o.teacherName.toLowerCase().includes(q) || o.subject.toLowerCase().includes(q);
      const matchSubject = subject === "All" || o.subject === subject;
      const matchPrice   = o.pricePerLesson >= pr.min && o.pricePerLesson <= pr.max;
      const matchRating  = o.rating >= mr;
      return matchSearch && matchSubject && matchPrice && matchRating;
    });
  }, [allOffers, search, subject, priceIdx, ratingIdx]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageItems   = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const resetFilters = () => {
    setSearch(""); setSubject("All"); setPriceIdx(0); setRatingIdx(0); setPage(1);
  };

  const onFilter = (setter) => (e) => { setter(e.target.value); setPage(1); };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="rq-page">

      {/* ── Search ─────────────────────────────────────────── */}
      <div className="rq-search-wrap">
        <div className="rq-search-box">
          <svg className="rq-search-icon" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            strokeLinejoin="round" width="17" height="17">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="rq-search"
            type="text"
            className="rq-search-input"
            placeholder="Search for subject or tutor name…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────── */}
      <div className="rq-filters">
        <div className="rq-filter">
          <label className="rq-filter__label" htmlFor="rq-filter-subject">Subject</label>
          <select
            id="rq-filter-subject"
            className="rq-filter__select"
            value={subject}
            onChange={onFilter(setSubject)}
          >
            {subjectOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="rq-filter">
          <label className="rq-filter__label" htmlFor="rq-filter-price">Price Range</label>
          <select
            id="rq-filter-price"
            className="rq-filter__select"
            value={priceIdx}
            onChange={(e) => { setPriceIdx(Number(e.target.value)); setPage(1); }}
          >
            {PRICE_RANGES.map((r, i) => <option key={i} value={i}>{r.label}</option>)}
          </select>
        </div>

        <div className="rq-filter">
          <label className="rq-filter__label" htmlFor="rq-filter-rating">Rating</label>
          <select
            id="rq-filter-rating"
            className="rq-filter__select"
            value={ratingIdx}
            onChange={(e) => { setRatingIdx(Number(e.target.value)); setPage(1); }}
          >
            {RATINGS.map((r, i) => <option key={i} value={i}>{r.label}</option>)}
          </select>
        </div>
      </div>

      {/* ── Cards ──────────────────────────────────────────── */}
      <div className="rq-list">
        {loading ? (
          [1, 2, 3].map((k) => <SkeletonCard key={k} />)
        ) : pageItems.length === 0 ? (
          <div className="rq-empty">
            <svg viewBox="0 0 64 64" fill="none" width="54" height="54">
              <circle cx="32" cy="32" r="30" stroke="#d1d5db" strokeWidth="2" />
              <path d="M20 32h24M32 20v24" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p>No tutors match your filters.</p>
            <button className="rq-btn rq-btn--primary" onClick={resetFilters} id="clear-filters-btn">
              Clear Filters
            </button>
          </div>
        ) : (
          pageItems.map((offer) => <RequestCard key={offer.id} offer={offer} />)
        )}
      </div>

      {/* ── Pagination ─────────────────────────────────────── */}
      {!loading && totalPages > 1 && (
        <nav className="rq-pagination" aria-label="Pagination">
          <button
            id="rq-prev"
            className={`rq-page-btn rq-page-btn--arrow ${currentPage === 1 ? "rq-page-btn--disabled" : ""}`}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >‹</button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              id={`rq-page-${n}`}
              className={`rq-page-btn ${n === currentPage ? "rq-page-btn--active" : ""}`}
              onClick={() => setPage(n)}
              aria-label={`Page ${n}`}
              aria-current={n === currentPage ? "page" : undefined}
            >
              {n}
            </button>
          ))}

          <button
            id="rq-next"
            className={`rq-page-btn rq-page-btn--arrow ${currentPage === totalPages ? "rq-page-btn--disabled" : ""}`}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >›</button>
        </nav>
      )}
    </div>
  );
}

export default Requests;
