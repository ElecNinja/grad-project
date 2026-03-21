import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getTeacherOffers, summarizePdf } from "../../apis/axios";
import "./offers.css";

function Offers() {
  const [offers, setOffers] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [summarizing, setSummarizing] = useState(false);

  const teacherId = useSelector((state) => state.user.profile?.teacher_id);

  useEffect(() => {
    getTeacherOffers("all")
      .then((data) => setOffers(data))
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  }, []);

  const downloadPDF = (url) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = "";
    link.click();
  };

  const handleSummarize = async (offer) => {
    setSelectedOffer(offer);
    setSummary(null);
    setSummarizing(true);
    try {
      const data = await summarizePdf(offer["pdf-url"]);
      setSummary(data);
    } catch {
      setSummary({ error: "Failed to summarize" });
    } finally {
      setSummarizing(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedOffer(null);
    setSummary(null);
  };

  if (loading) return <div className="offers-page"><p>Loading...</p></div>;

  return (
    <div className="offers-page">
      <h1 className="offers-title">Offers</h1>
      <p className="offers-subtitle">Manage incoming learning requests and review student materials.</p>

      <div className="offers-list">
        {offers.length === 0 && <p>No offers yet.</p>}
        {offers.map((offer) => (
          <div key={offer["id-pdf"]} className="offer-card">

            <div className="offer-left">
              <div className="avatar-circle">
                {/* TODO: add student photo later */}
                <img src="https://i.pravatar.cc/150?img=12" alt="student" />
              </div>
              <div className="offer-content">
                {/* TODO: join with profile-student to get name later */}
                <h3>Student</h3>
                <p className="material">Material Requested: {offer.specialties}</p>
                <p className="description"></p>
                <div className="buttons">
                  <div className="price-input-wrapper">
                    <span className="dollar-sign">$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="price-input"
                      placeholder="Set price"
                      value={prices[offer["id-pdf"]] || ""}
                      onChange={(e) => setPrices({ ...prices, [offer["id-pdf"]]: e.target.value.replace(/[^0-9]/g, "") })}
                    />
                  </div>
                  {/* TODO: wire accept button to acceptOffer API later */}
                  <button className="accept-btn">Accept</button>
                  {/* TODO: wire message button to chat system later */}
                  <button className="message-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    Send Message
                  </button>
                </div>
              </div>
            </div>

            <div className="offer-right">
              <div className="right-left-col">
                <button className="pdf-btn" onClick={() => downloadPDF(offer["pdf-url"])}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  PDF MATERIAL
                </button>
              </div>

              <div className="vertical-line"></div>

              <div className="right-right-col">
                <div className="ai-wrapper" onClick={() => handleSummarize(offer)}>
                  <div className="ai-icon-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="9" y1="13" x2="15" y2="13" />
                      <line x1="9" y1="17" x2="13" y2="17" />
                    </svg>
                    <span className="ai-pdf-text">PDF</span>
                  </div>
                  <span className="ai-label">AI SUMMARIZER</span>
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>

      {selectedOffer && (
        <div className="ai-modal" onClick={handleCloseModal}>
          <div className="ai-box" onClick={(e) => e.stopPropagation()}>
            <h3>AI Summary</h3>
            {summarizing && (
              <>
                <div className="skeleton-line"></div>
                <div className="skeleton-line"></div>
                <div className="skeleton-line"></div>
              </>
            )}
            {summary && !summarizing && (
              <>
                <p><strong>Field:</strong> {summary.field}</p>
                <p><strong>Sub-field:</strong> {summary.sub_field}</p>
                <p><strong>Summary:</strong> {summary.summary}</p>
                {summary.error && <p style={{ color: "red" }}>{summary.error}</p>}
              </>
            )}
            <button className="close-btn" onClick={handleCloseModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Offers;