import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Upload,
  FileText,
  FileArchive,
  Database,
  BookOpen,
  File,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Tag,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { api } from "../../apis/axios";
import "./UploadResource.css";

const RESOURCE_TYPES = [
  { value: "pdf",     label: "PDF Document",    Icon: FileArchive, color: "#ef4444", bg: "#fef2f2" },
  { value: "note",    label: "Notes",           Icon: FileText,    color: "#3b82f6", bg: "#eff6ff" },
  { value: "dataset", label: "Dataset",         Icon: Database,    color: "#8b5cf6", bg: "#f5f3ff" },
  { value: "summary", label: "Summary",         Icon: BookOpen,    color: "#10b981", bg: "#ecfdf5" },
  { value: "other",   label: "Other",           Icon: File,        color: "#f59e0b", bg: "#fffbeb" },
];

const ACCEPTED_TYPES = ".pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.xls,.zip,.png,.jpg,.jpeg";
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

const formatBytes = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function UploadResource() {
  const navigate = useNavigate();
  const user = useSelector((s) => s.user);
  const fileInputRef = useRef(null);

  // ── form state ──
  const [file, setFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileError, setFileError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resourceType, setResourceType] = useState("pdf");
  const [subjectId, setSubjectId] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);

  // ── async state ──
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null); // { id, title }
  const [submitError, setSubmitError] = useState("");

  // Load subjects (public endpoint)
  useEffect(() => {
    api
      .get("/api/community/subjects")
      .then((r) => setSubjects(r.data.subjects || []))
      .catch(() => setSubjects([]));
  }, []);

  // ── file handling ──
  const validateFile = (f) => {
    if (!f) return "Please select a file.";
    if (f.size > MAX_SIZE_BYTES) return `File too large. Maximum size is 50 MB (yours: ${formatBytes(f.size)}).`;
    return null;
  };

  const applyFile = (f) => {
    const err = validateFile(f);
    if (err) {
      setFileError(err);
      setFile(null);
      return;
    }
    setFileError("");
    setFile(f);
    // Auto-fill title from filename if blank
    if (!title) {
      const noExt = f.name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ");
      setTitle(noExt.slice(0, 100));
    }
  };

  const handleFileInputChange = (e) => {
    const f = e.target.files?.[0];
    if (f) applyFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) applyFile(f);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);

  const removeFile = () => {
    setFile(null);
    setFileError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── tag handling ──
  const addTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, "");
    if (!trimmed || tags.includes(trimmed) || tags.length >= 8) return;
    setTags((prev) => [...prev, trimmed]);
    setTagInput("");
  };

  const removeTag = (tag) => setTags((prev) => prev.filter((t) => t !== tag));

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  // ── submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!file) { setFileError("Please upload a file."); return; }
    if (!title.trim()) { setSubmitError("Title is required."); return; }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("resourceType", resourceType);
      if (subjectId) formData.append("subjectId", subjectId);
      formData.append("tags", tags.join(","));

      const r = await api.post("/api/community/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess({ id: r.data.resource.id, title: r.data.resource.title });
    } catch (err) {
      console.error(err);
      setSubmitError(
        err?.response?.data?.error || "Upload failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ── success screen ──
  if (success) {
    return (
      <div className="upload-page">
        <div className="upload-success-screen">
          <div className="upload-success-icon">
            <CheckCircle size={52} color="#10b981" strokeWidth={1.5} />
          </div>
          <h2 className="upload-success-title">Resource Uploaded!</h2>
          <p className="upload-success-sub">
            <strong>{success.title}</strong> is now live in the Community
            Resources library and available to everyone.
          </p>
          <div className="upload-success-actions">
            <Link to="/community" className="upload-success-browse-btn">
              <BookOpen size={17} />
              Browse All Resources
            </Link>
            <button
              className="upload-success-again-btn"
              onClick={() => {
                setSuccess(null);
                setFile(null);
                setTitle("");
                setDescription("");
                setTags([]);
                setTagInput("");
                setSubjectId("");
                setResourceType("pdf");
              }}
            >
              <Upload size={17} />
              Upload Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="upload-page">
      <div className="upload-inner">

        {/* ── BACK LINK ────────────────────────────────────────── */}
        <Link to="/community" className="upload-back-link">
          <ArrowLeft size={16} />
          Back to Community Resources
        </Link>

        {/* ── PAGE HEADER ──────────────────────────────────────── */}
        <div className="upload-page-header">
          <div className="upload-page-icon">
            <Upload size={28} color="#2563eb" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="upload-page-title">Share a Resource</h1>
            <p className="upload-page-sub">
              Upload free educational materials — your contribution helps the
              entire StudyBuddy community.
            </p>
          </div>
        </div>

        <form className="upload-form" onSubmit={handleSubmit} noValidate>

          {/* ── FILE DROP ZONE ───────────────────────────────────── */}
          <div className="upload-form-section">
            <label className="upload-label">
              File <span className="upload-required">*</span>
            </label>

            {!file ? (
              <div
                className={`upload-dropzone ${isDragOver ? "dragover" : ""}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Click or drag to upload a file"
                onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES}
                  onChange={handleFileInputChange}
                  hidden
                />
                <div className="upload-dropzone-icon">
                  <Upload size={32} color={isDragOver ? "#2563eb" : "#93c5fd"} />
                </div>
                <p className="upload-dropzone-primary">
                  {isDragOver ? "Drop it here!" : "Drag & drop your file here"}
                </p>
                <p className="upload-dropzone-secondary">
                  or <span className="upload-dropzone-link">click to browse</span>
                </p>
                <p className="upload-dropzone-hint">
                  PDF, DOC, DOCX, TXT, MD, CSV, XLSX, ZIP, PNG, JPG — max 50 MB
                </p>
              </div>
            ) : (
              <div className="upload-file-preview">
                <FileText size={20} color="#2563eb" />
                <div className="upload-file-info">
                  <span className="upload-file-name">{file.name}</span>
                  <span className="upload-file-size">{formatBytes(file.size)}</span>
                </div>
                <button
                  type="button"
                  className="upload-file-remove"
                  onClick={removeFile}
                  aria-label="Remove file"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {fileError && (
              <div className="upload-field-error">
                <AlertCircle size={14} />
                {fileError}
              </div>
            )}
          </div>

          {/* ── TITLE ────────────────────────────────────────────── */}
          <div className="upload-form-section">
            <label htmlFor="upload-title" className="upload-label">
              Title <span className="upload-required">*</span>
            </label>
            <input
              id="upload-title"
              type="text"
              className="upload-input"
              placeholder="e.g. Linear Algebra Cheat Sheet"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={150}
            />
            <span className="upload-char-count">{title.length}/150</span>
          </div>

          {/* ── DESCRIPTION ──────────────────────────────────────── */}
          <div className="upload-form-section">
            <label htmlFor="upload-desc" className="upload-label">
              Description <span className="upload-optional">(optional)</span>
            </label>
            <textarea
              id="upload-desc"
              className="upload-textarea"
              placeholder="Briefly describe what this resource covers and who it's for…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={800}
            />
            <span className="upload-char-count">{description.length}/800</span>
          </div>

          {/* ── RESOURCE TYPE ─────────────────────────────────────── */}
          <div className="upload-form-section">
            <label className="upload-label">Resource Type</label>
            <div className="upload-type-grid">
              {RESOURCE_TYPES.map(({ value, label, Icon, color, bg }) => (
                <label
                  key={value}
                  className={`upload-type-card ${resourceType === value ? "selected" : ""}`}
                  style={resourceType === value ? { borderColor: color, background: bg } : {}}
                >
                  <input
                    type="radio"
                    name="resourceType"
                    value={value}
                    checked={resourceType === value}
                    onChange={() => setResourceType(value)}
                    hidden
                  />
                  <Icon size={20} color={resourceType === value ? color : "#9ca3af"} strokeWidth={2} />
                  <span style={resourceType === value ? { color } : {}}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ── SUBJECT ───────────────────────────────────────────── */}
          <div className="upload-form-section">
            <label htmlFor="upload-subject" className="upload-label">
              Subject <span className="upload-optional">(optional)</span>
            </label>
            <select
              id="upload-subject"
              className="upload-select"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              <option value="">— No subject selected —</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* ── TAGS ──────────────────────────────────────────────── */}
          <div className="upload-form-section">
            <label className="upload-label">
              Tags <span className="upload-optional">(up to 8)</span>
            </label>
            <div className="upload-tags-input-row">
              <div className="upload-tags-input-wrap">
                <Tag size={15} color="#9ca3af" className="upload-tag-icon" />
                <input
                  type="text"
                  className="upload-tag-input"
                  placeholder="Type a tag and press Enter or comma…"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  disabled={tags.length >= 8}
                />
              </div>
              <button
                type="button"
                className="upload-add-tag-btn"
                onClick={addTag}
                disabled={!tagInput.trim() || tags.length >= 8}
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="upload-tag-list">
                {tags.map((tag) => (
                  <div key={tag} className="upload-tag-chip">
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── SUBMIT ERROR ──────────────────────────────────────── */}
          {submitError && (
            <div className="upload-submit-error">
              <AlertCircle size={16} />
              {submitError}
            </div>
          )}

          {/* ── ACTIONS ───────────────────────────────────────────── */}
          <div className="upload-form-actions">
            <button
              type="button"
              className="upload-cancel-btn"
              onClick={() => navigate("/community")}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="upload-submit-btn"
              disabled={loading}
              id="upload-submit-btn"
            >
              {loading ? (
                <><Loader2 size={18} className="spin" /> Uploading…</>
              ) : (
                <><Upload size={18} /> Publish Resource</>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
