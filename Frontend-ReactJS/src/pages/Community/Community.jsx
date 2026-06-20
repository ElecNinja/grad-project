import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FileText,
  Database,
  BookOpen,
  FileArchive,
  File,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Upload,
  Users,
  AlertCircle,
  Loader2,
  SlidersHorizontal,
} from "lucide-react";
import { api } from "../../apis/axios";
import "./Community.css";

// ── helpers ──────────────────────────────────────────────────────────────────

const formatBytes = (bytes) => {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const TYPE_META = {
  note:    { label: "Note",    Icon: FileText,    color: "#3b82f6", bg: "#eff6ff" },
  pdf:     { label: "PDF",     Icon: FileArchive, color: "#ef4444", bg: "#fef2f2" },
  dataset: { label: "Dataset", Icon: Database,    color: "#8b5cf6", bg: "#f5f3ff" },
  summary: { label: "Summary", Icon: BookOpen,    color: "#10b981", bg: "#ecfdf5" },
  other:   { label: "Other",   Icon: File,        color: "#f59e0b", bg: "#fffbeb" },
};

const getTypeMeta = (type) => TYPE_META[type] || TYPE_META.other;

// ── sub-components ────────────────────────────────────────────────────────────

const ResourceCard = ({ resource, onDownload, downloading }) => {
  const { Icon, label, color, bg } = getTypeMeta(resource.resourceType);

  return (
    <div className="community-card">
      <div className="community-card-header">
        <div className="community-type-badge" style={{ background: bg }}>
          <Icon size={16} color={color} strokeWidth={2} />
          <span style={{ color }}>{label}</span>
        </div>
        {resource.subjectName && (
          <div className="community-subject-chip">{resource.subjectName}</div>
        )}
      </div>

      <h3 className="community-card-title">{resource.title}</h3>

      {resource.description && (
        <p className="community-card-desc">
          {resource.description.length > 120
            ? resource.description.slice(0, 120) + "…"
            : resource.description}
        </p>
      )}

      {resource.tags && resource.tags.length > 0 && (
        <div className="community-tags">
          {resource.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="community-tag">{tag}</span>
          ))}
        </div>
      )}

      <div className="community-card-meta">
        <div className="community-meta-row">
          <Users size={13} color="#9ca3af" />
          <span>{resource.uploaderName}</span>
        </div>
        <div className="community-meta-row">
          <FileText size={13} color="#9ca3af" />
          <span>{formatBytes(resource.fileSizeBytes)}</span>
        </div>
        <div className="community-meta-row community-meta-right">
          <Download size={13} color="#9ca3af" />
          <span>{resource.downloadCount} downloads</span>
        </div>
      </div>

      <div className="community-card-footer">
        <span className="community-card-date">{formatDate(resource.createdAt)}</span>
        <button
          className="community-download-btn"
          onClick={() => onDownload(resource.id, resource.title)}
          disabled={downloading === resource.id}
          aria-label={`Download ${resource.title}`}
        >
          {downloading === resource.id ? (
            <><Loader2 size={15} className="spin" /> Downloading…</>
          ) : (
            <><Download size={15} /> Download</>
          )}
        </button>
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="community-card community-card-skeleton">
    <div className="skeleton skeleton-badge" />
    <div className="skeleton skeleton-title" />
    <div className="skeleton skeleton-text" />
    <div className="skeleton skeleton-text short" />
    <div className="skeleton skeleton-btn" />
  </div>
);

