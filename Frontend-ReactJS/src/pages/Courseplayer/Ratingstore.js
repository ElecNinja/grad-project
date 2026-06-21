// src/store/ratingStore.js
// Global, page-agnostic rating prompt system.
// Any page can call openRatingPrompt(...) and the single <RatingModalHost />
// mounted once at the app root will pop up as a floating window.

let _listeners = [];
let _current = null; // the rating request currently shown (or null)

/**
 * Call this from ANY page to ask the user to rate a teacher.
 * @param {Object} payload
 * @param {string} payload.teacherId
 * @param {string} payload.teacherName
 * @param {string} [payload.contextTitle]   e.g. course/bootcamp title, shown in the modal
 * @param {Function} [payload.onSubmit]     async (rating, comment) => {}
 */
export const openRatingPrompt = (payload) => {
  _current = { id: `${Date.now()}_${Math.random()}`, ...payload };
  _listeners.forEach((fn) => fn(_current));
};

export const closeRatingPrompt = () => {
  _current = null;
  _listeners.forEach((fn) => fn(null));
};

export const subscribeRating = (handler) => {
  _listeners.push(handler);
  // immediately emit current state to new subscriber
  handler(_current);
  return () => {
    _listeners = _listeners.filter((fn) => fn !== handler);
  };
};