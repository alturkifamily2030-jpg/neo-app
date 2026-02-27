import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { plannedTasks as initialPlanned, assets as initialAssets, chatMessages as initialMessages, chatChannels as initialChannels, teamMembers as initialUsers, tasks as initialTasks, groups as initialGroups, areas as initialAreas } from '../data/mockData';
import type { PlannedTask, Asset, ChatMessage, ChatChannel, User, Task, Group, Area } from '../types';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  groupName: string;
  groupColor: string;
  groupIcon: string;
  timestamp: Date;
  read: boolean;
}

export interface SystemChatMessage {
  id: string;
  channelHint: string; // group name hint to match channel
  text: string;
  timestamp: Date;
}

interface NotificationContextType {
  notifications: AppNotification[];
  systemMessages: SystemChatMessage[];
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  addSystemMessage: (m: Omit<SystemChatMessage, 'id' | 'timestamp'>) => void;
  markAllRead: () => void;
  unreadCount: number;
  // Planned tasks shared state
  plannedTasks: PlannedTask[];
  addPlannedTask: (t: PlannedTask) => void;
  updatePlannedTask: (id: string, changes: Partial<PlannedTask>) => void;
  deletePlannedTask: (id: string) => void;
  // Assets shared state
  assets: Asset[];
  addAsset: (a: Asset) => void;
  updateAsset: (id: string, changes: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  // Chat channels shared state
  chatChannels: ChatChannel[];
  addChatChannel: (c: ChatChannel) => void;
  // Chat messages shared state
  chatMessages: ChatMessage[];
  addChatMessage: (m: ChatMessage) => void;
  updateChatMessage: (id: string, changes: Partial<ChatMessage>) => void;
  toggleReaction: (msgId: string, emoji: string) => void;
  pinMessage: (msgId: string) => void;
  // Team members shared state
  teamMembers: User[];
  addUser: (u: User) => void;
  updateUser: (id: string, changes: Partial<User>) => void;
  deleteUser: (id: string) => void;
  // Tasks (work orders) shared state
  tasks: Task[];
  addTask: (t: Task) => void;
  updateTask: (id: string, changes: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  // Groups shared state
  groups: Group[];
  addGroup: (g: Group) => void;
  updateGroup: (id: string, changes: Partial<Group>) => void;
  deleteGroup: (id: string) => void;
  // Areas shared state
  areas: Area[];
  addArea: (a: Area) => void;
  updateArea: (id: string, changes: Partial<Area>) => void;
  deleteArea: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

// ── localStorage helpers ───────────────────────────────────────────────────

const DATE_FIELDS: Record<string, string[]> = {
  'neo_tasks': ['createdAt', 'dueDate'],
  'neo_planned': ['scheduledAt'],
  'neo_chat_messages': ['timestamp'],
  'neo_assets': [],   // handled specially for nested dates
  'neo_groups': [],
  'neo_areas': [],
  'neo_channels': [],
  'neo_users': [],
};

function reviveDates(obj: Record<string, unknown>, fields: string[]): Record<string, unknown> {
  const result = { ...obj };
  for (const field of fields) {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = new Date(result[field] as string);
    }
  }
  return result;
}

function reviveAsset(raw: Record<string, unknown>): Asset {
  const a = { ...raw } as unknown as Asset;
  if (typeof (a as unknown as Record<string, unknown>).warrantyExpiry === 'string') {
    (a as unknown as Record<string, unknown>).warrantyExpiry = new Date((a as unknown as Record<string, unknown>).warrantyExpiry as string);
  }
  if (typeof (a as unknown as Record<string, unknown>).installDate === 'string') {
    (a as unknown as Record<string, unknown>).installDate = new Date((a as unknown as Record<string, unknown>).installDate as string);
  }
  if (typeof (a as unknown as Record<string, unknown>).purchaseDate === 'string') {
    (a as unknown as Record<string, unknown>).purchaseDate = new Date((a as unknown as Record<string, unknown>).purchaseDate as string);
  }
  if (Array.isArray(a.maintenanceHistory)) {
    a.maintenanceHistory = a.maintenanceHistory.map(r => ({
      ...r,
      date: typeof r.date === 'string' ? new Date(r.date) : r.date,
    }));
  }
  if (Array.isArray((a as unknown as Record<string, unknown[]>).assetDocuments)) {
    (a as unknown as Record<string, unknown[]>).assetDocuments = (a as unknown as Record<string, unknown[]>).assetDocuments.map((d: unknown) => {
      const doc = d as Record<string, unknown>;
      return { ...doc, uploadedAt: typeof doc.uploadedAt === 'string' ? new Date(doc.uploadedAt) : doc.uploadedAt };
    });
  }
  return a;
}

function loadState<T>(key: string, fallback: T, revivers?: (item: Record<string, unknown>) => Record<string, unknown>): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return fallback;
    if (revivers) {
      return parsed.map(item => revivers(item as Record<string, unknown>)) as T;
    }
    const fields = DATE_FIELDS[key] ?? [];
    if (fields.length === 0) return parsed as T;
    return parsed.map(item => reviveDates(item as Record<string, unknown>, fields)) as T;
  } catch {
    return fallback;
  }
}