// ── main page ─────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const navigate = useNavigate();
  const user = useSelector((s) => s.user);

  const [resources, setResources] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(null);

  // ── filters & pagination ──
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const LIMIT = 9;

  // Debounce search input 400 ms
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [subjectFilter, typeFilter]);

  // Load subjects once
  useEffect(() => {
    // Public endpoint — no auth needed
    api
      .get("/api/community/subjects")
      .then((r) => setSubjects(r.data.subjects || []))
      .catch(() => setSubjects([]));
  }, []);

  // Load resources whenever filters / page change
  const fetchResources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      params.set("limit", LIMIT);
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (subjectFilter) params.set("subjectId", subjectFilter);
      if (typeFilter) params.set("resourceType", typeFilter);

      const r = await api.get(`/api/community?${params}`);
      setResources(r.data.resources || []);
      setTotalPages(r.data.pages || 1);
      setTotalCount(r.data.total || 0);
    } catch (err) {
      console.error(err);
      setError("Failed to load resources. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, subjectFilter, typeFilter]);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  // ── download handler ──
  const handleDownload = async (id, title) => {
    setDownloading(id);
    try {
      const r = await api.get(`/api/community/${id}/download`);
      const fileUrl = r.data.fileUrl;
      // Trigger browser download via anchor
      const a = document.createElement("a");
      a.href = fileUrl;
      a.download = title || "resource";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Download failed:", err);
      alert("Download failed. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  // ── upload button behaviour ──
  const handleUploadClick = () => {
    if (user?.loggedIn) {
      navigate("/community/upload");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="community-page">
      {/* ── HERO ────────────────────────────────────────────────── */}
      <div className="community-hero">
        <div className="community-hero-inner">
          <div className="community-hero-badge">
            <BookOpen size={16} />
            <span>Free · Open · Community-Driven</span>
          </div>
          <h1 className="community-hero-title">Community Resources</h1>
          <p className="community-hero-sub">
            A public library of free educational materials — notes, PDFs,
            datasets, and summaries — shared by the StudyBuddy community.
            Browse and download anything without signing up. Have something to
            share? Upload it and help others learn.
          </p>
          <div className="community-hero-actions">
            <button
              className="community-upload-hero-btn"
              onClick={handleUploadClick}
              id="hero-upload-btn"
            >
              <Upload size={18} />
              {user?.loggedIn ? "Upload a Resource" : "Sign in to Upload"}
            </button>
            <div className="community-hero-stat">
              <span className="community-hero-stat-num">{totalCount}</span>
              <span>resources shared</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT AREA ───────────────────────────────────────── */}
      <div className="community-content">

        {/* ── SEARCH + FILTERS ────────────────────────────────── */}
        <div className="community-controls">
          <div className="community-search-wrap">
            <Search size={18} className="community-search-icon" />
            <input
              id="community-search"
              type="text"
              placeholder="Search resources by title or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="community-search-input"
            />
          </div>

          <div className="community-filters">
            <SlidersHorizontal size={16} color="#6b7280" />
            <select
              id="community-subject-filter"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="community-select"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <select
              id="community-type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="community-select"
            >
              <option value="">All Types</option>
              {Object.entries(TYPE_META).map(([val, { label }]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── RESULTS INFO ────────────────────────────────────── */}
        {!loading && !error && (
          <div className="community-results-info">
            {totalCount > 0
              ? `Showing ${resources.length} of ${totalCount} resource${totalCount !== 1 ? "s" : ""}`
              : ""}
          </div>
        )}

        {/* ── GRID ────────────────────────────────────────────── */}
        {error ? (
          <div className="community-error">
            <AlertCircle size={32} color="#ef4444" />
            <p>{error}</p>
            <button className="community-retry-btn" onClick={fetchResources}>Try Again</button>
          </div>
        ) : loading ? (
          <div className="community-grid">
            {Array.from({ length: LIMIT }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : resources.length === 0 ? (
          <div className="community-empty">
            <div className="community-empty-icon">
              <BookOpen size={48} color="#93c5fd" />
            </div>
            <h3>No resources found</h3>
            <p>
              {debouncedSearch || subjectFilter || typeFilter
                ? "Try adjusting your search or filters."
                : "Be the first to share a resource with the community!"}
            </p>
            <button className="community-upload-hero-btn" onClick={handleUploadClick}>
              <Upload size={16} />
              {user?.loggedIn ? "Upload First Resource" : "Sign in to Upload"}
            </button>
          </div>
        ) : (
          <>
            <div className="community-grid">
              {resources.map((r) => (
                <ResourceCard
                  key={r.id}
                  resource={r}
                  onDownload={handleDownload}
                  downloading={downloading}
                />
              ))}
            </div>

            {/* ── PAGINATION ─────────────────────────────────── */}
            {totalPages > 1 && (
              <div className="community-pagination">
                <button
                  className="community-page-btn"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={18} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i).map((p) => (
                  <button
                    key={p}
                    className={`community-page-num ${p === page ? "active" : ""}`}
                    onClick={() => setPage(p)}
                    aria-label={`Page ${p + 1}`}
                    aria-current={p === page ? "page" : undefined}
                  >
                    {p + 1}
                  </button>
                ))}
                <button
                  className="community-page-btn"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  aria-label="Next page"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
