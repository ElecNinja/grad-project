import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const NOTIFICATION_COLUMNS = `
  id,
  recipient_id,
  type,
  title,
  body,
  data,
  is_read,
  read_at,
  created_at
`;

function getAccessToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("supabase_access_token");
}

function getAuthedClient() {
  const token = getAccessToken();
  if (!token || !supabaseUrl || !supabaseKey) return null;

  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

export async function fetchNotifications(recipientId, { limit = 20 } = {}) {
  const client = getAuthedClient();
  if (!client || !recipientId) return [];

  const { data, error } = await client
    .from("notifications")
    .select(NOTIFICATION_COLUMNS)
    .eq("recipient_id", recipientId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("Failed to load notifications", error);
    return [];
  }

  return data || [];
}

export async function fetchUnreadCount(recipientId) {
  const client = getAuthedClient();
  if (!client || !recipientId) return 0;

  const { count, error } = await client
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", recipientId)
    .eq("is_read", false);

  if (error) {
    console.warn("Failed to load unread count", error);
    return 0;
  }

  return count || 0;
}

export async function markNotificationRead(notificationId) {
  const client = getAuthedClient();
  if (!client || !notificationId) return false;

  const { error } = await client
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId);

  if (error) {
    console.warn("Failed to mark notification read", error);
    return false;
  }

  return true;
}

export async function markAllNotificationsRead(recipientId) {
  const client = getAuthedClient();
  if (!client || !recipientId) return false;

  const { error } = await client
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("recipient_id", recipientId)
    .eq("is_read", false);

  if (error) {
    console.warn("Failed to mark all notifications read", error);
    return false;
  }

  return true;
}

export function subscribeToNotifications(recipientId, onInsert) {
  const client = getAuthedClient();
  if (!client || !recipientId || typeof onInsert !== "function") {
    return () => {};
  }

  const channel = client
    .channel(`notifications:${recipientId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `recipient_id=eq.${recipientId}`,
      },
      (payload) => {
        onInsert(payload.new);
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
