import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import "./CourseDetails.css";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchBootcampLessons } from "../Bootcamp/bootcampApi";
import {
  lessonsToBootcamps,
  bootcampToCourseState,
  getLocalWorkBootcamps,
  mergeBootcampCatalogs,
} from "../Bootcamp/bootcampUtils";
import { enrollPublicBootcamp } from "../../apis/handlers/Publicbootcamphandlers";
import { 
  PlayCircle, 
  Clock, 
  Award, 
  Star, 
  Share2, 
  ChevronDown, 
  ChevronUp, 
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users,
  X
} from "lucide-react";

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
  const [enrollError, setEnrollError] = useState(null);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    setCourse(initialCourse);
    setEnrolledCount(initialCourse?.enrolledCount ?? 0);
    setOpenSections({ 0: true });
    setShowMore(false);
    setEnrollError(null);
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
              image: resolvedCourse.image,
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
      <Star
        key={i}
        size={14}
        fill={i < Math.round(rating || 0) ? "#f5a623" : "none"}
        stroke={i < Math.round(rating || 0) ? "#f5a623" : "#cbd5e1"}
      />
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
  const hasLearnContent = whatYouLearn.length > 0;

  const hasCapacity = course?.capacity != null && course.capacity > 0;
  const studentsLabel = hasCapacity
    ? `(${enrolledCount}/${course.capacity} filled)`
    : enrolledCount > 0
      ? `${enrolledCount} students`
      : null;

  const atCapacity = hasCapacity && enrolledCount >= course.capacity;

  const toggleSection = (index) =>
    setOpenSections((prev) => ({ ...prev, [index]: !prev[index] }));

  // Bootcamps carousel: track whether we can scroll further left/right
  const bcRowRef = useRef(null);
  const [bcCanScrollLeft, setBcCanScrollLeft] = useState(false);
  const [bcCanScrollRight, setBcCanScrollRight] = useState(false);

  const updateBcScrollState = useCallback(() => {
    const el = bcRowRef.current;
    if (!el) return;
    setBcCanScrollLeft(el.scrollLeft > 4);
    setBcCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateBcScrollState();
    const el = bcRowRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateBcScrollState, { passive: true });
    window.addEventListener("resize", updateBcScrollState);
    return () => {
      el.removeEventListener("scroll", updateBcScrollState);
      window.removeEventListener("resize", updateBcScrollState);
    };
  }, [otherBootcamps, updateBcScrollState]);

  const scrollBootcamps = (direction) => {
    const el = bcRowRef.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.85) * direction;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  // Open payment modal on Buy Now click
  const handleBuyNow = () => {
    if (!course) {
      setEnrollError("Course data is missing. Please try again.");
      return;
    }
    if (enrolling || alreadyEnrolled || atCapacity) return;
    // Show payment modal
    setShowPaymentModal(true);
    setEnrollError(null);
    // Reset card fields (optional)
    setCardNumber("");
    setExpiryDate("");
    setCvv("");
    setCardName("");
  };

  // Handle payment form submission
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    const cardNumClean = cardNumber.replace(/\s/g, "");
    if (cardNumClean.length !== 16 || !/^\d{16}$/.test(cardNumClean)) {
      setEnrollError("Please enter a valid 16-digit card number.");
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
      setEnrollError("Please enter expiry date in MM/YY format.");
      return;
    }
    const [month, year] = expiryDate.split("/");
    if (parseInt(month) < 1 || parseInt(month) > 12) {
      setEnrollError("Invalid month.");
      return;
    }
    if (!/^\d{3,4}$/.test(cvv)) {
      setEnrollError("Please enter a valid CVV (3-4 digits).");
      return;
    }
    if (!cardName.trim()) {
      setEnrollError("Please enter the name on card.");
      return;
    }

    // Proceed with enrollment
    setProcessingPayment(true);
    setEnrollError(null);

    try {
      const courseId = course.id;
      if (!courseId) {
        throw new Error("Course ID is missing.");
      }

      console.log("Processing payment for course ID:", courseId);
      // Simulate payment processing delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Call enrollment API
      const result = await enrollPublicBootcamp(courseId);
      if (result && result.response) {
        setEnrolledCount((prev) => prev + 1);
        setAlreadyEnrolled(true);
        setShowPaymentModal(false);
        navigate("/videos");
      } else {
        throw new Error(result?.message || "Enrollment failed. Please try again.");
      }
    } catch (err) {
      console.error("Payment/enrollment error:", err);
      setEnrollError(err.message || "Payment failed. Please try again.");
    } finally {
      setProcessingPayment(false);
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
            background: "#3b82f6",
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

  const hasMainContent = hasLearnContent;

  return (
    <div className="cd-page">
      <div className="cd-body">
        <div className="cd-main">
          <div className="cd-header-details">
            <div className="cd-badge-row">
              <span className="cd-premium-badge"><Sparkles size={12} /> Premium Bootcamp</span>
            </div>
            <h1>{course.title}</h1>
            {course.subtitle && <p className="cd-subtitle">{course.subtitle}</p>}
            {course.rating != null && course.rating > 0 && (
              <div className="cd-rating-row">
                <span className="stars">{renderStars(course.rating)}</span>
                <span className="cd-rating-num">{course.rating}</span>
                {course.reviews != null && (
                  <span className="cd-reviews">({course.reviews.toLocaleString()} ratings)</span>
                )}
              </div>
            )}
            {course.expert && <p className="cd-expert">Expert: <span>{course.expert}</span></p>}
          </div>

          {hasMainContent && (
            <div className="cd-box">
              <h2>What you'll learn</h2>
              <div className="cd-learn-grid">
                {visibleLearn.map((item, index) => (
                  <div key={index} className="cd-learn-item">
                    <Check size={16} className="cd-check-icon" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              {whatYouLearn.length > 8 && (
                <button className="cd-show-more" onClick={() => setShowMore(!showMore)}>
                  {showMore ? "Show less ▲" : "Show more ▼"}
                </button>
              )}
            </div>
          )}

          {/* ====== MOVED: Explore related topics & Course content ====== */}
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
                {sections.length} section{sections.length !== 1 ? "s" : ""}
                {course.totalLectures > 0 && (
                  <> • {course.totalLectures} lecture{course.totalLectures !== 1 ? "s" : ""}</>
                )}
                {course.totalDuration && <> • {course.totalDuration} total length</>}
              </p>
              <div className="cd-accordion">
                {sections.map((section, index) => {
                  const isOpen = !!openSections[index];
                  return (
                    <div key={index} className="cd-acc-item">
                      <div className="cd-acc-header" onClick={() => toggleSection(index)}>
                        <span className="cd-acc-title">
                          <span className="cd-acc-arrow">
                            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </span>
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
                              <span className="cd-lecture-icon">
                                <PlayCircle size={14} color="#64748b" />
                              </span>
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
          {/* ====== END OF MOVED SECTIONS ====== */}

        </div>

        <div className="cd-sidebar">
          <div className="cd-sidebar-img">
            <img
              src={course.image}
              alt={course.title}
              onError={(e) => {
                e.currentTarget.src = PLACEHOLDER_IMAGE;
              }}
            />
          </div>
          {course.price && <p className="cd-price">{course.price}</p>}
          <button
            className="cd-buy-btn"
            onClick={handleBuyNow}
            disabled={enrolling || alreadyEnrolled || atCapacity}
          >
            {buyBtnLabel}
          </button>
          {enrollError && (
            <div className="cd-enroll-error" style={{ color: "#dc2626", fontSize: "0.9rem", marginTop: "8px" }}>
              ⚠️ {enrollError}
            </div>
          )}
          
          <div className="cd-includes">
            <p className="cd-includes-title">This bootcamp includes:</p>
            {course?.totalLectures > 0 && (
              <p className="cd-include-row">
                <PlayCircle size={16} className="cd-inc-icon" />
                <span>{course.totalLectures} video{course.totalLectures !== 1 ? "s" : ""}</span>
              </p>
            )}
            {course?.totalDuration && (
              <p className="cd-include-row">
                <Clock size={16} className="cd-inc-icon" />
                <span>{course.totalDuration} total length</span>
              </p>
            )}
            <p className="cd-include-row">
              <Award size={16} className="cd-inc-icon" />
              <span>Full lifetime access</span>
            </p>
          </div>

          {studentsLabel && (
            <div className="cd-students">
              <Users size={16} className="cd-stud-icon" />
              <span>{studentsLabel}</span>
            </div>
          )}
          
          <button className="cd-share-btn">
            <Share2 size={14} /> Share
          </button>
        </div>
      </div>

      <div className="cd-full-width">
        {course.requirements && (
          <div className="cd-requirements">
            <h2>Requirements</h2>
            <p><em>{course.requirements}</em></p>
          </div>
        )}

        {otherBootcamps.length > 0 && (
          <div className="cd-bootcamps">
            <h2>Other Bootcamps You Might Like</h2>
            <div className="cd-bc-carousel">
              <button
                type="button"
                className="cd-bc-nav cd-bc-nav-left"
                onClick={() => scrollBootcamps(-1)}
                disabled={!bcCanScrollLeft}
                aria-label="Scroll bootcamps left"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="cd-bootcamps-row" ref={bcRowRef}>
                {otherBootcamps.map((bootcamp) => (
                  <div
                    key={bootcamp.id}
                    className="cd-bc-card"
                    onClick={() => navigate("/course", { state: { course: bootcamp } })}
                  >
                    <div className="cd-bc-img-wrapper">
                      <img
                        src={bootcamp.image}
                        alt={bootcamp.title}
                        onError={(e) => {
                          e.currentTarget.src = PLACEHOLDER_IMAGE;
                        }}
                      />
                    </div>
                    <div className="cd-bc-info">
                      <p className="cd-bc-title">{bootcamp.title}</p>
                      {bootcamp.expert && <p className="cd-bc-expert">Expert: {bootcamp.expert}</p>}
                      {(() => {
                        const bHasCapacity = bootcamp.capacity != null && bootcamp.capacity > 0;
                        const bCount = bootcamp.enrolledCount ?? 0;
                        if (bHasCapacity) {
                          return <p className="cd-bc-students">{bCount}/{bootcamp.capacity} students</p>;
                        }
                        if (bCount > 0) {
                          return <p className="cd-bc-students">{bCount} students</p>;
                        }
                        return null;
                      })()}
                      <div className="cd-bc-footer-row">
                        {bootcamp.price && <p className="cd-bc-price">{bootcamp.price}</p>}
                        {bootcamp.rating != null && bootcamp.rating > 0 && (
                          <div className="cd-bc-rating">
                            <Star size={12} fill="#ea580c" stroke="#ea580c" />
                            <span>{bootcamp.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="cd-bc-nav cd-bc-nav-right"
                onClick={() => scrollBootcamps(1)}
                disabled={!bcCanScrollRight}
                aria-label="Scroll bootcamps right"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===== PAYMENT MODAL ===== */}
      {showPaymentModal && (
        <div className="cd-modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="cd-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="cd-modal-close"
              onClick={() => setShowPaymentModal(false)}
              disabled={processingPayment}
            >
              <X size={20} />
            </button>
            <h2>Complete Your Purchase</h2>
            <p className="cd-modal-course">{course.title}</p>
            <p className="cd-modal-price">{course.price}</p>

            <form onSubmit={handlePaymentSubmit} className="cd-payment-form">
              <div className="cd-form-group">
                <label>Card Number</label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => {
                    // Allow only digits and spaces, max 19 chars (16 digits + 3 spaces)
                    const val = e.target.value.replace(/[^\d\s]/g, "").slice(0, 19);
                    setCardNumber(val);
                  }}
                  required
                  disabled={processingPayment}
                />
              </div>
              <div className="cd-form-row">
                <div className="cd-form-group">
                  <label>Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^0-9/]/g, "");
                      if (val.length > 5) val = val.slice(0, 5);
                      // Auto-insert slash after 2 digits
                      if (val.length === 2 && !val.includes("/")) {
                        val += "/";
                      }
                      setExpiryDate(val);
                    }}
                    required
                    disabled={processingPayment}
                  />
                </div>
                <div className="cd-form-group">
                  <label>CVV</label>
                  <input
                    type="text"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setCvv(val);
                    }}
                    required
                    disabled={processingPayment}
                  />
                </div>
              </div>
              <div className="cd-form-group">
                <label>Name on Card</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  required
                  disabled={processingPayment}
                />
              </div>
              {enrollError && (
                <div className="cd-payment-error" style={{ color: "#dc2626", fontSize: "0.9rem" }}>
                  {enrollError}
                </div>
              )}
              <button
                type="submit"
                className="cd-pay-btn"
                disabled={processingPayment}
              >
                {processingPayment ? "Processing..." : `Pay ${course.price || "Now"}`}
              </button>
            </form>
            <p className="cd-modal-note">
              * This is a demo – no real charges will be made.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseDetails;