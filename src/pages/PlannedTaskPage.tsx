import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Calendar, Clock, RefreshCw, Trash2, Edit2, Check, X,
  MapPin, Package, Play, CheckCircle2, MinusCircle, Plus, Users, Copy,
} from 'lucide-react';
import { format, addDays, addWeeks, addMonths, addYears, subDays, subWeeks, subMonths, subYears } from 'date-fns';
import { useNotifications } from '../context/NotificationContext';
import type { PlannedTask } from '../types';

const RECURRENCE_LABELS: Record<PlannedTask['recurrence'], string> = {
  never: 'Once (no repeat)',
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly (every 2 weeks)',
  monthly: 'Monthly',
  quarterly: 'Quarterly (every 3 months)',
  yearly: 'Yearly',
};

const RECURRENCE_COLORS: Record<PlannedTask['recurrence'], string> = {
  never: 'bg-gray-100 text-gray-600',
  daily: 'bg-orange-100 text-orange-700',
  weekly: 'bg-blue-100 text-blue-700',
  biweekly: 'bg-indigo-100 text-indigo-700',
  monthly: 'bg-purple-100 text-purple-700',
  quarterly: 'bg-pink-100 text-pink-700',
  yearly: 'bg-green-100 text-green-700',
};

const PRIORITY_STYLES: Record<'high' | 'medium' | 'low', string> = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-green-100 text-green-700 border-green-200',
};

function advanceDate(date: Date, recurrence: PlannedTask['recurrence']): Date | null {
  switch (recurrence) {
    case 'daily':     return addDays(date, 1);
    case 'weekly':    return addWeeks(date, 1);
    case 'biweekly':  return addWeeks(date, 2);
    case 'monthly':   return addMonths(date, 1);
    case 'quarterly': return addMonths(date, 3);
    case 'yearly':    return addYears(date, 1);
    default:          return null;
  }
}

function getNextOccurrences(task: PlannedTask, count = 4): Date[] {
  if (!task.enabled || task.recurrence === 'never') return [];
  const dates: Date[] = [];
  let current = new Date(task.scheduledAt);
  const now = new Date();
  while (current < now) {
    const next = advanceDate(current, task.recurrence);
    if (!next) break;
    current = next;
  }
  for (let i = 0; i < count; i++) {
    dates.push(new Date(current));
    const next = advanceDate(current, task.recurrence);
    if (!next) break;
    current = next;
  }
  return dates;
}

function getPastOccurrences(task: PlannedTask, count = 4): Date[] {
  if (task.recurrence === 'never') return [];
  const dates: Date[] = [];
  let current = new Date(task.scheduledAt);
  for (let i = 0; i < count; i++) {
    switch (task.recurrence) {
      case 'daily':     current = subDays(current, 1); break;
      case 'weekly':    current = subWeeks(current, 1); break;
      case 'biweekly':  current = subWeeks(current, 2); break;
      case 'monthly':   current = subMonths(current, 1); break;
      case 'quarterly': current = subMonths(current, 3); break;
      case 'yearly':    current = subYears(current, 1); break;
      default: return dates;
    }
    dates.push(new Date(current));
  }
  return dates;
}

// Deterministic "completed by" from task ID + run index
function getRunStatus(taskId: string, idx: number): 'completed' | 'skipped' {
  const hash = taskId.charCodeAt(taskId.length - 1) + idx;
  return hash % 5 === 3 ? 'skipped' : 'completed';
}

