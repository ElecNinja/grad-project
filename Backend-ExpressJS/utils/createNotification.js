// Backend-ExpressJS/utils/createNotification.js
// ─────────────────────────────────────────────────────────────────────────────
// Shared utility for inserting notification rows into Supabase.
// Rules:
//   • Never throws — any insert error is logged but swallowed so the caller
//     (bid acceptance, AI matching, etc.) is never broken by a failed notif.
//   • Every field is validated before the insert so we never store garbage rows.
// ─────────────────────────────────────────────────────────────────────────────

const supabase = require('../config/supabase');

/**
 * Insert a single notification row.
 *
 * @param {object} params
 * @param {string} params.recipientId  - profiles.id of the recipient
 * @param {string} params.type         - notification type key, e.g. 'new_bid'
 * @param {string} params.title        - short headline shown in the dropdown
 * @param {string} [params.body]       - longer description (optional)
 * @param {object} [params.data]       - arbitrary JSON payload, e.g. { bid_id, request_id }
 * @returns {Promise<object|null>}     - inserted row or null on failure
 */
async function createNotification({ recipientId, type, title, body = null, data = null }) {
  if (!recipientId || !type || !title) {
    console.warn('[createNotification] Missing required field (recipientId / type / title) — skipped');
    return null;
  }

  try {
    const { data: row, error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: recipientId,
        type,
        title,
        body: body ?? null,
        data: data ?? {},
        is_read: false,
        read_at: null,
      })
      .select()
      .single();

    if (error) {
      console.error('[createNotification] Insert error:', error.message);
      return null;
    }

    return row;
  } catch (err) {
    console.error('[createNotification] Unexpected error:', err.message);
    return null;
  }
}

/**
 * Insert one notification row per recipient (bulk).
 * Silently skips if recipientIds is empty.
 *
 * @param {string[]} recipientIds  - array of profiles.id values
 * @param {object}  shared         - { type, title, body?, data? } shared across all rows
 */
async function createNotificationsForMany(recipientIds, { type, title, body = null, data = null }) {
  const ids = (recipientIds || []).filter(Boolean);
  if (ids.length === 0) return;
  if (!type || !title) {
    console.warn('[createNotificationsForMany] Missing type/title — skipped');
    return;
  }

  const rows = ids.map((recipientId) => ({
    recipient_id: recipientId,
    type,
    title,
    body: body ?? null,
    data: data ?? {},
    is_read: false,
    read_at: null,
  }));

  try {
    const { error } = await supabase.from('notifications').insert(rows);
    if (error) {
      console.error('[createNotificationsForMany] Insert error:', error.message);
    }
  } catch (err) {
    console.error('[createNotificationsForMany] Unexpected error:', err.message);
  }
}

module.exports = { createNotification, createNotificationsForMany };
