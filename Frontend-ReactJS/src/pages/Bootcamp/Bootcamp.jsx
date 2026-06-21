import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import "./Bootcamp.css";
import { useNavigate } from "react-router-dom";
import { fetchBootcampLessons } from "./bootcampApi";
import {
  formatPrice,
  groupBootcamps,
  filterBootcamps,
  lessonsToBootcamps,
  bootcampToCourseState,
  PLACEHOLDER_IMAGE,
  getLocalWorkBootcamps,
  mergeBootcampCatalogs,
} from "./bootcampUtils";
import { Search, ChevronRight, ChevronLeft } from "lucide-react";

function Bootcamp() {
  const navigate = useNavigate();
  const currentUserId = useSelector((state) => state.user?.id);
  const scrollRefs = useRef({});

  const [bootcamps, setBootcamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("all");
  const [level, setLevel] = useState("all");

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);

    const localBootcamps = getLocalWorkBootcamps(currentUserId);

    try {
      const rows = await fetchBootcampLessons();
      const remoteBootcamps = lessonsToBootcamps(rows);
      setBootcamps(mergeBootcampCatalogs(remoteBootcamps, localBootcamps));
    } catch (err) {
      console.error("Bootcamp catalog:", err);
      setBootcamps(localBootcamps);

      if (localBootcamps.length === 0) {
        const msg = err.message || "";
        setError(
          msg.includes("JWT") || err.code === "PGRST301"
            ? "Sign in to view bootcamps."
            : msg.includes("policy") || err.code === "42501"
              ? "Database policy blocked read access."
              : `Could not load bootcamps: ${msg || "unknown error"}`
        );
      }
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const filtered = useMemo(
    () => filterBootcamps(bootcamps, { search, topic, level }),
    [bootcamps, search, topic, level]
  );

  const categories = useMemo(() => groupBootcamps(filtered), [filtered]);

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        style={{ color: i < Math.round(rating) ? "#f5a623" : "#e0e0e0", fontSize: "14px" }}
      >
        ★
      </span>
    ));

  const openCourse = (bootcamp) => {
    navigate("/course", { state: { course: bootcampToCourseState(bootcamp) } });
  };

  const scrollRight = (categoryName) => {
    if (scrollRefs.current[categoryName]) {
      scrollRefs.current[categoryName].scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  const scrollLeft = (categoryName) => {
    if (scrollRefs.current[categoryName]) {
      scrollRefs.current[categoryName].scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  return (
    <div className="bootcamp-page">
      <div className="container">
        <div className="search-container">
          <input
            className="search-input"
            placeholder="Find someone who makes learning easy..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="search-button">
            <Search size={24} />
          </button>
        </div>

        {loading && <p className="bootcamp-status">Loading bootcamps…</p>}
        {!loading && error && (
          <p className="bootcamp-status bootcamp-status--error">{error}</p>
        )}
        {!loading && !error && bootcamps.length === 0 && (
          <p className="bootcamp-status">No bootcamp lessons found.</p>
        )}
        {!loading && !error && bootcamps.length > 0 && categories.every((c) => !c.courses.length) && (
          <p className="bootcamp-status">No bootcamps match your filters.</p>
        )}

        {!loading &&
          !error &&
          categories.map((category) =>
            category.courses.length === 0 ? null : (
              <div key={category.name} className="category-section">
                <h2>{category.name}</h2>
                <div className="courses-wrapper">
                  <div
                    className="courses"
                    ref={(el) => {
                      scrollRefs.current[category.name] = el;
                    }}
                  >
                    {category.courses.map((course) => {
                      const priceLabel = formatPrice(course.price, course.currency);
                      const hasCapacity = course.capacity != null && course.capacity > 0;
                      const studentsLabel = hasCapacity
                        ? `${course.enrolledCount ?? 0}/${course.capacity} students`
                        : null;
                      const badgeClass = course.badge === "New" ? "badge-new" : "badge-highest";

                      return (
                        <div
                          key={course.id}
                          className="course-card"
                          role="button"
                          tabIndex={0}
                          onClick={() => openCourse(course)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") openCourse(course);
                          }}
                        >
                          <div className="card-img-wrapper">
                            <img
                              src={course.image || PLACEHOLDER_IMAGE}
                              alt={course.title}
                              onError={(e) => {
                                e.currentTarget.src = PLACEHOLDER_IMAGE;
                              }}
                            />
                          </div>
                          <div className="card-body">
                            <h3>{course.title}</h3>
                            {course.expert && (
                              <p className="expert">Expert : {course.expert}</p>
                            )}

                            {course.rating != null && course.rating > 0 && (
                              <div className="rating-row">
                                <span className="rating-num">{course.rating}</span>
                                <span className="stars">{renderStars(course.rating)}</span>
                                {course.reviews != null && (
                                  <span className="reviews">({course.reviews})</span>
                                )}
                              </div>
                            )}
                            {studentsLabel && (
                              <p className="students-count">{studentsLabel}</p>
                            )}
                            {(priceLabel || course.badge) && (
                              <div className="price-row">
                                {priceLabel && <span className="price">{priceLabel}</span>}
                                {course.badge && (
                                  <span className={`badge ${badgeClass}`}>
                                    {course.badge}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    className="scroll-arrow left"
                    onClick={() => scrollLeft(category.name)}
                    aria-label="Scroll left"
                  >
                    <ChevronLeft size={24} color="#333" />
                  </button>
                  <button
                    className="scroll-arrow right"
                    onClick={() => scrollRight(category.name)}
                    aria-label="Scroll right"
                  >
                    <ChevronRight size={24} color="#333" />
                  </button>
                </div>
              </div>
            )
          )}
      </div>
    </div>
  );
}

export default Bootcamp;
