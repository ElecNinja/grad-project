import { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useDispatch } from 'react-redux';
import { openChat, setActiveConversation, getOrCreateConversation } from '../../redux/chatSlice';
import {
  Bell,
  CheckCheck,
  CreditCard,
  GraduationCap,
  Loader2,
  MessageSquare,
  Star,
  UserCheck,
  Video,
  X,
} from "lucide-react";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
} from "./notificationApi";
import "./popupmessage.css";

const TYPE_META = {
  // New matching and bidding flow
  new_match: { icon: UserCheck, label: "Match found", color: "match" },
  new_bid: { icon: CreditCard, label: "New bid", color: "bid" },
  bid_accepted: { icon: CheckCheck, label: "Bid accepted", color: "accepted" },
  bid_rejected: { icon: X, label: "Bid rejected", color: "rejected" },
  
  // Sessions and courses
  course_ready: { icon: Video, label: "Course ready", color: "live" },
  live_session_scheduled: { icon: Video, label: "Session booked", color: "live" },
  bootcamp_joined: { icon: GraduationCap, label: "Bootcamp", color: "bootcamp" },
  new_lesson: { icon: Video, label: "New lesson", color: "live" },
  
  // Existing ones
  session_reminder: { icon: Video, label: "Reminder", color: "live" },
  session_started: { icon: Video, label: "Live now", color: "live" },
  new_message: { icon: MessageSquare, label: "Message", color: "message" },
  payment_received: { icon: CreditCard, label: "Payment", color: "payment" },
  payment_failed: { icon: CreditCard, label: "Payment", color: "payment" },
  review_received: { icon: Star, label: "Review", color: "review" },
};

