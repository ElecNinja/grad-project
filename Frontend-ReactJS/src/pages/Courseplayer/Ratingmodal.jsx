// src/pages/Courseplayer/Ratingmodal.js
import React, { useState, useEffect } from 'react';
import { subscribeRating, closeRatingPrompt } from './Ratingstore';

export default function RatingModalHost() {
  const [request, setRequest] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = subscribeRating((req) => {
      setRequest(req);
      setRating(0);
      setHoverRating(0);
      setComment('');
      setError('');
    });
    return unsub;
  }, []);

  if (!request) return null;

  const handleClose = () => closeRatingPrompt();

  const handleSubmit = async () => {
    if (rating === 0) { setError('Please select a star rating.'); return; }
    setError('');
    setSubmitting(true);
    try {
      await request.onSubmit?.(rating, comment);
      closeRatingPrompt();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: 16, padding: 28,
          width: '90%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Rate your teacher</h2>
            {request.teacherName && (
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
                {request.teacherName}
                {request.contextTitle ? ` · ${request.contextTitle}` : ''}
              </p>
            )}
          </div>
          <button onClick={handleClose}
            style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#94a3b8' }}>
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, margin: '20px 0' }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHoverRating(n)}
              onMouseLeave={() => setHoverRating(0)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24"
                fill={(hoverRating || rating) >= n ? '#f59e0b' : 'none'}
                stroke={(hoverRating || rating) >= n ? '#f59e0b' : '#cbd5e1'}
                strokeWidth="1.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
          ))}
        </div>

        <textarea
          placeholder="Leave a comment (optional)..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          style={{
            width: '100%', minHeight: 80, borderRadius: 10, border: '1.5px solid #e2e8f0',
            padding: 10, fontSize: 13, resize: 'vertical', boxSizing: 'border-box',
          }}
        />

        {error && (
          <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca',
            borderRadius: 8, padding: '8px 12px', fontSize: 13, marginTop: 10 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              flex: 1, padding: 10, borderRadius: 10, border: 'none',
              background: '#4f46e5', color: 'white', fontWeight: 600, fontSize: 14,
              cursor: 'pointer', opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Rating'}
          </button>
          <button
            onClick={handleClose}
            style={{
              padding: '10px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0',
              background: 'white', cursor: 'pointer', fontSize: 14,
            }}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}