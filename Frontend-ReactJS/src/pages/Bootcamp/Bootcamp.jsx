import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import "./Bootcamp.css";
import { useNavigate } from "react-router-dom";
import { fetchBootcampLessons } from "./bootcampApi";
import {
  formatPrice,
  groupBootcamps,
  filterBootcamps,
  getTopicOptions,
  getLevelOptions,
  lessonsToBootcamps,
  bootcampToCourseState,
  PLACEHOLDER_IMAGE,
} from "./bootcampUtils";

function Bootcamp() {
  const navigate = useNavigate();
  const scrollRefs = useRef({});

  const [bootcamps, setBootcamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("all");
  const [level, setLevel] = useState("all");

  const loadCatalog = useCallback(() => {
    setLoading(true);
    setError(null);

    fetchBootcampLessons()
      .then((rows) => {
        console.info("Bootcamp lessons loaded:", rows.length);
        setBootcamps(lessonsToBootcamps(rows));
      })
      .catch((err) => {
        console.error("Bootcamp catalog:", err);
        setBootcamps([]);
        const msg = err.message || "";
        setError(
          msg.includes("JWT") || err.code === "PGRST301"
            ? "Sign in to view bootcamps."
            : msg.includes("policy") || err.code === "42501"
              ? "Database policy blocked read access."
              : `Could not load bootcamps: ${msg || "unknown error"}`
        );
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const topicOptions = useMemo(() => getTopicOptions(bootcamps), [bootcamps]);
  const levelOptions = useMemo(() => getLevelOptions(bootcamps), [bootcamps]);
  const showTopicFilter = topicOptions.length > 0;
  const showLevelFilter = levelOptions.length > 0;

  const filtered = useMemo(
    () => filterBootcamps(bootcamps, { search, topic, level }),
    [bootcamps, search, topic, level]
  );

  const categories = useMemo(() => groupBootcamps(filtered), [filtered]);

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        style={{ color: i < Math.round(rating) ? "#f5a623" : "#ccc", fontSize: "14px" }}
      >
        ★
      </span>
    ));

  const openCourse = (bootcamp) => {
    navigate("/course", { state: { course: bootcampToCourseState(bootcamp) } });
  };

  return (
    <div className="bootcamp-page">
      <div className="container">
        <input
          className="search"
          placeholder="Find someone who makes learning easy..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="filters">
          <button
            type="button"
            className="filter-btn"
            onClick={() => {
              setSearch("");
              setTopic("all");
              setLevel("all");
            }}
          >
            ⚙ Reset filters
          </button>

          {showTopicFilter && (
            <select
              className="dropdown"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            >
              <option value="all">All topics</option>
              {topicOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          )}

          {showLevelFilter && (
            <select
              className="dropdown"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <option value="all">All levels</option>
              {levelOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          )}
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
                            <p className="lesson-count">
                              {course.lessons.length} lesson
                              {course.lessons.length !== 1 ? "s" : ""}
                              {course.hasUnpublishedLessons && (
                                <span className="draft-badge"> · includes draft</span>
                              )}
                            </p>
                            {course.rating != null && course.rating > 0 && (
                              <div className="rating-row">
                                <span className="rating-num">{course.rating}</span>
                                {renderStars(course.rating)}
                                {course.reviews != null && (
                                  <span className="reviews">({course.reviews})</span>
                                )}
                              </div>
                            )}
                            {(priceLabel || course.badge) && (
                              <div className="price-row">
                                {priceLabel && <span className="price">{priceLabel}</span>}
                                {course.badge && (
                                  <span
                                    className={`badge ${
                                      course.badge === "New" ? "badge-new" : "badge-top"
                                    }`}
                                  >
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
                </div>
              </div>
            )
          )}
      </div>
    </div>
  );
}

export default Bootcamp;


