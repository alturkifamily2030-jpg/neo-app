import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Plus, X, LayoutGrid, List, Search, ChevronRight,
  Columns3, Wrench, AlertCircle, CheckCircle2, Archive,
  DollarSign, BarChart2, QrCode, ShieldAlert,
} from 'lucide-react';
import QRScanner from '../components/ui/QRScanner';
import { format, differenceInDays, subMonths } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useNotifications } from '../context/NotificationContext';
import type { Asset, AssetCriticality } from '../types';

type Tab = 'dashboard' | 'register' | 'assets';

const categoryIcon: Record<string, string> = {
  Power: '⚡', Vehicle: '🚗', Pool: '🏊', Plumbing: '🔧', HVAC: '❄️',
  Kitchen: '🍳', 'Fire Safety': '🔥', Landscape: '🌿', Security: '📷',
};
const categoryColor: Record<string, string> = {
  Power: '#f59e0b', Vehicle: '#3b82f6', Pool: '#06b6d4', Plumbing: '#6b7280',
  HVAC: '#8b5cf6', Kitchen: '#f97316', 'Fire Safety': '#ef4444',
  Landscape: '#10b981', Security: '#64748b',
};

const statusStyle: Record<Asset['status'], { cls: string; icon: React.ReactNode; label: string }> = {
  active:      { cls: 'bg-green-100 text-green-700',  icon: <CheckCircle2 size={13} />, label: 'Active' },
  maintenance: { cls: 'bg-yellow-100 text-yellow-700',icon: <Wrench size={13} />,       label: 'Maintenance' },
  retired:     { cls: 'bg-gray-100 text-gray-500',    icon: <Archive size={13} />,      label: 'Retired' },
};

const critStyle: Record<AssetCriticality, { cls: string; dot: string; label: string }> = {
  high:   { cls: 'bg-red-100 text-red-600',     dot: 'bg-red-500',    label: 'High' },
  medium: { cls: 'bg-yellow-100 text-yellow-600',dot: 'bg-yellow-400', label: 'Medium' },
  low:    { cls: 'bg-green-100 text-green-600',  dot: 'bg-green-500',  label: 'Low' },
};

const CATEGORIES = ['Power','Vehicle','Pool','Plumbing','HVAC','Kitchen','Fire Safety','Landscape','Security'];

function computeHealthScore(asset: Asset): number {
  if (asset.status === 'retired') return 0;
  let score = 100;
  if (asset.status === 'maintenance') score -= 20;
  const totalCost = asset.maintenanceHistory.reduce((s, r) => s + r.cost, 0);
  if (asset.purchasePrice && asset.purchasePrice > 0) {
    const ratio = (totalCost / asset.purchasePrice) * 100;
    if (ratio >= 75) score -= 30;
    else if (ratio >= 40) score -= 15;
    else if (ratio >= 20) score -= 5;
  }
  if (asset.warrantyExpiry && differenceInDays(asset.warrantyExpiry, new Date()) < 0) score -= 10;
  if (asset.criticality === 'high' && asset.status === 'maintenance') score -= 10;
  return Math.max(0, Math.min(100, score));
}

