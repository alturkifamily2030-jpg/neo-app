import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Plus, Search, X, Columns3, RefreshCw, CalendarRange,
  LayoutDashboard, Calendar as CalendarIcon, List, Clock, Play,
} from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay,
  isToday, addMonths, subMonths, getDay, addDays, isBefore, startOfWeek,
} from 'date-fns';
import type { PlannedTask, Group, Area, Asset, User } from '../types';
import { useNotifications } from '../context/NotificationContext';

type PlanTab = 'dashboard' | 'calendar' | 'tasks' | 'timeline';

const RECURRENCE_LABELS: Record<PlannedTask['recurrence'], string> = {
  never: 'Once',
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
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
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

function taskOccursOn(task: PlannedTask, day: Date): boolean {
  if (!task.enabled) return false;
  const scheduled = task.scheduledAt;
  const dayMid = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
  const schMid = new Date(scheduled.getFullYear(), scheduled.getMonth(), scheduled.getDate()).getTime();
  if (dayMid < schMid) return false;
  switch (task.recurrence) {
    case 'never':    return dayMid === schMid;
    case 'daily':    return true;
    case 'weekly': {
      const diff = Math.round((dayMid - schMid) / 86400000);
      return diff % 7 === 0;
    }
    case 'biweekly': {
      const diff = Math.round((dayMid - schMid) / 86400000);
      return diff % 14 === 0;
    }
    case 'monthly':   return day.getDate() === scheduled.getDate();
    case 'quarterly': {
      const mDiff = (day.getFullYear() - scheduled.getFullYear()) * 12 + (day.getMonth() - scheduled.getMonth());
      return day.getDate() === scheduled.getDate() && mDiff % 3 === 0;
    }
    case 'yearly':    return day.getDate() === scheduled.getDate() && day.getMonth() === scheduled.getMonth();
    default:          return false;
  }
}

export default function PlanPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<PlanTab>('dashboard');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [splitView, setSplitView] = useState(false);
  const [filterGroup, setFilterGroup] = useState('all');
  const [filterRecurrence, setFilterRecurrence] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [runConfirmTask, setRunConfirmTask] = useState<PlannedTask | null>(null);

  const {
    groups, areas, assets, teamMembers,
    addNotification, addSystemMessage,
    plannedTasks: tasks, addPlannedTask, updatePlannedTask, addTask,
  } = useNotifications();

  const now = new Date();
  const weekEnd = addDays(now, 7);

  // ── Dashboard stats ──────────────────────────────────────
  const activeTasks = tasks.filter(t => t.enabled);
  const disabledTasks = tasks.filter(t => !t.enabled);
  const dueThisWeek = tasks.filter(t => t.enabled && t.scheduledAt >= now && t.scheduledAt <= weekEnd);
  const overdueTasks = tasks.filter(t => t.enabled && isBefore(t.scheduledAt, now) && t.recurrence === 'never');

  const recurrenceDist: Partial<Record<PlannedTask['recurrence'], number>> = {};
  tasks.forEach(t => { recurrenceDist[t.recurrence] = (recurrenceDist[t.recurrence] || 0) + 1; });
  const maxRecCount = Math.max(1, ...Object.values(recurrenceDist) as number[]);

  const groupDist: Record<string, { name: string; color: string; count: number }> = {};
  tasks.forEach(t => {
    if (!groupDist[t.groupId]) groupDist[t.groupId] = { name: t.groupName, color: t.groupColor, count: 0 };
    groupDist[t.groupId].count++;
  });
  const sortedGroupDist = Object.values(groupDist).sort((a, b) => b.count - a.count);

  // Completion rate (simulated from deterministic run history)
  const getRunStatusForStats = (taskId: string, idx: number) => {
    const hash = taskId.charCodeAt(taskId.length - 1) + idx;
    return hash % 5 === 3 ? 'skipped' : 'completed';
  };
  let totalRuns = 0;
  let completedRuns = 0;
  activeTasks.forEach(t => {
    if (t.recurrence === 'never') return;
    for (let i = 0; i < 4; i++) {
      totalRuns++;
      if (getRunStatusForStats(t.id, i) === 'completed') completedRuns++;
    }
  });
  const completionRate = totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : 0;

  // ── This-week schedule chart ──────────────────────────────
  const thisWeekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(now, { weekStartsOn: 1 }), i));
  const weekTaskCounts = thisWeekDays.map(day => ({
    label: format(day, 'EEE'),
    count: activeTasks.filter(t => taskOccursOn(t, day)).length,
    isToday: isToday(day),
  }));
  const maxDayCount = Math.max(1, ...weekTaskCounts.map(d => d.count));

  // Timeline week days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // ── Calendar data ─────────────────────────────────────────
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const daysWithTasks = new Set(
    days.filter(day => tasks.some(t => taskOccursOn(t, day)))
      .map(day => format(day, 'yyyy-MM-dd'))
  );
  const firstDayOfWeek = getDay(monthStart);
  const calendarDays: (Date | null)[] = [...Array(firstDayOfWeek).fill(null), ...days];

  const upcomingTasks = tasks
    .filter(t => t.scheduledAt >= selectedDate && t.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

  const groupedCalTasks: Record<string, PlannedTask[]> = {};
  upcomingTasks.forEach(t => {
    const key = format(t.scheduledAt, 'MMM d');
    if (!groupedCalTasks[key]) groupedCalTasks[key] = [];
    groupedCalTasks[key].push(t);
  });

  // ── All Tasks filter ──────────────────────────────────────
  const groupsWithTasks = groups.filter(g => tasks.some(t => t.groupId === g.id));

  const allTasksFiltered = tasks
    .filter(t => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterGroup !== 'all' && t.groupId !== filterGroup) return false;
      if (filterRecurrence !== 'all' && t.recurrence !== filterRecurrence) return false;
      if (filterStatus === 'active' && !t.enabled) return false;
      if (filterStatus === 'disabled' && t.enabled) return false;
      return true;
    })
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

  const toggleTask = (id: string) => {
    const t = tasks.find(t => t.id === id);
    if (t) updatePlannedTask(id, { enabled: !t.enabled });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Plan</h1>
            <p className="text-xs text-gray-400 mt-0.5">Preventive maintenance scheduling</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Plus size={16} /> Add Task
          </button>
        </div>
        {/* Tab nav */}
        <div className="flex gap-1">
          {([
            { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { key: 'calendar',  label: 'Calendar',  icon: CalendarIcon },
            { key: 'tasks',     label: 'All Tasks',  icon: List },
            { key: 'timeline',  label: 'Timeline',   icon: CalendarRange },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium transition-colors
                ${tab === key ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <Icon size={15} />{label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Dashboard ─────────────────────────────────────── */}
      {tab === 'dashboard' && (
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {/* KPI cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total PPM Tasks', value: tasks.length, emoji: '📋', cls: 'border-gray-200' },
              { label: 'Active Tasks', value: activeTasks.length, emoji: '✅', cls: 'border-green-200' },
              { label: 'Due This Week', value: dueThisWeek.length, emoji: '📅', cls: 'border-blue-200' },
              { label: 'Disabled', value: disabledTasks.length, emoji: '⏸️', cls: 'border-gray-200' },
            ].map(({ label, value, emoji, cls }) => (
              <div key={label} className={`bg-white rounded-xl border ${cls} p-4`}>
                <div className="text-2xl mb-1">{emoji}</div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* This week schedule */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">This Week's Schedule</h3>
            <div className="flex items-end justify-between gap-1" style={{ height: 72 }}>
              {weekTaskCounts.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className={`text-[10px] font-semibold leading-none ${d.count > 0 ? 'text-blue-600' : 'text-gray-300'}`}>
                    {d.count > 0 ? d.count : ''}
                  </span>
                  <div className="w-full flex items-end justify-center" style={{ height: 40 }}>
                    <div
                      className={`w-full rounded-t transition-all ${d.isToday ? 'bg-blue-600' : d.count > 0 ? 'bg-blue-300' : 'bg-gray-100'}`}
                      style={{ height: d.count > 0 ? `${Math.max(6, (d.count / maxDayCount) * 40)}px` : '4px' }}
                    />
                  </div>
                  <span className={`text-[10px] font-medium leading-none ${d.isToday ? 'text-blue-600' : 'text-gray-400'}`}>{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          {totalRuns > 0 && (
            <div className="bg-white rounded-xl border border-green-200 p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">Completion Rate</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{completedRuns}/{totalRuns} runs completed on schedule</p>
                </div>
                <span className={`text-2xl font-bold ${completionRate >= 80 ? 'text-green-600' : completionRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {completionRate}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${completionRate >= 80 ? 'bg-green-500' : completionRate >= 60 ? 'bg-yellow-500' : 'bg-red-400'}`}
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          )}

          {overdueTasks.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
              <span className="text-red-500 text-xl">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-red-700">{overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}</p>
                <p className="text-xs text-red-500">{overdueTasks.map(t => t.title).join(', ')}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Recurrence distribution */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Recurrence Distribution</h3>
              <div className="space-y-2.5">
                {(Object.entries(recurrenceDist) as [PlannedTask['recurrence'], number][])
                  .sort((a, b) => b[1] - a[1])
                  .map(([rec, count]) => (
                    <div key={rec} className="flex items-center gap-3">
                      <div className="w-20 text-xs text-gray-500 flex-shrink-0">{RECURRENCE_LABELS[rec]}</div>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(count / maxRecCount) * 100}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-4 text-right">{count}</span>
                    </div>
                  ))
                }
              </div>
            </div>

            {/* Group distribution */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">By Group</h3>
              <div className="space-y-2.5">
                {sortedGroupDist.slice(0, 6).map(g => (
                  <div key={g.name} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-gray-600 truncate">{g.name}</span>
                        <span className="text-xs font-semibold text-gray-700 ml-2 flex-shrink-0">{g.count}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(g.count / tasks.length) * 100}%`, backgroundColor: g.color }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Due this week */}
          {dueThisWeek.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Due This Week</h3>
              <div className="space-y-2">
                {dueThisWeek.map(task => (
                  <div
                    key={task.id}
                    onClick={() => navigate(`/plan/${task.id}`)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-100 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {task.image
                        ? <img src={task.image} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">📋</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: task.groupColor }} />
                        {task.groupName} · {format(task.scheduledAt, 'EEE, MMM d · HH:mm')}
                        {task.estimatedMinutes && <><span className="text-gray-300">·</span><Clock size={10} />{task.estimatedMinutes}min</>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {task.priority && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize ${PRIORITY_STYLES[task.priority]}`}>
                          {task.priority}
                        </span>
                      )}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${RECURRENCE_COLORS[task.recurrence]}`}>
                        {RECURRENCE_LABELS[task.recurrence]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All active tasks */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">All Active Tasks ({activeTasks.length})</h3>
            <div className="space-y-1.5">
              {activeTasks
                .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
                .map(task => (
                  <div
                    key={task.id}
                    onClick={() => navigate(`/plan/${task.id}`)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {task.image
                        ? <img src={task.image} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">📋</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{task.title}</p>
                      <p className="text-xs text-gray-400">{format(task.scheduledAt, 'MMM d · HH:mm')}</p>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${RECURRENCE_COLORS[task.recurrence]}`}>
                      {RECURRENCE_LABELS[task.recurrence]}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Calendar ──────────────────────────────────────── */}
      {tab === 'calendar' && (
        <div className="flex-1 overflow-hidden flex">
          {/* Left: mini calendar + manage panel */}
          <div className="w-80 flex-shrink-0 overflow-y-auto border-r border-gray-200 bg-white">
            <div className="p-4">
              {/* Mini calendar */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-1 hover:bg-gray-100 rounded">
                    <ChevronLeft size={16} className="text-gray-500" />
                  </button>
                  <span className="text-sm font-semibold text-gray-700">{format(currentMonth, 'MMM yyyy')}</span>
                  <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-1 hover:bg-gray-100 rounded">
                    <ChevronRight size={16} className="text-gray-500" />
                  </button>
                </div>
                <div className="grid grid-cols-7 mb-2">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {calendarDays.map((day, i) => {
                    if (!day) return <div key={i} />;
                    const hasTask = daysWithTasks.has(format(day, 'yyyy-MM-dd'));
                    const isSelected = isSameDay(day, selectedDate);
                    const isTod = isToday(day);
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedDate(day)}
                        className={`flex flex-col items-center py-1 rounded-full transition-colors text-xs
                          ${isSelected ? 'bg-blue-600 text-white' : isTod ? 'border-2 border-blue-400 text-blue-600' : 'hover:bg-gray-100 text-gray-700'}`}
                      >
                        <span>{format(day, 'd')}</span>
                        {hasTask && <span className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-blue-400'}`} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Manage tasks panel */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Manage Tasks</h3>
                <div className="space-y-2">
                  {tasks.map(task => (
                    <div key={task.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {task.image
                          ? <img src={task.image} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">📋</div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate">{task.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{RECURRENCE_LABELS[task.recurrence]}</p>
                      </div>
                      <button
                        onClick={() => toggleTask(task.id)}
                        className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 relative ${task.enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full shadow absolute top-0.5 transition-transform
                          ${task.enabled ? 'left-5' : 'left-0.5'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: task list */}
          <div className="flex-1 overflow-hidden flex flex-col bg-gray-50">
            <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="ml-auto">
                <button
                  onClick={() => setSplitView(v => !v)}
                  title="Split view by recurrence"
                  className={`p-1.5 rounded-lg ${splitView ? 'text-blue-600 bg-blue-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                >
                  <Columns3 size={16} />
                </button>
              </div>
            </div>

            {splitView ? (
              <div className="flex-1 flex overflow-x-auto overflow-y-hidden">
                {([
                  { key: 'short',   label: 'Once / Daily',              head: 'bg-gray-50',   text: 'text-gray-600',   ring: 'border-gray-200',   match: (r: string) => r === 'never' || r === 'daily' },
                  { key: 'weekly',  label: 'Weekly / Bi-weekly',        head: 'bg-blue-50',   text: 'text-blue-600',   ring: 'border-blue-200',   match: (r: string) => r === 'weekly' || r === 'biweekly' },
                  { key: 'long',    label: 'Monthly / Quarterly / Yearly', head: 'bg-purple-50', text: 'text-purple-600', ring: 'border-purple-200', match: (r: string) => r === 'monthly' || r === 'quarterly' || r === 'yearly' },
                ] as const).map(col => {
                  const colTasks = upcomingTasks.filter(t => col.match(t.recurrence));
                  return (
                    <div key={col.key} className="flex-1 min-w-[280px] flex flex-col border-r border-gray-200 last:border-r-0">
                      <div className={`flex items-center gap-2 px-4 py-3 ${col.head} border-b ${col.ring} flex-shrink-0`}>
                        <RefreshCw size={13} className={col.text} />
                        <span className={`text-sm font-semibold ${col.text}`}>{col.label}</span>
                        <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${col.head} ${col.text} border ${col.ring}`}>
                          {colTasks.length}
                        </span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-3 space-y-3">
                        {colTasks.length === 0
                          ? <div className="flex items-center justify-center py-16 text-gray-300 text-xs">No tasks</div>
                          : colTasks.map(task => (
                            <PlanTaskCard key={task.id} task={task} onClick={() => navigate(`/plan/${task.id}`)} />
                          ))
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  {Object.keys(groupedCalTasks).length === 0 ? (
                    <div className="text-center py-16 text-gray-400">No tasks from selected date</div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(groupedCalTasks).map(([dateLabel, dateTasks]) => (
                        <div key={dateLabel}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="h-px flex-1 bg-gray-200" />
                            <span className="text-xs font-medium text-gray-500">{dateLabel}</span>
                            <div className="h-px flex-1 bg-gray-200" />
                          </div>
                          <div className="space-y-3">
                            {dateTasks.map(task => (
                              <PlanTaskCard key={task.id} task={task} onClick={() => navigate(`/plan/${task.id}`)} horizontal />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── All Tasks ─────────────────────────────────────── */}
      {tab === 'tasks' && (
        <div className="flex-1 overflow-hidden flex flex-col bg-gray-50">
          <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 flex-shrink-0 flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Groups</option>
              {groupsWithTasks.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
            </select>
            <select value={filterRecurrence} onChange={e => setFilterRecurrence(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Recurrences</option>
              <option value="never">Once</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
            <span className="ml-auto text-xs text-gray-400">{allTasksFiltered.length} task{allTasksFiltered.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {allTasksFiltered.length === 0 ? (
              <div className="text-center py-16 text-gray-400">No tasks match the filters</div>
            ) : (
              <div className="space-y-2">
                {allTasksFiltered.map(task => (
                  <div
                    key={task.id}
                    onClick={() => navigate(`/plan/${task.id}`)}
                    className="bg-white rounded-xl border border-gray-200 flex items-center gap-4 p-4 cursor-pointer hover:shadow-sm transition-shadow"
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      {task.image
                        ? <img src={task.image} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">📋</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-800">{task.title}</p>
                        {task.priority && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize ${PRIORITY_STYLES[task.priority]}`}>
                            {task.priority}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: task.groupColor }} />
                          {task.groupName}
                        </span>
                        <span className="text-xs text-gray-400">{format(task.scheduledAt, 'MMM d, yyyy · HH:mm')}</span>
                        {task.estimatedMinutes && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock size={11} />{task.estimatedMinutes}min
                          </span>
                        )}
                        {task.assetName && (
                          <span className="text-xs text-gray-400">📦 {task.assetName}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${RECURRENCE_COLORS[task.recurrence]}`}>
                        {RECURRENCE_LABELS[task.recurrence]}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium
                        ${task.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {task.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setRunConfirmTask(task); }}
                      className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 flex-shrink-0"
                      title="Run Now"
                    >
                      <Play size={14} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); toggleTask(task.id); }}
                      className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${task.enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow absolute top-0.5 transition-transform
                        ${task.enabled ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Timeline ──────────────────────────────────────── */}
      {tab === 'timeline' && (
        <div className="flex-1 overflow-hidden flex flex-col bg-gray-50">
          {/* Week navigation */}
          <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setWeekStart(d => addDays(d, -7))}
              className="p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft size={18} className="text-gray-600" />
            </button>
            <span className="text-sm font-semibold text-gray-700 min-w-[220px] text-center">
              {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </span>
            <button
              onClick={() => setWeekStart(d => addDays(d, 7))}
              className="p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight size={18} className="text-gray-600" />
            </button>
            <button
              onClick={() => setWeekStart(startOfWeek(new Date()))}
              className="ml-2 text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50"
            >
              Today
            </button>
            <span className="ml-auto text-xs text-gray-400">
              {tasks.filter(t => weekDays.some(d => taskOccursOn(t, d))).length} task{tasks.filter(t => weekDays.some(d => taskOccursOn(t, d))).length !== 1 ? 's' : ''} this week
            </span>
          </div>

          {/* 7-column day grid */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <div className="flex h-full min-w-[700px]">
              {weekDays.map((day, dayIdx) => {
                const dayTasks = tasks.filter(t => taskOccursOn(t, day));
                const isTod = isToday(day);
                return (
                  <div
                    key={dayIdx}
                    className={`flex-1 flex flex-col border-r border-gray-200 last:border-r-0 min-w-0 ${isTod ? 'bg-blue-50/30' : ''}`}
                  >
                    {/* Day header */}
                    <div className={`px-2 py-3 border-b border-gray-200 text-center flex-shrink-0 ${isTod ? 'bg-blue-600' : 'bg-white'}`}>
                      <p className={`text-xs font-medium ${isTod ? 'text-blue-100' : 'text-gray-400'}`}>
                        {format(day, 'EEE')}
                      </p>
                      <p className={`text-base font-bold ${isTod ? 'text-white' : 'text-gray-800'}`}>
                        {format(day, 'd')}
                      </p>
                      {dayTasks.length > 0 && (
                        <p className={`text-[10px] font-medium mt-0.5 ${isTod ? 'text-blue-200' : 'text-gray-400'}`}>
                          {dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>

                    {/* Task cards */}
                    <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
                      {dayTasks.length === 0 ? (
                        <div className="flex items-center justify-center h-12 text-gray-200 text-xs select-none">—</div>
                      ) : (
                        dayTasks.map(task => (
                          <button
                            key={task.id}
                            onClick={() => navigate(`/plan/${task.id}`)}
                            className="w-full text-left"
                          >
                            <div
                              className="rounded-lg px-2 py-1.5 text-white"
                              style={{ backgroundColor: task.groupColor }}
                            >
                              <p className="text-[11px] font-semibold truncate leading-snug">{task.title}</p>
                              <p className="text-[10px] opacity-75 mt-0.5 flex items-center gap-1">
                                <Clock size={9} />{format(task.scheduledAt, 'HH:mm')}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {runConfirmTask && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Play size={24} className="text-green-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 text-center mb-2">Run Task Now?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              This will create a new work order in Fix for "<strong>{runConfirmTask.title}</strong>".
            </p>
            <div className="flex gap-3">
              <button onClick={() => setRunConfirmTask(null)}
                className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => {
                addTask({
                  id: `t${Date.now()}`,
                  title: runConfirmTask.title,
                  groupId: runConfirmTask.groupId,
                  groupName: runConfirmTask.groupName,
                  groupColor: runConfirmTask.groupColor,
                  areaId: runConfirmTask.areaId,
                  status: 'open',
                  priority: runConfirmTask.priority ?? 'medium',
                  image: runConfirmTask.image,
                  createdAt: new Date(),
                  assignees: runConfirmTask.assigneeIds ?? [],
                  description: runConfirmTask.description,
                  comments: [],
                  tags: {},
                });
                setRunConfirmTask(null);
              }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg py-2.5 text-sm font-medium">
                Run Now
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <CreatePlanTaskModal
          groups={groups}
          areas={areas}
          assets={assets}
          teamMembers={teamMembers}
          onClose={() => setShowCreate(false)}
          onSave={task => {
            addPlannedTask(task);
            setShowCreate(false);
            const grp = groups.find(g => g.id === task.groupId);
            if (grp) {
              addNotification({
                title: '📋 New Planned Task',
                body: `"${task.title}" scheduled for ${format(task.scheduledAt, 'MMM d, yyyy · HH:mm')} · ${RECURRENCE_LABELS[task.recurrence]}`,
                groupName: grp.name,
                groupColor: grp.color,
                groupIcon: grp.icon,
              });
              addSystemMessage({
                channelHint: grp.name,
                text: `📋 New PPM task assigned to *${grp.name}*: "${task.title}" — ${format(task.scheduledAt, 'MMM d, yyyy')} at ${format(task.scheduledAt, 'HH:mm')}. Repeats ${RECURRENCE_LABELS[task.recurrence]}.`,
              });
            }
          }}
        />
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────

function PlanTaskCard({ task, onClick, horizontal = false }: {
  task: PlannedTask;
  onClick: () => void;
  horizontal?: boolean;
}) {
  if (horizontal) {
    return (
      <div
        onClick={onClick}
        className="bg-white border border-gray-200 rounded-xl overflow-hidden flex cursor-pointer hover:shadow-md transition-shadow"
      >
        <div className="w-20 h-20 flex-shrink-0 bg-gray-100">
          {task.image
            ? <img src={task.image} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">📋</div>
          }
        </div>
        <div className="flex-1 p-3 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: task.groupColor }} />
            {task.groupName} · {format(task.scheduledAt, 'HH:mm')}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${RECURRENCE_COLORS[task.recurrence]}`}>
              {RECURRENCE_LABELS[task.recurrence]}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium
              ${task.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {task.enabled ? 'Active' : 'Disabled'}
            </span>
          </div>
        </div>
        <div className="flex items-center pr-3 text-gray-300 text-lg">›</div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
    >
      {task.image && (
        <div className="w-full h-24 bg-gray-100">
          <img src={task.image} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-3">
        <p className="text-sm font-medium text-gray-800 leading-snug">{task.title}</p>
        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: task.groupColor }} />
          {task.groupName}
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5">{format(task.scheduledAt, 'MMM d · HH:mm')}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${RECURRENCE_COLORS[task.recurrence]}`}>
            {RECURRENCE_LABELS[task.recurrence]}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium
            ${task.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {task.enabled ? 'Active' : 'Disabled'}
          </span>
        </div>
      </div>
    </div>
  );
}

function CreatePlanTaskModal({ groups, areas, assets, teamMembers, onClose, onSave }: {
  groups: Group[];
  areas: Area[];
  assets: Asset[];
  teamMembers: User[];
  onClose: () => void;
  onSave: (task: PlannedTask) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [groupId, setGroupId] = useState(groups[0]?.id ?? '');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState('09:00');
  const [recurrence, setRecurrence] = useState<PlannedTask['recurrence']>('weekly');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState('60');
  const [areaId, setAreaId] = useState('');
  const [assetId, setAssetId] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);

  const selectedGroup = groups.find(g => g.id === groupId) ?? groups[0];
  const selectedArea = areas.find(a => a.id === areaId);
  const selectedAsset = assets.find(a => a.id === assetId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedGroup) return;
    const [y, m, d] = date.split('-').map(Number);
    const [h, min] = time.split(':').map(Number);
    onSave({
      id: `p${Date.now()}`,
      title: title.trim(),
      description,
      groupId: selectedGroup.id,
      groupName: selectedGroup.name,
      groupColor: selectedGroup.color,
      scheduledAt: new Date(y, m - 1, d, h, min),
      recurrence,
      enabled: true,
      priority,
      estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : undefined,
      areaId: areaId || undefined,
      areaName: selectedArea?.name,
      assetId: assetId || undefined,
      assetName: selectedAsset?.name,
      assigneeIds,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-semibold text-gray-900">Create Planned Task</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Monthly AC filter service"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group *</label>
            <div className="relative">
              <select
                value={groupId}
                onChange={e => setGroupId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none cursor-pointer"
              >
                {groups.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
              </select>
              {selectedGroup && (
                <div
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-xs pointer-events-none"
                  style={{ backgroundColor: selectedGroup.color + '30' }}
                >
                  {selectedGroup.icon}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <div className="flex gap-2">
              {(['high', 'medium', 'low'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 text-sm rounded-lg border font-medium capitalize transition-colors
                    ${priority === p
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

          {/* Assignees */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assignees</label>
            <div className="flex flex-wrap gap-2">
              {teamMembers.filter(u => u.accepted !== false).map(u => {
                const sel = assigneeIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setAssigneeIds(ids => sel ? ids.filter(id => id !== u.id) : [...ids, u.id])}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs border font-medium transition-colors
                      ${sel ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${sel ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-700'}`}
                      style={{ fontSize: 9 }}
                    >
                      {u.name.charAt(0)}
                    </div>
                    {u.name.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what needs to be done..."
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence</label>
              <select value={recurrence} onChange={e => setRecurrence(e.target.value as PlannedTask['recurrence'])}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Est. Minutes</label>
              <input type="number" value={estimatedMinutes} onChange={e => setEstimatedMinutes(e.target.value)}
                placeholder="60" min="5"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area (optional)</label>
              <select value={areaId} onChange={e => setAreaId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">— None —</option>
                {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asset (optional)</label>
              <select value={assetId} onChange={e => setAssetId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">— None —</option>
                {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>

          {selectedGroup && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 flex items-start gap-3">
              <span className="text-lg">{selectedGroup.icon}</span>
              <div>
                <p className="text-xs font-semibold text-blue-800">Notification preview</p>
                <p className="text-xs text-blue-600 mt-0.5">
                  📋 New PPM task "{title || 'Task title'}" will notify <strong>{selectedGroup.name}</strong>
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg py-2.5 text-sm font-medium">
              Create & Notify
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
