import { create } from 'zustand';

interface Notification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: number;
}

interface NotifState {
  notifications: Notification[];
  unreadCount: number;
  fcmToken: string | null;
  addNotification: (notif: Omit<Notification, 'read' | 'createdAt'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  setFCMToken: (token: string) => void;
}

export const useNotifStore = create<NotifState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  fcmToken: null,
  addNotification: (notif) => {
    const newNotif: Notification = { ...notif, read: false, createdAt: Date.now() };
    const updated = [newNotif, ...get().notifications];
    set({ notifications: updated, unreadCount: updated.filter(n => !n.read).length });
  },
  markRead: (id) => {
    const updated = get().notifications.map(n => n.id === id ? { ...n, read: true } : n);
    set({ notifications: updated, unreadCount: updated.filter(n => !n.read).length });
  },
  markAllRead: () => {
    set({ notifications: get().notifications.map(n => ({ ...n, read: true })), unreadCount: 0 });
  },
  setFCMToken: (token) => set({ fcmToken: token }),
}));
