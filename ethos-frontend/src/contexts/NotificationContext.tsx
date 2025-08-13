import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';
import { fetchNotifications, markNotificationRead } from '../api/notifications';
import type { Notification } from '../types/notificationTypes';
import { useAuth } from './AuthContext';

interface NotificationContextValue {
  notifications: Notification[];
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const shownRef = useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const notes = await fetchNotifications();
      setNotifications(notes);
    } catch (err) {
      console.warn('[NotificationContext] Failed to load notifications', err);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (typeof window === 'undefined' || Notification.permission !== 'granted') return;
    notifications.forEach(n => {
      if (!n.read && !shownRef.current.has(n.id)) {
        new Notification(n.message);
        shownRef.current.add(n.id);
      }
    });
  }, [notifications]);

  const markRead = async (id: string) => {
    try {
      const updated = await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));
    } catch (err) {
      console.warn('[NotificationContext] Failed to mark read', err);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, refresh: load, markRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = (): NotificationContextValue => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be inside NotificationProvider');
  return ctx;
};
