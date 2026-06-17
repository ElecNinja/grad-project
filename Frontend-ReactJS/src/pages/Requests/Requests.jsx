import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { getMyRequests, confirmBid } from "../../apis/axios";
import "./requests.css";

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

function getYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|watch\?v=|embed\/)([^#&?]*)/);
  return match ? match[1] : null;
}

function normalise(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const result = [];
  raw.forEach((request) => {
    if (request.bids && request.bids.length > 0) {
      request.bids.forEach((bid) => {
                if (bid.status === "accepted") return;

        const teacherProfile = bid.teacher_profiles?.profiles;
        const yearsExp = bid.teacher_profiles?.years_experience;
        result.push({
          id: bid.id,
          requestId: request.id,
          teacherName: teacherProfile?.full_name || "Unknown Teacher",
          teacherId: bid.teacher_profiles?.profile_id || null,
          teacherBio: request.description || "",
          teacherAvatar: teacherProfile?.avatar_url || null,
          teacherVideo: bid.teacher_profiles?.introduction_video || null,
          subject: request.preferred_language || "General",
          rating: 0,
          reviews: 0,
          lessons: "—",
          experience: yearsExp != null ? `${yearsExp}y` : "—",
          pricePerLesson: Number(bid.price || 0),
          pdfUrl: request.request_files?.[0]?.file_url || null,
          bidStatus: bid.status,
          teachingMode: bid.teaching_mode,
        });
      });
    }
  });
  return result;
}

function Stars({ rating }) {
  return (
    <span className="rq-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} className={`rq-star ${n <= Math.round(rating) ? "rq-star--on" : "rq-star--off"}`}
          viewBox="0 0 20 20" width="12" height="12" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

// Video Modal
function VideoModal({ videoUrl, onClose }) {
  const videoId = getYouTubeId(videoUrl);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

 return createPortal(
    <div className="rq-modal-overlay" onClick={onClose}>
      <div
        style={{
          width: '80vw',
          maxWidth: '900px',
          aspectRatio: '16/9',
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '-40px',
            right: '0',
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: '#fff',
            fontSize: '24px',
            cursor: 'pointer',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >✕</button>
        {videoId ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            style={{ width: '100%', height: '100%', border: 'none' }}
            allowFullScreen
            allow="autoplay"
            title="Teacher video"
          />
        ) : (
          <video src={videoUrl} style={{ width: '100%', height: '100%' }} controls autoPlay />
        )}
      </div>
    </div>
  );
}

// Payment Modal
function PaymentModal({ offer, onClose, onSuccess }) {
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [paying, setPaying] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const formatCardNumber = (val) =>
    val.replace(/[^0-9]/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

  const formatExpiry = (val) => {
    const digits = val.replace(/[^0-9]/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErr("");
    const numberDigits = card.number.replace(/\s/g, "");
    if (numberDigits.length !== 16) { setErr("Please enter a valid 16-digit card number."); return; }
    if (!card.name.trim()) { setErr("Please enter the name on the card."); return; }
    if (!/^\d{2}\/\d{2}$/.test(card.expiry)) { setErr("Please enter a valid expiry date (MM/YY)."); return; }
    if (card.cvv.length < 3) { setErr("Please enter a valid CVV."); return; }
    setPaying(true);
    setTimeout(() => { setPaying(false); onSuccess(); }, 1200);
  };

return createPortal(
      <div className="rq-modal-overlay">
      <div className="rq-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rq-modal__header">
          <h3>Confirm &amp; Pay</h3>
          <button className="rq-modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p className="rq-modal__summary">
          Lesson with <strong>{offer.teacherName}</strong> — £€{offer.pricePerLesson} per lesson
        </p>
        <form className="rq-modal__form" onSubmit={handleSubmit}>
          <label className="rq-modal__label">
            Card Number
            <input type="text" inputMode="numeric" placeholder="1234 5678 9012 3456"
              value={card.number}
              onChange={(e) => setCard((c) => ({ ...c, number: formatCardNumber(e.target.value) }))}
              className="rq-modal__input" maxLength={19} />
          </label>
          <label className="rq-modal__label">
            Name on Card
            <input type="text" placeholder="John Doe" value={card.name}
              onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))}
              className="rq-modal__input" />
          </label>
          <div className="rq-modal__row">
            <label className="rq-modal__label">
              Expiry
              <input type="text" placeholder="MM/YY" value={card.expiry}
                onChange={(e) => setCard((c) => ({ ...c, expiry: formatExpiry(e.target.value) }))}
                className="rq-modal__input" maxLength={5} />
            </label>
            <label className="rq-modal__label">
              CVV
              <input type="text" inputMode="numeric" placeholder="123" value={card.cvv}
                onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value.replace(/[^0-9]/g, "").slice(0, 4) }))}
                className="rq-modal__input" maxLength={4} />
            </label>
          </div>
          {err && <p className="rq-modal__error">{err}</p>}
          <button type="submit" className="rq-btn rq-btn--primary rq-modal__submit" disabled={paying}>
            {paying ? "Processing…" : `Pay £€${offer.pricePerLesson}`}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}

