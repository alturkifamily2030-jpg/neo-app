import { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useNotifications } from '../../context/NotificationContext';
import KeyboardShortcutsModal from '../ui/KeyboardShortcutsModal';

interface AppLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export default function AppLayout({ children, onLogout }: AppLayoutProps) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(true);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { notifications, unreadCount, markAllRead } = useNotifications();

  // "g then X" navigation chord state
  const gPendingRef = useRef(false);
  const gTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      const isInput = ['input', 'textarea', 'select'].includes(tag) ||
        (e.target as HTMLElement).isContentEditable;

      // Ctrl/Cmd + / → shortcuts modal
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowShortcuts(v => !v);
        return;
      }

      // Ctrl/Cmd + N → create task (custom event)
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('neo:create-task'));
        return;
      }

      // Ctrl/Cmd + K → focus search (custom event)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('neo:focus-search'));
        return;
      }

      // Escape → close modals (custom event)
      if (e.key === 'Escape') {
        setShowNotifs(false);
        setShowShortcuts(false);
        window.dispatchEvent(new CustomEvent('neo:close-modal'));
        return;
      }

      // G-chord navigation (only when not typing in inputs)
      if (!isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key.toLowerCase() === 'g') {
          gPendingRef.current = true;
          if (gTimerRef.current) clearTimeout(gTimerRef.current);
          gTimerRef.current = setTimeout(() => { gPendingRef.current = false; }, 1500);
          return;
        }

        if (gPendingRef.current) {
          gPendingRef.current = false;
          if (gTimerRef.current) clearTimeout(gTimerRef.current);
          const dest: Record<string, string> = {
            f: '/fix', p: '/plan', a: '/assets', c: '/comply', d: '/dashboard',
          };
          const path = dest[e.key.toLowerCase()];
          if (path) {
            e.preventDefault();
            navigate(path);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (gTimerRef.current) clearTimeout(gTimerRef.current);
    };
  }, [navigate]);

  const handleBellClick = () => {
    setShowNotifs(v => !v);
    if (!showNotifs && unreadCount > 0) markAllRead();
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        onLogout={onLogout}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4 flex-shrink-0 relative">
          {/* Logo center */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="ml-1 text-base font-semibold text-gray-700">neo</span>
          </div>

          {/* Bell icon */}
          <div className="ml-auto relative">
            <button
              onClick={handleBellClick}
              className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications dropdown */}
            {showNotifs && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                  <button onClick={() => setShowNotifs(false)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                    <X size={16} />
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-12 text-center">
                      <Bell size={32} className="mx-auto text-gray-200 mb-3" />
                      <p className="text-sm text-gray-400">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => { setShowNotifs(false); if (n.taskId) navigate(`/fix/task/${n.taskId}`); }}
                        className={`flex gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 ${n.taskId ? 'cursor-pointer' : ''}`}
                      >
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: n.groupColor + '20' }}
                        >
                          {n.type === 'reminder' ? '⏰' : n.groupIcon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900 flex-1 leading-tight">{n.title}</p>
                            {n.type === 'new_task' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 flex-shrink-0 mt-0.5">NEW</span>
                            )}
                            {n.type === 'reminder' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 flex-shrink-0 mt-0.5">REMINDER</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: n.groupColor + '20', color: n.groupColor }}
                            >
                              {n.groupIcon} {n.groupName}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {format(n.timestamp, 'dd MMM, HH:mm')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Backdrop */}
      {showNotifs && (
        <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
      )}

      {/* Keyboard shortcuts modal */}
      {showShortcuts && <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </div>
  );
}
