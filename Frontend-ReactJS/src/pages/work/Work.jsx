import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getAcceptedOffers } from '../../apis/handlers/getAcceptedOffers';
import './Work.css';

/**
 * Work Page - Displays accepted offers/courses for the user
 * For students: shows courses they're enrolled in (teachers they've hired)
 * For teachers: shows courses they're teaching (students they've accepted offers from)
 */
export default function Work() {
  const [activeTab, setActiveTab] = useState("All");
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [listOpen, setListOpen] = useState(true);
  
  // Get user info from Redux to determine role
  const user = useSelector((state) => state.user);
  const userRole = user?.role || "student";
  const userName = user?.name || "User";

  useEffect(() => {
    fetchAcceptedOffers();
  }, [userRole]);

  const fetchAcceptedOffers = async () => {
    setLoading(true);
    setError("");
    
    const result = await getAcceptedOffers(userRole);
    
    if (result.response) {
      setOffers(result.data || []);
    } else {
      setError(result.message);
      setOffers([]);
    }
    
    setLoading(false);
  };

  // Group offers by type
  const groupedOffers = {
    all: offers,
    bootcamp: offers.filter(o => o.type === "bootcamp"),
    recorded: offers.filter(o => o.type === "recorded"),
    live_1on1: offers.filter(o => o.type === "live_1on1"),
  };

  const tabs = [
    { label: "All", icon: "📚" },
    { label: "Bootcamp", icon: "💻", count: groupedOffers.bootcamp.length },
    { label: "Recorded", icon: "🎥", count: groupedOffers.recorded.length },
    { label: "Live Sessions", icon: "👥", count: groupedOffers.live_1on1.length },
  ];

  const getDisplayOffers = () => {
    const tabKey = activeTab.toLowerCase().replace(" sessions", "_1on1");
    return groupedOffers[tabKey] || [];
  };

  const displayOffers = getDisplayOffers();

  // Get statistics
  const stats = {
    total: offers.length,
    bootcamp: groupedOffers.bootcamp.length,
    recorded: groupedOffers.recorded.length,
    sessions: groupedOffers.live_1on1.length,
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case "bootcamp": return "Bootcamp";
      case "recorded": return "Recorded Course";
      case "live_1on1": return "Live 1-on-1 Session";
      default: return type;
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case "bootcamp": return "💻";
      case "recorded": return "🎥";
      case "live_1on1": return "👥";
      default: return "📚";
    }
  };

  return (
    <div className="page-container">

      {/* Header */}
      <div className="page-header">
        <h1>Welcome back, {userName}</h1>
        <p>
          {userRole === "teacher" 
            ? "Manage your teaching materials and student progress."
            : "View your active courses and learning materials."}
        </p>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total</div>
          <div className="stat-value">{stats.total} Active</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Bootcamp</div>
          <div className="stat-value">{stats.bootcamp}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Recorded</div>
          <div className="stat-value">{stats.recorded}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Live Sessions</div>
          <div className="stat-value">{stats.sessions}</div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ 
          padding: "12px 16px", 
          backgroundColor: "#fee", 
          color: "#c33", 
          borderRadius: "8px",
          marginBottom: "16px"
        }}>
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "24px", marginBottom: "12px" }}>⏳</div>
          <p>Loading your courses...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && offers.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📚</div>
          <h2>No Active Courses</h2>
          <p style={{ color: "var(--text-light)" }}>
            {userRole === "teacher" 
              ? "You haven't accepted any offers yet. Browse student requests to get started."
              : "You haven't requested any courses yet. Visit 'Find Expert' to request help."}
          </p>
        </div>
      )}

      {/* Courses List */}
      {!loading && offers.length > 0 && (
        <>
          {/* Tabs */}
          <div className="card" style={{ marginBottom: "24px" }}>
            <div className="type-tabs" style={{ marginBottom: "8px" }}>
              {tabs.map((t) => (
                <button
                  key={t.label}
                  className={`type-tab ${activeTab === t.label ? "active" : ""}`}
                  onClick={() => setActiveTab(t.label)}
                  style={{ position: "relative" }}
                >
                  <span>{t.icon}</span>
                  {t.label}
                  {t.count !== undefined && t.count > 0 && (
                    <span style={{ 
                      marginLeft: "8px",
                      fontSize: "12px",
                      backgroundColor: "var(--primary)",
                      color: "white",
                      padding: "2px 8px",
                      borderRadius: "12px"
                    }}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Courses Grid/List */}
          <div className="card">
            <div className="list-card-header">
              <span className="list-card-title">
                {activeTab === "All" ? "All Courses" : activeTab}
              </span>
              <button className="chevron-btn" onClick={() => setListOpen(!listOpen)}>
                {listOpen ? "▲" : "▼"}
              </button>
            </div>

            {listOpen && displayOffers.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {displayOffers.map((offer, index) => (
                  <div key={offer.id || index} className="list-item" style={{ cursor: "pointer" }}>
                    <div className="list-user">
                      {/* Avatar */}
                      <div 
                        className="list-avatar"
                        style={{ 
                          background: offer.studentPhoto || offer.teacherPhoto 
                            ? `url(${offer.studentPhoto || offer.teacherPhoto}) center/cover`
                            : `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
                          backgroundSize: "cover",
                          overflow: "hidden"
                        }}
                      >
                        {!(offer.studentPhoto || offer.teacherPhoto) && (
                          <div style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center",
                            height: "100%",
                            color: "white",
                            fontSize: "18px"
                          }}>
                            {getTypeIcon(offer.type)}
                          </div>
                        )}
                      </div>

                      {/* Course Info */}
                      <div style={{ flex: 1 }}>
                        <div className="list-user-name">
                          {offer.title || "Untitled Course"}
                        </div>
                        <div className="list-course" style={{ fontSize: "12px", marginTop: "4px" }}>
                          <strong>Type:</strong> {getTypeLabel(offer.type)}
                        </div>
                        <div className="list-course" style={{ fontSize: "12px", marginTop: "2px" }}>
                          {userRole === "teacher" 
                            ? `👤 Student: ${offer.studentName}`
                            : `👨‍🏫 Teacher: ${offer.teacherName}`
                          }
                        </div>
                        {offer.description && (
                          <div style={{ fontSize: "12px", marginTop: "4px", color: "var(--text-light)", lineHeight: "1.4" }}>
                            {offer.description.substring(0, 100)}
                            {offer.description.length > 100 ? "..." : ""}
                          </div>
                        )}
                      </div>

                      {/* Price & Status */}
                      <div style={{ textAlign: "right", minWidth: "120px" }}>
                        <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--primary)" }}>
                          {offer.currency} {offer.pricePerHour}
                          <span style={{ fontSize: "12px", fontWeight: "400" }}>/hr</span>
                        </div>
                        <div style={{ 
                          fontSize: "11px", 
                          marginTop: "4px",
                          padding: "4px 8px",
                          backgroundColor: offer.bidStatus === "accepted" ? "#d4edda" : "#fff3cd",
                          color: offer.bidStatus === "accepted" ? "#155724" : "#856404",
                          borderRadius: "4px",
                          textTransform: "capitalize"
                        }}>
                          {offer.bidStatus || "pending"}
                        </div>
                        {offer.numSessions && (
                          <div style={{ fontSize: "11px", marginTop: "2px", color: "var(--text-light)" }}>
                            {offer.numSessions} session{offer.numSessions > 1 ? "s" : ""}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Badge */}
                    <span className="badge-pdf" style={{ alignSelf: "center" }}>
                      {getTypeIcon(offer.type)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {listOpen && displayOffers.length === 0 && (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--text-light)" }}>
                No {activeTab === "All" ? "courses" : activeTab.toLowerCase()} available
              </div>
            )}
          </div>
        </>
      )}

      {/* Refresh Button */}
      {!loading && offers.length > 0 && (
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <button
            onClick={fetchAcceptedOffers}
            style={{
              padding: "10px 24px",
              backgroundColor: "var(--primary)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600"
            }}
          >
            🔄 Refresh
          </button>
        </div>
      )}

    </div>
  );
}