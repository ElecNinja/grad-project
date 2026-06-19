import React, { useState, useEffect, useMemo } from "react";
import "./CourseDetails.css";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchBootcampLessons } from "../Bootcamp/bootcampApi";
import {
  lessonsToBootcamps,
  bootcampToCourseState,
  PLACEHOLDER_IMAGE,
  getLocalWorkBootcamps,
  mergeBootcampCatalogs,
} from "../Bootcamp/bootcampUtils";
import { enrollPublicBootcamp } from "../../apis/handlers/Publicbootcamphandlers";

function CourseDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialCourse = location.state?.course || null;

  const [openSections, setOpenSections] = useState({ 0: true });
  const [showMore, setShowMore] = useState(false);
  const [otherBootcamps, setOtherBootcamps] = useState([]);
  const [course, setCourse] = useState(initialCourse);

  const [enrolling, setEnrolling] = useState(false);
  const [enrolledCount, setEnrolledCount] = useState(initialCourse?.enrolledCount ?? 0);
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);

  useEffect(() => {
    setCourse(initialCourse);
    setEnrolledCount(initialCourse?.enrolledCount ?? 0);
    setOpenSections({ 0: true });
    setShowMore(false);
  }, [initialCourse]);

  useEffect(() => {
    let isMounted = true;

    const loadCatalog = async () => {
      const localBootcamps = getLocalWorkBootcamps();

      try {
        const rows = await fetchBootcampLessons();
        const catalog = mergeBootcampCatalogs(lessonsToBootcamps(rows), localBootcamps);
        if (!isMounted) return;

        const activeCourseId = initialCourse?.id;
        if (activeCourseId != null) {
          const matched = catalog.find((bootcamp) => String(bootcamp.id) === String(activeCourseId));
          if (matched) {
            const resolvedCourse = bootcampToCourseState(matched);
            setCourse((prev) => ({
              ...(prev || {}),
              ...resolvedCourse,
              image: resolvedCourse.image || prev?.image || PLACEHOLDER_IMAGE,
            }));
            setEnrolledCount(matched.enrolledCount ?? resolvedCourse.enrolledCount ?? 0);
          }
        }

        const others = catalog
          .filter((bootcamp) => String(bootcamp.id) !== String(activeCourseId))
          .map((bootcamp) => bootcampToCourseState(bootcamp));
        setOtherBootcamps(others);
      } catch (err) {
        console.error("Could not load related bootcamps:", err);
        if (!isMounted) return;

        const fallbackCatalog = getLocalWorkBootcamps();
        const activeCourseId = initialCourse?.id;
        if (activeCourseId != null) {
          const matched = fallbackCatalog.find((bootcamp) => String(bootcamp.id) === String(activeCourseId));
          if (matched) {
            const resolvedCourse = bootcampToCourseState(matched);
            setCourse((prev) => ({ ...(prev || {}), ...resolvedCourse }));
            setEnrolledCount(matched.enrolledCount ?? resolvedCourse.enrolledCount ?? 0);
          }
        }

        setOtherBootcamps(
          fallbackCatalog
            .filter((bootcamp) => String(bootcamp.id) !== String(activeCourseId))
            .map((bootcamp) => bootcampToCourseState(bootcamp))
        );
      }
    };

    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, [initialCourse?.id]);

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        style={{ color: i < Math.round(rating || 0) ? "#f5a623" : "#ccc", fontSize: "14px" }}
      >
        ★
      </span>
    ));

  const whatYouLearn = useMemo(() => {
    if (!course?.whatYouLearn) {
      return (course?.lessons || []).map((lesson) => lesson.title).filter(Boolean);
    }

    if (Array.isArray(course.whatYouLearn)) {
      return course.whatYouLearn.filter(Boolean);
    }

    return String(course.whatYouLearn)
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }, [course?.whatYouLearn, course?.lessons]);

  const sections = course?.sections || [];
  const visibleLearn = showMore ? whatYouLearn : whatYouLearn.slice(0, 8);

  const hasCapacity = course?.capacity != null && course.capacity > 0;
  const studentsLabel = hasCapacity
    ? `Students: (${enrolledCount}/${course.capacity})`
    : enrolledCount > 0
      ? `Students: ${enrolledCount}`
      : null;

  const atCapacity = hasCapacity && enrolledCount >= course.capacity;

  const toggleSection = (index) =>
    setOpenSections((prev) => ({ ...prev, [index]: !prev[index] }));

  const handleBuyNow = async () => {
    if (!course || enrolling || alreadyEnrolled || atCapacity) return;

    setEnrolling(true);
    try {
      const result = await enrollPublicBootcamp(course.id);
      if (!result.response) {
        throw new Error(result.message || "Could not enroll");
      }
      setEnrolledCount((prev) => prev + 1);
      setAlreadyEnrolled(true);
      navigate("/videos");
    } catch (err) {
      console.error("Enrollment failed:", err);
    } finally {
      setEnrolling(false);
    }
  };

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

  const buyBtnLabel = atCapacity
    ? "Full"
    : alreadyEnrolled
      ? "Enrolled ✓"
      : enrolling
        ? "Processing..."
        : "Buy Now";

  return (
    <div className="cd-page">
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
            onError={(e) => {
              e.currentTarget.src = PLACEHOLDER_IMAGE;
            }}
          />
        </div>
      </div>

      <div className="cd-body">
        <div className="cd-main">
          {whatYouLearn.length > 0 && (
            <div className="cd-box">
              <h2>What you'll learn</h2>
              <div className="cd-learn-grid">
                {visibleLearn.map((item, index) => (
                  <div key={index} className="cd-learn-item">✓ {item}</div>
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

      <div className="cd-full-width">
        {course.relatedTopics?.length > 0 && (
          <div className="cd-related">
            <h2>Explore related topics</h2>
            <div className="cd-topics-row">
              {course.relatedTopics.map((topic, index) => (
                <span key={index} className="cd-topic-tag">{topic}</span>
              ))}
            </div>
          </div>
        )}

        {sections.length > 0 && (
          <div className="cd-content-section">
            <h2>Course content</h2>
            <p className="cd-content-meta">
              {sections.length} section{sections.length !== 1 ? "s" : ""} • {" "}
              {course.totalLectures || 0} lecture{course.totalLectures !== 1 ? "s" : ""} • {" "}
              {course.totalDuration || "—"} total length
            </p>
            <div className="cd-accordion">
              {sections.map((section, index) => {
                const isOpen = !!openSections[index];
                return (
                  <div key={index} className="cd-acc-item">
                    <div className="cd-acc-header" onClick={() => toggleSection(index)}>
                      <span className="cd-acc-title">
                        <span className="cd-acc-arrow">{isOpen ? "▲" : "▼"}</span>
                        {section.title}
                      </span>
                      <span className="cd-sec-meta">
                        {section.lectures} lecture{section.lectures > 1 ? "s" : ""} • {section.duration}
                      </span>
                    </div>

                    {isOpen && section.items?.length > 0 && (
                      <div className="cd-acc-body">
                        {section.items.map((videoTitle, lessonIndex) => (
                          <div key={lessonIndex} className="cd-lecture-row">
                            <span className="cd-lecture-icon">▶</span>
                            <span className="cd-lecture-title">{videoTitle}</span>
                            <span className="cd-lecture-dur">{section.durations?.[lessonIndex] || "—"}</span>
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

        {course.requirements && (
          <div className="cd-requirements">
            <h2>Requirements</h2>
            <p><em>{course.requirements}</em></p>
          </div>
        )}

        {otherBootcamps.length > 0 && (
          <div className="cd-bootcamps">
            <h2>Bootcamps</h2>
            <div className="cd-bootcamps-row">
              {otherBootcamps.map((bootcamp) => (
                <div
                  key={bootcamp.id}
                  className="cd-bc-card"
                  onClick={() => navigate("/course", { state: { course: bootcamp } })}
                >
                  <img
                    src={bootcamp.image || PLACEHOLDER_IMAGE}
                    alt={bootcamp.title}
                    onError={(e) => {
                      e.currentTarget.src = PLACEHOLDER_IMAGE;
                    }}
                  />
                  <div className="cd-bc-info">
                    <p className="cd-bc-title">{bootcamp.title}</p>
                    {bootcamp.expert && <p className="cd-bc-expert">Expert: {bootcamp.expert}</p>}
                    {bootcamp.rating != null && bootcamp.rating > 0 && (
                      <div className="cd-bc-rating">
                        {renderStars(bootcamp.rating)} <span>{bootcamp.rating}</span>
                      </div>
                    )}
                    {bootcamp.price && <p className="cd-bc-price">{bootcamp.price}</p>}
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
