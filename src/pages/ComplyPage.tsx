import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, LayoutGrid, CalendarDays, FileText, Plus,
  CheckCircle2, AlertCircle, Clock, ChevronRight, Wifi,
  FileCheck, FileWarning, TrendingUp, Upload, X, Trash2,
  History, Check, BarChart2, Search,
} from 'lucide-react';
import { format, isToday, isFuture, isPast, subDays } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useComply } from '../context/ComplyContext';
import type {
  ChecklistFrequency, InspectionStatus, InspectionRun,
  ChecklistTemplate, ChecklistSection, ChecklistItem, ResponseType,
  ComplianceDocument,
} from '../types';

type Tab = 'dashboard' | 'checklists' | 'schedule' | 'documents';

const freqLabel: Record<ChecklistFrequency, string> = {
  daily: 'Daily', weekly: 'Weekly', biweekly: 'Bi-weekly',
  monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly', once: 'One-time',
};
const freqColor: Record<ChecklistFrequency, string> = {
  daily: 'bg-red-100 text-red-700', weekly: 'bg-orange-100 text-orange-700',
  biweekly: 'bg-yellow-100 text-yellow-700', monthly: 'bg-blue-100 text-blue-700',
  quarterly: 'bg-purple-100 text-purple-700', yearly: 'bg-green-100 text-green-700',
  once: 'bg-gray-100 text-gray-600',
};
const statusIcon: Record<InspectionStatus, React.ReactNode> = {
  completed:   <CheckCircle2 size={16} className="text-green-500" />,
  in_progress: <Clock size={16} className="text-yellow-500" />,
  scheduled:   <Clock size={16} className="text-blue-400" />,
  overdue:     <AlertCircle size={16} className="text-red-500" />,
};
const docCategoryLabel: Record<string, string> = {
  permit: 'Permits & Licenses', certificate: 'Certificates', sop: 'SOPs & Policies',
  training: 'Training Records', insurance: 'Insurance', contractor: 'Contractor Docs',
};
const docCategoryIcon: Record<string, React.ReactNode> = {
  permit:      <FileCheck size={18} className="text-purple-500" />,
  certificate: <ShieldCheck size={18} className="text-green-500" />,
  sop:         <FileText size={18} className="text-blue-500" />,
  training:    <FileCheck size={18} className="text-teal-500" />,
  insurance:   <ShieldCheck size={18} className="text-orange-500" />,
  contractor:  <FileWarning size={18} className="text-yellow-600" />,
};

