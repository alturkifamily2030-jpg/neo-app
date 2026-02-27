import { useState, useRef } from 'react';
import { X, Upload, Camera, Image, Trash2, AlertCircle, ChevronDown } from 'lucide-react';
import type { Task, Priority, TaskStatus } from '../../types';
import CameraCapture from '../ui/CameraCapture';
import { useNotifications } from '../../context/NotificationContext';

interface CreateTaskModalProps {
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'comments'>) => void;
  defaultGroupId?: string;
  initialPhoto?: string;
}

export default function CreateTaskModal({ onClose, onSave, defaultGroupId, initialPhoto }: CreateTaskModalProps) {
  const { groups, areas, teamMembers } = useNotifications();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [groupId, setGroupId] = useState(defaultGroupId ?? (groups[0]?.id ?? ''));
  const [areaId, setAreaId] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<TaskStatus>('open');
  const [photo, setPhoto] = useState<string | null>(initialPhoto ?? null);
  const [showCamera, setShowCamera] = useState(false);
  const [tagLocation, setTagLocation] = useState('');
  const [tagEquipment, setTagEquipment] = useState('');
  const [tagCategory, setTagCategory] = useState('');
  const [assignees, setAssignees] = useState<string[]>([]);
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedGroup = groups.find(g => g.id === groupId);
  const activeTags = selectedGroup?.activeTags ?? { location: true, equipment: true, category: true };
  const tagsRequired = selectedGroup?.tagsRequired ?? {};
  const blockGallery = selectedGroup?.blockGalleryPhotos ?? false;
  const groupMembers = teamMembers.filter(u => selectedGroup?.memberIds.includes(u.id));

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!title.trim()) errs.push('Title is required');
    if (tagsRequired.location && !tagLocation.trim()) errs.push('Location tag is required for this group');
    if (tagsRequired.equipment && !tagEquipment.trim()) errs.push('Equipment tag is required for this group');
    if (tagsRequired.category && !tagCategory.trim()) errs.push('Category tag is required for this group');
    if (selectedGroup?.assigneeRequired && assignees.length === 0) errs.push('At least one assignee is required for this group');
    if (selectedGroup?.roomRequired === 'area' && !areaId) errs.push('An area is required for this group');
    if (selectedGroup?.roomRequired === 'room') errs.push('A room must be assigned — you can set it after creating the task');
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    // Block on hard errors; warn-only on "after creating" soft hints
    const hardErrors = errs.filter(e => !e.includes('after creating'));
    if (hardErrors.length > 0) {
      setErrors(errs);
      return;
    }
    if (!selectedGroup) return;

    const tags = (tagLocation || tagEquipment || tagCategory) ? {
      location: tagLocation.trim() || undefined,
      equipment: tagEquipment.trim() || undefined,
      category: tagCategory.trim() || undefined,
    } : undefined;

    onSave({
      title: title.trim(),
      description,
      groupId,
      groupName: selectedGroup.name,
      groupColor: selectedGroup.color,
      areaId: areaId || undefined,
      status,
      priority,
      assignees,
      image: photo ?? undefined,
      tags,
    });
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPhoto(ev.target!.result as string);
    reader.readAsDataURL(file);
  };

  const toggleAssignee = (uid: string) => {
    setAssignees(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
  };

  if (showCamera) {
    return (
      <CameraCapture
        onCapture={dataUrl => setPhoto(dataUrl)}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Create Fix</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Validation errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-1">
              {errors.map((err, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertCircle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{err}</p>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input type="text" value={title} onChange={e => { setTitle(e.target.value); setErrors([]); }}
              placeholder="Enter task title"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Add description..." rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group *</label>
              <select value={groupId} onChange={e => { setGroupId(e.target.value); setErrors([]); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                {groups.filter(g => !g.archived).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area {selectedGroup?.roomRequired === 'area' && <span className="text-red-500">*</span>}
              </label>
              <select value={areaId} onChange={e => setAreaId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Select area</option>
                {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as Priority)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as TaskStatus)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          {/* Tag fields — shown when group has active tags */}
          {(activeTags.location || activeTags.equipment || activeTags.category) && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Tags</p>
              <div className="grid grid-cols-1 gap-3">
                {activeTags.location && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      📍 Location {tagsRequired.location && <span className="text-red-500">*</span>}
                    </label>
                    <input type="text" value={tagLocation} onChange={e => setTagLocation(e.target.value)}
                      placeholder="e.g. Pool Area, Room 201, Lobby"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                )}
                {activeTags.equipment && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      🔧 Equipment {tagsRequired.equipment && <span className="text-red-500">*</span>}
                    </label>
                    <input type="text" value={tagEquipment} onChange={e => setTagEquipment(e.target.value)}
                      placeholder="e.g. AC Unit, Pool Pump, Boiler"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                )}
                {activeTags.category && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      🏷 Category {tagsRequired.category && <span className="text-red-500">*</span>}
                    </label>
                    <input type="text" value={tagCategory} onChange={e => setTagCategory(e.target.value)}
                      placeholder="e.g. Repair, Inspection, Maintenance"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assignees */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assignees {selectedGroup?.assigneeRequired && <span className="text-red-500">*</span>}
            </label>
            <button type="button" onClick={() => setShowAssigneePicker(v => !v)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-left flex items-center justify-between hover:bg-gray-50">
              <span className={assignees.length === 0 ? 'text-gray-400' : 'text-gray-900'}>
                {assignees.length === 0
                  ? 'Select assignees...'
                  : teamMembers.filter(u => assignees.includes(u.id)).map(u => u.name).join(', ')}
              </span>
              <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
            </button>
            {showAssigneePicker && groupMembers.length > 0 && (
              <div className="mt-1 border border-gray-200 rounded-lg bg-white shadow-lg max-h-40 overflow-y-auto">
                {groupMembers.map(u => (
                  <button key={u.id} type="button" onClick={() => toggleAssignee(u.id)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-gray-50 text-left">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${assignees.includes(u.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                      {assignees.includes(u.id) && <div className="w-2 h-2 bg-white rounded-sm" />}
                    </div>
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
            {photo ? (
              <div className="relative rounded-lg overflow-hidden">
                <img src={photo} alt="Task photo" className="w-full h-40 object-cover" />
                <button
                  type="button"
                  onClick={() => setPhoto(null)}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                <Upload size={24} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400 mb-3">
                  {blockGallery ? 'Camera only (gallery blocked by group settings)' : 'Upload or capture a photo'}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCamera(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-700"
                  >
                    <Camera size={14} /> Camera
                  </button>
                  {!blockGallery && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200"
                    >
                      <Image size={14} /> Library
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            )}
          </div>

          {/* Asset required hint */}
          {selectedGroup?.assetRequired && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 flex items-start gap-2">
              <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">This group requires an asset to be linked. You can add it after creating the task from the task detail page.</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit"
              className="flex-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg py-2.5 text-sm font-medium">Create Fix</button>
          </div>
        </form>
      </div>
    </div>
  );
}
