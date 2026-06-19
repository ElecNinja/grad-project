// Frontend-ReactJS/src/components/ChatFloatingButton/ChatFloatingButton.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MessageCircle } from 'lucide-react';
import { toggleChat, fetchConversations } from '../../redux/chatSlice';
import './ChatFloatingButton.css';

const ChatFloatingButton = () => {
  const dispatch = useDispatch();
  const { conversations, isOpen } = useSelector((state) => state.chat);
  const currentUser = useSelector((state) => state.user); // ✅ correct

  const totalUnread = conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);

  useEffect(() => {
    if (currentUser?.loggedIn) {
      dispatch(fetchConversations());
    }
  }, [dispatch, currentUser]);

  const handleToggle = () => {
    dispatch(toggleChat());
    if (!isOpen) {
      dispatch(fetchConversations());
    }
  };

  if (!currentUser?.loggedIn) return null;

  return (
    <button
      className="chat-floating-button"
      onClick={handleToggle}
      aria-label="Open chat"
    >
      <MessageCircle size={28} />
      {totalUnread > 0 && (
        <span className="chat-badge">{totalUnread > 99 ? '99+' : totalUnread}</span>
      )}
    </button>
  );
};

export default ChatFloatingButton;