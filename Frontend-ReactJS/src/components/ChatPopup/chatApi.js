import { supabase } from "../../config/supabaseClient";

export async function fetchChatProfile(profileId) {
  if (!profileId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role")
    .eq("id", profileId)
    .single();

  if (error) {
    console.error("Error fetching chat profile:", error);
    return null;
  }

  return data;
}

export async function getOrCreateConversation(currentProfileId, otherProfileId) {
  if (!currentProfileId || !otherProfileId || currentProfileId === otherProfileId) {
    return null;
  }
  

  const { data: currentMemberships, error: currentError } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("profile_id", currentProfileId);

  if (currentError) {
    console.error("Error fetching current member conversations:", currentError);
    throw currentError;
  }

  const conversationIds = (currentMemberships || []).map((row) => row.conversation_id);

  if (conversationIds.length > 0) {
    const { data: matchingMemberships, error: matchError } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("profile_id", otherProfileId)
      .in("conversation_id", conversationIds)
      .limit(1);

    if (matchError) {
      console.error("Error finding existing conversation:", matchError);
      throw matchError;
    }

    if (matchingMemberships?.[0]?.conversation_id) {
      return matchingMemberships[0].conversation_id;
    }
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .insert({})
    .select("id")
    .single();

  if (conversationError) {
    console.error("Error creating conversation:", conversationError);
    throw conversationError;
  }

  const { error: membersError } = await supabase.from("conversation_members").insert([
    { conversation_id: conversation.id, profile_id: currentProfileId },
    { conversation_id: conversation.id, profile_id: otherProfileId },
  ]);

  if (membersError) {
    console.error("Error creating conversation members:", membersError);
    throw membersError;
  }

  return conversation.id;
}

export async function fetchMessages(conversationId) {
  if (!conversationId) return [];

  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, body, message_type, file_url, file_name, created_at")
    .eq("conversation_id", conversationId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }

  return data || [];
}

export async function sendChatMessage(conversationId, senderId, recipientId, body) {
  const cleanBody = body?.trim();
  if (!conversationId || !senderId || !cleanBody) return null;

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      body: cleanBody,
      message_type: "text",
    })
    .select("id, conversation_id, sender_id, body, message_type, created_at")
    .single();

  if (error) {
    console.error("Error sending message:", error);
    throw error;
  }

  if (recipientId) {
    await supabase.from("notifications").insert({
      recipient_id: recipientId,
      type: "new_message",
      title: "New message",
      body: cleanBody,
      data: {
        conversation_id: conversationId,
        sender_id: senderId,
      },
    });
  }

  return data;
}

export function subscribeToConversation(conversationId, onInsert) {
  if (!conversationId) return () => {};

  // Use a unique channel name to avoid conflicts
  const channelName = `chat-${conversationId}`;

  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
    }, (payload) => {
      const newMsg = payload.new;
      // Manual filter – only forward messages for this conversation
      if (newMsg && newMsg.conversation_id === conversationId) {
        onInsert(newMsg);
      }
    })
    .subscribe((status) => {
      console.log(`📡 Subscription status for ${conversationId}:`, status);
    });

  return () => {
    console.log(`🔴 Removing channel for ${conversationId}`);
    supabase.removeChannel(channel);
  };
}

export async function markNotificationsAsRead(conversationId, userId) {
  // Mark all notifications of type 'new_message' for this conversation as read
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('recipient_id', userId)
    .eq('type', 'new_message')
    .eq('data->>conversation_id', conversationId)
    .eq('is_read', false);
  if (error) console.error('Error marking notifications as read:', error);
}