export default function AssetsPage() {
  const navigate = useNavigate();
  const { assets, addAsset } = useNotifications();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [showCreate, setShowCreate] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [splitView, setSplitView] = useState(false);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [critFilter, setCritFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'criticality' | 'health' | 'cost'>('name');

  // ── stats ─────────────────────────────────────────────────
  const totalCost = assets.reduce((s, a) => s + a.maintenanceHistory.reduce((c, r) => c + r.cost, 0), 0);
  const highCrit  = assets.filter(a => a.criticality === 'high').length;
  const medCrit   = assets.filter(a => a.criticality === 'medium').length;
  const lowCrit   = assets.filter(a => a.criticality === 'low').length;
  const needsAttn = assets.filter(a => a.status === 'maintenance' || (a.criticality === 'high' && a.status !== 'active'));

  // Fleet health
  const healthScores = assets.map(computeHealthScore);
  const avgHealth = assets.length > 0 ? Math.round(healthScores.reduce((s, v) => s + v, 0) / assets.length) : 0;
  const goodCount = healthScores.filter(s => s >= 75).length;
  const fairCount = healthScores.filter(s => s >= 50 && s < 75).length;
  const poorCount = healthScores.filter(s => s < 50).length;

  // Warranty expiry
  const warrantySoon = assets.filter(a => {
    if (!a.warrantyExpiry) return false;
    const days = differenceInDays(a.warrantyExpiry, new Date());
    return days >= 0 && days <= 90;
  });
  const warrantyExpired = assets.filter(a => {
    if (!a.warrantyExpiry) return false;
    return differenceInDays(a.warrantyExpiry, new Date()) < 0;
  });

  // ── per-category stats ────────────────────────────────────
  const catStats = CATEGORIES.map(cat => {
    const list = assets.filter(a => a.category === cat);
    return {
      cat,
      total: list.length,
      active: list.filter(a => a.status === 'active').length,
      maintenance: list.filter(a => a.status === 'maintenance').length,
      retired: list.filter(a => a.status === 'retired').length,
      highCrit: list.filter(a => a.criticality === 'high').length,
      cost: list.reduce((s, a) => s + a.maintenanceHistory.reduce((c, r) => c + r.cost, 0), 0),
    };
  }).filter(c => c.total > 0);

  // ── all maintenance records (recent first) ────────────────
  const recentMaintenance = assets
    .flatMap(a => a.maintenanceHistory.map(r => ({ ...r, assetName: a.name, assetId: a.id })))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 8);

  // ── filtered assets ───────────────────────────────────────
  // ── monthly cost trend (last 6 months) ───────────────────
  const monthlyCostData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    return {
      label: format(d, 'MMM'),
      cost: assets.flatMap(a => a.maintenanceHistory)
        .filter(r => r.date.getFullYear() === d.getFullYear() && r.date.getMonth() === d.getMonth())
        .reduce((s, r) => s + r.cost, 0),
    };
  });

  const filtered = assets.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase())
      || a.category.toLowerCase().includes(search.toLowerCase())
      || a.location.toLowerCase().includes(search.toLowerCase());
    const matchCat    = catFilter    === 'all' || a.category    === catFilter;
    const matchCrit   = critFilter   === 'all' || a.criticality === critFilter;
    const matchStatus = statusFilter === 'all' || a.status      === statusFilter;
    return matchSearch && matchCat && matchCrit && matchStatus;
  });

  const critOrder: Record<AssetCriticality, number> = { high: 0, medium: 1, low: 2 };
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'criticality') return critOrder[a.criticality] - critOrder[b.criticality];
    if (sortBy === 'health') return computeHealthScore(b) - computeHealthScore(a);
    if (sortBy === 'cost') {
      return b.maintenanceHistory.reduce((s, r) => s + r.cost, 0) - a.maintenanceHistory.reduce((s, r) => s + r.cost, 0);
    }
    return 0;
  });

  const handleCreate = (data: Omit<Asset, 'id' | 'maintenanceHistory' | 'assetDocuments' | 'qrCode'>) => {
    addAsset({
      ...data,
      id: `as${Date.now()}`,
      qrCode: `QR-${Date.now()}`,
      maintenanceHistory: [],
      assetDocuments: [],
    } as Asset);
    setShowCreate(false);
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <BarChart2 size={15} /> },
    { key: 'register',  label: 'Register',  icon: <Package size={15} /> },
    { key: 'assets',    label: 'All Assets',icon: <QrCode size={15} /> },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Package size={22} className="text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Track</h1>
            <span className="text-sm text-gray-400 font-normal">· {assets.length} assets</span>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={16} /> Add Asset
          </button>
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

        {/* ════ DASHBOARD ════ */}
        {tab === 'dashboard' && (
          <div className="p-6 space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Assets',      value: assets.length,         icon: <Package size={20} className="text-blue-500" />,   color: 'bg-blue-50',   text: 'text-blue-700'   },
                { label: 'Active',            value: assets.filter(a=>a.status==='active').length,      icon: <CheckCircle2 size={20} className="text-green-500" />,  color: 'bg-green-50',  text: 'text-green-700'  },
                { label: 'Under Maintenance', value: assets.filter(a=>a.status==='maintenance').length, icon: <Wrench size={20} className="text-yellow-500" />,      color: 'bg-yellow-50', text: 'text-yellow-700' },
                { label: 'Retired',           value: assets.filter(a=>a.status==='retired').length,     icon: <Archive size={20} className="text-gray-500" />,       color: 'bg-gray-100',  text: 'text-gray-700'   },
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

            {/* Criticality + Cost row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Criticality */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Asset Criticality</h3>
                <div className="space-y-3">
                  {([['high', highCrit], ['medium', medCrit], ['low', lowCrit]] as [AssetCriticality, number][]).map(([crit, count]) => (
                    <div key={crit} className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${critStyle[crit].dot}`} />
                      <span className="text-sm text-gray-600 flex-1 capitalize">{critStyle[crit].label}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${critStyle[crit].dot}`}
                          style={{ width: assets.length > 0 ? `${(count / assets.length) * 100}%` : '0%' }} />
                      </div>
                      <span className="text-sm font-semibold text-gray-800 w-6 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Maintenance Cost */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Maintenance Cost</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                    <DollarSign size={22} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">${totalCost.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">Total maintenance spend</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {catStats.sort((a,b) => b.cost - a.cost).slice(0, 4).map(cs => (
                    <div key={cs.cat} className="flex items-center gap-2">
                      <span className="text-sm">{categoryIcon[cs.cat] ?? '📦'}</span>
                      <span className="text-xs text-gray-500 flex-1">{cs.cat}</span>
                      <span className="text-xs font-semibold text-gray-700">${cs.cost.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Fleet Health */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Fleet Health</h3>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                  ${avgHealth >= 75 ? 'bg-green-100 text-green-700' : avgHealth >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>
                  {avgHealth >= 75 ? 'Good' : avgHealth >= 50 ? 'Fair' : 'Poor'}
                </span>
              </div>
              <div className="flex items-center gap-5 mb-5">
                <div className="text-4xl font-bold text-gray-900">{avgHealth}%</div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${avgHealth >= 75 ? 'bg-green-500' : avgHealth >= 50 ? 'bg-yellow-500' : 'bg-red-400'}`}
                      style={{ width: `${avgHealth}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Average health score across all assets</p>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Good (≥75%)', count: goodCount, cls: 'bg-green-500' },
                  { label: 'Fair (50–74%)', count: fairCount, cls: 'bg-yellow-500' },
                  { label: 'Poor (<50%)', count: poorCount, cls: 'bg-red-400' },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${row.cls}`} />
                    <span className="text-xs text-gray-500 flex-1">{row.label}</span>
                    <div className="w-24 bg-gray-100 rounded-full h-1.5">
                      <div className={`h-full rounded-full ${row.cls}`}
                        style={{ width: `${assets.length > 0 ? (row.count / assets.length) * 100 : 0}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 w-5 text-right">{row.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Cost Trend */}
            {monthlyCostData.some(d => d.cost > 0) && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Maintenance Cost</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={monthlyCostData} barSize={32}>
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={52}
                      tickFormatter={v => (v as number) >= 1000 ? `$${((v as number)/1000).toFixed(0)}k` : `$${v}`} />
                    <Tooltip formatter={(v: number | undefined) => v != null ? [`$${v.toLocaleString()}`, 'Cost'] : ['—', 'Cost']} />
                    <Bar dataKey="cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Needs Attention */}
            {needsAttn.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle size={16} className="text-orange-500" />
                  <h2 className="text-sm font-semibold text-orange-600">Needs Attention ({needsAttn.length})</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {needsAttn.map(asset => (
                    <div key={asset.id} onClick={() => navigate(`/assets/${asset.id}`)}
                      className="bg-white rounded-xl border border-orange-100 p-3 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                        style={{ backgroundColor: (categoryColor[asset.category] ?? '#6b7280') + '20' }}>
                        {categoryIcon[asset.category] ?? '📦'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{asset.name}</p>
                        <p className="text-xs text-gray-400">{asset.location}</p>
                      </div>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${statusStyle[asset.status].cls}`}>
                        {statusStyle[asset.status].label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warranty Alerts */}
            {(warrantyExpired.length > 0 || warrantySoon.length > 0) && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert size={16} className="text-amber-500" />
                  <h2 className="text-sm font-semibold text-amber-600">Warranty Alerts ({warrantyExpired.length + warrantySoon.length})</h2>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
                  {[...warrantyExpired, ...warrantySoon].map(asset => {
                    const days = differenceInDays(asset.warrantyExpiry!, new Date());
                    const expired = days < 0;
                    return (
                      <div key={asset.id} onClick={() => navigate(`/assets/${asset.id}`)}
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                          style={{ backgroundColor: (categoryColor[asset.category] ?? '#6b7280') + '18' }}>
                          {categoryIcon[asset.category] ?? '📦'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{asset.name}</p>
                          <p className="text-xs text-gray-400">{asset.location}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${expired ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                            {expired ? `Expired ${Math.abs(days)}d ago` : `Expires in ${days}d`}
                          </span>
                          <span className="text-[10px] text-gray-400">{format(asset.warrantyExpiry!, 'MMM d, yyyy')}</span>
                        </div>
                        <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Maintenance */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent Maintenance</h2>
              <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
                {recentMaintenance.map(rec => {
                  const typeColor = rec.type === 'repair' ? 'text-red-500' : rec.type === 'replacement' ? 'text-purple-500' : rec.type === 'pm' ? 'text-blue-500' : 'text-green-500';
                  const typeDot   = rec.type === 'repair' ? 'bg-red-400' : rec.type === 'replacement' ? 'bg-purple-400' : rec.type === 'pm' ? 'bg-blue-400' : 'bg-green-400';
                  return (
                    <div key={rec.id} className="flex items-center gap-3 px-4 py-3">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${typeDot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{rec.assetName}</p>
                        <p className="text-xs text-gray-400 truncate">{rec.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-xs font-semibold capitalize ${typeColor}`}>{rec.type}</p>
                        <p className="text-[11px] text-gray-400">{format(rec.date, 'MMM d')}</p>
                      </div>
                      {rec.cost > 0 && (
                        <span className="text-xs font-medium text-gray-700 ml-1">${rec.cost.toLocaleString()}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ════ REGISTER ════ */}
        {tab === 'register' && (
          <div className="p-6">
            <p className="text-xs text-gray-400 mb-4">Asset registers grouped by category. Click a register to browse its assets.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {catStats.map(cs => (
                <div
                  key={cs.cat}
                  onClick={() => { setTab('assets'); setCatFilter(cs.cat); }}
                  className="bg-white rounded-2xl border border-gray-200 p-5 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: (categoryColor[cs.cat] ?? '#6b7280') + '18' }}>
                        {categoryIcon[cs.cat] ?? '📦'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{cs.cat}</p>
                        <p className="text-xs text-gray-400">{cs.total} asset{cs.total !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    {cs.highCrit > 0 && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                        {cs.highCrit} critical
                      </span>
                    )}
                  </div>
                  {/* Status bar */}
                  <div className="space-y-1.5">
                    {[
                      { label: 'Active',       count: cs.active,      cls: 'bg-green-500' },
                      { label: 'Maintenance',  count: cs.maintenance, cls: 'bg-yellow-400' },
                      { label: 'Retired',      count: cs.retired,     cls: 'bg-gray-300'  },
                    ].filter(r => r.count > 0).map(row => (
                      <div key={row.label} className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${row.cls} flex-shrink-0`} />
                        <span className="text-xs text-gray-500 flex-1">{row.label}</span>
                        <span className="text-xs font-semibold text-gray-700">{row.count}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">Maintenance cost</span>
                    <span className="text-xs font-semibold text-gray-700">${cs.cost.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════ ALL ASSETS ════ */}
        {tab === 'assets' && (
          <div className="flex flex-col h-full">
            {/* Filters toolbar */}
            <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search assets…" value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm w-44 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {/* Category filter */}
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-600 focus:outline-none bg-white">
                <option value="all">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {/* Criticality filter */}
              <select value={critFilter} onChange={e => setCritFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-600 focus:outline-none bg-white">
                <option value="all">All Criticality</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              {/* Status filter */}
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-600 focus:outline-none bg-white">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </select>
              {/* Sort */}
              <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-600 focus:outline-none bg-white">
                <option value="name">Sort: A–Z</option>
                <option value="criticality">Sort: Criticality</option>
                <option value="health">Sort: Health ↓</option>
                <option value="cost">Sort: Cost ↓</option>
              </select>
              <div className="ml-auto flex items-center gap-1">
                <button onClick={() => setShowQRScanner(true)} title="Scan QR Code"
                  className="p-1.5 rounded text-gray-400 hover:text-gray-600">
                  <QrCode size={16} />
                </button>
                <button onClick={() => { setViewMode('grid'); setSplitView(false); }}
                  className={`p-1.5 rounded ${viewMode==='grid'&&!splitView?'text-blue-600 bg-blue-50':'text-gray-400 hover:text-gray-600'}`}>
                  <LayoutGrid size={16} />
                </button>
                <button onClick={() => { setViewMode('list'); setSplitView(false); }}
                  className={`p-1.5 rounded ${viewMode==='list'&&!splitView?'text-blue-600 bg-blue-50':'text-gray-400 hover:text-gray-600'}`}>
                  <List size={16} />
                </button>
                <button onClick={() => setSplitView(v=>!v)} title="Split by status"
                  className={`p-1.5 rounded ${splitView?'text-blue-600 bg-blue-50':'text-gray-400 hover:text-gray-600'}`}>
                  <Columns3 size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              {splitView ? (
                <div className="h-full flex overflow-x-auto">
                  {(['active','maintenance','retired'] as Asset['status'][]).map(s => {
                    const colA = sorted.filter(a => a.status === s);
                    const cfg = statusStyle[s];
                    return (
                      <div key={s} className="flex-1 min-w-[280px] flex flex-col border-r border-gray-200 last:border-r-0">
                        <div className={`flex items-center gap-2 px-4 py-3 border-b flex-shrink-0 ${s==='active'?'bg-green-50 border-green-200':s==='maintenance'?'bg-yellow-50 border-yellow-200':'bg-gray-100 border-gray-200'}`}>
                          {cfg.icon}
                          <span className={`text-sm font-semibold ${s==='active'?'text-green-700':s==='maintenance'?'text-yellow-700':'text-gray-600'}`}>{cfg.label}</span>
                          <span className="ml-auto text-xs font-bold">{colA.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto bg-gray-50 p-2 space-y-2">
                          {colA.length === 0 ? (
                            <div className="text-center py-10 text-gray-300 text-xs">No assets</div>
                          ) : colA.map(asset => <AssetCard key={asset.id} asset={asset} onClick={() => navigate(`/assets/${asset.id}`)} compact />)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : sorted.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <Package size={48} className="text-gray-200 mb-4" strokeWidth={1.5} />
                  <p className="text-gray-400 text-sm">No assets match your filters</p>
                </div>
              ) : (
                <div className={`p-4 ${viewMode==='grid'?'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 content-start':'space-y-2'}`}>
                  {sorted.map(asset => (
                    <AssetCard key={asset.id} asset={asset} onClick={() => navigate(`/assets/${asset.id}`)} compact={false} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showCreate && <CreateAssetModal onClose={() => setShowCreate(false)} onSave={handleCreate} />}

      {showQRScanner && (
        <QRScanner
          onScan={data => {
            // Navigate to asset if QR matches asset ID or serial
            const asset = assets.find(a => a.qrCode === data || a.serialNumber === data || a.id === data);
            if (asset) {
              navigate(`/assets/${asset.id}`);
            } else if (data.includes('/assets/')) {
              navigate(data.split(window.location.origin)[1] || `/assets/${data}`);
            } else {
              alert(`QR Code scanned: ${data}`);
            }
          }}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  );
}

// ── Asset card ─────────────────────────────────────────────
function AssetCard({ asset, onClick, compact }: { asset: Asset; onClick: () => void; compact: boolean }) {
  const sc     = statusStyle[asset.status];
  const cc     = critStyle[asset.criticality];
  const icon   = categoryIcon[asset.category] ?? '📦';
  const health = computeHealthScore(asset);

  if (compact) {
    return (
      <div onClick={onClick} className="bg-white rounded-xl border border-gray-200 p-3 cursor-pointer hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">{asset.name}</p>
            <p className="text-[10px] text-gray-400">{asset.location}</p>
          </div>
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cc.dot}`} />
        </div>
      </div>
    );
  }

  return (
    <div onClick={onClick} className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: (categoryColor[asset.category] ?? '#6b7280') + '18' }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{asset.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{asset.category} · {asset.location}</p>
          {asset.serialNumber && <p className="text-[11px] text-gray-400 font-mono mt-0.5">{asset.serialNumber}</p>}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${sc.cls}`}>
            {sc.icon}{sc.label}
          </span>
          <span className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${cc.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cc.dot}`} />{cc.label}
          </span>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full
            ${health >= 75 ? 'bg-green-50 text-green-600' : health >= 50 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-500'}`}>
            {health}%
          </span>
          <ChevronRight size={14} className="text-gray-300 mt-1" />
        </div>
      </div>
      {asset.qrCode && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5">
          <QrCode size={12} className="text-gray-400" />
          <span className="text-[11px] text-gray-400 font-mono">{asset.qrCode}</span>
        </div>
      )}
    </div>
  );
}

// ── Create Modal ───────────────────────────────────────────
function CreateAssetModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (a: Omit<Asset, 'id' | 'maintenanceHistory' | 'assetDocuments' | 'qrCode'>) => void;
}) {
  const [name,         setName]         = useState('');
  const [category,     setCategory]     = useState('');
  const [location,     setLocation]     = useState('');
  const [serial,       setSerial]       = useState('');
  const [model,        setModel]        = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [vendor,       setVendor]       = useState('');
  const [price,        setPrice]        = useState('');
  const [status,       setStatus]       = useState<Asset['status']>('active');
  const [criticality,  setCriticality]  = useState<AssetCriticality>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(), category, location, serialNumber: serial || undefined,
      model: model || undefined, manufacturer: manufacturer || undefined,
      vendorName: vendor || undefined, purchasePrice: price ? Number(price) : undefined,
      status, criticality,
    } as Omit<Asset, 'id' | 'maintenanceHistory' | 'assetDocuments' | 'qrCode'>);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-semibold text-gray-900">Add Asset</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required autoFocus
              placeholder="e.g. Main Boiler"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Select…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{categoryIcon[c]} {c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Boiler Room"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <input type="text" value={model} onChange={e => setModel(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
              <input type="text" value={manufacturer} onChange={e => setManufacturer(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
              <input type="text" value={serial} onChange={e => setSerial(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price ($)</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor / Supplier</label>
            <input type="text" value={vendor} onChange={e => setVendor(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as Asset['status'])}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Criticality</label>
              <select value={criticality} onChange={e => setCriticality(e.target.value as AssetCriticality)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit"
              className="flex-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg py-2.5 text-sm font-medium">Add Asset</button>
          </div>
        </form>
      </div>
    </div>
  );
}
