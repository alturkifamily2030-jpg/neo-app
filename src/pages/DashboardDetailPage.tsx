import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useNotifications } from '../context/NotificationContext';
import { format } from 'date-fns';

const DASHBOARD_META: Record<string, { title: string; description: string }> = {
  overview: { title: 'Overview',         description: 'Overall task completion stats' },
  groups:   { title: 'Groups Report',    description: 'Tasks by group breakdown' },
  areas:    { title: 'Areas Report',     description: 'Task distribution by area' },
  assets:   { title: 'Assets Status',    description: 'Asset health overview' },
  planned:  { title: 'Planned Schedule', description: 'Upcoming planned tasks' },
  team:     { title: 'Team Workload',    description: 'Group membership by team member' },
};

const PIE_COLORS = ['#ef4444', '#f59e0b', '#22c55e'];

export default function DashboardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { assets, plannedTasks } = useNotifications();

  const meta = id ? DASHBOARD_META[id] : null;

  if (!meta) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400">
        <p className="text-lg font-medium">Dashboard not found</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-sm text-blue-600 hover:underline">
          Back to Dashboards
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-gray-900">{meta.title}</h1>
          <p className="text-xs text-gray-400">{meta.description}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-6">
        {id === 'overview' && <OverviewDashboard />}
        {id === 'groups'   && <GroupsDashboard />}
        {id === 'areas'    && <AreasDashboard />}
        {id === 'assets'   && <AssetsDashboard assets={assets} />}
        {id === 'planned'  && <PlannedDashboard plannedTasks={plannedTasks} />}
        {id === 'team'     && <TeamDashboard />}
      </div>
    </div>
  );
}

