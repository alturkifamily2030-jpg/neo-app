import { useState } from 'react';
import { Bell, BellOff, MoreHorizontal } from 'lucide-react';
import type { Group } from '../../types';
import StatusDots from '../ui/StatusDots';

interface GroupCardProps {
  group: Group;
  onClick: () => void;
}

export default function GroupCard({ group, onClick }: GroupCardProps) {
  const [notif, setNotif] = useState(group.notificationsOn);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow relative"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: group.color + '20' }}
        >
          <span>{group.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{group.name}</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{group.description}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setNotif(n => !n)}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            {notif ? <Bell size={14} /> : <BellOff size={14} />}
          </button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(m => !m)}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <MoreHorizontal size={14} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-36">
                {['Edit group', 'Archive', 'Delete'].map(item => (
                  <button
                    key={item}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3">
        <StatusDots counts={group.counts} />
      </div>
    </div>
  );
}
