import React, { useState } from "react";
import "./offers.css";

const offersData = [
  { id: 1, name: "Bavly Adel", material: "Data Structures", description: "I want to understand memory allocation, linked lists, and tree traversal.", image: "https://i.pravatar.cc/150?img=12", pdf: "/pdfs/data-structures.pdf" },
  { id: 2, name: "Mohamed Walid", material: "Linux Fundamentals", description: "Need help with command line tools, permissions, and bash scripting.", image: "https://i.pravatar.cc/150?img=33", pdf: "/pdfs/linux.pdf" },
  { id: 3, name: "Mokter", material: "React Basics", description: "Need help understanding components, props, and hooks.", image: "https://i.pravatar.cc/150?img=68", pdf: "/pdfs/react.pdf" },
  { id: 4, name: "Omar Khaled", material: "Database", description: "Struggling with SQL joins and normalization.", image: "https://i.pravatar.cc/150?img=68", pdf: "/pdfs/database.pdf" },
];

function Offers() {
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [prices, setPrices] = useState({});

  const downloadPDF = (file) => {
    const link = document.createElement("a");
    link.href = file;
    link.download = "";
    link.click();
  };

  return (
    <div className="offers-page">
      <h1 className="offers-title">Offers</h1>
      <p className="offers-subtitle">Manage incoming learning requests and review student materials.</p>

      <div className="offers-list">
        {offersData.map((offer) => (
          <div key={offer.id} className="offer-card">

            {/* LEFT: avatar + content + buttons */}
            <div className="offer-left">
              <div className="avatar-circle">
                <img src={offer.image} alt={offer.name} />
              </div>
              <div className="offer-content">
                <h3>{offer.name}</h3>
                <p className="material">Material Requested: {offer.material}</p>
                <p className="description">{offer.description}</p>
                <div className="buttons">
                  <div className="price-input-wrapper">
                    <span className="dollar-sign">$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="price-input"
                      placeholder="Set price"
                      value={prices[offer.id] || ""}
                      onChange={(e) => setPrices({ ...prices, [offer.id]: e.target.value.replace(/[^0-9]/g, "") })}
                    />
                  </div>
                  <button className="accept-btn">Accept</button>
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
                <button className="pdf-btn" onClick={() => downloadPDF(offer.pdf)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  PDF MATERIAL
                </button>
              </div>

              <div className="vertical-line"></div>

              <div className="right-right-col">
                <div className="ai-wrapper" onClick={() => setSelectedOffer(offer)}>
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
        <div className="ai-modal" onClick={() => setSelectedOffer(null)}>
          <div className="ai-box" onClick={(e) => e.stopPropagation()}>
            <h3>AI Summary (Coming Soon)</h3>
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
            <button className="close-btn" onClick={() => setSelectedOffer(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Offers;