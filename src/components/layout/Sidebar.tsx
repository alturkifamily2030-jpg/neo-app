import { NavLink, useLocation } from 'react-router-dom';
import {
  Wrench, Calendar, Package, MessageCircle, BarChart2,
  Lightbulb, User, Settings, LogOut, ChevronRight, ChevronLeft, ShieldCheck,
} from 'lucide-react';
import { currentUser } from '../../data/mockData';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onLogout: () => void;
}

const NavItem = ({ to, icon: Icon, label, collapsed }: {
  to: string; icon: React.ComponentType<{ size?: number; className?: string }>; label: string; collapsed: boolean;
}) => {
  const location = useLocation();
  const isActive = location.pathname.startsWith(to);

  return (
    <NavLink
      to={to}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 group relative
        ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
    >
      <Icon size={18} className={isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'} />
      {!collapsed && <span className="truncate">{label}</span>}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap
          opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
          {label}
        </div>
      )}
    </NavLink>
  );
};

export default function Sidebar({ collapsed, onToggle, onLogout }: SidebarProps) {
  const initial = currentUser.name.charAt(0).toUpperCase();

  return (
    <aside className={`flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300
      ${collapsed ? 'w-[60px]' : 'w-[200px]'} flex-shrink-0`}>

      {/* Header: user + toggle */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-100 min-h-[56px]">
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-gray-800 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
              {initial}
            </div>
            <span className="text-xs text-gray-600 truncate">{currentUser.email.split('@')[0]}</span>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-full bg-gray-800 text-white flex items-center justify-center text-sm font-bold mx-auto">
            {initial}
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1 rounded hover:bg-gray-100 text-gray-500 flex-shrink-0"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide py-2 px-2 space-y-1">
        {/* Logo dots */}
        <div className={`flex items-center gap-1 px-1 py-2 ${collapsed ? 'justify-center' : ''}`}>
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
          {!collapsed && <span className="ml-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Modules</span>}
        </div>

        <NavItem to="/fix" icon={Wrench} label="Fix" collapsed={collapsed} />
        <NavItem to="/plan" icon={Calendar} label="Plan" collapsed={collapsed} />
        <NavItem to="/comply" icon={ShieldCheck} label="Comply" collapsed={collapsed} />
        <NavItem to="/assets" icon={Package} label="Track" collapsed={collapsed} />
        <NavItem to="/chat" icon={MessageCircle} label="Chat" collapsed={collapsed} />
        <NavItem to="/dashboard" icon={BarChart2} label="Dashboard & Reports" collapsed={collapsed} />

        <div className="pt-3">
          {!collapsed && <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-1">Support</p>}
          <NavItem to="/helphub" icon={Lightbulb} label="HelpHub" collapsed={collapsed} />
        </div>

        <div className="pt-3">
          {!collapsed && <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-1">Settings</p>}
          <NavItem to="/profile"  icon={User}     label="Team"     collapsed={collapsed} />
          <NavItem to="/settings" icon={Settings} label="Settings" collapsed={collapsed} />
        </div>
      </div>

      {/* Logout */}
      <div className="px-2 pb-3 border-t border-gray-100 pt-2">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 w-full"
        >
          <LogOut size={18} />
          {!collapsed && <span>Log Out Of NEO</span>}
        </button>
        {!collapsed && (
          <p className="text-[10px] text-gray-400 text-center mt-2">NEO 2026 · v1.0.0</p>
        )}
      </div>
    </aside>
  );
}
