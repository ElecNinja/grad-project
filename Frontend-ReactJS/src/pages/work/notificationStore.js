import { useState, useEffect } from 'react';

let _notifListeners = [];
let _notifications = [];

export const notifyStudent = (studentId, payload) => {
  const notif = {
    id: `${Date.now()}_${Math.random()}`,
    studentId,
    ...payload,
    createdAt: new Date().toISOString(),
    read: false,
  };
  _notifications = [notif, ..._notifications];
  _notifListeners.forEach((fn) => fn([..._notifications]));
};

export const subscribeNotifications = (handler) => {
  _notifListeners.push(handler);
  return () => {
    _notifListeners = _notifListeners.filter((fn) => fn !== handler);
  };
};

export const getNotifications = () => _notifications;

export const markAllReadForUser = (userId) => {
  _notifications = _notifications.map((n) =>
    n.studentId === userId ? { ...n, read: true } : n
  );
};

export const clearNotificationsForUser = (userId) => {
  _notifications = _notifications.filter((n) => n.studentId !== userId);
};

// ✅ الـ hook دلوقتي هنا، مش جوا Work.jsx
export const useNotifications = (userId) => {
  const [notifs, setNotifs] = useState(
    getNotifications().filter((n) => n.studentId === userId)
  );

  useEffect(() => {
    const unsubscribe = subscribeNotifications((all) =>
      setNotifs(all.filter((n) => n.studentId === userId))
    );
    return unsubscribe;
  }, [userId]);

  const markAllRead = () => {
    markAllReadForUser(userId);
    setNotifs(getNotifications().filter((n) => n.studentId === userId));
  };

  return { notifs, markAllRead };
};