export default function PlannedTaskPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { plannedTasks, updatePlannedTask, deletePlannedTask, addPlannedTask, groups, areas, assets, addTask, teamMembers } = useNotifications();

  const task = plannedTasks.find(t => t.id === id);

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editGroupId, setEditGroupId] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editRecurrence, setEditRecurrence] = useState<PlannedTask['recurrence']>('weekly');
  const [editPriority, setEditPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [editEstimatedMinutes, setEditEstimatedMinutes] = useState('');
  const [editAreaId, setEditAreaId] = useState('');
  const [editAssetId, setEditAssetId] = useState('');
  const [editAssigneeIds, setEditAssigneeIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRunConfirm, setShowRunConfirm] = useState(false);
  const [runSuccess, setRunSuccess] = useState(false);
  const [duplicateSuccess, setDuplicateSuccess] = useState(false);
  const [showAddAssignee, setShowAddAssignee] = useState(false);
  const [newStepText, setNewStepText] = useState('');
  const [showAddStep, setShowAddStep] = useState(false);

  if (!task) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400">
        <p className="text-lg font-medium">Task not found</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-sm text-blue-600 hover:underline">Go back</button>
      </div>
    );
  }

  const startEdit = () => {
    setEditTitle(task.title);
    setEditDescription(task.description ?? '');
    setEditGroupId(task.groupId);
    setEditDate(format(task.scheduledAt, 'yyyy-MM-dd'));
    setEditTime(format(task.scheduledAt, 'HH:mm'));
    setEditRecurrence(task.recurrence);
    setEditPriority(task.priority ?? 'medium');
    setEditEstimatedMinutes(task.estimatedMinutes ? String(task.estimatedMinutes) : '');
    setEditAreaId(task.areaId ?? '');
    setEditAssetId(task.assetId ?? '');
    setEditAssigneeIds(task.assigneeIds ?? []);
    setEditing(true);
  };

  const saveEdit = () => {
    const [y, m, d] = editDate.split('-').map(Number);
    const [h, min] = editTime.split(':').map(Number);
    const grp = groups.find(g => g.id === editGroupId)!;
    const area = areas.find(a => a.id === editAreaId);
    const asset = assets.find(a => a.id === editAssetId);
    updatePlannedTask(task.id, {
      title: editTitle.trim() || task.title,
      description: editDescription,
      groupId: grp.id,
      groupName: grp.name,
      groupColor: grp.color,
      scheduledAt: new Date(y, m - 1, d, h, min),
      recurrence: editRecurrence,
      priority: editPriority,
      estimatedMinutes: editEstimatedMinutes ? parseInt(editEstimatedMinutes) : undefined,
      areaId: editAreaId || undefined,
      areaName: area?.name,
      assetId: editAssetId || undefined,
      assetName: asset?.name,
      assigneeIds: editAssigneeIds,
    });
    setEditing(false);
  };

  const handleDelete = () => {
    deletePlannedTask(task.id);
    navigate(-1);
  };

  const handleDuplicate = () => {
    addPlannedTask({
      ...task,
      id: `p${Date.now()}`,
      title: `Copy of ${task.title}`,
      enabled: false,
    });
    setDuplicateSuccess(true);
    setTimeout(() => setDuplicateSuccess(false), 4000);
  };

  const handleRunNow = () => {
    addTask({
      id: `t${Date.now()}`,
      title: task.title,
      groupId: task.groupId,
      groupName: task.groupName,
      groupColor: task.groupColor,
      areaId: task.areaId,
      status: 'open',
      priority: task.priority ?? 'medium',
      image: task.image,
      createdAt: new Date(),
      assignees: task.assigneeIds ?? [],
      description: task.description,
      comments: [],
      tags: {},
    });
    setShowRunConfirm(false);
    setRunSuccess(true);
    setTimeout(() => setRunSuccess(false), 4000);
  };

  const addAssignee = (userId: string) => {
    const ids = [...(task.assigneeIds ?? [])];
    if (!ids.includes(userId)) {
      updatePlannedTask(task.id, { assigneeIds: [...ids, userId] });
    }
    setShowAddAssignee(false);
  };

  const addChecklistStep = () => {
    if (!newStepText.trim()) return;
    const steps = [...(task.checklistSteps ?? []), { id: `s${Date.now()}`, text: newStepText.trim() }];
    updatePlannedTask(task.id, { checklistSteps: steps });
    setNewStepText('');
    setShowAddStep(false);
  };

  const removeChecklistStep = (stepId: string) => {
    const steps = (task.checklistSteps ?? []).filter(s => s.id !== stepId);
    updatePlannedTask(task.id, { checklistSteps: steps });
  };

  const removeAssignee = (userId: string) => {
    updatePlannedTask(task.id, { assigneeIds: (task.assigneeIds ?? []).filter(id => id !== userId) });
  };

  const toggleEditAssignee = (userId: string) => {
    setEditAssigneeIds(ids =>
      ids.includes(userId) ? ids.filter(id => id !== userId) : [...ids, userId]
    );
  };

  const nextOccurrences = getNextOccurrences(task);
  const pastOccurrences = getPastOccurrences(task);
  const completionCount = pastOccurrences.filter((_, i) => getRunStatus(task.id, i) === 'completed').length;
  const completionRate = pastOccurrences.length > 0 ? Math.round((completionCount / pastOccurrences.length) * 100) : 0;
  const groupIcon = groups.find(g => g.id === task.groupId)?.icon ?? '👥';
  const assignedUsers = teamMembers.filter(u => task.assigneeIds?.includes(u.id));
  const availableUsers = teamMembers.filter(u => u.accepted !== false && !task.assigneeIds?.includes(u.id));

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-gray-900 truncate">{task.title}</h1>
          <p className="text-xs text-gray-400">Planned Task</p>
        </div>
        <div className="flex items-center gap-2">
          {!editing && (
            <>
              <button
                onClick={() => setShowRunConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg font-medium"
              >
                <Play size={14} /> Run Now
              </button>
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <Edit2 size={14} /> Edit
              </button>
              <button
                onClick={handleDuplicate}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <Copy size={14} /> Duplicate
              </button>
            </>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Run success banner */}
      {runSuccess && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-2 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700 font-medium">
            Work order created in Fix — "{task.title}"
          </p>
          <button onClick={() => navigate('/fix')} className="ml-auto text-xs text-green-600 underline flex-shrink-0">View in Fix</button>
        </div>
      )}

      {/* Duplicate success banner */}
      {duplicateSuccess && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-blue-600 flex-shrink-0" />
          <p className="text-sm text-blue-700 font-medium">
            Task duplicated — "Copy of {task.title}" created as disabled
          </p>
          <button onClick={() => navigate('/plan')} className="ml-auto text-xs text-blue-600 underline flex-shrink-0">View in Plan</button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto bg-gray-50">
        {/* Banner image */}
        <div className="w-full h-48 bg-gray-200 relative flex-shrink-0">
          {task.image
            ? <img src={task.image} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-gray-400"><span className="text-5xl">📋</span></div>
          }
          <div className="absolute top-3 right-3">
            <button
              onClick={() => updatePlannedTask(task.id, { enabled: !task.enabled })}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow
                ${task.enabled ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
              {task.enabled ? 'Active' : 'Disabled'}
            </button>
          </div>
          <div className="absolute bottom-3 left-3">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium shadow ${RECURRENCE_COLORS[task.recurrence]}`}>
              {RECURRENCE_LABELS[task.recurrence]}
            </span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {editing ? (
            /* ── Edit form ── */
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Edit Planned Task</h3>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Group</label>
                <select value={editGroupId} onChange={e => setEditGroupId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  {groups.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
                <div className="flex gap-2">
                  {(['high', 'medium', 'low'] as const).map(p => (
                    <button key={p} type="button" onClick={() => setEditPriority(p)}
                      className={`flex-1 py-1.5 text-sm rounded-lg border font-medium capitalize transition-colors
                        ${editPriority === p
                          ? p === 'high' ? 'bg-red-500 text-white border-red-500'
                            : p === 'medium' ? 'bg-yellow-500 text-white border-yellow-500'
                            : 'bg-green-500 text-white border-green-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                  <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Time</label>
                  <input type="time" value={editTime} onChange={e => setEditTime(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Recurrence</label>
                  <select value={editRecurrence} onChange={e => setEditRecurrence(e.target.value as PlannedTask['recurrence'])}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="never">Once</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Est. Minutes</label>
                  <input type="number" value={editEstimatedMinutes} onChange={e => setEditEstimatedMinutes(e.target.value)}
                    placeholder="60" min="5"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Area (optional)</label>
                  <select value={editAreaId} onChange={e => setEditAreaId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">— None —</option>
                    {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Asset (optional)</label>
                  <select value={editAssetId} onChange={e => setEditAssetId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">— None —</option>
                    {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Assignees in edit mode */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Assignees</label>
                <div className="flex flex-wrap gap-2">
                  {teamMembers.filter(u => u.accepted !== false).map(u => {
                    const sel = editAssigneeIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleEditAssignee(u.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs border font-medium transition-colors
                          ${sel ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                      >
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${sel ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-700'}`}
                          style={{ fontSize: 9 }}>
                          {u.name.charAt(0)}
                        </div>
                        {u.name.split(' ')[0]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setEditing(false)}
                  className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5">
                  <X size={14} /> Cancel
                </button>
                <button onClick={saveEdit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-1.5">
                  <Check size={14} /> Save Changes
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Title & group card */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-gray-900 leading-snug">{task.title}</h2>
                  {task.priority && (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border capitalize flex-shrink-0 ${PRIORITY_STYLES[task.priority]}`}>
                      {task.priority}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-base">{groupIcon}</span>
                  <span className="text-sm font-medium" style={{ color: task.groupColor }}>{task.groupName}</span>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: task.groupColor }} />
                </div>
                {task.description && (
                  <p className="text-sm text-gray-600 mt-3 leading-relaxed">{task.description}</p>
                )}
                {(task.assetName || task.areaName) && (
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 flex-wrap">
                    {task.assetName && (
                      <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
                        <Package size={12} className="text-gray-400" /> {task.assetName}
                      </span>
                    )}
                    {task.areaName && (
                      <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
                        <MapPin size={12} className="text-gray-400" /> {task.areaName}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Assignees */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users size={15} className="text-gray-400" />
                    <p className="text-sm font-semibold text-gray-700">Assignees</p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setShowAddAssignee(m => !m)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <Plus size={13} /> Add
                    </button>
                    {showAddAssignee && availableUsers.length > 0 && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 w-52 max-h-60 overflow-y-auto">
                        {availableUsers.map(u => (
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
                  <p className="text-sm text-gray-400">No assignees — tap Add to assign team members</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {assignedUsers.map(u => (
                      <div key={u.id} className="flex items-center gap-1.5 bg-gray-100 rounded-full pl-1 pr-2 py-1">
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <span className="text-xs font-medium text-gray-700">{u.name.split(' ')[0]}</span>
                        <button onClick={() => removeAssignee(u.id)} className="text-gray-400 hover:text-red-500 ml-0.5">
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Procedure Steps */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Procedure Steps</h3>
                  <button
                    onClick={() => setShowAddStep(v => !v)}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Plus size={13} /> Add Step
                  </button>
                </div>

                {(task.checklistSteps ?? []).length === 0 && !showAddStep && (
                  <p className="text-sm text-gray-400">No procedure steps yet — tap Add Step to define the checklist.</p>
                )}

                <div className="space-y-2">
                  {(task.checklistSteps ?? []).map((step, i) => (
                    <div key={step.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-b-0">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <p className="flex-1 text-sm text-gray-700 leading-relaxed">{step.text}</p>
                      <button
                        onClick={() => removeChecklistStep(step.id)}
                        className="text-gray-300 hover:text-red-400 flex-shrink-0 mt-0.5"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {showAddStep && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={newStepText}
                      onChange={e => setNewStepText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addChecklistStep(); }}
                      placeholder="Describe this step..."
                      autoFocus
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={addChecklistStep}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => { setShowAddStep(false); setNewStepText(''); }}
                      className="px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Schedule card */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Schedule</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Calendar size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Date</p>
                      <p className="text-sm font-medium text-gray-800">{format(task.scheduledAt, 'EEEE, MMMM d, yyyy')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Clock size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Time</p>
                      <p className="text-sm font-medium text-gray-800">{format(task.scheduledAt, 'HH:mm')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <RefreshCw size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Recurrence</p>
                      <p className="text-sm font-medium text-gray-800">{RECURRENCE_LABELS[task.recurrence]}</p>
                    </div>
                  </div>
                  {task.estimatedMinutes && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Clock size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Estimated Duration</p>
                        <p className="text-sm font-medium text-gray-800">
                          {task.estimatedMinutes >= 60
                            ? `${Math.floor(task.estimatedMinutes / 60)}h ${task.estimatedMinutes % 60 > 0 ? `${task.estimatedMinutes % 60}min` : ''}`
                            : `${task.estimatedMinutes} minutes`
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Next occurrences */}
              {nextOccurrences.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Next Occurrences</h3>
                  <div className="space-y-2">
                    {nextOccurrences.map((date, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                          ${i === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {i + 1}
                        </div>
                        <span className="text-sm text-gray-700">{format(date, 'EEE, MMM d, yyyy · HH:mm')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Run History */}
              {pastOccurrences.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700">Run History</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{completionCount}/{pastOccurrences.length} runs completed</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${completionRate >= 80 ? 'bg-green-500' : completionRate >= 60 ? 'bg-yellow-500' : 'bg-red-400'}`}
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold ${completionRate >= 80 ? 'text-green-600' : completionRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {completionRate}%
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {pastOccurrences.map((date, i) => {
                      const status = getRunStatus(task.id, i);
                      const durations = [task.estimatedMinutes ?? 45, (task.estimatedMinutes ?? 45) - 5, (task.estimatedMinutes ?? 45) + 10, (task.estimatedMinutes ?? 45) - 10];
                      const dur = durations[i % durations.length];
                      const runner = assignedUsers.length > 0
                        ? assignedUsers[i % assignedUsers.length].name
                        : teamMembers[i % Math.min(teamMembers.length, 3)].name;
                      return (
                        <div key={i} className="flex items-center gap-3 py-1">
                          {status === 'completed'
                            ? <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                            : <MinusCircle size={16} className="text-gray-300 flex-shrink-0" />
                          }
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800">{format(date, 'EEE, MMM d, yyyy · HH:mm')}</p>
                            {status === 'completed' && (
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                Completed in {dur}min · by {runner.split(' ')[0]}
                              </p>
                            )}
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0
                            ${status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {status === 'completed' ? 'Done' : 'Skipped'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Enable/disable toggle */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">Task Status</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {task.enabled
                      ? 'Active — will notify the group on schedule'
                      : "Disabled — won't send notifications"}
                  </p>
                </div>
                <button
                  onClick={() => updatePlannedTask(task.id, { enabled: !task.enabled })}
                  className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${task.enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-transform
                    ${task.enabled ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Run Now confirmation */}
      {showRunConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Play size={24} className="text-green-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 text-center mb-2">Run Task Now?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              This will create a new work order in Fix for "<strong>{task.title}</strong>" immediately, outside the regular schedule.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowRunConfirm(false)}
                className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleRunNow}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg py-2.5 text-sm font-medium">
                Run Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-4 sm:items-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Delete Planned Task?</h3>
            <p className="text-sm text-gray-500 mb-6">
              "{task.title}" will be permanently deleted. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2.5 text-sm font-medium">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
