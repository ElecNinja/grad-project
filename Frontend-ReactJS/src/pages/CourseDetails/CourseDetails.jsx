import React, { useState, useEffect, useMemo } from "react";
import "./CourseDetails.css";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchBootcampLessons } from "../Bootcamp/bootcampApi";
import {
  lessonsToBootcamps,
  bootcampToCourseState,
  formatPrice,
  PLACEHOLDER_IMAGE,
} from "../Bootcamp/bootcampUtils";

function CourseDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const [openSections, setOpenSections] = useState({ 0: true }); // first section open by default
  const [showMore, setShowMore] = useState(false);
  const [otherBootcamps, setOtherBootcamps] = useState([]);

  const course = location.state?.course;

  // ── Buy Now / enrollment ──
  const [enrolling, setEnrolling] = useState(false);
  const [enrolledCount, setEnrolledCount] = useState(course?.enrolledCount ?? 0);
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);

  useEffect(() => {
    fetchBootcampLessons()
      .then((rows) => {
        const all = lessonsToBootcamps(rows);
        const others = all
          .filter((b) => b.id !== course?.id)
          .map((b) => bootcampToCourseState(b));
        setOtherBootcamps(others);
      })
      .catch((err) => {
        console.error("Could not load related bootcamps:", err);
        setOtherBootcamps([]);
      });
  }, [course?.id]);

  if (!course) {
    return (
      <div style={{ textAlign: "center", padding: "100px", fontSize: "18px" }}>
        <p>No course selected.</p>
        <button
          onClick={() => navigate("/bootcamp")}
          style={{
            marginTop: "20px",
            padding: "10px 24px",
            background: "#2f6df6",
            color: "white",
            border: "none",
            borderRadius: "20px",
            cursor: "pointer",
          }}
        >
          Back to Bootcamp
        </button>
      </div>
    );
  }

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        style={{ color: i < Math.round(rating || 0) ? "#f5a623" : "#ccc", fontSize: "14px" }}
      >
        ★
      </span>
    ));

  // ── What You'll Learn ──
  // Priority: course.whatYouLearn (from DB field) → fallback: lesson titles
  const whatYouLearn = useMemo(() => {
    if (course.whatYouLearn) {
      // Could be a string (newline-separated) or an array
      if (Array.isArray(course.whatYouLearn)) return course.whatYouLearn.filter(Boolean);
      return course.whatYouLearn
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    // fallback: lesson titles
    return (course.lessons || []).map((l) => l.title).filter(Boolean);
  }, [course.whatYouLearn, course.lessons]);

  const visibleLearn = showMore ? whatYouLearn : whatYouLearn.slice(0, 8);
  const sections = course.sections || [];

  // ── Student counter ──
  const hasCapacity = course.capacity != null && course.capacity > 0;
  const studentsLabel = hasCapacity
    ? `Students: (${enrolledCount}/${course.capacity})`
    : enrolledCount > 0
    ? `Students: ${enrolledCount}`
    : null;

  const atCapacity = hasCapacity && enrolledCount >= course.capacity;

  // ── Toggle section open/close ──
  const toggleSection = (i) =>
    setOpenSections((prev) => ({ ...prev, [i]: !prev[i] }));

  // ── Buy Now handler ──
  const handleBuyNow = async () => {
    if (enrolling || alreadyEnrolled || atCapacity) return;
    setEnrolling(true);
    try {
      // 👇 TODO: replace with the real API call, e.g.:
      // await enrollInBootcamp({ bootcampId: course.id });
      setEnrolledCount((prev) => prev + 1);
      setAlreadyEnrolled(true);
    } catch (err) {
      console.error("Enrollment failed:", err);
    } finally {
      setEnrolling(false);
    }
  };

  const buyBtnLabel = atCapacity
    ? "Full"
    : alreadyEnrolled
    ? "Enrolled ✓"
    : enrolling
    ? "Processing..."
    : "Buy Now";

  return (
    <div className="cd-page">
      {/* ── Banner ── */}
      <div className="cd-banner">
        <div className="cd-banner-left">
          <h1>{course.title}</h1>
          {course.subtitle && <p className="cd-subtitle">{course.subtitle}</p>}
          {course.rating != null && course.rating > 0 && (
            <div className="cd-rating-row">
              {renderStars(course.rating)}
              <span className="cd-rating-num">{course.rating}</span>
              {course.reviews != null && (
                <span className="cd-reviews">{course.reviews.toLocaleString()} ratings</span>
              )}
            </div>
          )}
          {course.expert && <p className="cd-expert">Expert: {course.expert}</p>}
        </div>
        <div className="cd-banner-img">
          <img
            src={course.image || PLACEHOLDER_IMAGE}
            alt={course.title}
            onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }}
          />
        </div>
      </div>

      {/* ── Body ── */}
      <div className="cd-body">
        <div className="cd-main">

          {/* What You'll Learn */}
          {whatYouLearn.length > 0 && (
            <div className="cd-box">
              <h2>What you'll learn</h2>
              <div className="cd-learn-grid">
                {visibleLearn.map((item, i) => (
                  <div key={i} className="cd-learn-item">✓ {item}</div>
                ))}
              </div>
              {whatYouLearn.length > 8 && (
                <button className="cd-show-more" onClick={() => setShowMore(!showMore)}>
                  {showMore ? "Show less ▲" : "Show more ▼"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="cd-sidebar">
          {course.price && <p className="cd-price">{course.price}</p>}
          <button
            className="cd-buy-btn"
            onClick={handleBuyNow}
            disabled={enrolling || alreadyEnrolled || atCapacity}
          >
            {buyBtnLabel}
          </button>
          <div className="cd-includes">
            <p className="cd-includes-title">This bootcamp includes:</p>
            <p>• {course.totalLectures || 0} video{course.totalLectures !== 1 ? "s" : ""}</p>
            <p>• {course.totalDuration || "—"} total length</p>
            <p>• Full lifetime access</p>
          </div>
          {studentsLabel && <div className="cd-students">{studentsLabel}</div>}
          <button className="cd-share-btn">Share</button>
        </div>
      </div>

      {/* ── Full Width ── */}
      <div className="cd-full-width">

        {/* Related Topics — now shown above Course Content */}
        {course.relatedTopics?.length > 0 && (
          <div className="cd-related">
            <h2>Explore related topics</h2>
            <div className="cd-topics-row">
              {course.relatedTopics.map((t, i) => (
                <span key={i} className="cd-topic-tag">{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* Course Content — sections with collapse/expand */}
        {sections.length > 0 && (
          <div className="cd-content-section">
            <h2>Course content</h2>
            <p className="cd-content-meta">
              {sections.length} section{sections.length !== 1 ? "s" : ""} •{" "}
              {course.totalLectures || 0} lecture{course.totalLectures !== 1 ? "s" : ""} •{" "}
              {course.totalDuration || "—"} total length
            </p>
            <div className="cd-accordion">
              {sections.map((sec, i) => {
                const isOpen = !!openSections[i];
                return (
                  <div key={i} className="cd-acc-item">
                    <div
                      className="cd-acc-header"
                      onClick={() => toggleSection(i)}
                    >
                      {/* Section name — NOT video titles */}
                      <span className="cd-acc-title">
                        <span className="cd-acc-arrow">{isOpen ? "▲" : "▼"}</span>
                        {sec.title}
                      </span>
                      <span className="cd-sec-meta">
                        {sec.lectures} lecture{sec.lectures > 1 ? "s" : ""} • {sec.duration}
                      </span>
                    </div>

                    {/* Video titles inside the section — only shown when open */}
                    {isOpen && sec.items?.length > 0 && (
                      <div className="cd-acc-body">
                        {sec.items.map((videoTitle, j) => (
                          <div key={j} className="cd-lecture-row">
                            <span className="cd-lecture-icon">▶</span>
                            <span className="cd-lecture-title">{videoTitle}</span>
                            <span className="cd-lecture-dur">{sec.durations?.[j] || "—"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Requirements */}
        {course.requirements && (
          <div className="cd-requirements">
            <h2>Requirements</h2>
            <p><em>{course.requirements}</em></p>
          </div>
        )}

        {/* Other Bootcamps */}
        {otherBootcamps.length > 0 && (
          <div className="cd-bootcamps">
            <h2>Bootcamps</h2>
            <div className="cd-bootcamps-row">
              {otherBootcamps.map((b) => (
                <div
                  key={b.id}
                  className="cd-bc-card"
                  onClick={() => navigate("/course", { state: { course: b } })}
                >
                  <img
                    src={b.image || PLACEHOLDER_IMAGE}
                    alt={b.title}
                    onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }}
                  />
                  <div className="cd-bc-info">
                    <p className="cd-bc-title">{b.title}</p>
                    {b.expert && <p className="cd-bc-expert">Expert: {b.expert}</p>}
                    {b.rating != null && b.rating > 0 && (
                      <div className="cd-bc-rating">
                        {renderStars(b.rating)} <span>{b.rating}</span>
                      </div>
                    )}
                    {b.price && <p className="cd-bc-price">{b.price}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CourseDetails;