import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Home, Plus, Search, Filter, MoreHorizontal,
  QrCode, MessageCircle, LayoutGrid, List, ArrowUpDown, User, Star, Link2, Columns3,
} from 'lucide-react';
import QRScanner from '../components/ui/QRScanner';
import { format } from 'date-fns';
import { useNotifications } from '../context/NotificationContext';
import type { Task } from '../types';
import CreateTaskModal from '../components/fix/CreateTaskModal';

type StatusFilter = 'open' | 'in_progress' | 'done';

export default function AreaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { tasks, addTask, areas, groups } = useNotifications();
  const area = areas.find(a => a.id === id);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [splitView, setSplitView] = useState(false);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  if (!area) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <p>Area not found</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline text-sm">
          Back to Fix
        </button>
      </div>
    );
  }

  const areaTasks = tasks.filter(t => t.areaId === area.id);

  // Use area's counts for display (includes historical)
  const displayCounts = {
    open: area.counts.red,
    in_progress: area.counts.yellow,
    done: area.counts.green,
  };

  const filteredTasks = areaTasks
    .filter(t => t.status === statusFilter)
    .filter(t => t.title.toLowerCase().includes(search.toLowerCase()));

  const statusDotColor = {
    open: 'bg-red-500',
    in_progress: 'bg-yellow-400',
    done: 'bg-green-500',
  };

  const statusLabel = {
    open: 'Open tasks',
    in_progress: 'Tasks in progress',
    done: 'Completed tasks',
  };

  const handleCreateTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'comments'>) => {
    addTask({
      ...taskData,
      id: `t${Date.now()}`,
      areaId: area.id,
      createdAt: new Date(),
      comments: [],
    });
  };

  // Groups that have tasks in this area
  const activeGroups = [...new Set(areaTasks.map(t => t.groupId))]
    .map(gid => groups.find(g => g.id === gid))
    .filter(Boolean);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Home size={18} className="text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-gray-900 truncate">{area.name}</h1>
          {area.description && area.description !== '-' && (
            <p className="text-xs text-gray-400">{area.description}</p>
          )}
        </div>
        {/* Active groups badges */}
        {activeGroups.length > 0 && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {activeGroups.slice(0, 3).map(g => g && (
              <span
                key={g.id}
                title={g.name}
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                style={{ backgroundColor: g.color + '20' }}
              >
                {g.icon}
              </span>
            ))}
            {activeGroups.length > 3 && (
              <span className="text-xs text-gray-400">+{activeGroups.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Toolbar row 1: filters + view toggles */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400" title="Sort">
            <ArrowUpDown size={16} />
          </button>
          <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400" title="My tasks">
            <User size={16} />
          </button>
          <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400" title="Starred">
            <Star size={16} />
          </button>
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-3">
          {(['open', 'in_progress', 'done'] as StatusFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              title={statusLabel[s]}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors
                ${statusFilter === s ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            >
              <span className={`w-5 h-5 rounded-full ${statusDotColor[s]}`}></span>
              <span className={`text-xs font-semibold
                ${s === 'open' ? 'text-red-500' : s === 'in_progress' ? 'text-yellow-500' : 'text-green-500'}`}>
                {displayCounts[s]}
              </span>
              {statusFilter === s && (
                <span className={`h-0.5 w-full rounded-full ${statusDotColor[s]}`}></span>
              )}
            </button>
          ))}
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-1">
          <button onClick={() => { setViewMode('list'); setSplitView(false); }}
            className={`p-1.5 rounded ${viewMode === 'list' && !splitView ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'}`}>
            <List size={16} />
          </button>
          <button onClick={() => { setViewMode('grid'); setSplitView(false); }}
            className={`p-1.5 rounded ${viewMode === 'grid' && !splitView ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'}`}>
            <LayoutGrid size={16} />
          </button>
          <button onClick={() => setSplitView(v => !v)} title="Split view — all statuses"
            className={`p-1.5 rounded ${splitView ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'}`}>
            <Columns3 size={16} />
          </button>
          <button className="p-1.5 rounded text-gray-400 hover:text-gray-600">
            <Link2 size={16} />
          </button>
        </div>
      </div>

      {/* Toolbar row 2: search + actions */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center gap-2">
        <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="Channel chat">
          <MessageCircle size={18} />
        </button>
        <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="Filter">
          <Filter size={18} />
        </button>
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search Tasks"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-full text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center flex-shrink-0"
        >
          <Plus size={18} />
        </button>
        <button
          onClick={() => setShowQRScanner(true)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          title="Scan QR Code"
        >
          <QrCode size={18} />
        </button>
        <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Task list / split view */}
      <div className="flex-1 overflow-hidden">
        {splitView ? (
          /* ── 3-column split view ── */
          <div className="h-full flex overflow-x-auto">
            {([
              { status: 'open'        as const, label: 'Open',        dot: 'bg-red-500',    ring: 'border-red-200',    head: 'bg-red-50',    text: 'text-red-600',    count: displayCounts.open },
              { status: 'in_progress' as const, label: 'In Progress', dot: 'bg-yellow-400', ring: 'border-yellow-200', head: 'bg-yellow-50', text: 'text-yellow-600', count: displayCounts.in_progress },
              { status: 'done'        as const, label: 'Done',        dot: 'bg-green-500',  ring: 'border-green-200',  head: 'bg-green-50',  text: 'text-green-600',  count: displayCounts.done },
            ]).map(col => {
              const colTasks = areaTasks
                .filter(t => t.status === col.status)
                .filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
              return (
                <div key={col.status} className="flex-1 min-w-[280px] flex flex-col border-r border-gray-200 last:border-r-0">
                  {/* Column header */}
                  <div className={`flex items-center gap-2 px-4 py-3 ${col.head} border-b ${col.ring} flex-shrink-0`}>
                    <span className={`w-3 h-3 rounded-full ${col.dot} flex-shrink-0`} />
                    <span className={`text-sm font-semibold ${col.text}`}>{col.label}</span>
                    <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${col.head} ${col.text} border ${col.ring}`}>
                      {col.count}
                    </span>
                  </div>
                  {/* Column tasks */}
                  <div className="flex-1 overflow-y-auto bg-gray-50 p-2 space-y-2">
                    {colTasks.length === 0 ? (
                      <div className="flex items-center justify-center py-12 text-gray-300 text-xs">
                        No tasks
                      </div>
                    ) : colTasks.map(task => (
                      <div
                        key={task.id}
                        onClick={() => navigate(`/fix/task/${task.id}`)}
                        className="bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
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
                          <p className="text-[10px] text-gray-300 mt-1">{format(task.createdAt, 'MMM d, HH:mm')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Single-status view ── */
          <div className="h-full overflow-y-auto">
            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="flex gap-3 mb-4">
                  <span className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="w-5 h-5 rounded-full bg-red-300"></span>
                  </span>
                  <span className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <span className="w-5 h-5 rounded-full bg-yellow-200"></span>
                  </span>
                  <span className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="w-5 h-5 rounded-full bg-green-200"></span>
                  </span>
                </div>
                <p className="text-base font-semibold text-gray-600">Manage your Tasks in a Snap!</p>
                <p className="text-sm text-gray-400 mt-1">
                  To add a task, click on the{' '}
                  <button onClick={() => setShowCreate(true)} className="w-5 h-5 bg-blue-600 text-white rounded-full inline-flex items-center justify-center mx-1">
                    <Plus size={12} />
                  </button>{' '}
                  button.
                </p>
              </div>
            ) : viewMode === 'list' ? (
              <div>
                {filteredTasks.map(task => (
                  <div
                    key={task.id}
                    className="flex items-center gap-4 px-4 py-3 bg-white border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/fix/task/${task.id}`)}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                        {task.image
                          ? <img src={task.image} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full bg-gray-200" />}
                      </div>
                      <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white
                        ${task.status === 'open' ? 'bg-red-500' : task.status === 'in_progress' ? 'bg-yellow-400' : 'bg-green-500'}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.groupColor }}></span>
                        <span className="text-xs text-gray-500">{task.groupName}</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {format(task.createdAt, 'MMM d, yyyy HH:mm')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredTasks.map(task => (
                  <div
                    key={task.id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/fix/task/${task.id}`)}
                  >
                    <div className="w-full h-28 bg-gray-100 relative">
                      {task.image
                        ? <img src={task.image} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-gray-200" />}
                      <span className={`absolute top-2 right-2 w-3 h-3 rounded-full border-2 border-white
                        ${task.status === 'open' ? 'bg-red-500' : task.status === 'in_progress' ? 'bg-yellow-400' : 'bg-green-500'}`}
                      />
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium text-gray-900 truncate">{task.title}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: task.groupColor }}></span>
                        <span className="text-[10px] text-gray-400 truncate">{task.groupName}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateTaskModal
          onClose={() => setShowCreate(false)}
          onSave={handleCreateTask}
        />
      )}

      {showQRScanner && (
        <QRScanner
          onScan={data => {
            if (data.includes('/fix/task/')) {
              navigate(data.split(window.location.origin)[1] || `/fix/task/${data}`);
            } else if (data.startsWith('t')) {
              navigate(`/fix/task/${data}`);
            } else {
              alert(`QR Code: ${data}`);
            }
          }}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  );
}
