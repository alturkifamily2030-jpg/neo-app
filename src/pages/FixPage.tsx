import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutGrid, List, Filter, Plus, Search, Columns3, Camera,
  ArrowUpDown, User, Check, X, AlertCircle, Clock, CheckCircle2,
  ChevronRight, AlertTriangle,
} from 'lucide-react';
import CameraCapture from '../components/ui/CameraCapture';
import { format, isAfter, isToday, isYesterday, isThisWeek } from 'date-fns';
import GroupCard from '../components/fix/GroupCard';
import AreaCard from '../components/fix/AreaCard';
import TaskListItem from '../components/fix/TaskListItem';
import CreateTaskModal from '../components/fix/CreateTaskModal';
import CreateGroupModal from '../components/fix/CreateGroupModal';
import CreateAreaModal from '../components/fix/CreateAreaModal';
import { useNotifications } from '../context/NotificationContext';
import { currentUser } from '../data/mockData';
import type { Area, Task, TaskStatus, Priority } from '../types';

type Tab = 'dashboard' | 'feed' | 'groups' | 'areas';
type FeedFilter = 'all' | TaskStatus | 'overdue';
type SortBy = 'newest' | 'oldest' | 'priority' | 'group' | 'due_date';


export default function FixPage() {
  const navigate = useNavigate();
  const { tasks, addTask, updateTask, groups, addGroup, areas, addArea, teamMembers } = useNotifications();
  const [tab, setTab] = useState<Tab>('groups');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | undefined>(undefined);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateArea, setShowCreateArea] = useState(false);

  // Listen for Ctrl+N shortcut
  useEffect(() => {
    const handler = () => setShowCreate(true);
    window.addEventListener('neo:create-task', handler);
    return () => window.removeEventListener('neo:create-task', handler);
  }, []);
  const [splitView, setSplitView] = useState(false);
  // New filter/sort state
  const [myTasksOnly,      setMyTasksOnly]      = useState(false);
  const [sortBy,           setSortBy]           = useState<SortBy>('newest');
  const [showSortMenu,     setShowSortMenu]     = useState(false);
  const [showFilterPanel,  setShowFilterPanel]  = useState(false);
  const [filterGroups,     setFilterGroups]     = useState<string[]>([]);
  const [filterPriorities, setFilterPriorities] = useState<Priority[]>([]);
  const [filterLocations,  setFilterLocations]  = useState<string[]>([]);
  const [filterEquipment,  setFilterEquipment]  = useState<string[]>([]);
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const dragTaskId = useRef<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const toggleFilterGroup = (id: string) =>
    setFilterGroups(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  const toggleFilterPriority = (p: Priority) =>
    setFilterPriorities(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  const toggleFilterLocation = (v: string) =>
    setFilterLocations(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  const toggleFilterEquipment = (v: string) =>
    setFilterEquipment(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  const toggleFilterCategory = (v: string) =>
    setFilterCategories(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  const clearFilters = () => { setFilterGroups([]); setFilterPriorities([]); setFilterLocations([]); setFilterEquipment([]); setFilterCategories([]); };

  const activeFilters = filterGroups.length + filterPriorities.length + filterLocations.length + filterEquipment.length + filterCategories.length;

  const baseFeedTasks = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.groupName.toLowerCase().includes(search.toLowerCase());
    const matchMine = !myTasksOnly || t.assignees.includes(currentUser.id);
    const matchGroups = filterGroups.length === 0 || filterGroups.includes(t.groupId);
    const matchPriority = filterPriorities.length === 0 || filterPriorities.includes(t.priority);
    const matchLoc = filterLocations.length === 0 || (t.tags?.location != null && filterLocations.includes(t.tags.location));
    const matchEq  = filterEquipment.length === 0  || (t.tags?.equipment != null && filterEquipment.includes(t.tags.equipment));
    const matchCat = filterCategories.length === 0 || (t.tags?.category != null && filterCategories.includes(t.tags.category));
    return matchSearch && matchMine && matchGroups && matchPriority && matchLoc && matchEq && matchCat;
  });

  const isOverdueFn = (t: Task) => t.dueDate != null && isAfter(new Date(), t.dueDate) && t.status !== 'done';

  const sortFn = (a: Task, b: Task): number => {
    if (sortBy === 'newest') return b.createdAt.getTime() - a.createdAt.getTime();
    if (sortBy === 'oldest') return a.createdAt.getTime() - b.createdAt.getTime();
    if (sortBy === 'priority') {
      const p: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
      return p[a.priority] - p[b.priority];
    }
    if (sortBy === 'due_date') {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.getTime() - b.dueDate.getTime();
    }
    return a.groupName.localeCompare(b.groupName);
  };

  const feedTasks = (
    feedFilter === 'all'     ? baseFeedTasks :
    feedFilter === 'overdue' ? baseFeedTasks.filter(isOverdueFn) :
    baseFeedTasks.filter(t => t.status === feedFilter)
  ).sort(sortFn);

  const filteredGroups = groups
    .filter(g => !g.archived && g.name.toLowerCase().includes(search.toLowerCase()))
    .map(g => {
      const gt = tasks.filter(t => t.groupId === g.id);
      return {
        ...g,
        counts: {
          red:    gt.filter(t => t.status === 'open').length,
          yellow: gt.filter(t => t.status === 'in_progress').length,
          green:  gt.filter(t => t.status === 'done').length,
        },
      };
    });

  const filteredAreas = areas
    .filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
    .map(a => {
      const at = tasks.filter(t => t.areaId === a.id);
      return {
        ...a,
        counts: {
          red:    at.filter(t => t.status === 'open').length,
          yellow: at.filter(t => t.status === 'in_progress').length,
          green:  at.filter(t => t.status === 'done').length,
        },
      };
    });

  const handleCreateTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'comments'>) => {
    addTask({
      ...taskData,
      id: `t${Date.now()}`,
      createdAt: new Date(),
      comments: [],
    });
  };

  const feedCounts = {
    all:         baseFeedTasks.length,
    open:        baseFeedTasks.filter(t => t.status === 'open').length,
    in_progress: baseFeedTasks.filter(t => t.status === 'in_progress').length,
    done:        baseFeedTasks.filter(t => t.status === 'done').length,
    overdue:     baseFeedTasks.filter(isOverdueFn).length,
  };

  // ── Dashboard stats ────────────────────────────────────────
  const allOpen    = tasks.filter(t => t.status === 'open').length;
  const allInProg  = tasks.filter(t => t.status === 'in_progress').length;
  const allDone    = tasks.filter(t => t.status === 'done').length;
  const allOverdue = tasks.filter(isOverdueFn).length;
  const completionRate = tasks.length > 0 ? Math.round((allDone / tasks.length) * 100) : 0;
  const topGroups = groups
    .map(g => {
      const gt = tasks.filter(t => t.groupId === g.id);
      return {
        ...g,
        openCount:   gt.filter(t => t.status === 'open').length,
        inProgCount: gt.filter(t => t.status === 'in_progress').length,
        doneCount:   gt.filter(t => t.status === 'done').length,
        total: gt.length,
      };
    })
    .filter(g => g.total > 0)
    .sort((a, b) => b.openCount - a.openCount)
    .slice(0, 6);
  const recentTasks = [...tasks]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6);

  const priorityBreakdown = {
    high:   tasks.filter(t => t.priority === 'high'   && t.status !== 'done').length,
    medium: tasks.filter(t => t.priority === 'medium' && t.status !== 'done').length,
    low:    tasks.filter(t => t.priority === 'low'    && t.status !== 'done').length,
  };
  const highPriorityOpen = tasks
    .filter(t => t.priority === 'high' && t.status !== 'done')
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  // ── Feed date grouping ─────────────────────────────────────
  const groupedFeedTasks = [
    { label: 'Today',     tasks: feedTasks.filter(t => isToday(t.createdAt)) },
    { label: 'Yesterday', tasks: feedTasks.filter(t => isYesterday(t.createdAt)) },
    { label: 'This Week', tasks: feedTasks.filter(t => !isToday(t.createdAt) && !isYesterday(t.createdAt) && isThisWeek(t.createdAt, { weekStartsOn: 1 })) },
    { label: 'Older',     tasks: feedTasks.filter(t => !isThisWeek(t.createdAt, { weekStartsOn: 1 })) },
  ].filter(g => g.tasks.length > 0);

  const tabConfig = [
    { key: 'dashboard' as Tab, label: 'Dashboard' },
    { key: 'feed' as Tab, label: `Feed (${tasks.length})` },
    { key: 'groups' as Tab, label: `Groups (${groups.length})` },
    { key: 'areas' as Tab, label: `Areas (${areas.length})` },
  ];

  const searchPlaceholder = {
    dashboard: 'Search', feed: 'Search Tasks', groups: 'Search Groups', areas: 'Search Areas'
  }[tab];

  const allTagLocations  = [...new Set(tasks.flatMap(t => t.tags?.location  ? [t.tags.location]  : []))].sort();
  const allTagEquipment  = [...new Set(tasks.flatMap(t => t.tags?.equipment ? [t.tags.equipment] : []))].sort();
  const allTagCategories = [...new Set(tasks.flatMap(t => t.tags?.category  ? [t.tags.category]  : []))].sort();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900 mb-3">Fix</h1>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            {tabConfig.map(t => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setSearch(''); setFeedFilter('all'); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors
                  ${tab === t.key
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            {(tab === 'groups' || tab === 'areas') && (
              <>
                <button onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded ${viewMode === 'grid' ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'}`}>
                  <LayoutGrid size={18} />
                </button>
                <button onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded ${viewMode === 'list' ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'}`}>
                  <List size={18} />
                </button>
              </>
            )}
            {tab === 'feed' && (
              <>
                {/* My Tasks */}
                <button
                  onClick={() => setMyTasksOnly(v => !v)}
                  title="My Tasks Only"
                  className={`p-1.5 rounded ${myTasksOnly ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <User size={18} />
                </button>
                {/* Sort */}
                <div className="relative">
                  <button
                    onClick={() => setShowSortMenu(m => !m)}
                    className={`p-1.5 rounded ${showSortMenu || sortBy !== 'newest' ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'}`}
                    title="Sort"
                  >
                    <ArrowUpDown size={18} />
                  </button>
                  {showSortMenu && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 w-44">
                      {([
                        { key: 'newest'   as SortBy, label: 'Newest First'   },
                        { key: 'oldest'   as SortBy, label: 'Oldest First'   },
                        { key: 'priority' as SortBy, label: 'By Priority'    },
                        { key: 'group'    as SortBy, label: 'By Group'       },
                        { key: 'due_date' as SortBy, label: 'By Due Date'    },
                      ]).map(opt => (
                        <button
                          key={opt.key}
                          onClick={() => { setSortBy(opt.key); setShowSortMenu(false); }}
                          className={`flex items-center justify-between w-full px-3 py-2 hover:bg-gray-50 text-sm first:rounded-t-xl last:rounded-b-xl
                            ${sortBy === opt.key ? 'text-blue-600 font-medium' : 'text-gray-700'}`}
                        >
                          {opt.label}
                          {sortBy === opt.key && <Check size={13} className="text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Filter */}
                <button
                  onClick={() => setShowFilterPanel(v => !v)}
                  className={`p-1.5 rounded relative ${showFilterPanel || activeFilters > 0 ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Filter"
                >
                  <Filter size={18} />
                  {activeFilters > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {activeFilters}
                    </span>
                  )}
                </button>
                {/* Split view */}
                <button
                  onClick={() => setSplitView(v => !v)}
                  title="Split view"
                  className={`p-1.5 rounded ${splitView ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Columns3 size={18} />
                </button>
              </>
            )}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 border border-gray-200 rounded-full text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
              />
            </div>
            {tab === 'feed' && (
              <button onClick={() => setShowCreate(true)}
                className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center">
                <Plus size={18} />
              </button>
            )}
            {tab === 'groups' && (
              <button onClick={() => setShowCreateGroup(true)}
                className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center">
                <Plus size={18} />
              </button>
            )}
            {tab === 'areas' && (
              <button onClick={() => setShowCreateArea(true)}
                className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center">
                <Plus size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feed status filter bar */}
      {tab === 'feed' && !splitView && (
        <div className="bg-white border-b border-gray-100 px-6 py-2 flex items-center gap-2">
          {([
            { key: 'all'         as FeedFilter, label: 'All',         count: feedCounts.all,         dot: 'bg-gray-400'  },
            { key: 'open'        as FeedFilter, label: 'Open',        count: feedCounts.open,        dot: 'bg-red-500'   },
            { key: 'in_progress' as FeedFilter, label: 'In Progress', count: feedCounts.in_progress, dot: 'bg-yellow-400'},
            { key: 'done'        as FeedFilter, label: 'Done',        count: feedCounts.done,        dot: 'bg-green-500' },
            { key: 'overdue'     as FeedFilter, label: 'Overdue',     count: feedCounts.overdue,     dot: 'bg-orange-500'},
          ]).map(f => (
            <button
              key={f.key}
              onClick={() => setFeedFilter(f.key)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors border
                ${feedFilter === f.key
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${f.dot} ${feedFilter === f.key ? 'opacity-70' : ''}`} />
              {f.label}
              <span className={`text-[10px] font-bold ml-0.5 ${feedFilter === f.key ? 'text-white/70' : 'text-gray-400'}`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Filter panel */}
      {tab === 'feed' && showFilterPanel && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 space-y-3">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Priority</p>
            <div className="flex gap-2">
              {([
                { key: 'high' as Priority, label: 'High', cls: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
                { key: 'medium' as Priority, label: 'Medium', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-400' },
                { key: 'low' as Priority, label: 'Low', cls: 'bg-gray-100 text-gray-700 border-gray-200', dot: 'bg-gray-400' },
              ]).map(p => (
                <button key={p.key} onClick={() => toggleFilterPriority(p.key)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors
                    ${filterPriorities.includes(p.key) ? p.cls : 'text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${p.dot}`} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Group</p>
            <div className="flex flex-wrap gap-2">
              {groups.map(g => (
                <button key={g.id} onClick={() => toggleFilterGroup(g.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors
                    ${filterGroups.includes(g.id) ? 'text-white border-transparent' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                  style={filterGroups.includes(g.id) ? { backgroundColor: g.color } : {}}>
                  <span>{g.icon}</span>
                  <span className="max-w-[80px] truncate">{g.name}</span>
                  {filterGroups.includes(g.id) && <X size={10} />}
                </button>
              ))}
            </div>
          </div>
          {allTagLocations.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">📍 Location</p>
              <div className="flex flex-wrap gap-1.5">
                {allTagLocations.map(v => (
                  <button key={v} onClick={() => toggleFilterLocation(v)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors
                      ${filterLocations.includes(v) ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}
          {allTagEquipment.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">🔧 Equipment</p>
              <div className="flex flex-wrap gap-1.5">
                {allTagEquipment.map(v => (
                  <button key={v} onClick={() => toggleFilterEquipment(v)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors
                      ${filterEquipment.includes(v) ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}
          {allTagCategories.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">🏷 Category</p>
              <div className="flex flex-wrap gap-1.5">
                {allTagCategories.map(v => (
                  <button key={v} onClick={() => toggleFilterCategory(v)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors
                      ${filterCategories.includes(v) ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}
          {activeFilters > 0 && (
            <button onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium">
              <X size={12} /> Clear all filters ({activeFilters})
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col" onClick={() => setShowSortMenu(false)}>
        {/* ════════ DASHBOARD ════════ */}
        {tab === 'dashboard' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Open',        value: allOpen,    icon: <AlertCircle size={20} className="text-red-500" />,      color: 'bg-red-50',    text: 'text-red-700'    },
                { label: 'In Progress', value: allInProg,  icon: <Clock size={20} className="text-yellow-500" />,         color: 'bg-yellow-50', text: 'text-yellow-700' },
                { label: 'Completed',   value: allDone,    icon: <CheckCircle2 size={20} className="text-green-500" />,   color: 'bg-green-50',  text: 'text-green-700'  },
                { label: 'Overdue',     value: allOverdue, icon: <AlertTriangle size={20} className="text-orange-500" />, color: 'bg-orange-50', text: 'text-orange-700' },
              ].map(kpi => (
                <div key={kpi.label} className={`${kpi.color} rounded-2xl p-4 flex items-center gap-4`}>
                  <div className="p-2 bg-white rounded-xl shadow-sm flex-shrink-0">{kpi.icon}</div>
                  <div>
                    <p className={`text-2xl font-bold ${kpi.text}`}>{kpi.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Completion rate */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">Completion Rate</p>
                <span className={`text-sm font-bold ${completionRate >= 70 ? 'text-green-600' : completionRate >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {completionRate}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${completionRate >= 70 ? 'bg-green-500' : completionRate >= 40 ? 'bg-yellow-400' : 'bg-red-500'}`}
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">{allDone} completed out of {tasks.length} total work orders</p>
            </div>

            {/* Priority distribution */}
            {tasks.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Open Tasks by Priority</p>
                <div className="space-y-2.5">
                  {[
                    { key: 'high',   label: 'High',   count: priorityBreakdown.high,   color: 'bg-red-500'    },
                    { key: 'medium', label: 'Medium', count: priorityBreakdown.medium, color: 'bg-yellow-400' },
                    { key: 'low',    label: 'Low',    count: priorityBreakdown.low,    color: 'bg-gray-300'   },
                  ].map(p => {
                    const total = priorityBreakdown.high + priorityBreakdown.medium + priorityBreakdown.low;
                    return (
                      <div key={p.key} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-14 flex-shrink-0">{p.label}</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${p.color} rounded-full transition-all`}
                            style={{ width: total > 0 ? `${(p.count / total) * 100}%` : '0%' }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 w-5 text-right">{p.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* By Group */}
            {topGroups.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-3">By Group</h2>
                <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
                  {topGroups.map(g => (
                    <div key={g.id} onClick={() => navigate(`/fix/group/${g.id}`)}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                        style={{ backgroundColor: g.color + '20' }}>
                        {g.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{g.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-xs text-red-500">{g.openCount}</span>
                          <span className="text-xs text-gray-300 mx-1">·</span>
                          <span className="w-2 h-2 rounded-full bg-yellow-400" /><span className="text-xs text-yellow-600">{g.inProgCount}</span>
                          <span className="text-xs text-gray-300 mx-1">·</span>
                          <span className="w-2 h-2 rounded-full bg-green-500" /><span className="text-xs text-green-600">{g.doneCount}</span>
                        </div>
                      </div>
                      <div className="w-24 flex-shrink-0">
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-green-500 transition-all"
                            style={{ width: `${g.total > 0 ? Math.round((g.doneCount / g.total) * 100) : 0}%` }} />
                        </div>
                        <p className="text-[10px] text-gray-400 text-right mt-0.5">
                          {g.total > 0 ? Math.round((g.doneCount / g.total) * 100) : 0}% done
                        </p>
                      </div>
                      <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* High Priority open tasks */}
            {highPriorityOpen.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> High Priority Open
                  </h2>
                  <button
                    onClick={() => { setTab('feed'); setFilterPriorities(['high']); setFeedFilter('open'); setShowFilterPanel(true); }}
                    className="text-xs text-blue-600 hover:underline">View all →</button>
                </div>
                <div className="bg-white rounded-2xl border border-red-100 divide-y divide-gray-100">
                  {highPriorityOpen.map(task => (
                    <div key={task.id} onClick={() => navigate(`/fix/task/${task.id}`)}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-red-50/40 transition-colors">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${task.status === 'open' ? 'bg-red-500' : 'bg-yellow-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                        <p className="text-xs text-gray-400">{task.groupName} · {format(task.createdAt, 'MMM d')}</p>
                      </div>
                      {isOverdueFn(task) && (
                        <span className="text-[11px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full flex-shrink-0">Late</span>
                      )}
                      <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Tasks */}
            {recentTasks.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-700">Recent Work Orders</h2>
                  <button onClick={() => setTab('feed')} className="text-xs text-blue-600 hover:underline">View all →</button>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
                  {recentTasks.map(task => (
                    <div key={task.id} onClick={() => navigate(`/fix/task/${task.id}`)}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${task.status === 'open' ? 'bg-red-500' : task.status === 'in_progress' ? 'bg-yellow-400' : 'bg-green-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                        <p className="text-xs text-gray-400">{task.groupName} · {format(task.createdAt, 'MMM d, yyyy')}</p>
                      </div>
                      <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <p className="text-sm">No work orders yet</p>
                <button onClick={() => { setTab('feed'); setShowCreate(true); }} className="mt-3 text-sm text-blue-600 hover:underline">+ Create one</button>
              </div>
            )}
          </div>
        )}

        {tab === 'feed' && (
          splitView ? (
            /* ── 3-column split view ── */
            <div className="h-full flex overflow-x-auto">
              {([
                { status: 'open'        as const, label: 'Open',        dot: 'bg-red-500',    ring: 'border-red-200',    head: 'bg-red-50',    text: 'text-red-600' },
                { status: 'in_progress' as const, label: 'In Progress', dot: 'bg-yellow-400', ring: 'border-yellow-200', head: 'bg-yellow-50', text: 'text-yellow-600' },
                { status: 'done'        as const, label: 'Done',        dot: 'bg-green-500',  ring: 'border-green-200',  head: 'bg-green-50',  text: 'text-green-600' },
              ]).map(col => {
                const colTasks = baseFeedTasks.filter(t => t.status === col.status);
                const isDropTarget = dragOverCol === col.status;
                return (
                  <div key={col.status} className="flex-1 min-w-[280px] flex flex-col border-r border-gray-200 last:border-r-0"
                    onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverCol(col.status); }}
                    onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCol(null); }}
                    onDrop={e => { e.preventDefault(); if (dragTaskId.current) { updateTask(dragTaskId.current, { status: col.status }); dragTaskId.current = null; } setDragOverCol(null); }}
                  >
                    <div className={`flex items-center gap-2 px-4 py-3 ${col.head} border-b ${col.ring} flex-shrink-0`}>
                      <span className={`w-3 h-3 rounded-full ${col.dot} flex-shrink-0`} />
                      <span className={`text-sm font-semibold ${col.text}`}>{col.label}</span>
                      <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${col.head} ${col.text} border ${col.ring}`}>
                        {colTasks.length}
                      </span>
                    </div>
                    <div className={`flex-1 overflow-y-auto p-2 space-y-2 transition-colors ${isDropTarget ? 'bg-blue-50 ring-2 ring-inset ring-blue-300' : 'bg-gray-50'}`}>
                      {colTasks.length === 0 ? (
                        <div className="flex items-center justify-center py-12 text-gray-300 text-xs">
                          {isDropTarget ? '⬇ Drop here' : 'No tasks'}
                        </div>
                      ) : colTasks.map(task => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={e => { dragTaskId.current = task.id; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', task.id); }}
                          onDragEnd={() => { dragTaskId.current = null; setDragOverCol(null); }}
                          onClick={() => navigate(`/fix/task/${task.id}`)}
                          className="bg-white rounded-xl border border-gray-200 overflow-hidden cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                        >
                          {task.image && (
                            <div className="w-full h-24 bg-gray-100">
                              <img src={task.image} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="p-3">
                            <p className="text-xs font-medium text-gray-900 leading-snug">{task.title}</p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: task.groupColor }} />
                              <span className="text-[10px] text-gray-400 truncate">{task.groupName}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── Filtered feed (date-grouped) ── */
            <div className="flex-1 overflow-y-auto">
              {feedTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <p>No tasks found</p>
                </div>
              ) : (
                groupedFeedTasks.map(group => (
                  <div key={group.label}>
                    <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                      <span className="text-xs font-semibold text-gray-500">{group.label}</span>
                      <div className="h-px flex-1 bg-gray-200" />
                      <span className="text-xs text-gray-400 font-medium">{group.tasks.length}</span>
                    </div>
                    {group.tasks.map(task => (
                      <TaskListItem key={task.id} task={task} onClick={() => navigate(`/fix/task/${task.id}`)} />
                    ))}
                  </div>
                ))
              )}
            </div>
          )
        )}
        {tab === 'groups' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className={viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-3'}>
              {filteredGroups.map(group => (
                <GroupCard key={group.id} group={group} onClick={() => navigate(`/fix/group/${group.id}`)} />
              ))}
            </div>
          </div>
        )}
        {tab === 'areas' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className={viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-3'}>
              {filteredAreas.map(area => (
                <AreaCard key={area.id} area={area} onClick={() => navigate(`/fix/area/${area.id}`)} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Snap button (photo-first task creation) — always visible on feed tab */}
      {tab === 'feed' && (
        <button
          onClick={() => setShowCamera(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl flex items-center justify-center z-30 transition-transform active:scale-95"
          title="Snap — create task"
        >
          <Camera size={24} />
        </button>
      )}

      {showCamera && (
        <CameraCapture
          onCapture={dataUrl => {
            setCapturedPhoto(dataUrl);
            setShowCamera(false);
            setShowCreate(true);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}

      {showCreate && (
        <CreateTaskModal
          onClose={() => { setShowCreate(false); setCapturedPhoto(undefined); }}
          onSave={handleCreateTask}
          initialPhoto={capturedPhoto}
        />
      )}
      {showCreateGroup && (
        <CreateGroupModal
          teamMembers={teamMembers}
          onClose={() => setShowCreateGroup(false)}
          onSave={g => { addGroup(g); setShowCreateGroup(false); }}
        />
      )}
      {showCreateArea && (
        <CreateAreaModal
          onClose={() => setShowCreateArea(false)}
          onSave={(a: Area) => { addArea(a); setShowCreateArea(false); }}
        />
      )}
    </div>
  );
}
