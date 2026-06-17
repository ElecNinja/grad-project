import { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { ArrowLeft, Loader2, Paperclip, Send } from "lucide-react";
import {
  fetchChatProfile,
  fetchMessages,
  getOrCreateConversation,
  sendChatMessage,
  subscribeToConversation,
} from "./chatApi";
import "./ChatPopup.css";

function formatDateLabel(dateValue) {
  if (!dateValue) return "";
  return new Date(dateValue).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateValue) {
  if (!dateValue) return "";
  return new Date(dateValue).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getInitials(name) {
  return (name || "User")
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export default function ChatPopup({ currentUser, peerId, onClose }) {
  const messagesEndRef = useRef(null);
  const [peer, setPeer] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const currentUserId = currentUser?.id;

  const loadChat = useCallback(async () => {
    if (!currentUserId || !peerId) return;

    setLoading(true);
    setError("");

    try {
      const [profile, convoId] = await Promise.all([
        fetchChatProfile(peerId),
        getOrCreateConversation(currentUserId, peerId),
      ]);

      setPeer(profile);
      setConversationId(convoId);
      const rows = await fetchMessages(convoId);
      setMessages(rows);
    } catch {
      setError("Could not open this conversation.");
    } finally {
      setLoading(false);
    }
  }, [currentUserId, peerId]);

  useEffect(() => {
    loadChat();
  }, [loadChat]);

  useEffect(() => {
    if (!conversationId) return undefined;

    return subscribeToConversation(conversationId, (row) => {
      setMessages((prev) => {
        if (prev.some((item) => item.id === row.id)) return prev;
        return [...prev, row];
      });
    });
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!draft.trim() || sending || !conversationId) return;

    const messageBody = draft;
    setDraft("");
    setSending(true);
    setError("");

    try {
      const row = await sendChatMessage(conversationId, currentUserId, peerId, messageBody);
      if (row) {
        setMessages((prev) => (prev.some((item) => item.id === row.id) ? prev : [...prev, row]));
      }
    } catch {
      setDraft(messageBody);
      setError("Message was not sent. Try again.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  if (!peerId) return null;

  const peerName = peer?.full_name || "Expert";
  const peerAvatar = peer?.avatar_url;
  const firstMessageDate = messages[0]?.created_at;

  return (
    <section className="chat-popup" role="dialog" aria-label={`Chat with ${peerName}`}>
      <header className="chat-popup__header">
        <button type="button" className="chat-popup__back" onClick={onClose} aria-label="Close chat">
          <ArrowLeft size={34} strokeWidth={2.5} />
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
      </header>

      <div className="chat-popup__body">
        {loading && (
          <div className="chat-popup__state">
            <Loader2 size={24} className="chat-popup__spin" />
            <span>Opening chat...</span>
          </div>
        )}

        {!loading && error && <div className="chat-popup__error">{error}</div>}

        {!loading && !error && (
          <>
            <div className="chat-popup__timeline">
              <span>{formatDateLabel(firstMessageDate || new Date())}</span>
              <span>{formatTime(firstMessageDate || new Date())}</span>
            </div>

            {messages.length === 0 && (
              <div className="chat-popup__empty">
                Start the conversation with {peerName.split(" ")[0]}.
              </div>
            )}

            {messages.map((message) => {
              const isMine = message.sender_id === currentUserId;
              return (
                <div
                  key={message.id}
                  className={`chat-popup__row ${isMine ? "chat-popup__row--mine" : "chat-popup__row--theirs"}`}
                >
                  {!isMine && (
                    <span className="chat-popup__mini-avatar">
                      {peerAvatar ? <img src={peerAvatar} alt="" /> : getInitials(peerName)}
                    </span>
                  )}
                  <div className="chat-popup__bubble">{message.body}</div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <footer className="chat-popup__composer">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a message..."
          rows={1}
          disabled={loading || !conversationId}
        />
        <button type="button" className="chat-popup__icon-btn" aria-label="Attach file" disabled>
          <Paperclip size={25} />
        </button>
        <button
          type="button"
          className="chat-popup__icon-btn chat-popup__send"
          onClick={handleSend}
          disabled={sending || !draft.trim() || loading || !conversationId}
          aria-label="Send message"
        >
          {sending ? <Loader2 size={24} className="chat-popup__spin" /> : <Send size={27} />}
        </button>
      </footer>
    </section>
  );
}

ChatPopup.propTypes = {
  currentUser: PropTypes.shape({
    id: PropTypes.string,
  }),
  peerId: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};
