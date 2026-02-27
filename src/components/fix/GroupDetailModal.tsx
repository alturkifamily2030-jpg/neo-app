import { X, Plus } from 'lucide-react';
import type { Group, Task } from '../../types';
import TaskListItem from './TaskListItem';
import StatusDots from '../ui/StatusDots';

interface GroupDetailModalProps {
  group: Group;
  tasks: Task[];
  onClose: () => void;
  onTaskClick: (task: Task) => void;
}

export default function GroupDetailModal({ group, tasks, onClose, onTaskClick }: GroupDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
            style={{ backgroundColor: group.color + '20' }}>
            {group.icon}
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">{group.name}</h2>
            <p className="text-xs text-gray-400">{group.description}</p>
          </div>
          <div className="flex items-center gap-4">
            <StatusDots counts={group.counts} />
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <p className="text-sm">No tasks in this group</p>
              <button className="mt-3 flex items-center gap-1.5 text-blue-600 text-sm hover:underline">
                <Plus size={16} /> Create first task
              </button>
            </div>
          ) : (
            tasks.map(task => (
              <TaskListItem key={task.id} task={task} onClick={() => onTaskClick(task)} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