function parseLocalDate(s: string): Date | undefined {
  if (!s) return undefined;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export default function ComplyPage() {
  const navigate = useNavigate();
  const { categories, templates, inspections, documents, createAdHocRun, addTemplate, addDocument, deleteTemplate, deleteDocument } = useComply();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showUploadDoc, setShowUploadDoc] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [searchChecklists, setSearchChecklists] = useState('');
  const [searchDocs, setSearchDocs] = useState('');
  const [filterDocCategory, setFilterDocCategory] = useState('all');

  // ── stats ────────────────────────────────────────────────
  const completed  = inspections.filter(r => r.status === 'completed');
  const overdue    = inspections.filter(r => r.status === 'overdue');
  const todayRuns  = inspections.filter(r => r.status === 'scheduled' && isToday(r.scheduledAt));
  const totalScore = completed.length > 0
    ? Math.round(completed.reduce((s, r) => s + (r.score ?? 100), 0) / completed.length)
    : 0;

  // ── issues: fail/flag/no items from completed inspections ──
  const issues = completed.flatMap(run => {
    const tpl = templates.find(t => t.id === run.templateId);
    if (!tpl) return [];
    return tpl.sections.flatMap(sec => sec.items)
      .filter(item => {
        const v = run.responses[item.id]?.value;
        return v === 'fail' || v === 'flag' || v === 'no';
      })
      .map(item => ({
        runId: run.id,
        templateName: run.templateName,
        itemLabel: item.label,
        value: run.responses[item.id]!.value as string,
        completedAt: run.completedAt,
        categoryId: run.categoryId,
      }));
  }).sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0));

  // ── 7-day compliance trend ────────────────────────────────
  const trendData = (() => {
    const base = totalScore > 0 ? totalScore : 80;
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayRuns = completed.filter(r => r.completedAt && format(r.completedAt, 'yyyy-MM-dd') === dateStr);
      const score = dayRuns.length > 0
        ? Math.round(dayRuns.reduce((s, r) => s + (r.score ?? 100), 0) / dayRuns.length)
        : Math.max(60, Math.min(100, base - 6 + i * 2));
      return { day: format(d, 'EEE'), score };
    });
  })();

  // ── per-category stats ───────────────────────────────────
  const catStats = categories.map(cat => {
    const catRuns     = inspections.filter(r => r.categoryId === cat.id);
    const catDone     = catRuns.filter(r => r.status === 'completed').length;
    const catOverdue  = catRuns.filter(r => r.status === 'overdue').length;
    const pct = catRuns.length > 0 ? Math.round((catDone / catRuns.length) * 100) : 100;
    return { ...cat, catDone, catOverdue, pct, total: catRuns.length };
  });

  // ── expired / expiring documents (within 60 days) ────────
  const expiringDocs = documents.filter(d => {
    if (!d.expiryDate) return false;
    const ms = d.expiryDate.getTime() - Date.now();
    return ms < 60 * 86400000; // within 60 days or past
  }).sort((a, b) => (a.expiryDate!.getTime()) - (b.expiryDate!.getTime()));

  // ── filtered templates ───────────────────────────────────
  const filteredTemplates = templates.filter(t => {
    if (catFilter !== 'all' && t.categoryId !== catFilter) return false;
    if (searchChecklists && !t.name.toLowerCase().includes(searchChecklists.toLowerCase())) return false;
    return true;
  });

  // ── schedule grouping ────────────────────────────────────
  const overdueRuns    = inspections.filter(r => r.status === 'overdue');
  const todayScheduled = inspections.filter(r => (r.status === 'scheduled' || r.status === 'in_progress') && isToday(r.scheduledAt));
  const upcomingRuns   = inspections.filter(r => r.status === 'scheduled' && isFuture(r.scheduledAt) && !isToday(r.scheduledAt));
  const historyRuns    = [...completed].sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0));

  // ── doc grouping ─────────────────────────────────────────
  const filteredDocs = documents.filter(doc => {
    if (searchDocs && !doc.name.toLowerCase().includes(searchDocs.toLowerCase())) return false;
    if (filterDocCategory !== 'all' && doc.category !== filterDocCategory) return false;
    return true;
  });
  const docGroups = Object.entries(docCategoryLabel).map(([key, label]) => ({
    key, label,
    docs: filteredDocs.filter(d => d.category === key),
  })).filter(g => g.docs.length > 0);

  // ── schedule upcoming grouped by date ────────────────────
  const groupedUpcoming = upcomingRuns
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
    .reduce((acc, run) => {
      const key = format(run.scheduledAt, 'EEE, MMM d');
      if (!acc[key]) acc[key] = [];
      acc[key].push(run);
      return acc;
    }, {} as Record<string, InspectionRun[]>);

  const handleStartInspection = (runId: string) => navigate(`/comply/run/${runId}`);
  const handleStartFromTemplate = (templateId: string) => {
    const id = createAdHocRun(templateId, 'u1', 'John Smith');
    if (id) navigate(`/comply/run/${id}`);
  };

  const catMap = categories.reduce((m, c) => { m[c.id] = c; return m; }, {} as Record<string, typeof categories[0]>);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard',  label: 'Dashboard',  icon: <LayoutGrid size={15} /> },
    { key: 'checklists', label: 'Checklists', icon: <ShieldCheck size={15} /> },
    { key: 'schedule',   label: 'Schedule',   icon: <CalendarDays size={15} /> },
    { key: 'documents',  label: 'Documents',  icon: <FileText size={15} /> },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={22} className="text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Comply</h1>
            <span className="text-sm text-gray-400 font-normal">· {totalScore}% compliance</span>
          </div>
          {tab === 'checklists' && (
            <button
              onClick={() => setShowCreateTemplate(true)}
              className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              <Plus size={16} /> Create Checklist
            </button>
          )}
          {tab === 'documents' && (
            <button
              onClick={() => setShowUploadDoc(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg">
              <Upload size={14} /> Upload Document
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors
                ${tab === t.key ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto bg-gray-50">

        {/* ════════ DASHBOARD ════════ */}
        {tab === 'dashboard' && (
          <div className="p-6 space-y-6">
            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Compliance Score', value: `${totalScore}%`, icon: <TrendingUp size={20} className="text-blue-500" />,   color: 'bg-blue-50',   textColor: 'text-blue-700'   },
                { label: 'Completed',         value: completed.length, icon: <CheckCircle2 size={20} className="text-green-500" />, color: 'bg-green-50',  textColor: 'text-green-700'  },
                { label: 'Overdue',           value: overdue.length,   icon: <AlertCircle size={20} className="text-red-500" />,   color: 'bg-red-50',    textColor: 'text-red-700'    },
                { label: 'Due Today',         value: todayRuns.length, icon: <Clock size={20} className="text-yellow-500" />,      color: 'bg-yellow-50', textColor: 'text-yellow-700' },
              ].map(kpi => (
                <div key={kpi.label} className={`${kpi.color} rounded-2xl p-4 flex items-center gap-4`}>
                  <div className="p-2 bg-white rounded-xl shadow-sm flex-shrink-0">{kpi.icon}</div>
                  <div>
                    <p className={`text-2xl font-bold ${kpi.textColor}`}>{kpi.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Overdue banner */}
            {overdue.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-700">{overdue.length} overdue inspection{overdue.length > 1 ? 's' : ''} require attention</p>
                  <p className="text-xs text-red-500 mt-0.5">Go to Schedule tab to start overdue inspections immediately.</p>
                </div>
                <button onClick={() => setTab('schedule')} className="text-xs text-red-600 font-medium hover:underline flex-shrink-0">View →</button>
              </div>
            )}

            {/* Expiring documents alert */}
            {expiringDocs.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileWarning size={16} className="text-amber-500" />
                  <p className="text-sm font-semibold text-amber-700">{expiringDocs.length} document{expiringDocs.length > 1 ? 's' : ''} expiring or expired</p>
                  <button onClick={() => setTab('documents')} className="text-xs text-amber-600 font-medium hover:underline ml-auto">View all →</button>
                </div>
                <div className="space-y-1.5">
                  {expiringDocs.slice(0, 3).map(doc => {
                    const expired = isPast(doc.expiryDate!);
                    return (
                      <div key={doc.id} className="flex items-center justify-between gap-3 bg-white rounded-lg px-3 py-2">
                        <p className="text-xs font-medium text-gray-800 truncate flex-1">{doc.name}</p>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${expired ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                          {expired ? 'EXPIRED' : `Exp ${format(doc.expiryDate!, 'MMM d, yyyy')}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 7-day trend chart */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 size={16} className="text-blue-500" />
                <h2 className="text-sm font-semibold text-gray-700">Compliance Trend (7 days)</h2>
                <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${totalScore >= 90 ? 'bg-green-50 text-green-600' : totalScore >= 70 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>
                  {totalScore}% today
                </span>
              </div>
              <ResponsiveContainer width="100%" height={110}>
                <LineChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                  <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} width={34} />
                  <Tooltip formatter={(v: number | undefined) => v != null ? [`${v}%`, 'Score'] : ['—', 'Score']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Category cards */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Compliance by Category</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {catStats.map(cat => (
                  <div key={cat.id}
                    onClick={() => { setTab('checklists'); setCatFilter(cat.id); }}
                    className="bg-white rounded-2xl border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{cat.icon}</span>
                        <span className="text-sm font-semibold text-gray-800">{cat.name}</span>
                      </div>
                      {cat.catOverdue > 0
                        ? <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{cat.catOverdue} overdue</span>
                        : <CheckCircle2 size={16} className="text-green-400" />
                      }
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${cat.pct}%`, backgroundColor: cat.color }} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{cat.catDone} completed</span>
                      <span className="font-semibold" style={{ color: cat.color }}>{cat.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Open issues */}
            {issues.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-700">Open Issues</h2>
                  <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{issues.length} item{issues.length > 1 ? 's' : ''}</span>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
                  {issues.slice(0, 6).map((issue, idx) => {
                    const cat = categories.find(c => c.id === issue.categoryId);
                    const isFail = issue.value === 'fail' || issue.value === 'no';
                    return (
                      <div key={idx}
                        onClick={() => navigate(`/comply/run/${issue.runId}`)}
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isFail ? 'bg-red-500' : 'bg-yellow-400'}`} />
                        <span className="text-lg flex-shrink-0">{cat?.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{issue.itemLabel}</p>
                          <p className="text-xs text-gray-400 truncate">{issue.templateName} · {issue.completedAt ? format(issue.completedAt, 'MMM d') : ''}</p>
                        </div>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${isFail ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}`}>
                          {issue.value === 'flag' ? 'Flagged' : 'Failed'}
                        </span>
                        <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent inspections */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent Inspections</h2>
              <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
                {[...inspections]
                  .filter(r => r.status === 'completed' || r.status === 'overdue')
                  .sort((a, b) => (b.completedAt ?? b.scheduledAt).getTime() - (a.completedAt ?? a.scheduledAt).getTime())
                  .slice(0, 6)
                  .map(run => {
                    const cat = categories.find(c => c.id === run.categoryId);
                    return (
                      <div key={run.id}
                        onClick={() => navigate(`/comply/run/${run.id}`)}
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
                        <span className="text-xl flex-shrink-0">{cat?.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{run.templateName}</p>
                          <p className="text-xs text-gray-400">{run.assigneeName} · {format(run.completedAt ?? run.scheduledAt, 'MMM d, HH:mm')}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {run.score != null && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${run.score >= 90 ? 'bg-green-50 text-green-600' : run.score >= 70 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>
                              {run.score}%
                            </span>
                          )}
                          {statusIcon[run.status]}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* ════════ CHECKLISTS ════════ */}
        {tab === 'checklists' && (
          <div className="p-6 space-y-4">
            {/* Search bar */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search checklists..."
                value={searchChecklists}
                onChange={e => setSearchChecklists(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchChecklists && (
                <button onClick={() => setSearchChecklists('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>
            {/* Category filter pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setCatFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${catFilter === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                All categories
              </button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setCatFilter(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                    ${catFilter === cat.id ? 'text-white border-transparent' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                  style={catFilter === cat.id ? { backgroundColor: cat.color } : undefined}>
                  <span>{cat.icon}</span>{cat.name}
                </button>
              ))}
            </div>

            {/* Template list */}
            <div className="space-y-3">
              {filteredTemplates.map(tpl => {
                const cat = categories.find(c => c.id === tpl.categoryId);
                const tplRuns    = inspections.filter(r => r.templateId === tpl.id);
                const lastRun    = tplRuns.filter(r => r.status === 'completed').sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0))[0];
                const nextRun    = tplRuns.filter(r => r.status === 'scheduled').sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())[0];
                const hasOverdue = tplRuns.some(r => r.status === 'overdue');
                const totalItems = tpl.sections.reduce((s, sec) => s + sec.items.length, 0);
                const avgScore   = (() => {
                  const done = tplRuns.filter(r => r.status === 'completed' && r.score != null);
                  return done.length > 0 ? Math.round(done.reduce((s, r) => s + (r.score ?? 0), 0) / done.length) : null;
                })();

                return (
                  <div key={tpl.id} className="bg-white rounded-2xl border border-gray-200 p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ backgroundColor: (cat?.color ?? '#6b7280') + '20' }}>
                        {cat?.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-semibold text-gray-900">{tpl.name}</span>
                          {hasOverdue && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600">Overdue</span>}
                          {avgScore != null && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${avgScore >= 90 ? 'bg-green-50 text-green-600' : avgScore >= 70 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>
                              avg {avgScore}%
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mb-2 line-clamp-1">{tpl.description}</p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${freqColor[tpl.frequency]}`}>
                            {freqLabel[tpl.frequency]}
                          </span>
                          <span className="text-[11px] text-gray-400">{totalItems} items · ~{tpl.estimatedMinutes} min</span>
                          {tpl.requiresSignature && <span className="text-[11px] text-gray-400">✍️ Signature</span>}
                          {lastRun && <span className="text-[11px] text-gray-400">Last: {format(lastRun.completedAt!, 'MMM d')}</span>}
                          {nextRun && (
                            <span className={`text-[11px] font-medium ${isToday(nextRun.scheduledAt) ? 'text-blue-600' : 'text-gray-400'}`}>
                              Next: {isToday(nextRun.scheduledAt) ? 'Today' : format(nextRun.scheduledAt, 'MMM d')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => handleStartFromTemplate(tpl.id)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg">
                          <Plus size={14} /> Start
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); deleteTemplate(tpl.id); }}
                          className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete template"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {tpl.sections.some(s => s.items.some(i => i.nfcEnabled)) && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5">
                        <Wifi size={12} className="text-blue-400" />
                        <span className="text-[11px] text-blue-500">NFC smart tag scanning enabled for some items</span>
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredTemplates.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <ShieldCheck size={40} className="mb-3 text-gray-300" />
                  <p className="text-sm">No checklists in this category</p>
                  <button onClick={() => setShowCreateTemplate(true)} className="mt-3 text-sm text-blue-600 hover:underline">+ Create one</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════ SCHEDULE ════════ */}
        {tab === 'schedule' && (
          <div className="p-6 space-y-6">
            {/* OVERDUE */}
            {overdueRuns.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle size={16} className="text-red-500" />
                  <h2 className="text-sm font-semibold text-red-600">Overdue ({overdueRuns.length})</h2>
                </div>
                <div className="space-y-2">
                  {overdueRuns.map(run => <ScheduleCard key={run.id} run={run} onStart={handleStartInspection} categories={catMap} />)}
                </div>
              </div>
            )}

            {/* TODAY */}
            {todayScheduled.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={16} className="text-blue-500" />
                  <h2 className="text-sm font-semibold text-blue-600">Due Today ({todayScheduled.length})</h2>
                </div>
                <div className="space-y-2">
                  {todayScheduled.map(run => <ScheduleCard key={run.id} run={run} onStart={handleStartInspection} categories={catMap} />)}
                </div>
              </div>
            )}

            {/* UPCOMING */}
            {upcomingRuns.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDays size={16} className="text-gray-500" />
                  <h2 className="text-sm font-semibold text-gray-600">Upcoming ({upcomingRuns.length})</h2>
                </div>
                <div className="space-y-4">
                  {Object.entries(groupedUpcoming).map(([dateLabel, dateRuns]) => (
                    <div key={dateLabel}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-px flex-1 bg-gray-200" />
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-0.5 rounded-full">{dateLabel}</span>
                        <div className="h-px flex-1 bg-gray-200" />
                      </div>
                      <div className="space-y-2">
                        {dateRuns.map(run => (
                          <ScheduleCard key={run.id} run={run} onStart={handleStartInspection} categories={catMap} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {overdueRuns.length === 0 && todayScheduled.length === 0 && upcomingRuns.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <CalendarDays size={40} className="mb-3 text-gray-300" />
                <p className="text-sm">No scheduled inspections</p>
              </div>
            )}

            {/* HISTORY */}
            {historyRuns.length > 0 && (
              <div>
                <button
                  onClick={() => setHistoryExpanded(v => !v)}
                  className="flex items-center gap-2 w-full text-left mb-3"
                >
                  <History size={16} className="text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-600">History ({historyRuns.length})</h2>
                  <span className="ml-auto text-xs text-gray-400">{historyExpanded ? 'Hide ↑' : 'Show ↓'}</span>
                </button>
                {historyExpanded && (
                  <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
                    {historyRuns.map(run => {
                      const cat = catMap[run.categoryId];
                      return (
                        <div key={run.id}
                          onClick={() => navigate(`/comply/run/${run.id}`)}
                          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
                          <span className="text-lg flex-shrink-0">{cat?.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{run.templateName}</p>
                            <p className="text-xs text-gray-400">
                              {run.assigneeName} · {run.completedAt ? format(run.completedAt, 'MMM d, yyyy HH:mm') : ''}
                            </p>
                          </div>
                          {run.score != null && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${run.score >= 90 ? 'bg-green-50 text-green-600' : run.score >= 70 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>
                              {run.score}%
                            </span>
                          )}
                          <CheckCircle2 size={15} className="text-green-400 flex-shrink-0" />
                          <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ════════ DOCUMENTS ════════ */}
        {tab === 'documents' && (
          <div className="p-6 space-y-6">
            {/* Search + filter */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchDocs}
                  onChange={e => setSearchDocs(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchDocs && (
                  <button onClick={() => setSearchDocs('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={14} />
                  </button>
                )}
              </div>
              <select
                value={filterDocCategory}
                onChange={e => setFilterDocCategory(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All types</option>
                {Object.entries(docCategoryLabel).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between -mt-2">
              <p className="text-sm text-gray-500">{filteredDocs.length} of {documents.length} documents</p>
            </div>

            {/* Expiry alerts */}
            {expiringDocs.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileWarning size={15} className="text-amber-500" />
                  <p className="text-sm font-semibold text-amber-700">Expiring or Expired Documents</p>
                </div>
                <div className="space-y-1.5">
                  {expiringDocs.map(doc => {
                    const expired = isPast(doc.expiryDate!);
                    return (
                      <div key={doc.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2">
                        <p className="text-xs font-medium text-gray-800 truncate flex-1">{doc.name}</p>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${expired ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                          {expired ? `EXPIRED ${format(doc.expiryDate!, 'MMM d')}` : `Exp ${format(doc.expiryDate!, 'MMM d, yyyy')}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {docGroups.map(group => (
              <div key={group.key}>
                <div className="flex items-center gap-2 mb-3">
                  {docCategoryIcon[group.key]}
                  <h2 className="text-sm font-semibold text-gray-700">{group.label} ({group.docs.length})</h2>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
                  {group.docs.map(doc => {
                    const expiringSoon = doc.expiryDate && isPast(doc.expiryDate);
                    const expiringIn60 = doc.expiryDate && !isPast(doc.expiryDate) && (doc.expiryDate.getTime() - Date.now()) < 60 * 86400000;
                    return (
                      <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${doc.fileType === 'pdf' ? 'bg-red-50' : doc.fileType === 'doc' ? 'bg-blue-50' : 'bg-green-50'}`}>
                          <span className={`text-[10px] font-bold uppercase ${doc.fileType === 'pdf' ? 'text-red-500' : doc.fileType === 'doc' ? 'text-blue-500' : 'text-green-500'}`}>
                            {doc.fileType}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                          <p className="text-xs text-gray-400">Uploaded {format(doc.uploadedAt, 'MMM d, yyyy')} by {doc.uploadedBy}</p>
                        </div>
                        <div className="flex-shrink-0 text-right flex items-center gap-1.5">
                          {doc.expiryDate && (
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${expiringSoon ? 'bg-red-50 text-red-600' : expiringIn60 ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-100 text-gray-500'}`}>
                              {expiringSoon ? 'EXPIRED' : `Exp ${format(doc.expiryDate, 'MMM yy')}`}
                            </span>
                          )}
                          <button
                            onClick={() => deleteDocument(doc.id)}
                            className="p-1.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                            title="Delete document"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      {showCreateTemplate && (
        <CreateTemplateModal
          categories={categories}
          onClose={() => setShowCreateTemplate(false)}
          onSave={(tpl) => { addTemplate(tpl); setShowCreateTemplate(false); setCatFilter('all'); setTab('checklists'); }}
        />
      )}

      {/* Upload Document Modal */}
      {showUploadDoc && (
        <UploadDocumentModal
          onClose={() => setShowUploadDoc(false)}
          onSave={(doc) => { addDocument(doc); setShowUploadDoc(false); }}
        />
      )}
    </div>
  );
}

// ── Upload Document Modal ─────────────────────────────────────
function UploadDocumentModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (doc: ComplianceDocument) => void;
}) {
  const [docName,    setDocName]    = useState('');
  const [category,   setCategory]   = useState<ComplianceDocument['category']>('certificate');
  const [fileType,   setFileType]   = useState<'pdf' | 'doc' | 'img'>('pdf');
  const [expiryDate, setExpiryDate] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile({ name: file.name, size: file.size });
    if (!docName.trim()) setDocName(file.name.replace(/\.[^.]+$/, ''));
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') setFileType('pdf');
    else if (['jpg','jpeg','png','gif','webp'].includes(ext ?? '')) setFileType('img');
    else setFileType('doc');
  };

  const handleSave = () => {
    if (!docName.trim()) return;
    onSave({
      id: `doc-${Date.now()}`,
      name: docName.trim(),
      category,
      fileType,
      uploadedAt: new Date(),
      uploadedBy: 'You',
      expiryDate: parseLocalDate(expiryDate),
    });
  };

  const catOptions: { value: ComplianceDocument['category']; label: string }[] = [
    { value: 'permit',      label: 'Permit / License'  },
    { value: 'certificate', label: 'Certificate'        },
    { value: 'sop',         label: 'SOP / Policy'       },
    { value: 'training',    label: 'Training Record'    },
    { value: 'insurance',   label: 'Insurance'          },
    { value: 'contractor',  label: 'Contractor Doc'     },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Upload Document</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Name *</label>
            <input value={docName} onChange={e => setDocName(e.target.value)}
              placeholder="e.g. Fire Certificate 2025"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value as ComplianceDocument['category'])}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {catOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File Type</label>
              <select value={fileType} onChange={e => setFileType(e.target.value as 'pdf' | 'doc' | 'img')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="pdf">PDF</option>
                <option value="doc">Document</option>
                <option value="img">Image</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (optional)</label>
            <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {/* File upload */}
          <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
            className="hidden" onChange={handleFileChange} />
          {selectedFile ? (
            <div className="border border-gray-200 rounded-xl p-4 flex items-center gap-3 bg-gray-50">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <FileText size={18} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                <p className="text-xs text-gray-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="p-1.5 rounded hover:bg-gray-200 text-gray-400">
                <X size={14} />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center gap-2 text-gray-400 cursor-pointer hover:border-blue-400 hover:text-blue-500 transition-colors w-full">
              <Upload size={24} />
              <span className="text-sm">Click to choose file or drag & drop</span>
              <span className="text-xs">PDF, DOC, or image</span>
            </button>
          )}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose}
            className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={!docName.trim()}
            className="flex-1 bg-blue-700 hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-2.5 text-sm font-medium">
            Save Document
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Schedule card ─────────────────────────────────────────────
function ScheduleCard({ run, onStart, categories }: {
  run: InspectionRun;
  onStart: (id: string) => void;
  categories: Record<string, { icon: string; color: string; name: string }>;
}) {
  const cat   = categories[run.categoryId];
  const isOver = run.status === 'overdue';
  const inProg = run.status === 'in_progress';

  return (
    <div className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${isOver ? 'border-red-200' : 'border-gray-200'}`}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ backgroundColor: (cat?.color ?? '#6b7280') + '20' }}>
        {cat?.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{run.templateName}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-xs ${isOver ? 'text-red-500' : 'text-gray-400'}`}>
            {isOver ? `Overdue since ${format(run.scheduledAt, 'MMM d')}` : `Scheduled ${format(run.scheduledAt, 'MMM d, HH:mm')}`}
          </span>
          {run.assigneeName && <span className="text-[11px] text-gray-400">· {run.assigneeName}</span>}
        </div>
      </div>
      <button onClick={() => onStart(run.id)}
        className={`flex items-center gap-1.5 px-3 py-2 text-white text-xs font-medium rounded-lg flex-shrink-0 ${isOver ? 'bg-red-500 hover:bg-red-600' : inProg ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
        {inProg ? 'Continue' : 'Start'}
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

// ── Create Template Modal ─────────────────────────────────────
function CreateTemplateModal({ categories, onClose, onSave }: {
  categories: { id: string; name: string; icon: string; color: string }[];
  onClose: () => void;
  onSave: (t: ChecklistTemplate) => void;
}) {
  const [name,       setName]       = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [frequency,  setFrequency]  = useState<ChecklistFrequency>('monthly');
  const [description,setDescription]= useState('');
  const [estMinutes, setEstMinutes] = useState('30');
  const [signature,  setSignature]  = useState(false);
  const [sections,   setSections]   = useState<ChecklistSection[]>([
    { id: 's1', title: 'Section 1', items: [
      { id: 'i1', label: '', responseType: 'yes_no', mandatory: true, nfcEnabled: false },
    ]},
  ]);

  const addSection = () => {
    const id = `s${Date.now()}`;
    setSections(prev => [...prev, { id, title: `Section ${prev.length + 1}`, items: [] }]);
  };

  const removeSection = (sid: string) => setSections(prev => prev.filter(s => s.id !== sid));

  const updateSectionTitle = (sid: string, title: string) =>
    setSections(prev => prev.map(s => s.id === sid ? { ...s, title } : s));

  const addItem = (sid: string) => {
    const id = `i${Date.now()}`;
    setSections(prev => prev.map(s => s.id === sid
      ? { ...s, items: [...s.items, { id, label: '', responseType: 'yes_no', mandatory: true, nfcEnabled: false }] }
      : s
    ));
  };

  const removeItem = (sid: string, iid: string) =>
    setSections(prev => prev.map(s => s.id === sid ? { ...s, items: s.items.filter(i => i.id !== iid) } : s));

  const updateItem = (sid: string, iid: string, changes: Partial<ChecklistItem>) =>
    setSections(prev => prev.map(s => s.id === sid
      ? { ...s, items: s.items.map(i => i.id === iid ? { ...i, ...changes } : i) }
      : s
    ));

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: `tpl-${Date.now()}`,
      name: name.trim(),
      categoryId,
      description: description.trim(),
      frequency,
      requiresSignature: signature,
      estimatedMinutes: Number(estMinutes) || 30,
      sections: sections.filter(s => s.items.length > 0),
    });
  };

  const freqs: ChecklistFrequency[] = ['daily','weekly','biweekly','monthly','quarterly','yearly','once'];
  const respTypes: ResponseType[] = ['yes_no','pass_flag_fail_na','text','number'];
  const respTypeLabel: Record<ResponseType, string> = {
    yes_no: 'Yes / No', pass_flag_fail_na: 'Pass / Flag / Fail / N/A', text: 'Text', number: 'Number',
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-semibold text-gray-900">Create Checklist Template</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Basic fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Checklist Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Daily Fire Walk"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
              <select value={frequency} onChange={e => setFrequency(e.target.value as ChecklistFrequency)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {freqs.map(f => <option key={f} value={f}>{freqLabel[f]}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              placeholder="Brief description of this checklist"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Time (min)</label>
              <input type="number" value={estMinutes} onChange={e => setEstMinutes(e.target.value)} min="1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex items-end pb-0.5">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setSignature(v => !v)}
                  className={`w-10 h-6 rounded-full transition-colors flex items-center flex-shrink-0 ${signature ? 'bg-blue-600' : 'bg-gray-200'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform mx-0.5 ${signature ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <span className="text-sm text-gray-700">Requires Signature</span>
              </label>
            </div>
          </div>

          {/* Sections + items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Sections & Items</h3>
              <button onClick={addSection}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                <Plus size={13} /> Add Section
              </button>
            </div>

            <div className="space-y-4">
              {sections.map((section, si) => (
                <div key={section.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* Section header */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
                    <input value={section.title} onChange={e => updateSectionTitle(section.id, e.target.value)}
                      className="flex-1 text-sm font-semibold text-gray-700 bg-transparent border-none outline-none"
                      placeholder="Section title" />
                    {sections.length > 1 && (
                      <button onClick={() => removeSection(section.id)} className="text-gray-400 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  {/* Items */}
                  <div className="divide-y divide-gray-100">
                    {section.items.map((item, ii) => (
                      <div key={item.id} className="p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-gray-400 font-mono mt-2 flex-shrink-0">{si+1}.{ii+1}</span>
                          <input value={item.label} onChange={e => updateItem(section.id, item.id, { label: e.target.value })}
                            placeholder="Item label (e.g. Fire exits clear and unobstructed)"
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          <button onClick={() => removeItem(section.id, item.id)} className="text-gray-300 hover:text-red-500 mt-2 flex-shrink-0">
                            <X size={14} />
                          </button>
                        </div>
                        <div className="flex items-center gap-3 pl-7">
                          <select value={item.responseType}
                            onChange={e => updateItem(section.id, item.id, { responseType: e.target.value as ResponseType })}
                            className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {respTypes.map(r => <option key={r} value={r}>{respTypeLabel[r]}</option>)}
                          </select>
                          <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                            <div onClick={() => updateItem(section.id, item.id, { mandatory: !item.mandatory })}
                              className={`w-8 h-4.5 rounded-full transition-colors flex items-center flex-shrink-0 ${item.mandatory ? 'bg-blue-600' : 'bg-gray-200'}`}
                              style={{ height: '18px', width: '32px' }}>
                              <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform mx-0.5 ${item.mandatory ? 'translate-x-3.5' : 'translate-x-0'}`} />
                            </div>
                            Mandatory
                          </label>
                          {item.mandatory && <Check size={12} className="text-blue-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Add item */}
                  <button onClick={() => addItem(section.id)}
                    className="w-full py-2.5 text-xs text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1 border-t border-gray-100">
                    <Plus size={13} /> Add Item
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose}
            className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim()}
            className="flex-1 bg-blue-700 hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-2.5 text-sm font-medium">
            Save Template
          </button>
        </div>
      </div>
    </div>
  );
}
