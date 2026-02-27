import { useState } from 'react';
import { X, Check, Users } from 'lucide-react';
import type { Group, User } from '../../types';

const EMOJI_OPTIONS = [
  '🔧','🪚','⚡','🌿','🔍','🏠','⚙️','🪲','❄️','🔥',
  '👤','🔎','📍','🧹','⚠️','🤵','🎭','🚗','🏊','🔧',
  '🛠️','🏗️','💧','🌡️','📋','🗝️','🔒','📦','🧯','🪣',
];

const COLOR_OPTIONS = [
  '#3b82f6','#8b5cf6','#10b981','#ef4444','#f59e0b',
  '#6b7280','#ec4899','#14b8a6','#f97316','#84cc16',
];

const statusDot: Record<User['status'], string> = {
  online: 'bg-green-400', away: 'bg-yellow-400', offline: 'bg-gray-300',
};

interface Props {
  teamMembers: User[];
  onClose: () => void;
  onSave: (g: Group) => void;
}

export default function CreateGroupModal({ teamMembers, onClose, onSave }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🔧');
  const [color, setColor] = useState('#3b82f6');
  const [memberIds, setMemberIds] = useState<string[]>(teamMembers.map(u => u.id));
  const [memberSearch, setMemberSearch] = useState('');

  const toggleMember = (id: string) =>
    setMemberIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleAll = () =>
    setMemberIds(memberIds.length === teamMembers.length ? [] : teamMembers.map(u => u.id));

  const filtered = teamMembers.filter(u =>
    u.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      id: `g${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'New group',
      icon,
      color,
      counts: { red: 0, yellow: 0, green: 0 },
      notificationsOn: true,
      memberIds,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-semibold text-gray-900">Create Group</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">

            {/* Preview */}
            <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: color + '25' }}
              >
                {icon}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{name || 'Group name'}</p>
                <p className="text-xs text-gray-400 truncate">{description || 'Description'}</p>
                <p className="text-xs text-gray-400 mt-0.5">{memberIds.length} member{memberIds.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Plumbing Team"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Short description of this group"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Icon picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
              <div className="grid grid-cols-10 gap-1.5">
                {EMOJI_OPTIONS.map((e, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIcon(e)}
                    className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-colors
                      ${icon === e ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-100'}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <div className="flex gap-2 flex-wrap">
                {COLOR_OPTIONS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-8 h-8 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check size={14} className="text-white" strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Members */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <Users size={14} className="text-gray-500" />
                  Access — Members ({memberIds.length}/{teamMembers.length})
                </label>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {memberIds.length === teamMembers.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>

              {/* Member search */}
              <input
                type="text"
                placeholder="Search members..."
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="border border-gray-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                {filtered.map(u => {
                  const selected = memberIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleMember(u.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-b border-gray-50 last:border-b-0
                        ${selected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    >
                      {/* Checkbox */}
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors
                        ${selected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                        {selected && <Check size={12} className="text-white" strokeWidth={3} />}
                      </div>
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                          {u.name.charAt(0)}
                        </div>
                        <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${statusDot[u.status]}`} />
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
                        <p className="text-xs text-gray-400 truncate">{u.role}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || memberIds.length === 0}
              className="flex-1 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg py-2.5 text-sm font-medium"
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