// ── Provider ───────────────────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [systemMessages, setSystemMessages] = useState<SystemChatMessage[]>([]);

  const [plannedTasks, setPlannedTasks] = useState<PlannedTask[]>(() =>
    loadState<PlannedTask[]>('neo_planned', initialPlanned, item => reviveDates(item, ['scheduledAt']))
  );
  const [assets, setAssets] = useState<Asset[]>(() =>
    loadState<Asset[]>('neo_assets', initialAssets, reviveAsset as unknown as (item: Record<string, unknown>) => Record<string, unknown>)
  );
  const [chatChannels, setChatChannels] = useState<ChatChannel[]>(() =>
    loadState<ChatChannel[]>('neo_channels', initialChannels)
  );
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() =>
    loadState<ChatMessage[]>('neo_chat_messages', initialMessages, item => reviveDates(item, ['timestamp']))
  );
  const [teamMembers, setTeamMembers] = useState<User[]>(() =>
    loadState<User[]>('neo_users', initialUsers)
  );
  const [tasks, setTasks] = useState<Task[]>(() =>
    loadState<Task[]>('neo_tasks', initialTasks, item => {
      const t = reviveDates(item, ['createdAt', 'dueDate']) as Record<string, unknown>;
      // Revive comment dates
      if (Array.isArray(t.comments)) {
        (t as Record<string, unknown[]>).comments = (t.comments as Record<string, unknown>[]).map((c) => ({
          ...c,
          createdAt: typeof c.createdAt === 'string' ? new Date(c.createdAt as string) : c.createdAt,
        }));
      }
      // Revive timeEntries dates
      if (Array.isArray(t.timeEntries)) {
        (t as Record<string, unknown[]>).timeEntries = (t.timeEntries as Record<string, unknown>[]).map((te) => ({
          ...te,
          date: typeof te.date === 'string' ? new Date(te.date as string) : te.date,
        }));
      }
      // Revive activityLog dates
      if (Array.isArray(t.activityLog)) {
        (t as Record<string, unknown[]>).activityLog = (t.activityLog as Record<string, unknown>[]).map((a) => ({
          ...a,
          timestamp: typeof a.timestamp === 'string' ? new Date(a.timestamp as string) : a.timestamp,
        }));
      }
      return t;
    })
  );
  const [groups, setGroups] = useState<Group[]>(() =>
    loadState<Group[]>('neo_groups', initialGroups)
  );
  const [areas, setAreas] = useState<Area[]>(() =>
    loadState<Area[]>('neo_areas', initialAreas)
  );

  // ── Persist to localStorage ────────────────────────────────────────────
  useEffect(() => { try { localStorage.setItem('neo_tasks', JSON.stringify(tasks)); } catch {} }, [tasks]);
  useEffect(() => { try { localStorage.setItem('neo_planned', JSON.stringify(plannedTasks)); } catch {} }, [plannedTasks]);
  useEffect(() => { try { localStorage.setItem('neo_assets', JSON.stringify(assets)); } catch {} }, [assets]);
  useEffect(() => { try { localStorage.setItem('neo_channels', JSON.stringify(chatChannels)); } catch {} }, [chatChannels]);
  useEffect(() => { try { localStorage.setItem('neo_chat_messages', JSON.stringify(chatMessages)); } catch {} }, [chatMessages]);
  useEffect(() => { try { localStorage.setItem('neo_users', JSON.stringify(teamMembers)); } catch {} }, [teamMembers]);
  useEffect(() => { try { localStorage.setItem('neo_groups', JSON.stringify(groups)); } catch {} }, [groups]);
  useEffect(() => { try { localStorage.setItem('neo_areas', JSON.stringify(areas)); } catch {} }, [areas]);

  // ── BroadcastChannel for cross-tab sync ────────────────────────────────
  const bcRef = useRef<BroadcastChannel | null>(null);
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const bc = new BroadcastChannel('neo_sync');
    bcRef.current = bc;
    bc.onmessage = (e) => {
      const { type } = e.data as { type: string };
      if (type === 'tasks_updated') {
        setTasks(loadState<Task[]>('neo_tasks', initialTasks, item => {
          const t = reviveDates(item, ['createdAt', 'dueDate']) as Record<string, unknown>;
          if (Array.isArray(t.comments)) {
            (t as Record<string, unknown[]>).comments = (t.comments as Record<string, unknown>[]).map((c) => ({
              ...c,
              createdAt: typeof c.createdAt === 'string' ? new Date(c.createdAt as string) : c.createdAt,
            }));
          }
          return t;
        }));
      } else if (type === 'chat_updated') {
        setChatMessages(loadState<ChatMessage[]>('neo_chat_messages', initialMessages, item => reviveDates(item, ['timestamp'])));
      }
    };
    return () => bc.close();
  }, []);

  const broadcastUpdate = (type: string) => {
    bcRef.current?.postMessage({ type });
  };

  // ── Notifications ─────────────────────────────────────────────────────
  const addNotification = (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...n,
      id: `notif_${Date.now()}`,
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Browser push notification
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(n.title, {
          body: n.body,
          icon: '/favicon.ico',
          tag: newNotif.id,
        });
      } catch {}
    }
  };

  const addSystemMessage = (m: Omit<SystemChatMessage, 'id' | 'timestamp'>) => {
    setSystemMessages(prev => [{
      ...m,
      id: `sys_${Date.now()}`,
      timestamp: new Date(),
    }, ...prev]);
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // ── Planned tasks ─────────────────────────────────────────────────────
  const addPlannedTask = (t: PlannedTask) => setPlannedTasks(prev => [...prev, t]);
  const updatePlannedTask = (id: string, changes: Partial<PlannedTask>) =>
    setPlannedTasks(prev => prev.map(t => t.id === id ? { ...t, ...changes } : t));
  const deletePlannedTask = (id: string) =>
    setPlannedTasks(prev => prev.filter(t => t.id !== id));

  // ── Assets ────────────────────────────────────────────────────────────
  const addAsset = (a: Asset) => setAssets(prev => [...prev, a]);
  const updateAsset = (id: string, changes: Partial<Asset>) =>
    setAssets(prev => prev.map(a => a.id === id ? { ...a, ...changes } : a));
  const deleteAsset = (id: string) =>
    setAssets(prev => prev.filter(a => a.id !== id));

  // ── Chat ──────────────────────────────────────────────────────────────
  const addChatChannel = (c: ChatChannel) => setChatChannels(prev => [...prev, c]);
  const addChatMessage = (m: ChatMessage) => {
    setChatMessages(prev => [...prev, m]);
    setTimeout(() => broadcastUpdate('chat_updated'), 100);
  };
  const updateChatMessage = (id: string, changes: Partial<ChatMessage>) =>
    setChatMessages(prev => prev.map(m => m.id === id ? { ...m, ...changes } : m));
  const toggleReaction = (msgId: string, emoji: string) => {
    setChatMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      const existing = m.reactions ?? [];
      const r = existing.find(x => x.emoji === emoji);
      if (r) {
        if (r.reactedByMe) {
          const next = r.count - 1;
          return { ...m, reactions: next === 0 ? existing.filter(x => x.emoji !== emoji) : existing.map(x => x.emoji === emoji ? { ...x, count: next, reactedByMe: false } : x) };
        } else {
          return { ...m, reactions: existing.map(x => x.emoji === emoji ? { ...x, count: x.count + 1, reactedByMe: true } : x) };
        }
      }
      return { ...m, reactions: [...existing, { emoji, count: 1, reactedByMe: true }] };
    }));
  };
  const pinMessage = (msgId: string) =>
    setChatMessages(prev => prev.map(m => m.id === msgId ? { ...m, pinned: !m.pinned } : m));

  // ── Team members ──────────────────────────────────────────────────────
  const addUser = (u: User) => setTeamMembers(prev => [...prev, u]);
  const updateUser = (id: string, changes: Partial<User>) =>
    setTeamMembers(prev => prev.map(u => u.id === id ? { ...u, ...changes } : u));
  const deleteUser = (id: string) =>
    setTeamMembers(prev => prev.filter(u => u.id !== id));

  // ── Tasks ─────────────────────────────────────────────────────────────
  const addTask = (t: Task) => {
    setTasks(prev => [t, ...prev]);
    setTimeout(() => broadcastUpdate('tasks_updated'), 100);
  };
  const updateTask = (id: string, changes: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...changes } : t));
    setTimeout(() => broadcastUpdate('tasks_updated'), 100);
  };
  const deleteTask = (id: string) =>
    setTasks(prev => prev.filter(t => t.id !== id));

  // ── Groups ────────────────────────────────────────────────────────────
  const addGroup = (g: Group) => setGroups(prev => [...prev, g]);
  const updateGroup = (id: string, changes: Partial<Group>) =>
    setGroups(prev => prev.map(g => g.id === id ? { ...g, ...changes } : g));
  const deleteGroup = (id: string) =>
    setGroups(prev => prev.filter(g => g.id !== id));

  // ── Areas ─────────────────────────────────────────────────────────────
  const addArea = (a: Area) => setAreas(prev => [...prev, a]);
  const updateArea = (id: string, changes: Partial<Area>) =>
    setAreas(prev => prev.map(a => a.id === id ? { ...a, ...changes } : a));
  const deleteArea = (id: string) =>
    setAreas(prev => prev.filter(a => a.id !== id));

  return (
    <NotificationContext.Provider value={{
      notifications, systemMessages, addNotification, addSystemMessage, markAllRead, unreadCount,
      plannedTasks, addPlannedTask, updatePlannedTask, deletePlannedTask,
      assets, addAsset, updateAsset, deleteAsset,
      chatChannels, addChatChannel,
      chatMessages, addChatMessage, updateChatMessage, toggleReaction, pinMessage,
      teamMembers, addUser, updateUser, deleteUser,
      tasks, addTask, updateTask, deleteTask,
      groups, addGroup, updateGroup, deleteGroup,
      areas, addArea, updateArea, deleteArea,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
