import { supabase } from "../../config/supabaseClient";

/**
 * Fetch all notifications for the specified recipient, sorted by created_at descending.
 * @param {string} recipientId - The user UUID.
 * @returns {Promise<Array>} List of notifications.
 */
export async function fetchNotifications(recipientId) {
  if (!recipientId) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", recipientId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch the exact count of unread notifications for a recipient.
 * @param {string} recipientId - The user UUID.
 * @returns {Promise<number>} Unread notification count.
 */
export async function fetchUnreadCount(recipientId) {
  if (!recipientId) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("recipient_id", recipientId)
    .eq("is_read", false);

  if (error) {
    console.error("Error fetching unread notification count:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Mark a single notification as read by setting is_read to true and read_at to now.
 * @param {string} notificationId - The notification UUID.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
export async function markNotificationRead(notificationId) {
  
  if (!notificationId) return false;

  const { data, error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId)
    .select();

  if (error) {
    console.error(`Error marking notification ${notificationId} as read:`, error);
    return false;
  }

  return data && data.length > 0;
}

/**
 * Mark all unread notifications for a recipient as read.
 * @param {string} recipientId - The recipient user UUID.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
export async function markAllNotificationsRead(recipientId) {
  if (!recipientId) return false;

  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("recipient_id", recipientId)
    .eq("is_read", false);

  if (error) {
    console.error(`Error marking all notifications as read for ${recipientId}:`, error);
    return false;
  }

  return true;
}

/**
 * Subscribe to realtime INSERT events on the notifications table for the current recipient.
 * @param {string} recipientId - The recipient user UUID.
 * @param {Function} onInsert - Callback when a new notification is inserted.
 * @returns {Function} Unsubscribe clean up function.
 */
export function subscribeToNotifications(recipientId, onInsert) {
  if (!recipientId) return () => {};

  const channel = supabase
    .channel(`public:notifications:recipient_id=eq.${recipientId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `recipient_id=eq.${recipientId}`,
      },
      (payload) => {
        if (payload.new) {
          onInsert(payload.new);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
