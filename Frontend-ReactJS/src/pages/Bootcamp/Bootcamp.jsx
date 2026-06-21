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
import { Search, ChevronRight, ChevronLeft, SlidersHorizontal, ChevronDown, X } from "lucide-react";

// ─── Sort options ───────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: "newest",     label: "Newest" },
  { value: "price_asc",  label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating",     label: "Highest Rated" },
  { value: "popular",    label: "Most Popular" },
];

function applySorting(bootcamps, sortKey) {
  const arr = [...bootcamps];
  switch (sortKey) {
    case "price_asc":
      return arr.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    case "price_desc":
      return arr.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
    case "rating":
      return arr.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case "popular":
      return arr.sort((a, b) => (b.enrolledCount ?? 0) - (a.enrolledCount ?? 0));
    case "newest":
    default:
      return arr.sort((a, b) => {
        const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bt - at;
      });
  }
}

// ─── Component ──────────────────────────────────────────────────
function Bootcamp() {
  const navigate       = useNavigate();
  const currentUserId  = useSelector((state) => state.user?.id);
  const scrollRefs     = useRef({});
  const sortDropRef    = useRef(null);
  const topicDropRef   = useRef(null);

  // Data
  const [bootcamps,      setBootcamps]      = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);

  // Filters
  const [search,         setSearch]         = useState("");
  const [topic,          setTopic]          = useState("all");
  const [sort,           setSort]           = useState("newest");

  // Dropdown open flags
  const [sortOpen,       setSortOpen]       = useState(false);
  const [topicOpen,      setTopicOpen]      = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (sortDropRef.current && !sortDropRef.current.contains(e.target)) setSortOpen(false);
      if (topicDropRef.current && !topicDropRef.current.contains(e.target)) setTopicOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Data loading ──────────────────────────────────────────────
  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    const localBootcamps = getLocalWorkBootcamps(currentUserId);

    try {
      const { api } = await import("../../apis/axios");
      const catRes = await api.get("/api/bootcamps/categories");
      if (catRes.status === 200) setCategoriesList(catRes.data.categories || []);

      const rows            = await fetchBootcampLessons();
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

  useEffect(() => { loadCatalog(); }, [loadCatalog]);

  // ── Derived state ─────────────────────────────────────────────
  // True if the user has typed a search (switches to flat grid)
  const isFiltering = search.trim() !== "";

  // Filtered list — level filter omitted (no `level` column in DB schema yet)
  const filtered = useMemo(
    () => filterBootcamps(bootcamps, { search, topic }),
    [bootcamps, search, topic]
  );

  // Sorted flat list (used in the flat-grid view when searching)
  const sortedFiltered = useMemo(
    () => applySorting(filtered, sort),
    [filtered, sort]
  );

  // Sorted + grouped (used in the grouped-sections view when not searching)
  const categories = useMemo(
    () => groupBootcamps(applySorting(filtered, sort), categoriesList),
    [filtered, sort, categoriesList]
  );

  // Readable labels for active filter buttons
  const currentTopicLabel =
    topic === "all"
      ? "Topic"
      : (categoriesList.find((c) => c.value === topic)?.label ?? topic);

  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Filter & Sort";

  const clearFilters = () => {
    setSearch("");
    setTopic("all");
    setSort("newest");
  };

  // ── Helpers ───────────────────────────────────────────────────
  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < Math.round(rating) ? "#f5a623" : "#e0e0e0", fontSize: "14px" }}>
        ★
      </span>
    ));

  const openCourse = (bootcamp) =>
    navigate("/course", { state: { course: bootcampToCourseState(bootcamp) } });

  const scrollRight = (categoryName) => {
    if (scrollRefs.current[categoryName])
      scrollRefs.current[categoryName].scrollBy({ left: 300, behavior: "smooth" });
  };
  const scrollLeft = (categoryName) => {
    if (scrollRefs.current[categoryName])
      scrollRefs.current[categoryName].scrollBy({ left: -300, behavior: "smooth" });
  };

  // ── Card renderer (shared between both views) ─────────────────
  const renderCard = (course) => {
    const priceLabel    = formatPrice(course.price, course.currency);
    const hasCapacity   = course.capacity != null && course.capacity > 0;
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
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openCourse(course); }}
      >
        <div className="card-img-wrapper">
          <img
            src={course.image || PLACEHOLDER_IMAGE}
            alt={course.title}
            onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }}
          />
        </div>
        <div className="card-body">
          <h3>{course.title}</h3>
          {course.expert && <p className="expert">Expert : {course.expert}</p>}
          {course.rating != null && course.rating > 0 && (
            <div className="rating-row">
              <span className="rating-num">{course.rating}</span>
              <span className="stars">{renderStars(course.rating)}</span>
              {course.reviews != null && <span className="reviews">({course.reviews})</span>}
            </div>
          )}
          {studentsLabel && <p className="students-count">{studentsLabel}</p>}
          {(priceLabel || course.badge) && (
            <div className="price-row">
              {priceLabel && <span className="price">{priceLabel}</span>}
              {course.badge && <span className={`badge ${badgeClass}`}>{course.badge}</span>}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="bootcamp-page">
      <div className="container">

        {/* ── Search bar ─────────────────────────────────────── */}
        <div className="search-container">
          <input
            className="search-input"
            placeholder="Find someone who makes learning easy..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="search-clear-btn"
              onClick={() => setSearch("")}
              title="Clear search"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
          <button className="search-button" aria-label="Search">
            <Search size={24} />
          </button>
        </div>

        {/* ── Filter bar ─────────────────────────────────────── */}
        <div className="filters">

          {/* Filter & Sort dropdown */}
          <div className="dropdown-wrap" ref={sortDropRef}>
            <button
              className={`filter-btn${sort !== "newest" ? " filter-btn--active" : ""}`}
              onClick={() => { setSortOpen((v) => !v); setTopicOpen(false); }}
            >
              <SlidersHorizontal size={15} />
              {currentSortLabel}
              <ChevronDown size={13} style={{ marginLeft: 2, opacity: 0.6 }} />
            </button>
            {sortOpen && (
              <div className="dropdown-panel">
                {SORT_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    className={`dropdown-option${sort === o.value ? " dropdown-option--active" : ""}`}
                    onClick={() => { setSort(o.value); setSortOpen(false); }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Topic / Category dropdown */}
          <div className="dropdown-wrap" ref={topicDropRef}>
            <button
              className={`dropdown${topic !== "all" ? " filter-btn--active" : ""}`}
              onClick={() => { setTopicOpen((v) => !v); setSortOpen(false); }}
            >
              {currentTopicLabel}
              <ChevronDown size={13} style={{ marginLeft: 2, opacity: 0.6 }} />
            </button>
            {topicOpen && (
              <div className="dropdown-panel">
                <button
                  className={`dropdown-option${topic === "all" ? " dropdown-option--active" : ""}`}
                  onClick={() => { setTopic("all"); setTopicOpen(false); }}
                >
                  All Topics
                </button>
                {categoriesList.map((c) => (
                  <button
                    key={c.value}
                    className={`dropdown-option${topic === c.value ? " dropdown-option--active" : ""}`}
                    onClick={() => { setTopic(c.value); setTopicOpen(false); }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}
          </div>



          {/* Clear all active filters */}
          {(isFiltering || sort !== "newest") && (
            <button className="filter-btn filter-btn--clear" onClick={clearFilters}>
              <X size={13} />
              Clear
            </button>
          )}
        </div>

        {/* ── Status messages ────────────────────────────────── */}
        {loading && <p className="bootcamp-status">Loading bootcamps…</p>}
        {!loading && error && <p className="bootcamp-status bootcamp-status--error">{error}</p>}

        {/* ── FLAT GRID — active when search/filter is on ─────── */}
        {!loading && !error && isFiltering && (
          sortedFiltered.length === 0 ? (
            <div className="bootcamp-empty-state">
              <p className="bootcamp-empty-state__msg">No bootcamps match your search.</p>
              <button className="bootcamp-empty-state__btn" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <p className="bootcamp-results-count">
                {sortedFiltered.length} bootcamp{sortedFiltered.length !== 1 ? "s" : ""} found
              </p>
              <div className="bootcamp-flat-grid">
                {sortedFiltered.map((course) => renderCard(course))}
              </div>
            </>
          )
        )}

        {/* ── GROUPED SECTIONS — shown when no filter active ─── */}
        {!loading && !error && !isFiltering && (
          bootcamps.length === 0
            ? <p className="bootcamp-status">No bootcamp lessons found.</p>
            : categories.map((category) =>
                category.courses.length === 0 ? null : (
                  <div key={category.name} className="category-section">
                    <h2>{category.name}</h2>
                    <div className="courses-wrapper">
                      <div
                        className="courses"
                        ref={(el) => { scrollRefs.current[category.name] = el; }}
                      >
                        {category.courses.map((course) => renderCard(course))}
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
              )
        )}

      </div>
    </div>
  );
}

export default Bootcamp;
