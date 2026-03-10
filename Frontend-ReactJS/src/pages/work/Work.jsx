import React, { useState } from 'react';
import './Work.css';
// import upload from '../../assets/images/upload.png'; // uncomment in your project

const USERS_VIDEOS = [
  { id: 1, name: "User Alpha",  course: "Courses: OS Development",       students: null, initials: "UA", color: "#3b3fd8" },
  { id: 2, name: "Jane Smith",  course: "Courses: UI Design Principles",  students: null, initials: "JS", color: "#f59e0b" },
  { id: 3, name: "Robert Chen", course: "Courses: Data Science 101",      students: null, initials: "RC", color: "#1a1d2e" },
];

const USERS_BOOTCAMP = [
  { id: 1, name: "Group A", course: "Courses: OS Development",       students: 15, initials: "A", color: "#3b3fd8" },
  { id: 2, name: "Group B", course: "Courses: UI Design Principles",  students: 10, initials: "B", color: "#f59e0b" },
  { id: 3, name: "Group C", course: "Courses: Data Science 101",      students: 30, initials: "C", color: "#1a1d2e" },
];

const VIDEOS = [
  { id: 1, title: "Intro to Operating Systems", type: "Online",   status: "published",  date: "Oct 24, 2023", emoji: "🖥️" },
  { id: 2, title: "Advanced Data Structures",   type: "Bootcamp", status: "processing", date: "Oct 21, 2023", emoji: "📊" },
];

const tabs = [
  { label: "Online Course", icon: "🎓" },
  { label: "Videos",        icon: "🎬" },
  { label: "Bootcamp",      icon: "💻" },
];

/* ─── Sub-forms per tab ─────────────────────────────────── */

function OnlineCourseForm() {
  const [title, setTitle]   = useState("");
  const [tags,  setTags]    = useState("");

  return (
    <div className="form-fields" style={{ marginTop: 16 }}>
      <div>
        <div className="field-label">Video Title</div>
        <input
          className="field-input"
          placeholder="Add a title that describes your video"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
  );
}

function VideosForm() {
  const [title, setTitle]   = useState("");
  const [info,  setInfo]    = useState("");
  const [tags,  setTags]    = useState("");

  return (
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
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <div className="field-label">Additional Information</div>
          <textarea
            className="field-textarea"
            placeholder="Video description or notes for students..."
            value={info}
            onChange={(e) => setInfo(e.target.value)}
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
  );
}

function BootcampForm() {
  const [title, setTitle] = useState("");
  const [info,  setInfo]  = useState("");
  const [tags,  setTags]  = useState("");

  return (
    <div className="upload-form-grid">
      {/* Drop zone */}
      <div className="upload-zone">
        <div className="upload-icon">📋</div>
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
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <div className="field-label">Additional Information</div>
          <textarea
            className="field-textarea"
            placeholder="Video description or notes for students..."
            value={info}
            onChange={(e) => setInfo(e.target.value)}
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
  );
}

/* ─── Publish button label per tab ─────────────────────── */
const publishLabel = {
  "Online Course": "Go live",
  "Videos":        "⬆️ Upload and Publish",
  "Bootcamp":      "⬆️ Upload and Publish",
};

/* ─── Main Component ────────────────────────────────────── */
export default function Work() {
  const [activeTab, setActiveTab] = useState("Videos");
  const [listOpen,  setListOpen]  = useState(true);

  return (
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
          {/* <img src={upload} alt="upload icon" className="upload-new-content-icon" /> */}
           Upload New Content
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

        {/* ── Dynamic form based on active tab ── */}
        {activeTab === "Online Course" && <OnlineCourseForm />}
        {activeTab === "Videos"        && <VideosForm />}
        {activeTab === "Bootcamp"      && <BootcampForm />}

      </div>

      {/* My Lists */}
      <div className="card">
        <div className="list-card-header">
          <span className="list-card-title">My Lists</span>
          <button className="chevron-btn" onClick={() => setListOpen(!listOpen)}>
            {listOpen ? "▲" : "▼"}
          </button>
        </div>

        {listOpen && (activeTab === "Bootcamp" ? USERS_BOOTCAMP : USERS_VIDEOS).map((u) => (
          <div className="list-item" key={u.id}>
            <div className="list-user">
              <div className="list-avatar" style={{ background: u.color }}>{u.initials}</div>
              <div>
                <div className="list-user-name">{u.name}</div>
                <div className="list-course">{u.course}</div>
                {u.students && (
                  <div className="list-students">Number Of Students: {u.students}</div>
                )}
              </div>
            </div>
            <span className="badge-pdf">PDF</span>
          </div>
        ))}

        <button className="btn-publish">
          {publishLabel[activeTab]}
        </button>
      </div>

      {/* Video Management — shown for Videos and Bootcamp tabs */}
      {(activeTab === "Videos" || activeTab === "Bootcamp") && (
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
                    <span className={`badge-status ${v.status === "published" ? "badge-published" : "badge-processing"}`}>
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
      )}

    </div>
  );
}