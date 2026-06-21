import React, { useState, useEffect } from "react";
import {
  getStudentRequests,
  summarizePdf,
  acceptRequest,
} from "../../apis/axios";

import "./offers.css";
const TypeMode = [
  { label: "All", value: "all" },
  { label: "Recorded", value: "recorded" },
  { label: "Live", value: "live_1on1" },
  { label: "Bootcamp", value: "bootcamp" },
];
function Offers() {
  const [offers, setOffers] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [summarizing, setSummarizing] = useState(false);
  const [acceptedOffers, setAcceptedOffers] = useState({});
  const [acceptError, setAcceptError] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [comments, setComments] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    getStudentRequests()
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
      const data = await summarizePdf(offer.fileUrl);
      setSummary(data);
    } catch {
      setSummary({ error: "Failed to summarize" });
    } finally {
      setSummarizing(false);
    }
  };

  const handleAccept = async (offer) => {
    const offerId = offer.id;
    const price = prices[offerId];

    if (!price) {
      setAcceptError("Please set a price first.");
      return;
    }

    try {
      await acceptRequest(offerId, price, offer.preferred_mode, comments[offerId] || "");

      setAcceptedOffers((prev) => ({
        ...prev,
        [offerId]: true,
      }));

      setTimeout(() => {
        setOffers((prev) => prev.filter((o) => o.id !== offerId));
      }, 800);

      setAcceptError("");
    } catch (err) {
      setAcceptError("Failed to accept offer.");
    }
  };

  const handleCloseModal = () => {
    setSelectedOffer(null);
    setSummary(null);
  };

  if (loading) {
    return (
      <div className="offers-page">
        <p>Loading...</p>
      </div>
    );
  }

  const filteredOffers = offers.filter((offer) => {
    const matchesType =
      selectedType === "all" ||
      offer.preferred_mode?.toLowerCase() === selectedType.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      offer.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="offers-page">
      <h1 className="offers-title">Offers</h1>

      <p className="offers-subtitle">
        Manage incoming learning requests and review student materials.
      </p>
      <div className="offers-filter">
        <div className="offers-search-box">
          <svg className="offers-search-icon" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            strokeLinejoin="round" width="16" height="16">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="offers-search-input"
            placeholder="Search material description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          {TypeMode.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {acceptError && (
        <p style={{ color: "red", textAlign: "center" }}>
          {acceptError}
        </p>
      )}

      <div className="offers-list">
        {filteredOffers.length === 0 && (
  <p className="no-offers">No offers found.</p>
)}

        {filteredOffers.map((offer) => (
          <div key={offer.id} className="offer-card">

            {/* LEFT */}
            <div className="offer-left">

              <div className="avatar-circle">
                <img
  src={offer.studentPhoto || "https://ui-avatars.com/api/?name=" + encodeURIComponent(offer.studentName || 'S') + "&background=random&color=fff&size=128"}
  alt="student"
/>
              </div>

              <div className="offer-content">

                <h3>{offer.studentName || "Student"}</h3>

                {/* DESCRIPTION */}
                <p className="material-text">
                  {offer.description || "No description provided"}
                </p>

                {/* TYPE */}
                <p className="type-text">
                  Type: {offer.preferred_mode || "Not specified"}
                </p>

                {/* BUTTONS */}
                <div className="buttons">

                  {/* PRICE */}
                  <div className="price-input-wrapper">
                    <span className="dollar-sign">$</span>

                    <input
                      type="text"
                      inputMode="numeric"
                      className="price-input"
                      placeholder="Set price"
                      value={prices[offer.id] || ""}
                      onChange={(e) =>
                        setPrices({
                          ...prices,
                          [offer.id]: e.target.value.replace(/[^0-9]/g, ""),
                        })
                      }
                    />
                  </div>

                  {/* ACCEPT */}
                  <button
                    className="accept-btn"
                    onClick={() => handleAccept(offer)}
                    disabled={acceptedOffers[offer.id]}
                    style={
                      acceptedOffers[offer.id]
                        ? { background: "green" }
                        : {}
                    }
                  >
                    {acceptedOffers[offer.id]
                      ? "Accepted ✓"
                      : "Accept"}
                  </button>
{/* COMMENT */}
<div className="comment-wrapper">
  <textarea
    className="comment-input"
    placeholder="Add a comment for the student..."
    value={comments[offer.id] || ""}
    onChange={(e) =>
      setComments({
        ...comments,
        [offer.id]: e.target.value,
      })
    }
    rows={2}
  />
</div>

                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="offer-right">

              {/* PDF BUTTON */}
              <div className="right-left-col">
                {offer.fileUrl ? (
                  <button
                    className="pdf-btn"
                    onClick={() => downloadPDF(offer.fileUrl)}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      width="15"
                      height="15"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>

                    PDF MATERIAL
                  </button>
                ) : (
                  <p className="no-file">
                    No file uploaded
                  </p>
                )}
              </div>

              <div className="vertical-line"></div>

              {/* AI BUTTON */}
              <div className="right-right-col">
                {offer.fileUrl && (
                  <div
                    className="ai-wrapper"
                    onClick={() => handleSummarize(offer)}
                  >
                    <div className="ai-icon-box">

                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        width="24"
                        height="24"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="9" y1="13" x2="15" y2="13" />
                        <line x1="9" y1="17" x2="13" y2="17" />
                      </svg>

                      <span className="ai-pdf-text">
                        PDF
                      </span>
                    </div>

                    <span className="ai-label">
                      AI SUMMARIZER
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {selectedOffer && (
        <div className="ai-modal" onClick={handleCloseModal}>

          <div
            className="ai-box"
            onClick={(e) => e.stopPropagation()}
          >
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
                <p>
                  <strong>Field:</strong> {summary.field}
                </p>

                <p>
                  <strong>Sub-field:</strong> {summary.sub_field}
                </p>

                <p>
                  <strong>Summary:</strong> {summary.summary}
                </p>

                {summary.error && (
                  <p style={{ color: "red" }}>
                    {summary.error}
                  </p>
                )}
              </>
            )}

            <button
              className="close-btn"
              onClick={handleCloseModal}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Offers;
