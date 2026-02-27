import { X, MessageCircle, User } from 'lucide-react';
import { format } from 'date-fns';
import type { Task, TaskStatus } from '../../types';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

const statusLabels: Record<TaskStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  done: 'Done',
};

const statusColors: Record<TaskStatus, string> = {
  open: 'bg-red-100 text-red-700 border-red-200',
  in_progress: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  done: 'bg-green-100 text-green-700 border-green-200',
};

export default function TaskDetailModal({ task, onClose, onStatusChange }: TaskDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: task.groupColor }}></span>
            <span className="text-sm text-gray-500">{task.groupName}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">{task.title}</h2>
          {task.image && (
            <img src={task.image} alt="" className="w-full h-48 object-cover rounded-xl" />
          )}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Status</p>
            <div className="flex gap-2">
              {(['open', 'in_progress', 'done'] as TaskStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => onStatusChange(task.id, s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                    ${task.status === s ? statusColors[s] : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                >
                  {statusLabels[s]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-1">Priority</p>
              <p className="capitalize font-medium text-gray-700">{task.priority}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Created</p>
              <p className="font-medium text-gray-700">{format(task.createdAt, 'MMM d, yyyy HH:mm')}</p>
            </div>
          </div>
          {task.description && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Description</p>
              <p className="text-sm text-gray-700">{task.description}</p>
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle size={16} className="text-gray-400" />
              <p className="text-sm font-medium text-gray-700">Comments ({task.comments.length})</p>
            </div>
            {task.comments.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No comments yet</p>
            )}
            <div className="flex gap-2 mt-3">
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <User size={14} className="text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Add a comment..."
                className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