// Single teacher offer card
function RequestCard({ offer, onAccepted  }) {
  const [accepted, setAccepted] = useState(false);
  const [msgOpen,  setMsgOpen]  = useState(false);
  const [msgText,  setMsgText]  = useState("");
  const [payOpen,  setPayOpen]  = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);

  const handleSend = () => {
    if (msgText.trim()) { setMsgOpen(false); setMsgText(""); }
  };

  const videoId = getYouTubeId(offer.teacherVideo);

  return (
    <article className={`rq-card ${accepted ? "rq-card--accepted" : ""}`}>

      {/* LEFT: teacher info */}
      <div className="rq-card__left">
        {offer.teacherAvatar ? (
          <img src={offer.teacherAvatar} alt={offer.teacherName} className="rq-card__avatar" />
        ) : (
          <div className="rq-card__avatar rq-card__avatar--initials" aria-label={offer.teacherName}>
            {offer.teacherName.trim().split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
          </div>
        )}

        <div className="rq-card__body">
          <h2 className="rq-card__name">{offer.teacherName}</h2>
          <p className="rq-card__bio">{offer.teacherBio}</p>

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

          <div className="rq-card__actions">
            <button className="rq-btn rq-btn--primary" onClick={() => setMsgOpen((v) => !v)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Send Message
            </button>
           <Link className="rq-btn rq-btn--outline" to={`/teacher-profile/${offer.teacherId}`}>
              View Profile
            </Link>
            <button
              className={`rq-btn rq-btn--outline ${accepted ? "rq-btn--accepted" : ""}`}
              onClick={() => !accepted && setPayOpen(true)}
              disabled={accepted}
            >
              {accepted ? "Accepted ✓" : "Accept"}
            </button>
          </div>

          {msgOpen && (
            <div className="rq-msg-composer">
              <textarea className="rq-msg-composer__textarea" rows={3}
                placeholder={`Message ${offer.teacherName.split(" ")[0]}…`}
                value={msgText} onChange={(e) => setMsgText(e.target.value)} />
              <div className="rq-msg-composer__footer">
                <button className="rq-btn rq-btn--primary rq-btn--sm" onClick={handleSend}>Send</button>
                <button className="rq-btn rq-btn--ghost rq-btn--sm"
                  onClick={() => { setMsgOpen(false); setMsgText(""); }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: video thumbnail */}
      <div
        className={`rq-card__cover ${!offer.teacherVideo ? "rq-card__cover--placeholder" : ""}`}
        onClick={() => offer.teacherVideo && setVideoOpen(true)}
        style={{ cursor: offer.teacherVideo ? 'pointer' : 'default' }}
      >
        {offer.teacherVideo ? (
          videoId ? (
            <>
              <img
                src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                alt="Video thumbnail"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {/* Play button overlay */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '54px', height: '54px', borderRadius: '50%',
                background: 'rgba(29, 78, 216, 0.9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '3px solid #fff',
                boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
                zIndex: 2,
              }}>
                <svg viewBox="0 0 24 24" fill="white" width="22" height="22" style={{ marginLeft: '3px' }}>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </>
          ) : (
            <video src={offer.teacherVideo} className="rq-card__cover-img" />
          )
        ) : (
          <div className="rq-card__cover-fallback">
            <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" width="48" height="48">
              <path d="M15 10l4.553-2.277A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
            <span className="rq-card__cover-fallback-text">Preview unavailable</span>
          </div>
        )}
      </div>

      {videoOpen && (
        <VideoModal videoUrl={offer.teacherVideo} onClose={() => setVideoOpen(false)} />
      )}

      {payOpen && (
        <PaymentModal
          offer={offer}
          onClose={() => setPayOpen(false)}
          onSuccess={async () => {
            try {
              await confirmBid(offer.id);
            } catch (err) {
              console.error("Failed to confirm bid:", err);
            }
            setPayOpen(false);
            setAccepted(true);
            if (onAccepted) onAccepted(offer.id);
          }}
        />
      )}
    </article>
  );
}

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

function Requests() {
  const [allOffers, setAllOffers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [subject,   setSubject]   = useState("All");
  const [priceIdx,  setPriceIdx]  = useState(0);
  const [ratingIdx, setRatingIdx] = useState(0);
  const [page,      setPage]      = useState(1);

  useEffect(() => {
    getMyRequests()
      .then((data) => setAllOffers(normalise(data)))
      .catch(()    => setAllOffers([]))
      .finally(()  => setLoading(false));
  }, []);

  const subjectOptions = useMemo(() => {
    const unique = ["All", ...new Set(allOffers.map((o) => o.subject).filter(Boolean))];
    return unique;
  }, [allOffers]);

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

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageItems   = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const resetFilters = () => {
    setSearch(""); setSubject("All"); setPriceIdx(0); setRatingIdx(0); setPage(1);
  };

  const onFilter = (setter) => (e) => { setter(e.target.value); setPage(1); };

  return (
    <div className="rq-page">
      <div className="rq-search-wrap">
        <div className="rq-search-box">
          <svg className="rq-search-icon" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            strokeLinejoin="round" width="17" height="17">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input id="rq-search" type="text" className="rq-search-input"
            placeholder="Search for subject or tutor name…"
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      <div className="rq-filters">
        <div className="rq-filter">
          <label className="rq-filter__label" htmlFor="rq-filter-subject">Subject</label>
          <select id="rq-filter-subject" className="rq-filter__select" value={subject} onChange={onFilter(setSubject)}>
            {subjectOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="rq-filter">
          <label className="rq-filter__label" htmlFor="rq-filter-price">Price Range</label>
          <select id="rq-filter-price" className="rq-filter__select" value={priceIdx}
            onChange={(e) => { setPriceIdx(Number(e.target.value)); setPage(1); }}>
            {PRICE_RANGES.map((r, i) => <option key={i} value={i}>{r.label}</option>)}
          </select>
        </div>
        <div className="rq-filter">
          <label className="rq-filter__label" htmlFor="rq-filter-rating">Rating</label>
          <select id="rq-filter-rating" className="rq-filter__select" value={ratingIdx}
            onChange={(e) => { setRatingIdx(Number(e.target.value)); setPage(1); }}>
            {RATINGS.map((r, i) => <option key={i} value={i}>{r.label}</option>)}
          </select>
        </div>
      </div>

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
pageItems.map((offer) => (
            <RequestCard
              key={offer.id}
              offer={offer}
              onAccepted={(bidId) => {
                setAllOffers((prev) => prev.filter((o) => o.id !== bidId));
              }}
            />
          ))        )}
      </div>

      {!loading && totalPages > 1 && (
        <nav className="rq-pagination" aria-label="Pagination">
          <button id="rq-prev"
            className={`rq-page-btn rq-page-btn--arrow ${currentPage === 1 ? "rq-page-btn--disabled" : ""}`}
            onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button key={n} id={`rq-page-${n}`}
              className={`rq-page-btn ${n === currentPage ? "rq-page-btn--active" : ""}`}
              onClick={() => setPage(n)}>{n}</button>
          ))}
          <button id="rq-next"
            className={`rq-page-btn rq-page-btn--arrow ${currentPage === totalPages ? "rq-page-btn--disabled" : ""}`}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>›</button>
        </nav>
      )}
    </div>
  );
}

export default Requests;