function formatRelativeTime(isoDate) {
  if (!isoDate) return "";

  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(isoDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function getNotificationMeta(type) {
  return TYPE_META[type] || { icon: Bell, label: "Update", color: "default" };
}

// Route map keyed by notification type.
// Paths match routes defined in Router.jsx exactly.
const ROUTE_BY_TYPE = {
  // Teacher receives these
  new_match:              (role) => "/requests",
  bid_accepted:           (role) => "/work",
  bid_rejected:           (role) => "/requests",
  review_received:        (role) => "/work",
  payment_received:       (role) => "/work",
  payment_failed:         (role) => "/work",
  // Student receives these
  new_bid:                (role) => "/requests",
  course_ready:           (role) => "/videos",
  live_session_scheduled: (role) => "/videos",
  bootcamp_joined:        (role) => "/videos",
  new_lesson:             (role) => "/videos",
  session_reminder:       (role) => "/videos",
  // Both can receive
  new_message:            null, // handled separately via chat dispatch
};

function getNotificationRoute(notification, role) {
  const fn = ROUTE_BY_TYPE[notification?.type];
  if (fn === null) return null;           // new_message — handled elsewhere
  if (typeof fn === "function") return fn(role);

  // Fallback: use data fields for legacy / unknown types
  const data = notification?.data || {};
  if (data.bootcamp_id) return "/videos";
  if (data.request_id)  return role === "teacher" ? "/requests" : "/requests";
  if (data.bid_id)      return role === "teacher" ? "/work" : "/requests";
  if (data.session_id)  return role === "teacher" ? "/work" : "/videos";
  return null;
}

function PopupMessage({
  isOpen,
  onClose,
  recipientId,
  anchorRef,
  onUnreadCountChange,
}) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userRole = useSelector((state) => state.user?.role);
  const panelRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  const syncUnreadCount = useCallback(
    async (items) => {
      if (typeof onUnreadCountChange !== "function") return;
      const targetItems = items || [];

      const unread = targetItems.filter((item) => !item.is_read).length;
      if (recipientId) {
        const count = await fetchUnreadCount(recipientId);
        onUnreadCountChange(count || unread);
        return;
      }

      onUnreadCountChange(unread);
    },
    [onUnreadCountChange, recipientId]
  );

  const loadNotifications = useCallback(async () => {
    if (!recipientId) return;

    setLoading(true);
    setError("");

    try {
      const rows = await fetchNotifications(recipientId);
      setNotifications(rows);
      await syncUnreadCount(rows);
    } catch {
      setError("Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, [recipientId, syncUnreadCount]);

  useEffect(() => {
    if (!isOpen || !recipientId) return;
    loadNotifications();
  }, [isOpen, recipientId, loadNotifications]);

  useEffect(() => {
    if (!recipientId) return undefined;

    const unsubscribe = subscribeToNotifications(recipientId, (row) => {
      setNotifications((prev) => {
        const exists = prev.some((item) => item.id === row.id);
        const next = exists ? prev : [row, ...prev];
        syncUnreadCount(next);
        return next;
      });
    });

    return unsubscribe;
  }, [recipientId, syncUnreadCount]);

  useEffect(() => {
    if (!recipientId || !onUnreadCountChange) return;

    fetchUnreadCount(recipientId).then(onUnreadCountChange);
  }, [recipientId, onUnreadCountChange]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event) => {
      const clickedPanel = panelRef.current?.contains(event.target);
      const clickedAnchor = anchorRef?.current?.contains(event.target);
      if (!clickedPanel && !clickedAnchor) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [anchorRef, isOpen, onClose]);

  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      const updated = await markNotificationRead(notification.id);
      if (updated) {
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id
              ? { ...item, is_read: true, read_at: new Date().toISOString() }
              : item
          )
        );
        await syncUnreadCount(
          notifications.map((item) =>
            item.id === notification.id ? { ...item, is_read: true } : item
          )
        );
      }
    }

    // ─── NEW: handle new_message notifications ──────────────────────────
    if (notification.type === 'new_message') {
      const data = notification.data || {};
      const conversationId = data.conversation_id;
      const senderId = data.sender_id;

      try {
        if (conversationId) {
          dispatch(setActiveConversation(conversationId));
        } else if (senderId) {
          const convId = await dispatch(getOrCreateConversation(senderId)).unwrap();
          dispatch(setActiveConversation(convId));
        } else {
          // fallback: cannot open chat
          return;
        }
        dispatch(openChat());
      } catch (error) {
        console.error('Failed to open chat from notification:', error);
      } finally {
        onClose(); // close notification dropdown
      }
      return; // don't navigate
    }

    // ─── Existing navigation logic ──────────────────────────────────────
    const route = getNotificationRoute(notification, userRole);
    if (route) {
      navigate(route);
      onClose();
    }
  };

  const handleMarkAllRead = async () => {
    if (!recipientId || markingAll) return;

    setMarkingAll(true);
    const success = await markAllNotificationsRead(recipientId);
    if (success) {
      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          is_read: true,
          read_at: item.read_at || new Date().toISOString(),
        }))
      );
      onUnreadCountChange?.(0);
    }
    setMarkingAll(false);
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  return (
    <div className="popup-message" ref={panelRef} role="dialog" aria-label="Notifications">
      <div className="popup-message__header">
        <div>
          <h3 className="popup-message__title">Notifications</h3>
          {unreadCount > 0 && (
            <p className="popup-message__subtitle">{unreadCount} unread</p>
          )}
        </div>
        <div className="popup-message__actions">
          {unreadCount > 0 && (
            <button
              type="button"
              className="popup-message__mark-all"
              onClick={handleMarkAllRead}
              disabled={markingAll}
            >
              {markingAll ? <Loader2 size={14} className="popup-message__spin" /> : <CheckCheck size={14} />}
              Mark all read
            </button>
          )}
          <button
            type="button"
            className="popup-message__close"
            onClick={onClose}
            aria-label="Close notifications"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="popup-message__body">
        {loading && (
          <div className="popup-message__state">
            <Loader2 size={22} className="popup-message__spin" />
            <span>Loading notifications…</span>
          </div>
        )}

        {!loading && error && (
          <div className="popup-message__state popup-message__state--error">
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div className="popup-message__state">
            <Bell size={28} />
            <strong>No notifications yet</strong>
            <span>Updates about bids, sessions, messages, and payments will appear here.</span>
          </div>
        )}

        {!loading && !error && notifications.length > 0 && (
          <ul className="popup-message__list">
            {notifications.map((notification) => {
              const meta = getNotificationMeta(notification.type);
              const Icon = meta.icon;

              return (
                <li key={notification.id}>
                  <button
                    type="button"
                    className={`popup-message__item ${notification.is_read ? "" : "popup-message__item--unread"}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <span className={`popup-message__icon popup-message__icon--${meta.color || "default"}`}>
                      <Icon size={16} />
                    </span>
                    <span className="popup-message__content">
                      <span className="popup-message__item-top">
                        <span className="popup-message__item-title">{notification.title}</span>
                        <span className="popup-message__time">
                          {formatRelativeTime(notification.created_at)}
                        </span>
                      </span>
                      <span className={`popup-message__badge popup-message__badge--${meta.color || "default"}`}>{meta.label}</span>
                      {notification.body && (
                        <span className="popup-message__item-body">{notification.body}</span>
                      )}
                    </span>
                    {!notification.is_read && <span className="popup-message__unread-dot" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

PopupMessage.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  recipientId: PropTypes.string,
  anchorRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  onUnreadCountChange: PropTypes.func,
};

export default PopupMessage;
