import { useState } from 'react';
import { format, isAfter } from 'date-fns';
import { MessageCircle, Calendar, ExternalLink, Copy, Trash2, MoreVertical } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import ContextMenu from '../ui/ContextMenu';
import type { Task } from '../../types';

interface TaskListItemProps {
  task: Task;
  onClick: () => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (task: Task) => void;
  onStatusChange?: (id: string, status: Task['status']) => void;
}

const priorityConfig = {
  high:   { label: 'High',   cls: 'bg-red-100 text-red-700' },
  medium: { label: 'Med',    cls: 'bg-yellow-100 text-yellow-700' },
  low:    { label: 'Low',    cls: 'bg-gray-100 text-gray-500' },
};

const statusDot = {
  open:        'bg-red-500',
  in_progress: 'bg-yellow-400',
  done:        'bg-green-500',
};

export default function TaskListItem({ task, onClick, onDelete, onDuplicate, onStatusChange: _onStatusChange }: TaskListItemProps) {
  const { teamMembers, updateTask, deleteTask, addTask } = useNotifications();
  const assignedUsers = teamMembers.filter(u => task.assignees.includes(u.id));
  const pCfg = priorityConfig[task.priority];
  const hasTags = task.tags && (task.tags.location || task.tags.equipment || task.tags.category);
  const isOverdue = !!task.dueDate && task.status !== 'done' && isAfter(new Date(), task.dueDate);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const contextMenuItems = [
    {
      label: 'Open',
      icon: <ExternalLink size={14} />,
      onClick: onClick,
    },
    {
      label: 'Copy link',
      icon: <Copy size={14} />,
      onClick: () => {
        navigator.clipboard?.writeText(`${window.location.origin}/fix/task/${task.id}`).catch(() => {});
      },
    },
    {
      label: 'Duplicate',
      icon: <Copy size={14} />,
      onClick: () => {
        const newId = `t${Date.now()}`;
        addTask({ ...task, id: newId, title: `Copy of ${task.title}`, createdAt: new Date(), status: 'open', comments: [], activityLog: [], timeEntries: [] });
        if (onDuplicate) onDuplicate(task);
      },
    },
    { separator: true, label: '', onClick: () => {} },
    {
      label: 'Mark Open',
      onClick: () => updateTask(task.id, { status: 'open' }),
    },
    {
      label: 'Mark In Progress',
      onClick: () => updateTask(task.id, { status: 'in_progress' }),
    },
    {
      label: 'Mark Done',
      onClick: () => updateTask(task.id, { status: 'done' }),
    },
    { separator: true, label: '', onClick: () => {} },
    {
      label: 'Delete',
      icon: <Trash2 size={14} />,
      danger: true,
      onClick: () => {
        deleteTask(task.id);
        if (onDelete) onDelete(task.id);
      },
    },
  ];

  return (
    <>
      <div
        className={`flex items-start gap-3 px-4 py-3 bg-white border-b hover:bg-gray-50 cursor-pointer ${isOverdue ? 'border-l-2 border-l-red-400 border-b-gray-100' : 'border-b-gray-100'}`}
        onClick={onClick}
        onContextMenu={handleContextMenu}
      >
        {/* Photo / thumbnail */}
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100">
            {task.image
              ? <img src={task.image} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xl">📷</span>
                </div>
            }
          </div>
          <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${statusDot[task.status]}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-gray-900 leading-snug">{task.title}</p>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${pCfg.cls}`}>
                {pCfg.label}
              </span>
              <button
                onClick={e => { e.stopPropagation(); handleContextMenu(e); }}
                className="p-0.5 rounded hover:bg-gray-200 text-gray-300 hover:text-gray-500"
              >
                <MoreVertical size={13} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: task.groupColor }} />
            <span className="text-xs text-gray-400 truncate">{task.groupName}</span>
          </div>

          {hasTags && (
            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
              {task.tags?.location && (
                <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md font-medium">
                  📍 {task.tags.location}
                </span>
              )}
              {task.tags?.equipment && (
                <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-md font-medium">
                  🔧 {task.tags.equipment}
                </span>
              )}
              {task.tags?.category && (
                <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-md font-medium">
                  🏷 {task.tags.category}
                </span>
              )}
            </div>
          )}

          {/* Due date row */}
          {task.dueDate && (
            <div className="flex items-center gap-1 mt-1.5">
              <Calendar size={11} className={isOverdue ? 'text-red-500' : 'text-gray-400'} />
              <span className={`text-[11px] font-medium ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                {isOverdue ? 'Overdue · ' : 'Due '}
                {format(task.dueDate, 'MMM d, yyyy')}
              </span>
              {isOverdue && (
                <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full ml-0.5">Late</span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-1.5">
            {/* Assignee avatars */}
            <div className="flex items-center">
              {assignedUsers.slice(0, 4).map((u, i) => (
                <div
                  key={u.id}
                  title={u.name}
                  className="w-5 h-5 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white font-bold flex-shrink-0"
                  style={{ marginLeft: i === 0 ? 0 : -6, fontSize: 8 }}
                >
                  {u.name.charAt(0)}
                </div>
              ))}
              {assignedUsers.length === 0 && (
                <span className="text-[10px] text-gray-300">Unassigned</span>
              )}
            </div>

            <div className="flex items-center gap-2 text-gray-400">
              {task.comments.length > 0 && (
                <span className="flex items-center gap-0.5 text-[11px]">
                  <MessageCircle size={11} />
                  {task.comments.length}
                </span>
              )}
              <span className="text-[11px]">{format(task.createdAt, 'MMM d')}</span>
            </div>
          </div>
        </div>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}
