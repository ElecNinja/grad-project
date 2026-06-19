// Frontend-ReactJS/src/components/ChatPopup/ChatPopup.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Loader2, Send, X } from 'lucide-react';
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  markAsRead,
  setActiveConversation,
  closeChat,
  addNewMessage,
  incrementUnreadCount,
} from '../../redux/chatSlice';
import { subscribeToConversation, markNotificationsAsRead } from './chatApi';
import { store } from '../../redux/store';
import './ChatPopup.css';

function getInitials(name) {
  return (name || 'User')
    .trim()
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function formatTime(dateValue) {
  if (!dateValue) return '';
  return new Date(dateValue).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

const ChatPopup = () => {
  const dispatch = useDispatch();
  const { conversations, activeConversationId, messages, isOpen, loading } = useSelector(
    (state) => state.chat
  );
  const currentUser = useSelector((state) => state.user);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // When a conversation is selected
  useEffect(() => {
    if (activeConversationId) {
      setViewMode('chat');
      dispatch(fetchMessages(activeConversationId));
      dispatch(markAsRead(activeConversationId));
      // Mark notifications as read
      if (currentUser?.id) {
        markNotificationsAsRead(activeConversationId, currentUser.id);
      }
      dispatch(fetchConversations());
    } else {
      setViewMode('list');
    }
  }, [activeConversationId, dispatch, currentUser?.id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // When popup opens, refresh conversations
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchConversations());
    }
  }, [isOpen, dispatch]);

  // ─── Real‑time subscription ──────────────────────────────────────────
  useEffect(() => {
    if (!activeConversationId) return undefined;

    console.log('🟢 Subscribing to conversation:', activeConversationId);

    const unsubscribe = subscribeToConversation(activeConversationId, (newMsg) => {
      console.log('🔔 New message received:', newMsg);
      // Add to Redux store
      dispatch(addNewMessage(newMsg));

      // Only increment unread if the message is from someone else AND the chat is not already open for this conversation
      if (newMsg.sender_id !== currentUser?.id) {
        const chatState = store.getState().chat;
        // If chat is open and active conversation is this one, don't increment unread
        if (!(chatState.isOpen && chatState.activeConversationId === newMsg.conversation_id)) {
          dispatch(incrementUnreadCount({ conversationId: newMsg.conversation_id }));
        }
      }
    });

    return () => {
      console.log('🔴 Unsubscribing from conversation:', activeConversationId);
      unsubscribe();
    };
  }, [activeConversationId, dispatch, currentUser?.id]);

  // ─── Handlers ────────────────────────────────────────────────────────
  const handleSelectConversation = (convId) => {
    dispatch(setActiveConversation(convId));
  };

  const handleBackToList = () => {
    dispatch(setActiveConversation(null));
    setViewMode('list');
  };

  const handleClose = () => {
    dispatch(closeChat());
    dispatch(setActiveConversation(null));
  };

  const handleSend = async () => {
    if (!draft.trim() || sending || !activeConversationId) return;
    const messageBody = draft;
    setDraft('');
    setSending(true);
    try {
      await dispatch(sendMessage({ conversationId: activeConversationId, body: messageBody })).unwrap();
      dispatch(fetchConversations());
    } catch (error) {
      console.error('Send message error:', error);
      setDraft(messageBody);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Find active conversation peer
  const activeConversation = conversations.find((c) => c.conversationId === activeConversationId);
  const peer = activeConversation?.peer || null;
  const peerName = peer?.full_name || 'User';
  const peerAvatar = peer?.avatar_url;

  // ─── Render functions ──────────────────────────────────────────────
  const renderList = () => (
    <div className="chat-popup__list">
      <div className="chat-popup__list-header">
        <span>Messages</span>
        <button className="chat-popup__close-btn" onClick={handleClose}>
          <X size={20} />
        </button>
      </div>
      {loading && conversations.length === 0 ? (
        <div className="chat-popup__state">
          <Loader2 size={24} className="chat-popup__spin" />
          <span>Loading...</span>
        </div>
      ) : conversations.length === 0 ? (
        <div className="chat-popup__empty">No conversations yet.</div>
      ) : (
        <ul>
          {conversations.map((conv) => (
            <li
              key={conv.conversationId}
              className="chat-popup__list-item"
              onClick={() => handleSelectConversation(conv.conversationId)}
            >
              <div className="chat-popup__list-avatar">
                {conv.peer?.avatar_url ? (
                  <img src={conv.peer.avatar_url} alt={conv.peer.full_name} />
                ) : (
                  <span>{getInitials(conv.peer?.full_name)}</span>
                )}
              </div>
              <div className="chat-popup__list-info">
                <div className="chat-popup__list-name">{conv.peer?.full_name || 'Unknown'}</div>
                <div className="chat-popup__list-preview">
                  {conv.lastMessage?.body || 'No messages yet'}
                </div>
              </div>
              <div className="chat-popup__list-meta">
                <span className="chat-popup__list-time">
                  {conv.lastMessage?.created_at ? formatTime(conv.lastMessage.created_at) : ''}
                </span>
                {conv.unreadCount > 0 && (
                  <span className="chat-popup__list-badge">{conv.unreadCount}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const renderChat = () => (
    <div className="chat-popup__chat">
      <header className="chat-popup__chat-header">
        <button className="chat-popup__back" onClick={handleBackToList}>
          <ArrowLeft size={22} />
        </button>
        <div className="chat-popup__person">
          <span className="chat-popup__avatar">
            {peerAvatar ? <img src={peerAvatar} alt={peerName} /> : getInitials(peerName)}
            <span className="chat-popup__online" />
          </span>
          <span>
            <strong>{peerName}</strong>
            <small>online</small>
          </span>
        </div>
        <button className="chat-popup__close-btn" onClick={handleClose}>
          <X size={20} />
        </button>
      </header>

      <div className="chat-popup__body">
        {loading && messages.length === 0 ? (
          <div className="chat-popup__state">
            <Loader2 size={24} className="chat-popup__spin" />
            <span>Loading messages...</span>
          </div>
        ) : (
          <>
            {messages.length === 0 && (
              <div className="chat-popup__empty">No messages yet. Say hello!</div>
            )}
            {messages.map((msg) => {
              const isMine = msg.sender_id === currentUser?.id;
              return (
                <div
                  key={msg.id}
                  className={`chat-popup__row ${isMine ? 'chat-popup__row--mine' : 'chat-popup__row--theirs'}`}
                >
                  {!isMine && (
                    <span className="chat-popup__mini-avatar">
                      {peerAvatar ? <img src={peerAvatar} alt="" /> : getInitials(peerName)}
                    </span>
                  )}
                  <div className="chat-popup__bubble">
                    <span>{msg.body}</span>
                    <span className="chat-popup__time">{formatTime(msg.created_at)}</span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <footer className="chat-popup__composer">
        <textarea
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          disabled={loading}
        />
        <button
          className="chat-popup__send"
          onClick={handleSend}
          disabled={sending || !draft.trim() || loading}
        >
          {sending ? <Loader2 size={22} className="chat-popup__spin" /> : <Send size={22} />}
        </button>
      </footer>
    </div>
  );

  return (
    <div className="chat-popup-overlay" onClick={handleClose}>
      <div className="chat-popup" onClick={(e) => e.stopPropagation()}>
        {viewMode === 'list' ? renderList() : renderChat()}
      </div>
    </div>
  );
};

export default ChatPopup;