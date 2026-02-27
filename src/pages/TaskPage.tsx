import { useParams, useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import CameraCapture from '../components/ui/CameraCapture';
import {
  ChevronLeft, Trash2, MessageCircle, User, Plus, X, ChevronDown,
  Edit2, Calendar, Clock, Bell, BellOff, MoreVertical, Check,
  ImagePlus, MapPin, Package, CheckCircle2, Circle, Timer, Copy,
} from 'lucide-react';
import { format, formatDistanceToNow, isAfter } from 'date-fns';
import { useNotifications } from '../context/NotificationContext';
import { currentUser } from '../data/mockData';
import type { TaskStatus, Priority } from '../types';

const statusConfig: Record<TaskStatus, { label: string; dot: string; activeBg: string }> = {
  open:        { label: 'Open',        dot: 'bg-red-500',    activeBg: 'bg-red-100 text-red-700 border-red-200' },
  in_progress: { label: 'In Progress', dot: 'bg-yellow-400', activeBg: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  done:        { label: 'Done',        dot: 'bg-green-500',  activeBg: 'bg-green-100 text-green-700 border-green-200' },
};

const priorityConfig: Record<Priority, { label: string; cls: string }> = {
  high:   { label: 'High',   cls: 'bg-red-100 text-red-700 border-red-200' },
  medium: { label: 'Medium', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  low:    { label: 'Low',    cls: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const LOCATION_OPTIONS = [
  'Barefoot Kids room', 'Beach Club', 'BOH A Zone', 'BOH B Zone', 'Cup Building',
  'Date palms', 'Dining Kitchen', 'Dining Main Hall', 'Farm House', 'Generator Room',
  'Guest House', 'Main Entrance', 'Pool Area', 'Security Post', 'Staff Accommodation',
  'Store Room', 'Workshop',
];

const EQUIPMENT_OPTIONS = [
  'AC Unit', 'Bicycle', 'Dyna Truck', 'Fire Extinguisher', 'Generator',
  'JCB', 'Pool Pump', 'RO System', 'Sprinkler System', 'Water Heater',
];

const CATEGORY_OPTIONS = [
  'Cleaning', 'Inspection', 'Installation', 'Maintenance', 'Operations', 'Repair', 'Safety',
];

export default function TaskPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tasks, updateTask, deleteTask, addTask, teamMembers, groups } = useNotifications();
  const task = tasks.find(t => t.id === id);

  const [showDelete,        setShowDelete]        = useState(false);
  const [showCamera,        setShowCamera]        = useState(false);
  const [showApprovalDlg,   setShowApprovalDlg]   = useState(false);
  const [comment,           setComment]           = useState('');
  const [showAssigneeMenu,  setShowAssigneeMenu]  = useState(false);
  const [showLocMenu,       setShowLocMenu]       = useState(false);
  const [showEqMenu,        setShowEqMenu]        = useState(false);
  const [showCatMenu,       setShowCatMenu]       = useState(false);
  const [showMoreMenu,      setShowMoreMenu]      = useState(false);
  const [editingTitle,      setEditingTitle]      = useState(false);
  const [titleDraft,        setTitleDraft]        = useState('');
  const [editingDesc,       setEditingDesc]       = useState(false);
  const [descDraft,         setDescDraft]         = useState('');
  const [isWatching,        setIsWatching]        = useState(false);
  const [showEstMenu,       setShowEstMenu]       = useState(false);
  // Sub-tasks
  const [newSubtaskText,    setNewSubtaskText]    = useState('');
  const [showAddSubtask,    setShowAddSubtask]    = useState(false);
  // Time log
  const [showAddTime,       setShowAddTime]       = useState(false);
  const [timeMinutes,       setTimeMinutes]       = useState('');
  const [timeNote,          setTimeNote]          = useState('');

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <p>Task not found</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline text-sm">Go back</button>
      </div>
    );
  }

  const group = groups.find(g => g.id === task.groupId);
  const requiresApproval = group?.requiresApproval ?? false;
  const checklistMustComplete = group?.checklistMustComplete ?? false;
  const checklistAutoYellow = group?.checklistAutoYellow ?? false;
  const checklistAutoGreen = group?.checklistAutoGreen ?? false;
  const blockGallery = group?.blockGalleryPhotos ?? false;
  const allPhotos = task.photos?.length ? task.photos : (task.image ? [task.image] : []);
  const cfg = statusConfig[task.status];
  const assignedUsers = teamMembers.filter(u => task.assignees.includes(u.id));
  const unassignedUsers = teamMembers.filter(u => !task.assignees.includes(u.id) && u.accepted !== false);
  const isOverdue = !!task.dueDate && task.status !== 'done' && isAfter(new Date(), task.dueDate);

  // Derived activity items
  const activityItems = [
    { id: 'created', text: 'Task created', time: task.createdAt, user: 'System', emoji: '🔧' },
    ...(task.activityLog ?? []).map(a => ({ id: a.id, text: a.action, time: a.timestamp, user: a.userName, emoji: '📝' })),
    ...task.comments.map(c => ({
      id: `cmt-${c.id}`, text: `"${c.text.slice(0, 50)}${c.text.length > 50 ? '…' : ''}"`,
      time: c.createdAt, user: c.userName, emoji: '💬',
    })),
  ].sort((a, b) => a.time.getTime() - b.time.getTime());

  // ── Handlers ──

  const closeAllMenus = () => {
    setShowAssigneeMenu(false); setShowLocMenu(false);
    setShowEqMenu(false); setShowCatMenu(false);
    setShowMoreMenu(false); setShowEstMenu(false);
    setShowAddSubtask(false); setShowAddTime(false);
  };

  const handleStatus = (status: TaskStatus) => {
    if (status === 'done') {
      // Enforce checklist-must-complete rule
      if (checklistMustComplete && (task.subtasks?.length ?? 0) > 0) {
        const allDone = task.subtasks!.every(s => s.done);
        if (!allDone) {
          alert('Checklist must be 100% complete before this task can be set to Done (group rule).');
          return;
        }
      }
      // Require approval
      if (requiresApproval && task.status !== 'done') {
        setShowApprovalDlg(true);
        return;
      }
    }
    updateTask(id!, { status });
  };

  const handleSendComment = () => {
    if (!comment.trim()) return;
    updateTask(id!, {
      comments: [...task.comments, {
        id: `c${Date.now()}`, userId: currentUser.id,
        userName: currentUser.name, text: comment.trim(), createdAt: new Date(),
      }],
    });
    setComment('');
  };

  const handleDelete = () => { deleteTask(id!); navigate(-1); };

  const handleDuplicate = () => {
    const newId = `t${Date.now()}`;
    addTask({
      ...task,
      id: newId,
      title: `Copy of ${task.title}`,
      createdAt: new Date(),
      status: 'open',
      comments: [],
      activityLog: [],
      timeEntries: [],
    });
    setShowMoreMenu(false);
    navigate(`/fix/task/${newId}`);
  };

  const addAssignee = (userId: string) => {
    if (!task.assignees.includes(userId))
      updateTask(id!, { assignees: [...task.assignees, userId] });
    setShowAssigneeMenu(false);
  };

  const removeAssignee = (userId: string) =>
    updateTask(id!, { assignees: task.assignees.filter(a => a !== userId) });

  const setTag = (field: 'location' | 'equipment' | 'category', value: string | undefined) =>
    updateTask(id!, { tags: { ...task.tags, [field]: value } });

  const saveTitle = () => {
    const t = titleDraft.trim();
    if (t) updateTask(id!, { title: t });
    setEditingTitle(false);
  };

  const saveDesc = () => {
    updateTask(id!, { description: descDraft.trim() || undefined });
    setEditingDesc(false);
  };

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateTask(id!, { dueDate: e.target.value ? new Date(e.target.value) : undefined });
  };

  const EST_OPTIONS = [15, 30, 45, 60, 90, 120, 180, 240];

  // Sub-task handlers
  const addSubtask = () => {
    if (!newSubtaskText.trim()) return;
    updateTask(id!, { subtasks: [...(task.subtasks ?? []), { id: `st${Date.now()}`, text: newSubtaskText.trim(), done: false }] });
    setNewSubtaskText(''); setShowAddSubtask(false);
  };
  const toggleSubtask = (stId: string) => {
    const updated = task.subtasks?.map(s => s.id === stId ? { ...s, done: !s.done } : s) ?? [];
    const anyDone = updated.some(s => s.done);
    const allDone = updated.length > 0 && updated.every(s => s.done);
    let newStatus: TaskStatus | undefined;
    if (allDone && checklistAutoGreen && task.status !== 'done') newStatus = 'done';
    else if (anyDone && checklistAutoYellow && task.status === 'open') newStatus = 'in_progress';
    updateTask(id!, { subtasks: updated, ...(newStatus ? { status: newStatus } : {}) });
  };
  const removeSubtask = (stId: string) =>
    updateTask(id!, { subtasks: task.subtasks?.filter(s => s.id !== stId) });

  const photoFileRef = useRef<HTMLInputElement>(null);
  const handleGalleryPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target!.result as string;
      updateTask(id!, { photos: [...(task.photos ?? []), dataUrl] });
    };
    reader.readAsDataURL(file);
  };

  // Time log handlers
  const addTimeEntry = () => {
    const mins = parseInt(timeMinutes);
    if (!mins || mins <= 0) return;
    updateTask(id!, {
      timeEntries: [...(task.timeEntries ?? []), {
        id: `te${Date.now()}`, date: new Date(), minutes: mins,
        userId: currentUser.id, userName: currentUser.name,
        note: timeNote.trim() || undefined,
      }],
    });
    setTimeMinutes(''); setTimeNote(''); setShowAddTime(false);
  };
  const totalLoggedMinutes = (task.timeEntries ?? []).reduce((s, e) => s + e.minutes, 0);
  const fmtMins = (m: number) => m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}` : `${m}m`;

  return (
    <div
      className="h-full flex flex-col bg-gray-50"
      onClick={closeAllMenus}
    >
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-2 flex-shrink-0">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 flex-shrink-0">
          <ChevronLeft size={20} />
        </button>

        {editingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={e => setTitleDraft(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
            className="flex-1 text-base font-semibold text-gray-900 border-b-2 border-blue-500 outline-none bg-transparent"
          />
        ) : (
          <h1 className="flex-1 text-base font-semibold text-gray-900 truncate">{task.title}</h1>
        )}

        {/* Watch */}
        <button
          onClick={e => { e.stopPropagation(); setIsWatching(v => !v); }}
          className={`p-1.5 rounded-lg flex-shrink-0 ${isWatching ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:bg-gray-100'}`}
          title={isWatching ? 'Unwatch' : 'Watch task'}
        >
          {isWatching ? <Bell size={18} /> : <BellOff size={18} />}
        </button>

        {/* 3-dot menu */}
        <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={() => setShowMoreMenu(m => !m)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <MoreVertical size={18} />
          </button>
          {showMoreMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 w-44">
              <button
                onClick={() => { setTitleDraft(task.title); setEditingTitle(true); setShowMoreMenu(false); }}
                className="flex items-center gap-2 w-full px-3 py-2.5 hover:bg-gray-50 text-sm text-gray-700"
              >
                <Edit2 size={14} className="text-gray-400" /> Edit Title
              </button>
              <button
                onClick={handleDuplicate}
                className="flex items-center gap-2 w-full px-3 py-2.5 hover:bg-gray-50 text-sm text-gray-700 border-t border-gray-100"
              >
                <Copy size={14} className="text-gray-400" /> Duplicate Task
              </button>
              <button
                onClick={() => { setShowMoreMenu(false); setShowDelete(true); }}
                className="flex items-center gap-2 w-full px-3 py-2.5 hover:bg-red-50 text-sm text-red-600 border-t border-gray-100"
              >
                <Trash2 size={14} /> Delete Task
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ── Photo gallery ── */}
        {allPhotos.length > 0 ? (
          <div className="relative bg-gray-900">
            <div className="flex overflow-x-auto snap-x snap-mandatory">
              {allPhotos.map((photo, i) => (
                <div key={i} className="flex-shrink-0 w-full snap-center">
                  <img src={photo} alt="" className="w-full h-52 object-cover" />
                </div>
              ))}
            </div>
            {allPhotos.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                {allPhotos.map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/70" />
                ))}
              </div>
            )}
            <div className="absolute bottom-3 left-3 flex gap-1.5">
              <button
                onClick={() => setShowCamera(true)}
                className="flex items-center gap-1.5 bg-black/50 hover:bg-black/70 text-white text-xs px-2.5 py-1.5 rounded-full"
              >
                <ImagePlus size={12} /> Camera
              </button>
              {!blockGallery && (
                <button
                  onClick={() => photoFileRef.current?.click()}
                  className="flex items-center gap-1.5 bg-black/50 hover:bg-black/70 text-white text-xs px-2.5 py-1.5 rounded-full"
                >
                  <ImagePlus size={12} /> Gallery
                </button>
              )}
            </div>
            <input ref={photoFileRef} type="file" accept="image/*" className="hidden" onChange={handleGalleryPhoto} />
            <div className="absolute top-3 right-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.activeBg}`}>
                {cfg.label}
              </span>
            </div>
          </div>
        ) : (
          <div className="relative flex items-center gap-3 px-4 h-20" style={{ backgroundColor: task.groupColor + '15' }}>
            <span className={`w-4 h-4 rounded-full ${cfg.dot} flex-shrink-0`} />
            <span className="text-sm font-medium text-gray-600 flex-1">{cfg.label}</span>
            <div className="flex gap-1.5 flex-shrink-0">
              <button
                onClick={() => setShowCamera(true)}
                className="flex items-center gap-1.5 bg-white/80 hover:bg-white text-gray-600 text-xs px-3 py-1.5 rounded-full border border-gray-200"
              >
                <ImagePlus size={13} /> Camera
              </button>
              {!blockGallery && (
                <button
                  onClick={() => photoFileRef.current?.click()}
                  className="flex items-center gap-1.5 bg-white/80 hover:bg-white text-gray-600 text-xs px-3 py-1.5 rounded-full border border-gray-200"
                >
                  <ImagePlus size={13} /> Gallery
                </button>
              )}
            </div>
          </div>
        )}

        <div className="p-4 space-y-3">
          {/* ── Status ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2.5">Status</p>
            <div className="flex gap-2">
              {(['open', 'in_progress', 'done'] as TaskStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => handleStatus(s)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors
                    ${task.status === s ? statusConfig[s].activeBg : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${task.status === s ? statusConfig[s].dot : 'bg-gray-300'}`} />
                    {statusConfig[s].label}
                  </span>
                </button>
              ))}
            </div>
            {requiresApproval && task.status === 'done' && (
              <div className="mt-2 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <CheckCircle2 size={14} className="text-amber-500 flex-shrink-0" />
                <p className="text-xs text-amber-700 font-medium">Pending admin approval</p>
              </div>
            )}
          </div>

          {/* ── Priority + Due Date ── */}
          <div className="grid grid-cols-2 gap-3">
            {/* Priority */}
            <div className="bg-white rounded-xl border border-gray-200 p-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Priority</p>
              <div className="flex flex-col gap-1.5">
                {(['high', 'medium', 'low'] as Priority[]).map(p => (
                  <button
                    key={p}
                    onClick={() => updateTask(id!, { priority: p })}
                    className={`w-full py-1 rounded-lg text-[11px] font-semibold border transition-colors
                      ${task.priority === p ? priorityConfig[p].cls : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'}`}
                  >
                    {task.priority === p && <span className="mr-1">✓</span>}
                    {priorityConfig[p].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date + Est Time */}
            <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-3">
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Due Date</p>
                <label className={`flex items-center gap-1.5 cursor-pointer ${isOverdue ? 'text-red-600' : task.dueDate ? 'text-blue-600' : 'text-gray-400'}`}>
                  <Calendar size={13} className="flex-shrink-0" />
                  <input
                    type="date"
                    value={task.dueDate ? format(task.dueDate, 'yyyy-MM-dd') : ''}
                    onChange={handleDueDateChange}
                    className={`text-xs font-medium border-none outline-none bg-transparent cursor-pointer w-full
                      ${isOverdue ? 'text-red-600' : task.dueDate ? 'text-blue-600' : 'text-gray-400'}`}
                  />
                </label>
                {isOverdue && <p className="text-[10px] text-red-500 mt-0.5">Overdue!</p>}
              </div>

              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Est. Time</p>
                <div className="relative" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setShowEstMenu(m => !m)}
                    className="flex items-center gap-1.5 text-xs font-medium text-blue-600 w-full"
                  >
                    <Clock size={13} className="flex-shrink-0 text-gray-400" />
                    <span className="truncate">
                      {task.estimatedMinutes
                        ? task.estimatedMinutes >= 60
                          ? `${Math.floor(task.estimatedMinutes / 60)}h${task.estimatedMinutes % 60 ? ` ${task.estimatedMinutes % 60}m` : ''}`
                          : `${task.estimatedMinutes}m`
                        : 'Set time'}
                    </span>
                    <ChevronDown size={12} className="ml-auto text-gray-400 flex-shrink-0" />
                  </button>
                  {showEstMenu && (
                    <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 w-36">
                      <button
                        onClick={() => { updateTask(id!, { estimatedMinutes: undefined }); setShowEstMenu(false); }}
                        className="w-full px-3 py-2 text-xs text-gray-400 hover:bg-gray-50 text-left border-b border-gray-100"
                      >
                        Clear
                      </button>
                      {EST_OPTIONS.map(min => (
                        <button
                          key={min}
                          onClick={() => { updateTask(id!, { estimatedMinutes: min }); setShowEstMenu(false); }}
                          className={`w-full px-3 py-2 text-xs text-left hover:bg-gray-50 flex justify-between
                            ${task.estimatedMinutes === min ? 'text-blue-600 font-medium' : 'text-gray-700'}`}
                        >
                          {min >= 60 ? `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ''}` : `${min}m`}
                          {task.estimatedMinutes === min && <Check size={12} className="text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Assignees ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Assignees</p>
              <div className="relative" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setShowAssigneeMenu(m => !m)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Plus size={13} /> Add
                </button>
                {showAssigneeMenu && unassignedUsers.length > 0 && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 w-52 max-h-60 overflow-y-auto">
                    {unassignedUsers.map(u => (
                      <button
                        key={u.id}
                        onClick={() => addAssignee(u.id)}
                        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 text-left"
                      >
                        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                          <p className="text-[10px] text-gray-400 truncate">{u.role}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {assignedUsers.length === 0 ? (
              <p className="text-sm text-gray-400">No assignees yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {assignedUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-1.5 bg-gray-100 rounded-full pl-1 pr-2 py-1">
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <span className="text-xs font-medium text-gray-700">{u.name.split(' ')[0]}</span>
                    <button onClick={() => removeAssignee(u.id)} className="text-gray-400 hover:text-red-500 ml-0.5">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Tags ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2.5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Tags</p>
            {([
              { field: 'location' as const, emoji: '📍', label: 'Location', opts: LOCATION_OPTIONS, show: showLocMenu, toggle: () => { setShowLocMenu(m => !m); setShowEqMenu(false); setShowCatMenu(false); }, close: () => setShowLocMenu(false) },
              { field: 'equipment' as const, emoji: '🔧', label: 'Equipment', opts: EQUIPMENT_OPTIONS, show: showEqMenu, toggle: () => { setShowEqMenu(m => !m); setShowLocMenu(false); setShowCatMenu(false); }, close: () => setShowEqMenu(false) },
              { field: 'category' as const, emoji: '🏷', label: 'Category', opts: CATEGORY_OPTIONS, show: showCatMenu, toggle: () => { setShowCatMenu(m => !m); setShowLocMenu(false); setShowEqMenu(false); }, close: () => setShowCatMenu(false) },
            ]).map(({ field, emoji, label, opts, show, toggle, close }) => (
              <div key={field} className="flex items-center justify-between" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{emoji}</span>
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </div>
                <div className="relative">
                  <button onClick={toggle} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                    <span className="max-w-[110px] truncate">{task.tags?.[field] ?? 'Set tag'}</span>
                    <ChevronDown size={13} />
                  </button>
                  {show && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 w-52 max-h-56 overflow-y-auto">
                      <button
                        onClick={() => { setTag(field, undefined); close(); }}
                        className="flex items-center w-full px-3 py-2 hover:bg-gray-50 text-sm text-gray-400 border-b border-gray-100"
                      >
                        Clear
                      </button>
                      {opts.map(opt => (
                        <button
                          key={opt}
                          onClick={() => { setTag(field, opt); close(); }}
                          className={`flex items-center justify-between w-full px-3 py-2 hover:bg-gray-50 text-sm text-left
                            ${task.tags?.[field] === opt ? 'text-blue-600 font-medium' : 'text-gray-700'}`}
                        >
                          {opt}
                          {task.tags?.[field] === opt && <Check size={12} className="text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ── Description ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Description</p>
              {!editingDesc && (
                <button
                  onClick={() => { setDescDraft(task.description ?? ''); setEditingDesc(true); }}
                  className="p-1 rounded hover:bg-gray-100 text-gray-400"
                >
                  <Edit2 size={13} />
                </button>
              )}
            </div>
            {editingDesc ? (
              <div className="space-y-2">
                <textarea
                  autoFocus
                  value={descDraft}
                  onChange={e => setDescDraft(e.target.value)}
                  rows={4}
                  placeholder="Add a description…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="flex gap-2">
                  <button onClick={() => setEditingDesc(false)} className="flex-1 border border-gray-200 rounded-lg py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button onClick={saveDesc} className="flex-1 bg-blue-600 text-white rounded-lg py-1.5 text-xs font-medium hover:bg-blue-700">Save</button>
                </div>
              </div>
            ) : (
              <p className={`text-sm leading-relaxed ${task.description ? 'text-gray-700' : 'text-gray-400 italic'}`}>
                {task.description || 'No description. Tap the edit icon to add one.'}
              </p>
            )}
          </div>

          {/* ── Sub-tasks / Checklist ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Checklist</p>
                {(task.subtasks?.length ?? 0) > 0 && (
                  <span className="text-xs text-gray-500 font-medium">
                    {task.subtasks!.filter(s => s.done).length}/{task.subtasks!.length}
                  </span>
                )}
              </div>
              <button onClick={() => setShowAddSubtask(v => !v)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                <Plus size={13} /> Add
              </button>
            </div>
            {(task.subtasks?.length ?? 0) > 0 && (
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                <div className="h-1.5 rounded-full bg-blue-500 transition-all"
                  style={{ width: `${Math.round((task.subtasks!.filter(s => s.done).length / task.subtasks!.length) * 100)}%` }} />
              </div>
            )}
            <div className="space-y-1.5">
              {(task.subtasks ?? []).map(st => (
                <div key={st.id} className="flex items-center gap-2 group">
                  <button onClick={() => toggleSubtask(st.id)}
                    className={`flex-shrink-0 transition-colors ${st.done ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'}`}>
                    {st.done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  </button>
                  <p className={`flex-1 text-sm ${st.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{st.text}</p>
                  <button onClick={() => removeSubtask(st.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-opacity flex-shrink-0">
                    <X size={13} />
                  </button>
                </div>
              ))}
              {(task.subtasks ?? []).length === 0 && !showAddSubtask && (
                <p className="text-sm text-gray-400 italic">No checklist items</p>
              )}
            </div>
            {showAddSubtask && (
              <div className="flex items-center gap-2 mt-2">
                <input autoFocus value={newSubtaskText} onChange={e => setNewSubtaskText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addSubtask(); if (e.key === 'Escape') setShowAddSubtask(false); }}
                  placeholder="Add checklist item…"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={addSubtask} disabled={!newSubtaskText.trim()}
                  className="p-1.5 bg-blue-600 text-white rounded-lg disabled:opacity-40"><Check size={14} /></button>
                <button onClick={() => { setShowAddSubtask(false); setNewSubtaskText(''); }}
                  className="p-1.5 text-gray-400 hover:text-gray-600"><X size={14} /></button>
              </div>
            )}
          </div>

          {/* ── Details ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-3">Details</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5 font-semibold uppercase">Group</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: task.groupColor }} />
                  <p className="text-sm font-medium text-gray-900 truncate">{task.groupName}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5 font-semibold uppercase">Created</p>
                <p className="text-sm font-medium text-gray-900">{format(task.createdAt, 'dd MMM yyyy')}</p>
                <p className="text-[10px] text-gray-400">{format(task.createdAt, 'HH:mm')}</p>
              </div>
              {task.areaId && (
                <div>
                  <p className="text-[10px] text-gray-400 mb-0.5 font-semibold uppercase">Area</p>
                  <div className="flex items-center gap-1">
                    <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                    <p className="text-sm font-medium text-gray-900 truncate">{task.areaId}</p>
                  </div>
                </div>
              )}
              {task.assetName && (
                <div>
                  <p className="text-[10px] text-gray-400 mb-0.5 font-semibold uppercase">Asset</p>
                  <div className="flex items-center gap-1">
                    <Package size={12} className="text-gray-400 flex-shrink-0" />
                    <p className="text-sm font-medium text-gray-900 truncate">{task.assetName}</p>
                  </div>
                </div>
              )}
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5 font-semibold uppercase">Work Order #</p>
                <p className="text-xs font-mono text-gray-600">{task.id.toUpperCase()}</p>
              </div>
              {task.dueDate && (
                <div>
                  <p className="text-[10px] text-gray-400 mb-0.5 font-semibold uppercase">Due</p>
                  <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                    {format(task.dueDate, 'dd MMM yyyy')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Time Log ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Time Log</p>
                {totalLoggedMinutes > 0 && (
                  <span className="text-xs font-semibold text-blue-600">{fmtMins(totalLoggedMinutes)} logged</span>
                )}
              </div>
              <button onClick={() => setShowAddTime(v => !v)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                <Plus size={13} /> Log Time
              </button>
            </div>
            {(task.timeEntries ?? []).length > 0 && (
              <div className="space-y-2 mb-2">
                {(task.timeEntries ?? []).map(te => (
                  <div key={te.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <Timer size={13} className="text-blue-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-blue-600">{fmtMins(te.minutes)}</span>
                        <span className="text-xs text-gray-400">· {te.userName} · {format(te.date, 'MMM d')}</span>
                      </div>
                      {te.note && <p className="text-xs text-gray-500 mt-0.5">{te.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {(task.timeEntries ?? []).length === 0 && !showAddTime && (
              <p className="text-sm text-gray-400 italic">No time logged yet</p>
            )}
            {showAddTime && (
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2">
                  <select value={timeMinutes} onChange={e => setTimeMinutes(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select duration…</option>
                    {[15,30,45,60,90,120,180,240,300,480].map(m => (
                      <option key={m} value={m}>{fmtMins(m)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input value={timeNote} onChange={e => setTimeNote(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addTimeEntry(); }}
                    placeholder="Optional note…"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button onClick={addTimeEntry} disabled={!timeMinutes}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium disabled:opacity-40 flex-shrink-0">
                    Save
                  </button>
                  <button onClick={() => { setShowAddTime(false); setTimeMinutes(''); setTimeNote(''); }}
                    className="p-1.5 text-gray-400 hover:text-gray-600"><X size={14} /></button>
                </div>
              </div>
            )}
          </div>

          {/* ── Activity Log ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-3">Activity</p>
            <div className="space-y-0">
              {activityItems.map((item, i) => (
                <div key={item.id} className="flex gap-2.5">
                  <div className="flex flex-col items-center flex-shrink-0 w-6">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs flex-shrink-0">
                      {item.emoji}
                    </div>
                    {i < activityItems.length - 1 && <div className="w-px flex-1 bg-gray-100 my-1 min-h-[8px]" />}
                  </div>
                  <div className="flex-1 min-w-0 pb-3">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-semibold text-gray-700 truncate">{item.user === 'System' ? 'System' : item.user}</span>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">{formatDistanceToNow(item.time, { addSuffix: true })}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.text}</p>
                  </div>
                </div>
              ))}
              {/* Current status */}
              <div className="flex gap-2.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.activeBg.split(' ')[0]}`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-700">Current Status</p>
                  <p className="text-xs text-gray-500 mt-0.5">{cfg.label}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Comments ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle size={15} className="text-gray-400" />
              <p className="text-sm font-semibold text-gray-700">Comments ({task.comments.length})</p>
            </div>
            {task.comments.length > 0 && (
              <div className="space-y-3 mb-3">
                {task.comments.map(c => (
                  <div key={c.id} className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                      {c.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-xs font-semibold text-gray-700">{c.userName}</p>
                        <p className="text-[10px] text-gray-400">{format(c.createdAt, 'MMM d · HH:mm')}</p>
                      </div>
                      <p className="text-sm text-gray-800">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <User size={14} className="text-white" />
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendComment()}
                  placeholder="Add a comment…"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {comment.trim() && (
                  <button onClick={handleSendComment} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium">
                    Send
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Camera capture ── */}
      {showCamera && (
        <CameraCapture
          onCapture={dataUrl => {
            const currentPhotos = task.photos?.length ? task.photos : (task.image ? [task.image] : []);
            updateTask(id!, { photos: [...currentPhotos, dataUrl] });
            setShowCamera(false);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* ── Approval confirm ── */}
      {showApprovalDlg && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <CheckCircle2 size={32} className="text-amber-500 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-2 text-center">Submit for Approval?</h3>
            <p className="text-sm text-gray-500 mb-5 text-center">
              This group requires admin approval. The task will be marked as <strong>Pending Approval</strong> until an admin confirms.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowApprovalDlg(false)} className="flex-1 border border-gray-300 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => { updateTask(id!, { status: 'done' }); setShowApprovalDlg(false); }}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl py-2.5 text-sm font-medium"
              >Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ── */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Delete Task?</h3>
            <p className="text-sm text-gray-500 mb-1 truncate font-medium">"{task.title}"</p>
            <p className="text-sm text-gray-400 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)} className="flex-1 border border-gray-300 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2.5 text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
