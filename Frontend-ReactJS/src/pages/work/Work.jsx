import React, { useState} from 'react';
import {
  CloudUpload,
  Monitor,
  Play,
  BookOpen,
  ChevronDown,
  Upload,
  Pencil,
  Trash2,
} from 'lucide-react';
import './Work.css';
import upload from '../../assets/images/upload.png';
const USERS = [
  { id: 1, name: "User Alpha", course: "Courses: OS Development", initials: "UA", color: "#3b3fd8" },
  { id: 2, name: "Jane Smith", course: "Courses: UI Design Principles", initials: "JS", color: "#f59e0b" },
  { id: 3, name: "Robert Chen", course: "Courses: Data Science 101", initials: "RC", color: "#1a1d2e" },
];

const VIDEOS = [
  { id: 1, title: "Intro to Operating Systems", type: "Online", status: "published", date: "Oct 24, 2023", emoji: "🖥️" },
  { id: 2, title: "Advanced Data Structures", type: "Bootcamp", status: "processing", date: "Oct 21, 2023", emoji: "📊" },
];

export default function Work() {
  const [activeTab, setActiveTab] = useState("Videos");
  const [videoTitle, setVideoTitle] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [tags, setTags] = useState("");
  const [listOpen, setListOpen] = useState(true);

  const tabs = [
    { label: "Online Course", icon: "🎓" },
    { label: "Videos", icon: "🎬" },
    { label: "Bootcamp", icon: "💻" },
  ];

  return (
    <>
      {/* ── Page ── */}
      <div className="page-container">

        {/* Header */}
        <div className="page-header">
          <h1>Welcome back, Username</h1>
          <p>Manage your course content and student materials from your professional dashboard.</p>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Online</div>
            <div className="stat-value">12 Courses</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Bootcamp</div>
            <div className="stat-value">4 Programs</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Recent</div>
            <div className="stat-value">28 Videos</div>
          </div>
        </div>

        {/* Upload New Content */}
        <div className="card">
          <div className="card-title">
          <img src={upload} alt="upload icon" className="upload-new-content-icon" /> Upload New Content
          </div>

          <div className="content-type-label">Choose Content Type</div>
          <div className="type-tabs">
            {tabs.map((t) => (
              <button
                key={t.label}
                className={`type-tab ${activeTab === t.label ? "active" : ""}`}
                onClick={() => setActiveTab(t.label)}
              >
                <span>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          <div className="upload-form-grid">
            {/* Drop zone */}
            <div className="upload-zone">
              <div className="upload-icon">📹</div>
              <div className="upload-text">Drag and drop your video files here</div>
              <div className="upload-sub">MP4, MKV up to 2GB</div>
              <button className="btn-select">Select Files</button>
            </div>

            {/* Fields */}
            <div className="form-fields">
              <div>
                <div className="field-label">Video Title</div>
                <input
                  className="field-input"
                  placeholder="Add a title that describes your video"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                />
              </div>
              <div>
                <div className="field-label">Additional Information</div>
                <textarea
                  className="field-textarea"
                  placeholder="Video description or notes for students..."
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                />
              </div>
              <div>
                <div className="field-label">Tags</div>
                <input
                  className="field-input"
                  placeholder="e.g. tutorial, python, basic"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* My Lists */}
        <div className="card">
          <div className="list-card-header">
            <span className="list-card-title"> My Lists</span>
            <button className="chevron-btn" onClick={() => setListOpen(!listOpen)}>
              {listOpen ? "▲" : "▼"}
            </button>
          </div>

          {listOpen && (
            <>
              {USERS.map((u) => (
                <div className="list-item" key={u.id}>
                  <div className="list-user">
                    <div className="list-avatar" style={{ background: u.color }}>
                      {u.initials}
                    </div>
                    <div>
                      <div className="list-user-name">{u.name}</div>
                      <div className="list-course">{u.course}</div>
                    </div>
                  </div>
                  <span className="badge-pdf">PDF</span>
                </div>
              ))}
            </>
          )}

          <button className="btn-publish">
             Upload and Publish
          </button>
        </div>

        {/* Video Management */}
        <div className="card">
          <div className="vm-header">
            <span className="vm-title">Video Management</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "var(--text-light)", fontWeight: 600 }}>Filter:</span>
              <select className="filter-select">
                <option>All Categories</option>
                <option>Online</option>
                <option>Bootcamp</option>
              </select>
            </div>
          </div>

          <table className="vm-table">
            <thead>
              <tr>
                <th>Video Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {VIDEOS.map((v) => (
                <tr key={v.id}>
                  <td>
                    <div className="video-cell">
                      <div className="video-thumb">{v.emoji}</div>
                      <span className="video-name">{v.title}</span>
                    </div>
                  </td>
                  <td>{v.type}</td>
                  <td>
                    <span
                      className={`badge-status ${
                        v.status === "published" ? "badge-published" : "badge-processing"
                      }`}
                    >
                      {v.status === "published" ? "Published" : "Processing"}
                    </span>
                  </td>
                  <td>{v.date}</td>
                  <td>
                    <div className="actions-cell">
                      <button className="action-btn" title="Edit">✏️</button>
                      <button className="action-btn" title="Delete">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </>
  );
}