import React from 'react';
import './Support.css';

const Support = () => {
  return (
    <div className="support-page">
      <div className="support-container">
        <header className="support-header">
          <h1>Support</h1>
          <p className="support-sub">Need help using Aidemy? We're here to help — choose a topic or send us a message.</p>
        </header>

        <section className="support-grid">
          <div className="support-card">
            <h3>FAQ</h3>
            <ul>
              <li>How do I upload a PDF? — Go to Add Material and follow the steps.</li>
              <li>How does matching work? — AI analyzes your PDF and recommends teachers.</li>
              <li>How to contact a teacher? — Use the Message button on a teacher profile.</li>
            </ul>
          </div>

          <div className="support-card">
            <h3>Contact Us</h3>
            <p>If you need direct assistance, email us at <a href="mailto:support@aidemy.ai">support@aidemy.ai</a> or fill the form below.</p>
            <form className="support-form" onSubmit={(e) => { e.preventDefault(); alert('Message sent — mock.'); }}>
              <input placeholder="Your name" required />
              <input placeholder="Your email" type="email" required />
              <textarea placeholder="How can we help?" required />
              <button className="btn-primary" type="submit">Send message</button>
            </form>
          </div>

          <div className="support-card">
            <h3>Guides</h3>
            <p>Quick links to help you get started:</p>
            <ul>
              <li><a href="/terms">Terms &amp; policies</a></li>
              <li><a href="/">How matching works</a></li>
              <li><a href="/">Billing &amp; payments</a></li>
            </ul>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Support;