/* ── Overview ── */
function OverviewDashboard() {
  const { tasks, groups } = useNotifications();
  const total = tasks.length;
  const open = tasks.filter(t => t.status === 'open').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const done = tasks.filter(t => t.status === 'done').length;
  const completion = total ? Math.round((done / total) * 100) : 0;

  const statCards = [
    { label: 'Total Tasks',     value: total,         color: 'text-blue-600',   bg: 'bg-blue-50' },
    { label: 'Open',            value: open,          color: 'text-red-600',    bg: 'bg-red-50' },
    { label: 'In Progress',     value: inProgress,    color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Completed',       value: done,          color: 'text-green-600',  bg: 'bg-green-50' },
    { label: 'Completion Rate', value: `${completion}%`, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Groups',          value: groups.length, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const pieData = [
    { name: 'Open', value: open },
    { name: 'In Progress', value: inProgress },
    { name: 'Done', value: done },
  ];

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Completion ring */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Status Distribution</h3>
        <div className="flex items-center gap-8">
          <ResponsiveContainer width={220} height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85}
                paddingAngle={4} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Legend iconType="circle" iconSize={10} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-3">
            {[
              { label: 'Open',        value: open,       pct: total ? Math.round(open / total * 100) : 0,       color: 'bg-red-500' },
              { label: 'In Progress', value: inProgress, pct: total ? Math.round(inProgress / total * 100) : 0, color: 'bg-yellow-400' },
              { label: 'Done',        value: done,       pct: total ? Math.round(done / total * 100) : 0,       color: 'bg-green-500' },
            ].map(r => (
              <div key={r.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600 font-medium">{r.label}</span>
                  <span className="text-gray-500">{r.value} ({r.pct}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${r.color} rounded-full`} style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Priority breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Priority Breakdown</h3>
        <div className="grid grid-cols-3 gap-4">
          {(['high', 'medium', 'low'] as const).map(p => {
            const count = tasks.filter(t => t.priority === p).length;
            const pct = total ? Math.round(count / total * 100) : 0;
            const cls = p === 'high' ? 'text-red-600 bg-red-50' : p === 'medium' ? 'text-yellow-600 bg-yellow-50' : 'text-green-600 bg-green-50';
            return (
              <div key={p} className={`rounded-xl p-4 ${cls.split(' ')[1]}`}>
                <p className="text-xs font-medium text-gray-500 capitalize mb-1">{p} Priority</p>
                <p className={`text-2xl font-bold ${cls.split(' ')[0]}`}>{count}</p>
                <p className="text-xs text-gray-400 mt-0.5">{pct}% of total</p>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ── Groups ── */
function GroupsDashboard() {
  const { groups } = useNotifications();
  const byGroup = groups
    .map(g => ({
      name: g.name.length > 14 ? g.name.slice(0, 14) + '…' : g.name,
      fullName: g.name,
      icon: g.icon,
      open: g.counts.red,
      inProgress: g.counts.yellow,
      done: g.counts.green,
      total: g.counts.red + g.counts.yellow + g.counts.green,
    }))
    .sort((a, b) => b.total - a.total);

  const top8 = byGroup.slice(0, 8);

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Tasks by Group (Top 8)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={top8} margin={{ left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="open"       fill="#ef4444" name="Open"        stackId="a" />
            <Bar dataKey="inProgress" fill="#f59e0b" name="In Progress" stackId="a" />
            <Bar dataKey="done"       fill="#22c55e" name="Done"        stackId="a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">All Groups</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                <th className="px-5 py-3">Group</th>
                <th className="px-5 py-3 text-red-500">Open</th>
                <th className="px-5 py-3 text-yellow-500">In Progress</th>
                <th className="px-5 py-3 text-green-500">Done</th>
                <th className="px-5 py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {byGroup.map((g, i) => (
                <tr key={g.name} className={`border-b border-gray-50 hover:bg-gray-50 ${i % 2 ? 'bg-gray-50/50' : ''}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span>{g.icon}</span>
                      <span className="font-medium text-gray-800">{g.fullName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-red-600 font-semibold">{g.open}</td>
                  <td className="px-5 py-3 text-yellow-600 font-semibold">{g.inProgress}</td>
                  <td className="px-5 py-3 text-green-600 font-semibold">{g.done}</td>
                  <td className="px-5 py-3 text-gray-700 font-medium">{g.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ── Areas ── */
function AreasDashboard() {
  const { areas } = useNotifications();
  const byArea = areas.map(a => ({
    name: a.name.length > 16 ? a.name.slice(0, 16) + '…' : a.name,
    fullName: a.name,
    open: a.counts.red,
    inProgress: a.counts.yellow,
    done: a.counts.green,
    total: a.counts.red + a.counts.yellow + a.counts.green,
  })).sort((a, b) => b.total - a.total);

  const withTasks = byArea.filter(a => a.total > 0);
  const totalAreaTasks = byArea.reduce((s, a) => s + a.total, 0);

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Areas',      value: areas.length, color: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'Areas with Tasks', value: withTasks.length,                                           color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'Total Tasks',      value: totalAreaTasks,                                             color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(c => (
          <div key={c.label} className={`${c.bg} rounded-xl p-4`}>
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Tasks per Area (with tasks)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={withTasks} layout="vertical" margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={110} />
            <Tooltip />
            <Bar dataKey="open"       fill="#ef4444" name="Open"        stackId="a" />
            <Bar dataKey="inProgress" fill="#f59e0b" name="In Progress" stackId="a" />
            <Bar dataKey="done"       fill="#22c55e" name="Done"        stackId="a" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">All Areas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                <th className="px-5 py-3">Area</th>
                <th className="px-5 py-3 text-red-500">Open</th>
                <th className="px-5 py-3 text-yellow-500">In Progress</th>
                <th className="px-5 py-3 text-green-500">Done</th>
                <th className="px-5 py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {byArea.map((a, i) => (
                <tr key={a.fullName} className={`border-b border-gray-50 hover:bg-gray-50 ${i % 2 ? 'bg-gray-50/50' : ''}`}>
                  <td className="px-5 py-3 font-medium text-gray-800">{a.fullName}</td>
                  <td className="px-5 py-3 text-red-600 font-semibold">{a.open}</td>
                  <td className="px-5 py-3 text-yellow-600 font-semibold">{a.inProgress}</td>
                  <td className="px-5 py-3 text-green-600 font-semibold">{a.done}</td>
                  <td className="px-5 py-3 text-gray-700 font-medium">{a.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ── Assets ── */
function AssetsDashboard({ assets }: { assets: ReturnType<typeof useNotifications>['assets'] }) {
  const navigate = useNavigate();
  const active      = assets.filter(a => a.status === 'active').length;
  const maintenance = assets.filter(a => a.status === 'maintenance').length;
  const retired     = assets.filter(a => a.status === 'retired').length;

  const pieData = [
    { name: 'Active',      value: active },
    { name: 'Maintenance', value: maintenance },
    { name: 'Retired',     value: retired },
  ];
  const pieCols = ['#22c55e', '#f59e0b', '#9ca3af'];

  // By category
  const categories: Record<string, number> = {};
  assets.forEach(a => { categories[a.category] = (categories[a.category] ?? 0) + 1; });
  const catData = Object.entries(categories)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Active</p>
          <p className="text-2xl font-bold text-green-600">{active}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Maintenance</p>
          <p className="text-2xl font-bold text-yellow-600">{maintenance}</p>
        </div>
        <div className="bg-gray-100 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Retired</p>
          <p className="text-2xl font-bold text-gray-500">{retired}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                paddingAngle={4} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={pieCols[i]} />)}
              </Pie>
              <Legend iconType="circle" iconSize={10} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">By Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={catData} layout="vertical" margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" name="Assets" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Assets needing attention */}
      {maintenance > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">Needs Attention</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {assets.filter(a => a.status === 'maintenance').map(a => (
              <button
                key={a.id}
                onClick={() => navigate(`/assets/${a.id}`)}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{a.name}</p>
                  <p className="text-xs text-gray-400">{a.location} · {a.category}</p>
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                  Maintenance
                </span>
                <span className="text-gray-300 flex-shrink-0">›</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ── Planned ── */
function PlannedDashboard({ plannedTasks }: { plannedTasks: ReturnType<typeof useNotifications>['plannedTasks'] }) {
  const enabled  = plannedTasks.filter(p => p.enabled).length;
  const disabled = plannedTasks.filter(p => !p.enabled).length;

  const RECURRENCE_LABELS: Record<string, string> = {
    never: 'Once', daily: 'Daily', weekly: 'Weekly',
    biweekly: 'Bi-weekly', monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly',
  };
  const byRecurrence = (['never', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'] as const)
    .map(r => ({ name: RECURRENCE_LABELS[r], value: plannedTasks.filter(p => p.recurrence === r).length }))
    .filter(d => d.value > 0);

  const upcoming = [...plannedTasks]
    .filter(p => p.enabled)
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
    .slice(0, 10);

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Planned</p>
          <p className="text-2xl font-bold text-blue-600">{plannedTasks.length}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Active</p>
          <p className="text-2xl font-bold text-green-600">{enabled}</p>
        </div>
        <div className="bg-gray-100 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Disabled</p>
          <p className="text-2xl font-bold text-gray-500">{disabled}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">By Recurrence</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={byRecurrence}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" name="Tasks" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">Upcoming Active Tasks</h3>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No active planned tasks</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {upcoming.map(p => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {p.image
                    ? <img src={p.image} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">📋</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{p.title}</p>
                  <p className="text-xs text-gray-400">{p.groupName} · {RECURRENCE_LABELS[p.recurrence] ?? p.recurrence}</p>
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {format(p.scheduledAt, 'MMM d, HH:mm')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* ── Team ── */
function TeamDashboard() {
  const navigate = useNavigate();
  const { teamMembers: members } = useNotifications();

  const online  = members.filter(u => u.status === 'online').length;
  const away    = members.filter(u => u.status === 'away').length;
  const offline = members.filter(u => u.status === 'offline').length;

  const memberData = members.map(u => ({
    name: u.name.split(' ')[0],
    groups: u.groupIds.length,
  })).sort((a, b) => b.groups - a.groups);

  const pieData = [
    { name: 'Online',  value: online },
    { name: 'Away',    value: away },
    { name: 'Offline', value: offline },
  ];
  const pieCols = ['#22c55e', '#f59e0b', '#9ca3af'];

  const statusDot: Record<string, string> = { online: 'bg-green-400', away: 'bg-yellow-400', offline: 'bg-gray-300' };

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Online</p>
          <p className="text-2xl font-bold text-green-600">{online}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Away</p>
          <p className="text-2xl font-bold text-yellow-600">{away}</p>
        </div>
        <div className="bg-gray-100 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Offline</p>
          <p className="text-2xl font-bold text-gray-500">{offline}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Member Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                paddingAngle={4} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={pieCols[i]} />)}
              </Pie>
              <Legend iconType="circle" iconSize={10} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Groups per Member</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={memberData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="groups" fill="#6b7280" name="Groups" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">All Members ({members.length})</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {members.map(u => (
            <button
              key={u.id}
              onClick={() => navigate(`/profile/${u.id}`)}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                  {u.name.charAt(0)}
                </div>
                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${statusDot[u.status]}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
                <p className="text-xs text-gray-400">{u.role}</p>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {u.groupIds.length} group{u.groupIds.length !== 1 ? 's' : ''}
              </span>
              <span className="text-gray-300 flex-shrink-0">›</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
