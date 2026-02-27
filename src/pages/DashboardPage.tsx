import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, LineChart, Line, RadialBarChart, RadialBar,
} from 'recharts';
import {
  LayoutDashboard, FileText, Download, ChevronRight,
  Filter, RotateCcw, TrendingUp, Trophy, AlertTriangle, Medal, Calendar,
} from 'lucide-react';
import {
  format, subDays, startOfDay, endOfDay, isWithinInterval,
} from 'date-fns';
import { useNotifications } from '../context/NotificationContext';
import { useComply } from '../context/ComplyContext';
import type { PlannedTask } from '../types';

type DashTab = 'dashboard' | 'reports' | 'leaderboard';
type DateFilter = '7' | '30' | '90' | 'all';

const PIE_STATUS_COLORS = ['#ef4444', '#f59e0b', '#22c55e'];
const PIE_ASSET_COLORS  = ['#22c55e', '#f59e0b', '#9ca3af'];

const RECURRENCE_LABELS: Record<PlannedTask['recurrence'], string> = {
  never: 'Once', daily: 'Daily', weekly: 'Weekly',
  biweekly: 'Bi-weekly', monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly',
};

// ── CSV download helper ────────────────────────────────────────
function downloadCSV(data: Record<string, string | number>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => `"${String(row[h]).replace(/"/g, '""')}"`).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<DashTab>('dashboard');
  const [dateFilter, setDateFilter] = useState<DateFilter>('30');
  const [groupFilter, setGroupFilter] = useState('all');
  const [generatedReports, setGeneratedReports] = useState<Record<string, boolean>>({});

  // ── Report period state ────────────────────────────────────────
  const [reportPeriod, setReportPeriod] = useState<'today' | '7' | '30' | '90' | 'year' | 'all' | 'custom'>('30');
  const [reportFrom,   setReportFrom]   = useState('');
  const [reportTo,     setReportTo]     = useState('');

  const {
    tasks, assets, plannedTasks, teamMembers, groups,
  } = useNotifications();
  const { inspections } = useComply();

  const now = new Date();

  // ── Filter tasks ──────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (dateFilter !== 'all') {
        const cutoff = subDays(now, parseInt(dateFilter));
        if (t.createdAt < cutoff) return false;
      }
      if (groupFilter !== 'all' && t.groupId !== groupFilter) return false;
      return true;
    });
  }, [tasks, dateFilter, groupFilter]);

  // ── Task KPIs ─────────────────────────────────────────────────
  const total      = filteredTasks.length;
  const open       = filteredTasks.filter(t => t.status === 'open').length;
  const inProgress = filteredTasks.filter(t => t.status === 'in_progress').length;
  const done       = filteredTasks.filter(t => t.status === 'done').length;
  const rate       = total ? Math.round(done / total * 100) : 0;

  // ── Module KPIs ───────────────────────────────────────────────
  const activePPM       = plannedTasks.filter(p => p.enabled).length;
  const activeAssets    = assets.filter(a => a.status === 'active').length;
  const completedInsp   = inspections.filter(i => i.status === 'completed');
  const complianceScore = completedInsp.length > 0
    ? Math.round(completedInsp.reduce((s, i) => s + (i.score ?? 100), 0) / completedInsp.length)
    : 0;
  const overdueInsp     = inspections.filter(i => i.status === 'overdue').length;

  // ── Chart data ────────────────────────────────────────────────
  const statusPieData = [
    { name: 'Open',        value: open },
    { name: 'In Progress', value: inProgress },
    { name: 'Done',        value: done },
  ];

  const priorityData = (['high', 'medium', 'low'] as const).map(p => ({
    name: p.charAt(0).toUpperCase() + p.slice(1),
    value: filteredTasks.filter(t => t.priority === p).length,
    fill: p === 'high' ? '#ef4444' : p === 'medium' ? '#f59e0b' : '#22c55e',
  }));

  const groupBarData = groups
    .map(g => ({
      name: g.name.length > 13 ? g.name.slice(0, 13) + '…' : g.name,
      open: filteredTasks.filter(t => t.groupId === g.id && t.status === 'open').length,
      inProgress: filteredTasks.filter(t => t.groupId === g.id && t.status === 'in_progress').length,
      done: filteredTasks.filter(t => t.groupId === g.id && t.status === 'done').length,
    }))
    .filter(g => g.open + g.inProgress + g.done > 0)
    .sort((a, b) => (b.open + b.inProgress + b.done) - (a.open + a.inProgress + a.done))
    .slice(0, 8);

  // 7-day task trend
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(now, 6 - i);
    const dayStart = startOfDay(date);
    const dayEnd   = endOfDay(date);
    const dayTasks = tasks.filter(t => isWithinInterval(t.createdAt, { start: dayStart, end: dayEnd }));
    return {
      date: format(date, 'MMM d'),
      Opened: dayTasks.length,
      Completed: dayTasks.filter(t => t.status === 'done').length,
    };
  });

  // Asset status donut
  const assetStatusData = [
    { name: 'Active',      value: assets.filter(a => a.status === 'active').length },
    { name: 'Maintenance', value: assets.filter(a => a.status === 'maintenance').length },
    { name: 'Retired',     value: assets.filter(a => a.status === 'retired').length },
  ];

  // Asset criticality
  const assetCritData = [
    { name: 'High',   value: assets.filter(a => a.criticality === 'high').length,   fill: '#ef4444' },
    { name: 'Medium', value: assets.filter(a => a.criticality === 'medium').length, fill: '#f59e0b' },
    { name: 'Low',    value: assets.filter(a => a.criticality === 'low').length,    fill: '#22c55e' },
  ];

  // PPM by recurrence
  const ppmRecurrenceData = (Object.keys(RECURRENCE_LABELS) as PlannedTask['recurrence'][])
    .map(r => ({
      name: RECURRENCE_LABELS[r],
      value: plannedTasks.filter(p => p.recurrence === r).length,
    }))
    .filter(d => d.value > 0);

  // Recent tasks
  const recentTasks = [...filteredTasks]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);

  // Overdue/aging open tasks (open > 7 days)
  const overdueTasks = filteredTasks.filter(t =>
    t.status !== 'done' && t.createdAt < subDays(now, 7)
  ).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  // Compliance score trend (last 10 completed inspections)
  const complianceTrend = [...inspections]
    .filter(i => i.status === 'completed')
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
    .slice(-10)
    .map(i => ({
      name: i.templateName.length > 14 ? i.templateName.slice(0, 14) + '…' : i.templateName,
      Score: i.score ?? 100,
    }));

  // Leaderboard
  const leaderboard = teamMembers
    .filter(u => u.accepted !== false)
    .map(u => {
      const myTasks = filteredTasks.filter(t => t.assignees.includes(u.id));
      const myDone  = myTasks.filter(t => t.status === 'done').length;
      const myProg  = myTasks.filter(t => t.status === 'in_progress').length;
      const myOpen  = myTasks.filter(t => t.status === 'open').length;
      const myTotal = myTasks.length;
      const myRate  = myTotal > 0 ? Math.round(myDone / myTotal * 100) : 0;
      const points  = myDone * 10 + myProg * 3;
      return { id: u.id, name: u.name, role: u.role, status: u.status, done: myDone, prog: myProg, open: myOpen, total: myTotal, rate: myRate, points };
    })
    .sort((a, b) => b.points - a.points);

  // ── Report period filtering ────────────────────────────────────
  const reportTasks = useMemo(() => {
    return tasks.filter(t => {
      if (reportPeriod === 'all') return true;
      if (reportPeriod === 'custom') {
        const from = reportFrom ? new Date(reportFrom) : null;
        const to   = reportTo   ? new Date(reportTo + 'T23:59:59') : null;
        if (from && t.createdAt < from) return false;
        if (to   && t.createdAt > to)   return false;
        return true;
      }
      const days = reportPeriod === 'today' ? 0 : reportPeriod === 'year' ? 365 : parseInt(reportPeriod);
      const cutoff = reportPeriod === 'today'
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
        : subDays(now, days);
      return t.createdAt >= cutoff;
    });
  }, [tasks, reportPeriod, reportFrom, reportTo]);

  const reportPeriodLabel = (() => {
    if (reportPeriod === 'today') return 'Today';
    if (reportPeriod === '7')     return 'Last 7 days';
    if (reportPeriod === '30')    return 'Last 30 days';
    if (reportPeriod === '90')    return 'Last 90 days';
    if (reportPeriod === 'year')  return 'This Year';
    if (reportPeriod === 'all')   return 'All Time';
    if (reportPeriod === 'custom' && reportFrom && reportTo) return `${reportFrom} → ${reportTo}`;
    return 'Custom Range';
  })();

  // ── Report: Completed by User ─────────────────────────────────
  const userReport = teamMembers.map(u => {
    const assigned  = reportTasks.filter(t => t.assignees.includes(u.id));
    const doneCount = assigned.filter(t => t.status === 'done').length;
    const openCount = assigned.filter(t => t.status === 'open').length;
    const rateVal   = assigned.length > 0 ? Math.round(doneCount / assigned.length * 100) : 0;
    return { id: u.id, name: u.name, role: u.role, assigned: assigned.length, done: doneCount, open: openCount, rate: rateVal };
  }).sort((a, b) => b.assigned - a.assigned);

  // CSV generators
  const generateTaskDetails = () => {
    const data = reportTasks.map(t => ({
      'ID': t.id,
      'Title': t.title,
      'Group': t.groupName,
      'Status': t.status,
      'Priority': t.priority,
      'Assignees': t.assignees.length,
      'Comments': t.comments.length,
      'Created': format(t.createdAt, 'yyyy-MM-dd HH:mm'),
    }));
    downloadCSV(data, `neo-task-details-${reportPeriodLabel.replace(/\s/g,'-')}.csv`);
    setGeneratedReports(p => ({ ...p, tasks: true }));
  };

  const generateUserReport = () => {
    const data = userReport.map(u => ({
      'Name': u.name, 'Role': u.role,
      'Assigned': u.assigned, 'Completed': u.done,
      'Open': u.open, 'Completion Rate': `${u.rate}%`,
    }));
    downloadCSV(data, `neo-user-report-${reportPeriodLabel.replace(/\s/g,'-')}.csv`);
    setGeneratedReports(p => ({ ...p, users: true }));
  };

  const markGenerated = (key: string) => {
    setGeneratedReports(p => ({ ...p, [key]: true }));
  };

  const openPrintWindow = (title: string, body: string) => {
    const win = window.open('', '_blank', 'width=860,height=700');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
<style>body{font-family:Inter,sans-serif;padding:32px;color:#111}h1{font-size:22px;margin:0 0 4px}
.meta{color:#888;font-size:13px;margin-bottom:24px}.card{border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;margin-bottom:10px}
.badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600}
.open{background:#fee2e2;color:#dc2626}.in_progress{background:#fef3c7;color:#d97706}.done{background:#dcfce7;color:#16a34a}
.high{background:#fee2e2;color:#dc2626}.medium{background:#fef3c7;color:#d97706}.low{background:#f3f4f6;color:#6b7280}
table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:8px 12px;border-bottom:1px solid #f3f4f6}
th{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280}
@media print{button{display:none!important}}
</style></head><body>
<h1>${title}</h1><p class="meta">Generated ${format(new Date(), 'PPP · p')} · NEO Facility Management</p>
${body}
<br/><button onclick="window.print()" style="padding:10px 24px;background:#1d4ed8;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px">Print / Save as PDF</button>
</body></html>`);
    win.document.close();
  };

  const generateMultitaskReport = () => {
    const cards = filteredTasks.map(t => `
      <div class="card">
        <div style="display:flex;align-items:flex-start;gap:12px">
          ${t.image ? `<img src="${t.image}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;flex-shrink:0" />` : ''}
          <div style="flex:1">
            <div style="font-weight:600;font-size:15px;margin-bottom:4px">${t.title}</div>
            <div style="font-size:12px;color:#6b7280;margin-bottom:6px">${t.groupName} · ${format(t.createdAt, 'PP')}</div>
            <span class="badge ${t.status}">${t.status.replace('_',' ')}</span>
            <span class="badge ${t.priority}" style="margin-left:4px">${t.priority}</span>
            ${t.description ? `<p style="margin:8px 0 0;font-size:13px;color:#374151">${t.description}</p>` : ''}
          </div>
        </div>
      </div>`).join('');
    openPrintWindow('Multi-Task Report', `<p style="margin-bottom:16px;color:#4b5563">${filteredTasks.length} tasks shown</p>${cards}`);
    markGenerated('multitask');
  };

  const generateTimeReport = () => {
    const entries = filteredTasks.flatMap(t =>
      (t.timeEntries ?? []).map(e => ({ task: t.title, group: t.groupName, user: e.userName, date: e.date, mins: e.minutes, note: e.note ?? '' }))
    ).sort((a, b) => b.date.getTime() - a.date.getTime());
    if (entries.length === 0) {
      downloadCSV([{ 'Notice': 'No time entries logged yet' }], 'neo-time-report.csv');
    } else {
      const data = entries.map(e => ({ 'Task': e.task, 'Group': e.group, 'User': e.user, 'Date': format(e.date, 'yyyy-MM-dd'), 'Minutes': e.mins, 'Hours': (e.mins/60).toFixed(2), 'Note': e.note }));
      downloadCSV(data, 'neo-time-report.csv');
    }
    markGenerated('time');
  };

  const generateChecklistReport = () => {
    const rows = filteredTasks.flatMap(t =>
      (t.subtasks ?? []).map(s => ({ 'Task': t.title, 'Group': t.groupName, 'Status': t.status, 'Checklist Item': s.text, 'Done': s.done ? 'Yes' : 'No', 'Created': format(t.createdAt, 'yyyy-MM-dd') }))
    );
    if (rows.length === 0) {
      const cards = filteredTasks.slice(0, 50).map(t => `<div class="card"><b>${t.title}</b> <span class="badge ${t.status}">${t.status}</span><br/><span style="font-size:12px;color:#6b7280">${t.groupName} · ${format(t.createdAt,'PP')}</span></div>`).join('');
      openPrintWindow('Checklist Report', `<p style="color:#6b7280;margin-bottom:16px">No subtasks found — showing task overview (${filteredTasks.length} tasks)</p>${cards}`);
    } else {
      downloadCSV(rows, 'neo-checklist-report.csv');
    }
    markGenerated('checklist');
  };

  const generateInspectionReport = () => {
    const body = inspections.slice(0,30).map(i => `
      <div class="card">
        <div style="font-weight:600">${i.templateName}</div>
        <div style="font-size:12px;color:#6b7280;margin:4px 0">${format(i.scheduledAt,'PP')} · ${i.status}${i.assigneeName ? ' · ' + i.assigneeName : ''}</div>
        ${i.score !== undefined ? `<div>Score: <b>${i.score}%</b></div>` : ''}
      </div>`).join('');
    openPrintWindow('Inspection Report', `<p style="margin-bottom:16px;color:#4b5563">${inspections.length} inspection runs</p>${body}`);
    markGenerated('inspection');
  };

  const STATUS_DOT: Record<string, string> = {
    open: 'bg-red-400', in_progress: 'bg-yellow-400', done: 'bg-green-400',
  };
  const STATUS_LABEL: Record<string, string> = {
    open: 'Open', in_progress: 'In Progress', done: 'Done',
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard & Reports</h1>
            <p className="text-xs text-gray-400 mt-0.5">Real-time analytics across all modules</p>
          </div>
        </div>
        <div className="flex gap-1">
          {([
            { key: 'dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
            { key: 'reports',     label: 'Reports',     icon: FileText },
            { key: 'leaderboard', label: 'Leaderboard', icon: Trophy },
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

      {/* ── Dashboard tab ────────────────────────────────────── */}
      {tab === 'dashboard' && (
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {/* Filter bar */}
          <div className="bg-blue-700 px-6 py-3 flex items-center gap-3 flex-wrap">
            <Filter size={14} className="text-blue-200 flex-shrink-0" />
            <span className="text-blue-200 text-xs font-medium">Filter:</span>
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as DateFilter)}
              className="bg-blue-600 border border-blue-500 text-white text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
            <select
              value={groupFilter}
              onChange={e => setGroupFilter(e.target.value)}
              className="bg-blue-600 border border-blue-500 text-white text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
            >
              <option value="all">All Groups</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
            </select>
            <button
              onClick={() => { setDateFilter('30'); setGroupFilter('all'); }}
              className="flex items-center gap-1 text-blue-200 hover:text-white text-xs"
            >
              <RotateCcw size={12} /> Reset
            </button>
            <span className="ml-auto text-blue-200 text-xs">
              Showing <strong className="text-white">{total}</strong> tasks
            </span>
          </div>

          <div className="p-6 space-y-6">
            {/* Task KPI row */}
            <div className="grid grid-cols-5 gap-4">
              {[
                { label: 'Total Tasks',      value: total,         icon: '📋', cls: 'border-gray-200',   val: 'text-gray-900' },
                { label: 'Open',             value: open,          icon: '🔴', cls: 'border-red-200',    val: 'text-red-600' },
                { label: 'In Progress',      value: inProgress,    icon: '🟡', cls: 'border-yellow-200', val: 'text-yellow-600' },
                { label: 'Completed',        value: done,          icon: '🟢', cls: 'border-green-200',  val: 'text-green-600' },
                { label: 'Completion Rate',  value: `${rate}%`,    icon: '📈', cls: 'border-blue-200',   val: 'text-blue-600' },
              ].map(({ label, value, icon, cls, val }) => (
                <div key={label} className={`bg-white rounded-xl border ${cls} p-4`}>
                  <div className="text-xl mb-1">{icon}</div>
                  <div className={`text-2xl font-bold ${val}`}>{value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* Module KPI row */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Active PPM Tasks',   value: activePPM,        sub: `${plannedTasks.length} total scheduled`,       icon: '📅', bg: 'bg-indigo-50',  text: 'text-indigo-700' },
                { label: 'Assets Online',      value: `${activeAssets}/${assets.length}`, sub: `${assets.length - activeAssets} offline/retired`, icon: '📦', bg: 'bg-teal-50',   text: 'text-teal-700' },
                { label: 'Compliance Score',   value: `${complianceScore}%`, sub: `${completedInsp.length} inspections done`, icon: '🛡️', bg: 'bg-purple-50', text: 'text-purple-700' },
                { label: 'Overdue Inspections',value: overdueInsp,      sub: overdueInsp > 0 ? 'Requires attention' : 'All on schedule', icon: overdueInsp > 0 ? '⚠️' : '✅', bg: overdueInsp > 0 ? 'bg-red-50' : 'bg-green-50', text: overdueInsp > 0 ? 'text-red-700' : 'text-green-700' },
              ].map(({ label, value, sub, icon, bg, text }) => (
                <div key={label} className={`${bg} rounded-xl p-4 border border-white`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500">{label}</span>
                    <span className="text-base">{icon}</span>
                  </div>
                  <div className={`text-2xl font-bold ${text}`}>{value}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
                </div>
              ))}
            </div>

            {/* 7-day trend */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-800">7-Day Task Activity</h3>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={trendData} margin={{ left: -10, right: 10 }}>
                  <defs>
                    <linearGradient id="gradOpen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradDone" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend iconType="circle" iconSize={10} />
                  <Area type="monotone" dataKey="Opened"    stroke="#ef4444" fill="url(#gradOpen)" strokeWidth={2} dot={{ r: 3 }} />
                  <Area type="monotone" dataKey="Completed" stroke="#22c55e" fill="url(#gradDone)" strokeWidth={2} dot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Status distribution + Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">Task Status Distribution</h3>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={170} height={170}>
                    <PieChart>
                      <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                        {statusPieData.map((_, i) => <Cell key={i} fill={PIE_STATUS_COLORS[i]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2.5">
                    {[
                      { label: 'Open',        val: open,       pct: total ? Math.round(open/total*100) : 0,       color: 'bg-red-500' },
                      { label: 'In Progress', val: inProgress, pct: total ? Math.round(inProgress/total*100) : 0, color: 'bg-yellow-400' },
                      { label: 'Done',        val: done,       pct: total ? Math.round(done/total*100) : 0,       color: 'bg-green-500' },
                    ].map(r => (
                      <div key={r.label}>
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <span className="text-gray-600">{r.label}</span>
                          <span className="text-gray-500">{r.val} ({r.pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${r.color} rounded-full`} style={{ width: `${r.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">Priority Breakdown</h3>
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart data={priorityData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={55} />
                    <Tooltip />
                    <Bar dataKey="value" name="Tasks" radius={[0, 6, 6, 0]}>
                      {priorityData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tasks by Group stacked bar */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Tasks by Group (Top 8)</h3>
              {groupBarData.length === 0
                ? <p className="text-sm text-gray-400 text-center py-8">No data for selected filters</p>
                : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={groupBarData} margin={{ left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip />
                      <Legend iconType="circle" iconSize={10} />
                      <Bar dataKey="open"       fill="#ef4444" name="Open"        stackId="a" />
                      <Bar dataKey="inProgress" fill="#f59e0b" name="In Progress" stackId="a" />
                      <Bar dataKey="done"       fill="#22c55e" name="Done"        stackId="a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )
              }
            </div>

            {/* PPM + Assets */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">PPM Tasks by Recurrence</h3>
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={ppmRecurrenceData} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" name="Tasks" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">Asset Status & Criticality</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 text-center mb-2">Status</p>
                    <ResponsiveContainer width="100%" height={130}>
                      <PieChart>
                        <Pie data={assetStatusData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                          {assetStatusData.map((_, i) => <Cell key={i} fill={PIE_ASSET_COLORS[i]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 text-center mb-2">Criticality</p>
                    <ResponsiveContainer width="100%" height={130}>
                      <PieChart>
                        <Pie data={assetCritData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                          {assetCritData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="flex justify-center gap-4 mt-1">
                  {assetStatusData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_ASSET_COLORS[i] }} />
                      <span className="text-[10px] text-gray-500">{d.name} ({d.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Tasks table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800">Recent Tasks</h3>
                <button
                  onClick={() => navigate('/fix')}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  View all <ChevronRight size={12} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                      <th className="px-5 py-3">Task</th>
                      <th className="px-5 py-3">Group</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Priority</th>
                      <th className="px-5 py-3">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTasks.map((t, i) => (
                      <tr
                        key={t.id}
                        onClick={() => navigate(`/fix/${t.id}`)}
                        className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${i % 2 ? 'bg-gray-50/40' : ''}`}
                      >
                        <td className="px-5 py-3">
                          <p className="font-medium text-gray-800 max-w-[200px] truncate">{t.title}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className="flex items-center gap-1.5 text-xs text-gray-600">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: t.groupColor }} />
                            {t.groupName}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="flex items-center gap-1.5 text-xs">
                            <span className={`w-2 h-2 rounded-full ${STATUS_DOT[t.status]}`} />
                            {STATUS_LABEL[t.status]}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize
                            ${t.priority === 'high' ? 'bg-red-100 text-red-700'
                              : t.priority === 'medium' ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'}`}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500">
                          {format(t.createdAt, 'MMM d, yyyy')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>


            {/* Overdue / aging tasks alert */}
            {overdueTasks.length > 0 && (
              <div className="bg-white rounded-xl border border-orange-200 overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 bg-orange-50 border-b border-orange-100">
                  <AlertTriangle size={16} className="text-orange-500" />
                  <h3 className="text-sm font-semibold text-orange-800">Aging Open Tasks ({overdueTasks.length})</h3>
                  <span className="ml-auto text-xs text-orange-500">Open for &gt; 7 days</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                        <th className="px-5 py-3">Task</th>
                        <th className="px-5 py-3">Group</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Age</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overdueTasks.slice(0, 8).map((t, i) => {
                        const ageDays = Math.floor((now.getTime() - t.createdAt.getTime()) / 86400000);
                        return (
                          <tr
                            key={t.id}
                            onClick={() => navigate(`/fix/task/${t.id}`)}
                            className={`border-b border-gray-50 hover:bg-orange-50 cursor-pointer ${i % 2 ? 'bg-gray-50/40' : ''}`}
                          >
                            <td className="px-5 py-3">
                              <p className="font-medium text-gray-800 max-w-[200px] truncate">{t.title}</p>
                            </td>
                            <td className="px-5 py-3">
                              <span className="flex items-center gap-1.5 text-xs text-gray-600">
                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: t.groupColor }} />
                                {t.groupName}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                                t.status === 'open' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {t.status === 'in_progress' ? 'In Progress' : 'Open'}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <span className={`text-xs font-bold ${ageDays > 14 ? 'text-red-600' : 'text-orange-500'}`}>
                                {ageDays}d
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Compliance score trend */}
            {complianceTrend.length >= 2 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-base">🛡️</span>
                  <h3 className="text-sm font-semibold text-gray-800">Compliance Score Trend</h3>
                  <span className="ml-auto text-xs text-gray-400">Last {complianceTrend.length} inspections</span>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={complianceTrend} margin={{ left: -10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                    <Tooltip formatter={(v) => [`${v}%`, 'Score']} />
                    <Line type="monotone" dataKey="Score" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4, fill: '#8b5cf6' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Reports tab ──────────────────────────────────────── */}
      {tab === 'reports' && (
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-6">

          {/* ── Period selector ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-blue-600" />
              <h2 className="text-sm font-semibold text-gray-800">Report Period</h2>
              <span className="ml-auto text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">{reportPeriodLabel} · {reportTasks.length} tasks</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {([
                { key: 'today', label: 'Today'       },
                { key: '7',     label: 'Last 7 days'  },
                { key: '30',    label: 'Last 30 days' },
                { key: '90',    label: 'Last 90 days' },
                { key: 'year',  label: 'This Year'    },
                { key: 'all',   label: 'All Time'     },
                { key: 'custom',label: 'Custom'       },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setReportPeriod(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors
                    ${reportPeriod === key
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {reportPeriod === 'custom' && (
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
                  <input type="date" value={reportFrom} onChange={e => setReportFrom(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
                  <input type="date" value={reportTo} onChange={e => setReportTo(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Available Reports</h2>
            <p className="text-xs text-gray-400">Generate and download reports in Excel or PDF format.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              {
                key: 'tasks',
                icon: '📊',
                title: 'Task Details Report',
                desc: 'Full spreadsheet with title, group, status, priority, assignees, and creation date for every task.',
                badge: 'Excel',
                badgeCls: 'bg-green-100 text-green-700',
                onDownload: generateTaskDetails,
                onView: () => navigate('/dashboard/groups'),
              },
              {
                key: 'multitask',
                icon: '📸',
                title: 'Multi-Task Report',
                desc: 'Visual task summary including photos, ideal for sharing with contractors and surveyors.',
                badge: 'PDF',
                badgeCls: 'bg-red-100 text-red-700',
                onDownload: generateMultitaskReport,
                onView: () => navigate('/dashboard/overview'),
              },
              {
                key: 'users',
                icon: '👥',
                title: 'Completed Tasks by User',
                desc: 'Daily and weekly task completion metrics by individual team member.',
                badge: 'Excel',
                badgeCls: 'bg-green-100 text-green-700',
                onDownload: generateUserReport,
                onView: () => navigate('/dashboard/team'),
              },
              {
                key: 'time',
                icon: '⏱️',
                title: 'Time Report',
                desc: 'Task timestamps, response times, and duration analytics from open to completion.',
                badge: 'Excel',
                badgeCls: 'bg-green-100 text-green-700',
                onDownload: generateTimeReport,
                onView: () => navigate('/dashboard/areas'),
              },
              {
                key: 'checklist',
                icon: '✅',
                title: 'Checklist Report',
                desc: 'Task-level summary with individual checklist item responses and full audit log.',
                badge: 'PDF',
                badgeCls: 'bg-red-100 text-red-700',
                onDownload: generateChecklistReport,
                onView: () => navigate('/comply'),
              },
              {
                key: 'inspection',
                icon: '🔍',
                title: 'Inspection Report',
                desc: 'Visual representation of inspection checklists, ideal for compliance documentation and regulator audits.',
                badge: 'PDF',
                badgeCls: 'bg-red-100 text-red-700',
                onDownload: generateInspectionReport,
                onView: () => navigate('/comply'),
              },
              {
                key: 'leaderboard',
                icon: '🏆',
                title: 'Performance Leaderboard',
                desc: 'Team rankings by tasks completed, completion rate, and points. Great for team motivation and recognition.',
                badge: 'Excel',
                badgeCls: 'bg-green-100 text-green-700',
                onDownload: () => {
                  const data = leaderboard.map((u, i) => ({
                    'Rank': i + 1, 'Name': u.name, 'Role': u.role,
                    'Total Tasks': u.total, 'Completed': u.done,
                    'In Progress': u.prog, 'Open': u.open,
                    'Completion Rate': `${u.rate}%`, 'Points': u.points,
                  }));
                  downloadCSV(data, 'neo-leaderboard.csv');
                  markGenerated('leaderboard');
                },
                onView: () => setTab('leaderboard'),
              },
              {
                key: 'compliance',
                icon: '🛡️',
                title: 'Compliance Summary Report',
                desc: 'Overview of all inspection runs, scores, and compliance status across all categories.',
                badge: 'Excel',
                badgeCls: 'bg-green-100 text-green-700',
                onDownload: () => {
                  const data = inspections.map(i => ({
                    'ID': i.id, 'Template': i.templateName, 'Category': i.categoryId,
                    'Status': i.status, 'Score': i.score ?? 0, 'Assignee': i.assigneeName ?? '',
                    'Scheduled': format(i.scheduledAt, 'yyyy-MM-dd'),
                  }));
                  downloadCSV(data, 'neo-compliance.csv');
                  markGenerated('compliance');
                },
                onView: () => navigate('/comply'),
              },
            ].map(r => (
              <div key={r.key} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
                <div className="flex items-start gap-3 mb-3">
                  <div className="text-3xl">{r.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">{r.title}</h3>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${r.badgeCls}`}>{r.badge}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{r.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-auto pt-3 border-t border-gray-100">
                  <button
                    onClick={r.onDownload}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                      ${generatedReports[r.key]
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-blue-700 hover:bg-blue-800 text-white'}`}
                  >
                    <Download size={12} />
                    {generatedReports[r.key] ? 'Downloaded ✓' : 'Download'}
                  </button>
                  <button
                    onClick={r.onView}
                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50"
                  >
                    View <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Completed by User inline table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Completed Tasks by User — Live Preview</h3>
                <p className="text-xs text-gray-400 mt-0.5">Real-time team productivity snapshot</p>
              </div>
              <button
                onClick={generateUserReport}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-medium"
              >
                <Download size={12} /> Download Excel
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    <th className="px-5 py-3">Member</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3 text-center">Assigned</th>
                    <th className="px-5 py-3 text-center text-green-600">Completed</th>
                    <th className="px-5 py-3 text-center text-red-500">Open</th>
                    <th className="px-5 py-3">Completion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {userReport.map((u, i) => (
                    <tr key={u.id} className={`border-b border-gray-50 hover:bg-gray-50 ${i % 2 ? 'bg-gray-50/40' : ''}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {u.name.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-800 text-sm">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500">{u.role}</td>
                      <td className="px-5 py-3 text-center font-semibold text-gray-700">{u.assigned}</td>
                      <td className="px-5 py-3 text-center font-semibold text-green-600">{u.done}</td>
                      <td className="px-5 py-3 text-center font-semibold text-red-500">{u.open}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${u.rate >= 70 ? 'bg-green-500' : u.rate >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`}
                              style={{ width: `${u.rate}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700 w-8">{u.rate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Daily Summary card */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-start gap-4">
            <div className="text-3xl">📧</div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900">Daily Summary Report</h3>
              <p className="text-xs text-blue-600 mt-1 leading-relaxed">
                Automatically generated summary of all activity from the previous day, delivered to Group Admins.
                Configure in Group Settings → Notifications → Daily Summary.
              </p>
            </div>
            <button
              onClick={() => markGenerated('daily')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium flex-shrink-0 transition-colors
                ${generatedReports.daily ? 'bg-green-100 text-green-700' : 'bg-blue-700 text-white hover:bg-blue-800'}`}
            >
              {generatedReports.daily ? '✓ Enabled' : 'Enable'}
            </button>
          </div>
        </div>
      )}

      {/* ── Leaderboard tab ──────────────────────────────────── */}
      {tab === 'leaderboard' && (
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {/* Filter bar (reuse) */}
          <div className="bg-blue-700 px-6 py-3 flex items-center gap-3 flex-wrap">
            <Trophy size={14} className="text-blue-200 flex-shrink-0" />
            <span className="text-blue-200 text-xs font-medium">Period:</span>
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as DateFilter)}
              className="bg-blue-600 border border-blue-500 text-white text-xs px-3 py-1.5 rounded-lg focus:outline-none"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
            <button
              onClick={() => setDateFilter('30')}
              className="flex items-center gap-1 text-blue-200 hover:text-white text-xs"
            >
              <RotateCcw size={12} /> Reset
            </button>
            <span className="ml-auto text-blue-200 text-xs">
              {leaderboard.length} team members ranked
            </span>
          </div>

          <div className="p-6 space-y-6">
            {/* Podium — top 3 */}
            {leaderboard.length >= 3 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Trophy size={18} className="text-yellow-500" />
                  <h3 className="text-sm font-semibold text-gray-800">Top Performers</h3>
                  <span className="text-xs text-gray-400 ml-1">by points (completed × 10 + in-progress × 3)</span>
                </div>
                <div className="flex items-end justify-center gap-4">
                  {/* 2nd place */}
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <span className="text-3xl">🥈</span>
                    <div className="w-16 h-16 rounded-full bg-gray-400 flex items-center justify-center text-white text-2xl font-bold">
                      {leaderboard[1].name.charAt(0)}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-900 truncate max-w-[100px]">{leaderboard[1].name.split(' ')[0]}</p>
                      <p className="text-xs text-gray-400">{leaderboard[1].done} done</p>
                      <p className="text-xs font-bold text-gray-600">{leaderboard[1].points} pts</p>
                    </div>
                    <div className="w-full h-20 bg-gray-100 rounded-t-xl flex items-end justify-center pb-2">
                      <span className="text-lg font-bold text-gray-500">2</span>
                    </div>
                  </div>
                  {/* 1st place */}
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <span className="text-4xl">🥇</span>
                    <div className="w-20 h-20 rounded-full bg-yellow-500 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-yellow-200">
                      {leaderboard[0].name.charAt(0)}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-900 truncate max-w-[120px]">{leaderboard[0].name.split(' ')[0]}</p>
                      <p className="text-xs text-gray-400">{leaderboard[0].done} done</p>
                      <p className="text-sm font-bold text-yellow-600">{leaderboard[0].points} pts</p>
                    </div>
                    <div className="w-full h-28 bg-yellow-50 border-2 border-yellow-200 rounded-t-xl flex items-end justify-center pb-2">
                      <span className="text-xl font-bold text-yellow-500">1</span>
                    </div>
                  </div>
                  {/* 3rd place */}
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <span className="text-3xl">🥉</span>
                    <div className="w-16 h-16 rounded-full bg-orange-400 flex items-center justify-center text-white text-2xl font-bold">
                      {leaderboard[2].name.charAt(0)}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-900 truncate max-w-[100px]">{leaderboard[2].name.split(' ')[0]}</p>
                      <p className="text-xs text-gray-400">{leaderboard[2].done} done</p>
                      <p className="text-xs font-bold text-orange-600">{leaderboard[2].points} pts</p>
                    </div>
                    <div className="w-full h-14 bg-orange-50 rounded-t-xl flex items-end justify-center pb-2">
                      <span className="text-lg font-bold text-orange-400">3</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Full ranking table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Medal size={16} className="text-blue-500" />
                  <h3 className="text-sm font-semibold text-gray-800">Full Rankings</h3>
                </div>
                <button
                  onClick={() => {
                    const data = leaderboard.map((u, i) => ({
                      'Rank': i + 1, 'Name': u.name, 'Role': u.role,
                      'Completed': u.done, 'In Progress': u.prog,
                      'Open': u.open, 'Total': u.total,
                      'Completion Rate': `${u.rate}%`, 'Points': u.points,
                    }));
                    downloadCSV(data, 'neo-leaderboard.csv');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 text-white rounded-lg text-xs font-medium hover:bg-blue-800"
                >
                  <Download size={12} /> Export
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                      <th className="px-4 py-3 w-12">Rank</th>
                      <th className="px-4 py-3">Member</th>
                      <th className="px-4 py-3 text-center text-green-600">Done</th>
                      <th className="px-4 py-3 text-center text-yellow-600">In Prog.</th>
                      <th className="px-4 py-3 text-center text-red-500">Open</th>
                      <th className="px-4 py-3">Rate</th>
                      <th className="px-4 py-3 text-center">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((u, i) => {
                      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                      const rowBg = i === 0 ? 'bg-yellow-50' : i === 1 ? 'bg-gray-50' : i === 2 ? 'bg-orange-50/40' : (i % 2 === 0 ? '' : 'bg-gray-50/40');
                      return (
                        <tr
                          key={u.id}
                          onClick={() => navigate(`/profile/${u.id}`)}
                          className={`border-b border-gray-50 hover:bg-blue-50 cursor-pointer transition-colors ${rowBg}`}
                        >
                          <td className="px-4 py-3 text-center">
                            {medal
                              ? <span className="text-lg">{medal}</span>
                              : <span className="text-sm font-bold text-gray-400">#{i + 1}</span>
                            }
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{u.name}</p>
                                <p className="text-xs text-gray-400">{u.role}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-green-600">{u.done}</td>
                          <td className="px-4 py-3 text-center font-semibold text-yellow-600">{u.prog}</td>
                          <td className="px-4 py-3 text-center font-semibold text-red-500">{u.open}</td>
                          <td className="px-4 py-3 min-w-[100px]">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${u.rate >= 70 ? 'bg-green-500' : u.rate >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`}
                                  style={{ width: `${u.rate}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-gray-700 w-8">{u.rate}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-sm font-bold ${i === 0 ? 'text-yellow-600' : i === 1 ? 'text-gray-500' : i === 2 ? 'text-orange-500' : 'text-blue-600'}`}>
                              {u.points}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {leaderboard.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-5 py-12 text-center text-gray-400 text-sm">
                          No data for selected period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Radial chart of top 5 */}
            {leaderboard.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">Points Distribution (Top 5)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="20%"
                    outerRadius="90%"
                    data={leaderboard.slice(0, 5).map((u, i) => ({
                      name: u.name.split(' ')[0],
                      value: u.points,
                      fill: ['#eab308', '#9ca3af', '#f97316', '#3b82f6', '#8b5cf6'][i],
                    }))}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <RadialBar dataKey="value" background label={{ position: 'insideStart', fill: '#fff', fontSize: 10 }} />
                    <Legend iconSize={10} />
                    <Tooltip />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
