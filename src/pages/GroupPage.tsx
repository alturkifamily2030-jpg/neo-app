import { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QRScanner from '../components/ui/QRScanner';
import {
  ChevronLeft, MessageCircle, Filter, Search, Plus, QrCode, MoreHorizontal,
  ArrowUpDown, ScanLine, User, Star, LayoutGrid, List, Link2, Columns3, RefreshCw,
  ChevronLeft as CalLeft, ChevronRight as CalRight, Calendar, Settings,
  Bell, CheckCircle2, Trash2, X, Check, ChevronRight as ChevRight,
  Users, ShieldCheck, ClipboardList, Tag,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { plannedTasks as allPlanned } from '../data/mockData';
import { useNotifications } from '../context/NotificationContext';
import type { Task, Group } from '../types';
import CreateTaskModal from '../components/fix/CreateTaskModal';
import QRCodeCanvas, { downloadCanvasAsPng, printQRCode } from '../components/ui/QRCodeCanvas';

type GroupTab = 'tasks' | 'planned';
type StatusFilter = 'open' | 'in_progress' | 'done';

const GROUP_ICONS = ['🔧','🪚','⚡','🌿','🔍','🏠','⚙️','🪲','❄️','🔥','👤','🔎','📍','🧹','⚠️','🤵','🎭','💡','🔑','🛠️','🏗️','🚿','🏊','🌊','🌳','🚪','📦','🎯','📋','🔐'];
const GROUP_COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#6b7280','#ec4899','#f97316','#14b8a6','#a855f7','#0ea5e9','#84cc16'];

export default function GroupPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { tasks, addTask, groups, teamMembers } = useNotifications();
  const group = groups.find(g => g.id === id);
  const [groupTab, setGroupTab] = useState<GroupTab>('tasks');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [splitView, setSplitView] = useState(false);
  const [plannedSplitView, setPlannedSplitView] = useState(false);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <p>Group not found</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline text-sm">Back to Fix</button>
      </div>
    );
  }

  if (showSettings) {
    return <GroupSettingsView group={group} onBack={() => setShowSettings(false)} />;
  }

  const groupTasks = tasks.filter(t => t.groupId === group.id);
  const displayCounts = {
    open: group.counts.red,
    in_progress: group.counts.yellow,
    done: group.counts.green,
  };
  const filteredTasks = groupTasks
    .filter(t => t.status === statusFilter)
    .filter(t => t.title.toLowerCase().includes(search.toLowerCase()));

  const groupPlanned = allPlanned.filter(p => p.groupId === group.id);
  const monthStart = startOfMonth(calendarDate);
  const monthEnd = endOfMonth(calendarDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDow = getDay(monthStart);
  const plannedDates = groupPlanned.map(p => p.scheduledAt);

  const handleCreateTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'comments'>) => {
    addTask({ ...taskData, id: `t${Date.now()}`, createdAt: new Date(), comments: [] });
  };

  // Custom traffic light labels (with fallback to defaults)
  const tl = {
    open: group.trafficLightLabels?.red ?? 'Open',
    in_progress: group.trafficLightLabels?.yellow ?? 'In Progress',
    done: group.trafficLightLabels?.green ?? 'Done',
  };

  const statusDotColor = { open: 'bg-red-500', in_progress: 'bg-yellow-400', done: 'bg-green-500' };
  const statusLabel = { open: `${tl.open} tasks`, in_progress: `${tl.in_progress} tasks`, done: `${tl.done} tasks` };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <ChevronLeft size={20} />
        </button>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
          style={{ backgroundColor: group.color + '20' }}>
          {group.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-gray-900 truncate">{group.name}</h1>
          <p className="text-xs text-gray-400">{group.memberIds.length} member{group.memberIds.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          title="Group Settings"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Require Approval banner */}
      {group.requiresApproval && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 flex items-center gap-2">
          <ShieldCheck size={13} className="text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-700 font-medium">Task Approval required — completed tasks need admin sign-off</p>
        </div>
      )}

      {/* Tabs + Members avatars */}
      <div className="bg-white border-b border-gray-200 px-4 flex items-center justify-between py-2">
        <div className="flex items-center gap-1">
          {(['tasks', 'planned'] as GroupTab[]).map(t => (
            <button key={t} onClick={() => setGroupTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${groupTab === t ? 'bg-white shadow-sm border border-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {t === 'tasks' ? 'Tasks' : 'Planned Tasks'}
            </button>
          ))}
        </div>
        <div className="flex items-center">
          {teamMembers.filter(u => group.memberIds.includes(u.id)).slice(0, 5).map((u, i) => (
            <div key={u.id} title={u.name}
              className="w-7 h-7 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
              style={{ marginLeft: i === 0 ? 0 : -8, zIndex: i }}>
              {u.name.charAt(0)}
            </div>
          ))}
          {group.memberIds.length > 5 && (
            <div className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-gray-600 text-[10px] font-bold flex-shrink-0" style={{ marginLeft: -8 }}>
              +{group.memberIds.length - 5}
            </div>
          )}
        </div>
      </div>

      {/* ── TASKS TAB ── */}
      {groupTab === 'tasks' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400" title="Sort"><ArrowUpDown size={16} /></button>
              <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400" title="Scan QR Code" onClick={() => setShowQRScanner(true)}><ScanLine size={16} /></button>
              <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400" title="My tasks"><User size={16} /></button>
              <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400" title="Starred"><Star size={16} /></button>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-3 mr-2">
                {(['open', 'in_progress', 'done'] as StatusFilter[]).map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)} title={statusLabel[s]}
                    className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors
                      ${statusFilter === s ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
                    <span className={`w-5 h-5 rounded-full ${statusDotColor[s]}`}></span>
                    <span className={`text-xs font-semibold ${s === 'open' ? 'text-red-500' : s === 'in_progress' ? 'text-yellow-500' : 'text-green-500'}`}>
                      {displayCounts[s]}
                    </span>
                    {statusFilter === s && <span className={`h-0.5 w-full rounded-full ${statusDotColor[s]}`}></span>}
                  </button>
                ))}
              </div>
              <button onClick={() => { setViewMode('list'); setSplitView(false); }}
                className={`p-1.5 rounded ${viewMode === 'list' && !splitView ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'}`}>
                <List size={16} />
              </button>
              <button onClick={() => { setViewMode('grid'); setSplitView(false); }}
                className={`p-1.5 rounded ${viewMode === 'grid' && !splitView ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'}`}>
                <LayoutGrid size={16} />
              </button>
              <button onClick={() => setSplitView(v => !v)} title="Split view"
                className={`p-1.5 rounded ${splitView ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'}`}>
                <Columns3 size={16} />
              </button>
              <button className="p-1.5 rounded text-gray-400 hover:text-gray-600"><Link2 size={16} /></button>
            </div>
          </div>

          <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center gap-2">
            <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><MessageCircle size={18} /></button>
            <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Filter size={18} /></button>
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search Tasks" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={() => setShowCreate(true)}
              className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center flex-shrink-0">
              <Plus size={18} />
            </button>
            <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><QrCode size={18} /></button>
            <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><MoreHorizontal size={18} /></button>
          </div>

          <div className="flex-1 overflow-hidden">
            {splitView ? (
              <div className="h-full flex overflow-x-auto">
                {([
                  { status: 'open' as const, label: tl.open, dot: 'bg-red-500', ring: 'border-red-200', head: 'bg-red-50', text: 'text-red-600', count: displayCounts.open },
                  { status: 'in_progress' as const, label: tl.in_progress, dot: 'bg-yellow-400', ring: 'border-yellow-200', head: 'bg-yellow-50', text: 'text-yellow-600', count: displayCounts.in_progress },
                  { status: 'done' as const, label: tl.done, dot: 'bg-green-500', ring: 'border-green-200', head: 'bg-green-50', text: 'text-green-600', count: displayCounts.done },
                ]).map(col => {
                  const colTasks = groupTasks.filter(t => t.status === col.status).filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
                  return (
                    <div key={col.status} className="flex-1 min-w-[280px] flex flex-col border-r border-gray-200 last:border-r-0">
                      <div className={`flex items-center gap-2 px-4 py-3 ${col.head} border-b ${col.ring} flex-shrink-0`}>
                        <span className={`w-3 h-3 rounded-full ${col.dot} flex-shrink-0`} />
                        <span className={`text-sm font-semibold ${col.text}`}>{col.label}</span>
                        <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${col.head} ${col.text} border ${col.ring}`}>{col.count}</span>
                      </div>
                      <div className="flex-1 overflow-y-auto bg-gray-50 p-2 space-y-2">
                        {colTasks.length === 0
                          ? <div className="flex items-center justify-center py-12 text-gray-300 text-xs">No tasks</div>
                          : colTasks.map(task => (
                            <div key={task.id} onClick={() => navigate(`/fix/task/${task.id}`)}
                              className="bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                              {task.image && <div className="w-full h-24 bg-gray-100"><img src={task.image} alt="" className="w-full h-full object-cover" /></div>}
                              <div className="p-3">
                                <p className="text-xs font-medium text-gray-900 leading-snug">{task.title}</p>
                                <p className="text-[10px] text-gray-400 mt-1">{format(task.createdAt, 'MMM d, HH:mm')}</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full overflow-y-auto">
                {filteredTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <div className="flex gap-3 mb-4">
                      <span className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><span className="w-5 h-5 rounded-full bg-red-300"></span></span>
                      <span className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center"><span className="w-5 h-5 rounded-full bg-yellow-200"></span></span>
                      <span className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center"><span className="w-5 h-5 rounded-full bg-green-200"></span></span>
                    </div>
                    <p className="text-base font-semibold text-gray-600">Manage your Tasks in a Snap!</p>
                    <p className="text-sm text-gray-400 mt-1">
                      To add a task, click on the{' '}
                      <button onClick={() => setShowCreate(true)} className="w-5 h-5 bg-blue-600 text-white rounded-full inline-flex items-center justify-center mx-1"><Plus size={12} /></button>{' '}button.
                    </p>
                  </div>
                ) : viewMode === 'list' ? (
                  <div>
                    {filteredTasks.map(task => (
                      <div key={task.id}
                        className="flex items-center gap-4 px-4 py-3 bg-white border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/fix/task/${task.id}`)}>
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                            {task.image ? <img src={task.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200" />}
                          </div>
                          <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${statusDotColor[task.status]}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{format(task.createdAt, 'MMM d, yyyy HH:mm')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filteredTasks.map(task => (
                      <div key={task.id}
                        className="bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => navigate(`/fix/task/${task.id}`)}>
                        <div className="w-full h-28 bg-gray-100 relative">
                          {task.image ? <img src={task.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200" />}
                          <span className={`absolute top-2 right-2 w-3 h-3 rounded-full border-2 border-white ${statusDotColor[task.status]}`} />
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-medium text-gray-900 truncate">{task.title}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{format(task.createdAt, 'MMM d')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PLANNED TASKS TAB ── */}
      {groupTab === 'planned' && (
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
            <div>
              <h2 className="text-base font-bold text-gray-900">Plan</h2>
              <p className="text-xs text-gray-400">Here you find all information about Calendar.</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400"><Filter size={16} /></button>
              <button onClick={() => setPlannedSplitView(v => !v)}
                className={`p-1.5 rounded ${plannedSplitView ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'}`}>
                <Columns3 size={16} />
              </button>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input placeholder="Search Planned Tasks"
                  className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48" />
              </div>
            </div>
          </div>

          <div className="flex gap-0 h-full">
            <div className="w-72 flex-shrink-0 border-r border-gray-200 p-4 space-y-4 bg-white">
              <div className="border border-gray-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-3">
                  <button onClick={() => setCalendarDate(d => subMonths(d, 1))} className="p-1 rounded hover:bg-gray-100"><CalLeft size={14} /></button>
                  <span className="text-sm font-semibold text-gray-700">{format(calendarDate, 'MMM yyyy').toUpperCase()}</span>
                  <button onClick={() => setCalendarDate(d => addMonths(d, 1))} className="p-1 rounded hover:bg-gray-100"><CalRight size={14} /></button>
                </div>
                <div className="grid grid-cols-7 mb-1">
                  {['S','M','T','W','T','F','S'].map((d, i) => (
                    <div key={i} className="text-center text-[10px] font-medium text-gray-400 py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-1">
                  {Array.from({ length: startDow }).map((_, i) => <div key={`e${i}`} />)}
                  {days.map(day => {
                    const hasTask = plannedDates.some(d => isSameDay(d, day));
                    const today = isToday(day);
                    return (
                      <button key={day.toISOString()}
                        className={`w-7 h-7 mx-auto rounded-full text-xs flex items-center justify-center transition-colors
                          ${today ? 'bg-blue-600 text-white font-bold' : 'hover:bg-gray-100 text-gray-700'}`}>
                        {format(day, 'd')}
                        {hasTask && !today && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Manage Planned Tasks</h3>
                {groupPlanned.length === 0 ? (
                  <div className="text-center py-6">
                    <Calendar size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-xs font-medium text-gray-500">Manage your Planned Tasks in a Snap!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {groupPlanned.map(pt => (
                      <div key={pt.id} onClick={() => navigate(`/plan/${pt.id}`)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <div className="w-8 h-8 rounded bg-gray-200 flex-shrink-0 overflow-hidden">
                          {pt.image && <img src={pt.image} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{pt.title}</p>
                          <p className="text-[10px] text-gray-400 capitalize">{pt.recurrence}</p>
                        </div>
                        <div className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors flex-shrink-0 ${pt.enabled ? 'bg-blue-600 justify-end' : 'bg-gray-200 justify-start'}`}>
                          <div className="w-4 h-4 rounded-full bg-white shadow" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {plannedSplitView ? (
              <div className="flex-1 flex overflow-x-auto overflow-y-hidden">
                {([
                  { key: 'once', label: 'Once / Daily', dot: 'bg-gray-400', ring: 'border-gray-200', head: 'bg-gray-50', text: 'text-gray-600', match: (r: string) => r === 'never' || r === 'daily' },
                  { key: 'weekly', label: 'Weekly', dot: 'bg-blue-500', ring: 'border-blue-200', head: 'bg-blue-50', text: 'text-blue-600', match: (r: string) => r === 'weekly' },
                  { key: 'monthly', label: 'Monthly', dot: 'bg-purple-500', ring: 'border-purple-200', head: 'bg-purple-50', text: 'text-purple-600', match: (r: string) => r === 'monthly' },
                ] as const).map(col => {
                  const colTasks = groupPlanned.filter(pt => col.match(pt.recurrence));
                  return (
                    <div key={col.key} className="flex-1 min-w-[260px] flex flex-col border-r border-gray-200 last:border-r-0">
                      <div className={`flex items-center gap-2 px-4 py-3 ${col.head} border-b ${col.ring} flex-shrink-0`}>
                        <RefreshCw size={13} className={col.text} />
                        <span className={`text-sm font-semibold ${col.text}`}>{col.label}</span>
                        <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${col.head} ${col.text} border ${col.ring}`}>{colTasks.length}</span>
                      </div>
                      <div className="flex-1 overflow-y-auto bg-gray-50 p-2 space-y-2">
                        {colTasks.length === 0
                          ? <div className="flex items-center justify-center py-12 text-gray-300 text-xs">No tasks</div>
                          : colTasks.map(pt => (
                            <div key={pt.id} onClick={() => navigate(`/plan/${pt.id}`)} className="bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                              {pt.image && <div className="w-full h-20 bg-gray-100"><img src={pt.image} alt="" className="w-full h-full object-cover" /></div>}
                              <div className="p-3">
                                <p className="text-xs font-medium text-gray-900 leading-snug">{pt.title}</p>
                                <p className="text-[10px] text-gray-400 mt-1">{format(pt.scheduledAt, 'MMM d · HH:mm')}</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 p-4 overflow-y-auto">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Planned Tasks</h3>
                {groupPlanned.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                    <p className="text-sm">No data available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groupPlanned.map(pt => (
                      <div key={pt.id} onClick={() => navigate(`/plan/${pt.id}`)} className="bg-white rounded-xl border border-gray-200 overflow-hidden flex gap-3 p-3 cursor-pointer hover:shadow-md transition-shadow">
                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                          {pt.image && <img src={pt.image} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{pt.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{format(pt.scheduledAt, 'MMM d · HH:mm')}</p>
                          <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: group.color + '20', color: group.color }}>{group.name}</span>
                        </div>
                        <span className="text-gray-300 flex items-center flex-shrink-0">›</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showCreate && (
        <CreateTaskModal onClose={() => setShowCreate(false)} onSave={handleCreateTask} defaultGroupId={group.id} />
      )}

      {showQRScanner && (
        <QRScanner
          onScan={data => {
            // Navigate to task if QR matches task ID pattern
            if (data.startsWith('t') || data.includes('/fix/task/')) {
              const taskId = data.includes('/fix/task/') ? data.split('/fix/task/')[1] : data;
              navigate(`/fix/task/${taskId}`);
            } else {
              // Show the scanned data as alert if not a task QR
              alert(`QR Code: ${data}`);
            }
          }}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  );
}

// ─── GROUP SETTINGS VIEW ────────────────────────────────────────────────────

function GroupSettingsView({ group, onBack }: { group: Group; onBack: () => void }) {
  const navigate = useNavigate();
  const { updateGroup, deleteGroup, teamMembers } = useNotifications();
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const handleQRReady = useCallback((canvas: HTMLCanvasElement) => { qrCanvasRef.current = canvas; }, []);

  type SettingsSection = 'main' | 'general' | 'traffic' | 'members' | 'notifications' | 'tags' | 'qr';

  const [section, setSection] = useState<SettingsSection>('main');

  // General edit state
  const [editName, setEditName] = useState(group.name);
  const [editDesc, setEditDesc] = useState(group.description);
  const [editIcon, setEditIcon] = useState(group.icon);
  const [editColor, setEditColor] = useState(group.color);

  // Traffic light labels
  const [redLabel, setRedLabel] = useState(group.trafficLightLabels?.red ?? 'Open');
  const [yellowLabel, setYellowLabel] = useState(group.trafficLightLabels?.yellow ?? 'In Progress');
  const [greenLabel, setGreenLabel] = useState(group.trafficLightLabels?.green ?? 'Done');

  // Members
  const [showAddMember, setShowAddMember] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const groupMembers = teamMembers.filter(u => group.memberIds.includes(u.id));
  const nonMembers = teamMembers.filter(u => !group.memberIds.includes(u.id) && u.accepted !== false);

  const getMemberRole = (uid: string) => group.memberRoles?.[uid] ?? 'user';

  const toggleMemberRole = (uid: string) => {
    const current = getMemberRole(uid);
    const newRole = current === 'admin' ? 'user' : 'admin';
    updateGroup(group.id, {
      memberRoles: { ...(group.memberRoles ?? {}), [uid]: newRole },
    });
  };

  const addMember = (uid: string) => {
    updateGroup(group.id, { memberIds: [...group.memberIds, uid] });
    setShowAddMember(false);
  };

  const removeMember = (uid: string) => {
    const newIds = group.memberIds.filter(id => id !== uid);
    const newRoles = { ...(group.memberRoles ?? {}) };
    delete newRoles[uid];
    updateGroup(group.id, { memberIds: newIds, memberRoles: newRoles });
  };

  const saveGeneral = () => {
    updateGroup(group.id, {
      name: editName.trim() || group.name,
      description: editDesc,
      icon: editIcon,
      color: editColor,
    });
    setSection('main');
  };

  const saveTrafficLabels = () => {
    updateGroup(group.id, {
      trafficLightLabels: {
        red: redLabel.trim() || 'Open',
        yellow: yellowLabel.trim() || 'In Progress',
        green: greenLabel.trim() || 'Done',
      },
    });
    setSection('main');
  };

  const toggle = (field: 'notificationsOn' | 'requiresApproval' | 'dailySummary', current: boolean) => {
    updateGroup(group.id, { [field]: !current });
  };

  const toggleTag = (tag: 'location' | 'equipment' | 'category') => {
    const current = group.activeTags ?? { location: true, equipment: true, category: true };
    updateGroup(group.id, { activeTags: { ...current, [tag]: !current[tag] } });
  };

  const handleDelete = () => {
    deleteGroup(group.id);
    navigate('/fix');
  };

  // ── Main Settings Menu ──
  if (section === 'main') {
    const tl = group.trafficLightLabels;
    const activeTags = group.activeTags ?? { location: true, equipment: true, category: true };

    const menuItems = [
      {
        icon: <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: group.color + '20' }}>{group.icon}</div>,
        label: 'General',
        subtitle: group.name,
        key: 'general' as SettingsSection,
      },
      {
        icon: <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center"><span className="text-base">🚦</span></div>,
        label: 'Traffic Light Labels',
        subtitle: tl ? `${tl.red} · ${tl.yellow} · ${tl.green}` : 'Open · In Progress · Done',
        key: 'traffic' as SettingsSection,
      },
      {
        icon: <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center"><Users size={16} className="text-blue-600" /></div>,
        label: 'Members',
        subtitle: `${group.memberIds.length} member${group.memberIds.length !== 1 ? 's' : ''}`,
        key: 'members' as SettingsSection,
      },
      {
        icon: <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center"><Bell size={16} className="text-purple-600" /></div>,
        label: 'Notifications & Reports',
        subtitle: group.notificationsOn ? 'Notifications on' : 'Notifications off',
        key: 'notifications' as SettingsSection,
      },
      {
        icon: <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center"><Tag size={16} className="text-green-600" /></div>,
        label: 'Tags',
        subtitle: [activeTags.location && 'Location', activeTags.equipment && 'Equipment', activeTags.category && 'Category'].filter(Boolean).join(', ') || 'None active',
        key: 'tags' as SettingsSection,
      },
      {
        icon: <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center"><QrCode size={16} className="text-gray-600" /></div>,
        label: 'QR Code',
        subtitle: 'Generate & download QR code',
        key: 'qr' as SettingsSection,
      },
    ];

    return (
      <div className="h-full flex flex-col">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><ChevronLeft size={20} /></button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-gray-900">Group Settings</h1>
            <p className="text-xs text-gray-400">{group.name}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50">
          {/* Group header card */}
          <div className="bg-white m-4 rounded-2xl border border-gray-200 p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: group.color + '20' }}>
              {group.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">{group.name}</p>
              <p className="text-sm text-gray-400 mt-0.5">{group.description}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: group.color }} />
                <span className="text-xs text-gray-500">{group.memberIds.length} members</span>
              </div>
            </div>
          </div>

          {/* Menu list */}
          <div className="bg-white mx-4 rounded-2xl border border-gray-200 overflow-hidden mb-4">
            {menuItems.map((item, idx) => (
              <button key={item.key} onClick={() => setSection(item.key)}
                className={`flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 text-left transition-colors ${idx < menuItems.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div className="flex-shrink-0">{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-400 truncate">{item.subtitle}</p>
                </div>
                <ChevRight size={16} className="text-gray-300 flex-shrink-0" />
              </button>
            ))}
          </div>

          {/* Danger Zone */}
          <div className="bg-white mx-4 rounded-2xl border border-red-100 overflow-hidden mb-6">
            <div className="px-4 py-2 border-b border-red-100">
              <p className="text-xs font-semibold text-red-500 uppercase tracking-wide">Danger Zone</p>
            </div>
            <button className="flex items-center gap-3 w-full px-4 py-3 hover:bg-red-50 text-left border-b border-gray-100">
              <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                <ClipboardList size={16} className="text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Archive Group</p>
                <p className="text-xs text-gray-400">Hide this group from view, preserving all data</p>
              </div>
            </button>
            <button onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-red-50 text-left">
              <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 size={16} className="text-red-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-600">Delete Group</p>
                <p className="text-xs text-gray-400">Permanently delete this group and all tasks</p>
              </div>
            </button>
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Delete Group?</h3>
              <p className="text-sm text-gray-500 mb-5">
                "<strong>{group.name}</strong>" and all its tasks will be permanently deleted. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={handleDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2.5 text-sm font-medium">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Section header helper ──
  const SectionHeader = ({ title }: { title: string }) => (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
      <button onClick={() => setSection('main')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><ChevronLeft size={20} /></button>
      <h1 className="text-base font-semibold text-gray-900">{title}</h1>
    </div>
  );

  // ── General ──
  if (section === 'general') {
    return (
      <div className="h-full flex flex-col">
        <SectionHeader title="General" />
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
          {/* Icon picker */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Group Icon</p>
            <div className="grid grid-cols-10 gap-2">
              {GROUP_ICONS.map(emoji => (
                <button key={emoji} onClick={() => setEditIcon(emoji)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-colors
                    ${editIcon === emoji ? 'ring-2 ring-blue-500' : 'hover:bg-gray-100'}`}
                  style={{ backgroundColor: editIcon === emoji ? editColor + '20' : undefined }}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Group Color</p>
            <div className="flex flex-wrap gap-3">
              {GROUP_COLORS.map(color => (
                <button key={color} onClick={() => setEditColor(color)}
                  className={`w-9 h-9 rounded-full transition-transform ${editColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>

          {/* Name & Description */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Group Name</label>
              <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Description</label>
              <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Preview</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: editColor + '20' }}>{editIcon}</div>
              <div>
                <p className="font-semibold text-gray-900">{editName || 'Group Name'}</p>
                <p className="text-sm text-gray-400">{editDesc || 'Description'}</p>
              </div>
            </div>
          </div>

          <button onClick={saveGeneral}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2">
            <Check size={16} /> Save Changes
          </button>
        </div>
      </div>
    );
  }

  // ── Traffic Light Labels ──
  if (section === 'traffic') {
    return (
      <div className="h-full flex flex-col">
        <SectionHeader title="Traffic Light Labels" />
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <p className="text-xs text-blue-700">
              Customize the names of each traffic light status for this group. These labels appear in the task status buttons and filters.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {[
              { dot: 'bg-red-500', label: '🔴 Red — Task Created', value: redLabel, set: setRedLabel, placeholder: 'Open' },
              { dot: 'bg-yellow-400', label: '🟡 Yellow — In Progress', value: yellowLabel, set: setYellowLabel, placeholder: 'In Progress' },
              { dot: 'bg-green-500', label: '🟢 Green — Completed', value: greenLabel, set: setGreenLabel, placeholder: 'Done' },
            ].map(({ label, value, set, placeholder }) => (
              <div key={label} className="px-4 py-3">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
                <input type="text" value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
          </div>

          {/* Preview */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Preview</p>
            <div className="flex gap-2">
              {[
                { dot: 'bg-red-500', label: redLabel || 'Open', active: 'bg-red-100 text-red-700 border-red-200' },
                { dot: 'bg-yellow-400', label: yellowLabel || 'In Progress', active: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
                { dot: 'bg-green-500', label: greenLabel || 'Done', active: 'bg-green-100 text-green-700 border-green-200' },
              ].map(({ label, active }) => (
                <div key={label} className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border text-center ${active}`}>
                  {label}
                </div>
              ))}
            </div>
          </div>

          <button onClick={saveTrafficLabels}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2">
            <Check size={16} /> Save Labels
          </button>
        </div>
      </div>
    );
  }

  // ── Members ──
  if (section === 'members') {
    return (
      <div className="h-full flex flex-col">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSection('main')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><ChevronLeft size={20} /></button>
          <h1 className="text-base font-semibold text-gray-900 flex-1">Members</h1>
          <button onClick={() => setShowAddMember(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg">
            <Plus size={14} /> Add Member
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="bg-white divide-y divide-gray-100 border-b border-gray-200">
            {groupMembers.map(u => {
              const role = getMemberRole(u.id);
              return (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {u.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0
                        ${role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                        {role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{u.role}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => toggleMemberRole(u.id)}
                      className={`text-xs px-2 py-1 rounded-lg border font-medium transition-colors
                        ${role === 'admin' ? 'text-purple-700 border-purple-200 hover:bg-purple-50' : 'text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
                      {role === 'admin' ? 'Make User' : 'Make Admin'}
                    </button>
                    <button onClick={() => removeMember(u.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400">
                      <X size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {groupMembers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Users size={32} className="mb-2" />
              <p className="text-sm">No members yet</p>
            </div>
          )}
        </div>

        {showAddMember && nonMembers.length > 0 && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
            <div className="bg-white rounded-t-2xl w-full max-w-md max-h-[70vh] flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-900">Add to Group</h3>
                <button onClick={() => setShowAddMember(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={18} /></button>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                {nonMembers.map(u => (
                  <button key={u.id} onClick={() => addMember(u.id)}
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 text-left">
                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.role}</p>
                    </div>
                    <Plus size={16} className="ml-auto text-blue-500 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Notifications & Reports ──
  if (section === 'notifications') {
    const rows = [
      {
        icon: <Bell size={18} className={group.notificationsOn ? 'text-blue-600' : 'text-gray-400'} />,
        label: 'Group Notifications',
        desc: 'Receive push notifications for new tasks in this group',
        value: group.notificationsOn,
        field: 'notificationsOn' as const,
      },
      {
        icon: <CheckCircle2 size={18} className={group.requiresApproval ? 'text-amber-500' : 'text-gray-400'} />,
        label: 'Require Task Approval',
        desc: 'Tasks marked Done by Users need Admin approval before closing',
        value: group.requiresApproval ?? false,
        field: 'requiresApproval' as const,
      },
      {
        icon: <ClipboardList size={18} className={group.dailySummary ? 'text-purple-600' : 'text-gray-400'} />,
        label: 'Daily Summary Report',
        desc: 'Send a daily email summary of all task activity in this group',
        value: group.dailySummary ?? false,
        field: 'dailySummary' as const,
      },
    ];

    return (
      <div className="h-full flex flex-col">
        <SectionHeader title="Notifications & Reports" />
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-3">
          {rows.map(row => (
            <div key={row.field} className="bg-white rounded-xl border border-gray-200 px-4 py-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                {row.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{row.label}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-snug">{row.desc}</p>
              </div>
              <button onClick={() => toggle(row.field, row.value)}
                className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 relative ${row.value ? 'bg-blue-600' : 'bg-gray-200'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-transform ${row.value ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          ))}

          {group.requiresApproval && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-xs text-amber-700 font-medium">Task Approval is active</p>
              <p className="text-xs text-amber-600 mt-1">When a User marks a task as Done (Green), it enters a "Pending Approval" state. Group Admins will receive a notification and can approve or reject the completion.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Tags ──
  if (section === 'tags') {
    const activeTags = group.activeTags ?? { location: true, equipment: true, category: true };

    const tagRows = [
      { key: 'location' as const, emoji: '📍', label: 'Location Tags', desc: 'Tag tasks with a physical location (e.g. Pool Area, Guest House)', color: 'bg-blue-50', textColor: 'text-blue-600' },
      { key: 'equipment' as const, emoji: '🔧', label: 'Equipment Tags', desc: 'Tag tasks with specific equipment (e.g. AC Unit, Pool Pump)', color: 'bg-purple-50', textColor: 'text-purple-600' },
      { key: 'category' as const, emoji: '🏷', label: 'Category Tags', desc: 'Tag tasks with a work category (e.g. Repair, Inspection, Maintenance)', color: 'bg-emerald-50', textColor: 'text-emerald-600' },
    ];

    return (
      <div className="h-full flex flex-col">
        <SectionHeader title="Tags" />
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-3">
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-500">Control which tag types are active for this group. Active tags can be added to tasks to help organize and filter work orders.</p>
          </div>

          {tagRows.map(row => (
            <div key={row.key} className="bg-white rounded-xl border border-gray-200 px-4 py-4 flex items-center gap-4">
              <div className={`w-9 h-9 rounded-xl ${row.color} flex items-center justify-center text-lg flex-shrink-0`}>
                {row.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{row.label}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-snug">{row.desc}</p>
              </div>
              <button onClick={() => toggleTag(row.key)}
                className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 relative ${activeTags[row.key] ? 'bg-blue-600' : 'bg-gray-200'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-transform ${activeTags[row.key] ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── QR Code ──
  if (section === 'qr') {
    return (
      <div className="h-full flex flex-col">
        <SectionHeader title="QR Code" />
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center">
            <QRCodeCanvas
              value={`${window.location.origin}/fix/group/${group.id}`}
              size={180}
              onReady={handleQRReady}
            />
            <p className="text-sm font-semibold text-gray-900 mt-4 mb-1">{group.name}</p>
            <p className="text-xs text-gray-400 text-center mb-5">Anyone scanning this QR code can instantly submit a task to this group — no app required.</p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => qrCanvasRef.current && printQRCode(qrCanvasRef.current, group.name)}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Print / PDF
              </button>
              <button
                onClick={() => qrCanvasRef.current && downloadCanvasAsPng(qrCanvasRef.current, `qr-${group.name}.png`)}
                className="flex-1 bg-blue-700 hover:bg-blue-800 text-white rounded-xl py-2.5 text-sm font-medium">
                Download PNG
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">How it works</p>
            <div className="space-y-2.5">
              {[
                { n: '1', text: 'Print this QR code and place it in the area this group covers' },
                { n: '2', text: 'Anyone scans the code with their phone camera (no app needed)' },
                { n: '3', text: 'They take a photo, add a description, and submit' },
                { n: '4', text: 'The task appears in this group under the "SnapBot" reporter' },
              ].map(step => (
                <div key={step.n} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{step.n}</div>
                  <p className="text-sm text-gray-600">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
