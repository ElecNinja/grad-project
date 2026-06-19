// Backend-ExpressJS/services/chatService.js
const supabase = require('../config/supabase');

/**
 * Get all conversations for a user, with peer info, last message, unread count.
 */
async function getUserConversations(userId) {
  // 1. Get all conversation IDs where user is a member
  const { data: memberships, error: membersError } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('profile_id', userId);

  if (membersError) throw membersError;
  if (!memberships || memberships.length === 0) return [];

  const conversationIds = memberships.map(m => m.conversation_id);

  // 2. For each conversation, get the other member's profile, last message, and unread count.
  // We'll do a single query with multiple CTEs or use a loop. For simplicity, we'll fetch each.
  // Optimize: we can do a raw query with JSON aggregation, but since this is a small feature,
  // we'll fetch sequentially (or you can use Promise.all).
  const conversations = [];
  for (const convId of conversationIds) {
    // Get members (excluding current user)
    const { data: members, error: memError } = await supabase
      .from('conversation_members')
      .select('profile_id')
      .eq('conversation_id', convId)
      .neq('profile_id', userId);

    if (memError) throw memError;
    if (!members || members.length === 0) continue; // should not happen

    const peerId = members[0].profile_id;

    // Get peer profile
    const { data: peer, error: peerError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role')
      .eq('id', peerId)
      .single();

    if (peerError) throw peerError;

    // Get last message
    const { data: lastMessage, error: lastError } = await supabase
      .from('messages')
      .select('id, body, created_at, sender_id')
      .eq('conversation_id', convId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastError) throw lastError;

    // Get unread count: messages where sender != userId and read = false
    const { count: unreadCount, error: unreadError } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', convId)
      .eq('is_deleted', false)
      .eq('read', false)
      .neq('sender_id', userId);

    if (unreadError) throw unreadError;

    conversations.push({
      conversationId: convId,
      peer,
      lastMessage: lastMessage || null,
      unreadCount: unreadCount || 0,
    });
  }

  // Sort by last message time descending
  conversations.sort((a, b) => {
    const timeA = a.lastMessage?.created_at ? new Date(a.lastMessage.created_at) : new Date(0);
    const timeB = b.lastMessage?.created_at ? new Date(b.lastMessage.created_at) : new Date(0);
    return timeB - timeA;
  });

  return conversations;
}

/**
 * Get messages for a conversation, including sender details.
 */
async function getConversationMessages(conversationId, currentUserId) {
  // Check if current user is a member
  const { data: membership, error: memError } = await supabase
    .from('conversation_members')
    .select('profile_id')
    .eq('conversation_id', conversationId)
    .eq('profile_id', currentUserId)
    .maybeSingle();

  if (memError) throw memError;
  if (!membership) throw new Error('User is not a member of this conversation');

  // Fetch messages
  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select('id, sender_id, body, message_type, file_url, file_name, created_at, read')
    .eq('conversation_id', conversationId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  if (msgError) throw msgError;

  // Optionally, mark unread messages as read in the background (or we'll do it via a separate endpoint)
  return messages;
}

/**
 * Send a new message.
 */
async function sendMessage(conversationId, senderId, body) {
  const cleanBody = body?.trim();
  if (!cleanBody) throw new Error('Message body cannot be empty');

  // Verify sender is a member
  const { data: membership, error: memError } = await supabase
    .from('conversation_members')
    .select('profile_id')
    .eq('conversation_id', conversationId)
    .eq('profile_id', senderId)
    .maybeSingle();

  if (memError) throw memError;
  if (!membership) throw new Error('Sender is not a member of this conversation');

  // Insert message
  const { data: newMessage, error: insertError } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      body: cleanBody,
      message_type: 'text',
      read: false,
    })
    .select('id, sender_id, body, created_at')
    .single();

  if (insertError) throw insertError;

  // Determine recipient (the other member)
  const { data: otherMember, error: otherError } = await supabase
    .from('conversation_members')
    .select('profile_id')
    .eq('conversation_id', conversationId)
    .neq('profile_id', senderId)
    .maybeSingle();

  if (otherError) throw otherError;
  const recipientId = otherMember?.profile_id;

  // If recipient exists, create notification
  if (recipientId) {
    // Fetch sender name for notification
    const { data: senderProfile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', senderId)
      .single();
    const senderName = senderProfile?.full_name || 'Someone';

    await supabase
      .from('notifications')
      .insert({
        recipient_id: recipientId,
        type: 'new_message',
        title: `New message from ${senderName}`,
        body: cleanBody,
        data: { conversation_id: conversationId, sender_id: senderId },
        is_read: false,
        read_at: null,
      });
  }

  return newMessage;
}

/**
 * Mark all messages in a conversation as read for a given user.
 */
async function markMessagesAsRead(conversationId, userId) {
  // Mark read = true for all messages where sender != userId and read = false
  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .eq('read', false);

  if (error) throw error;
  return { success: true };
}

/**
 * Get or create a conversation between two users.
 */
async function getOrCreateConversation(user1Id, user2Id) {
  if (user1Id === user2Id) throw new Error('Cannot chat with yourself');

  // Check if conversation already exists
  // Find conversations where both are members
  const { data: memberships1, error: err1 } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('profile_id', user1Id);

  if (err1) throw err1;
  if (!memberships1 || memberships1.length === 0) {
    // No conversations for user1, create new
    return createNewConversation(user1Id, user2Id);
  }

  const convIds = memberships1.map(m => m.conversation_id);
  const { data: memberships2, error: err2 } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('profile_id', user2Id)
    .in('conversation_id', convIds);

  if (err2) throw err2;
  if (memberships2 && memberships2.length > 0) {
    // Return the first matching conversation
    return memberships2[0].conversation_id;
  }

  // No common conversation, create new
  return createNewConversation(user1Id, user2Id);
}

async function createNewConversation(user1Id, user2Id) {
  // Insert conversation
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .insert({})
    .select('id')
    .single();
  if (convError) throw convError;

  // Insert members
  const { error: memError } = await supabase
    .from('conversation_members')
    .insert([
      { conversation_id: conversation.id, profile_id: user1Id },
      { conversation_id: conversation.id, profile_id: user2Id },
    ]);
  if (memError) throw memError;

  return conversation.id;
}

module.exports = {
  getUserConversations,
  getConversationMessages,
  sendMessage,
  markMessagesAsRead,
  getOrCreateConversation,
};