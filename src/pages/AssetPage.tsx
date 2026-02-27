import { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Package, MapPin, Tag, Hash, Calendar, Wrench,
  Edit2, Trash2, Check, X, AlertCircle, CheckCircle, Archive,
  FileText, QrCode, Wifi, DollarSign, Plus, Building2, Phone,
  ShieldCheck, Clock, TrendingUp, ListChecks, AlertTriangle,
  ChevronRight, Camera, Flag,
} from 'lucide-react';
import { format, differenceInDays, subMonths } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useNotifications } from '../context/NotificationContext';
import QRCodeCanvas, { downloadCanvasAsPng, printQRCode } from '../components/ui/QRCodeCanvas';
import type { Asset, MaintenanceRecord, AssetDocument, Priority, Group } from '../types';

type Tab = 'details' | 'maintenance' | 'documents' | 'tasks' | 'photos' | 'qrtag';

const statusConfig: Record<Asset['status'], { label: string; icon: React.ReactNode; cls: string }> = {
  active:      { label: 'Active',      icon: <CheckCircle size={14} />, cls: 'bg-green-100 text-green-700'  },
  maintenance: { label: 'Maintenance', icon: <AlertCircle size={14} />, cls: 'bg-yellow-100 text-yellow-700' },
  retired:     { label: 'Retired',     icon: <Archive size={14} />,     cls: 'bg-gray-100 text-gray-500'    },
};
const critConfig = {
  high:   { label: 'High',   dot: 'bg-red-500',    cls: 'bg-red-50 text-red-600'      },
  medium: { label: 'Medium', dot: 'bg-yellow-400', cls: 'bg-yellow-50 text-yellow-600' },
  low:    { label: 'Low',    dot: 'bg-green-500',  cls: 'bg-green-50 text-green-600'   },
};
const categoryIcon: Record<string, string> = {
  Power: '⚡', Vehicle: '🚗', Pool: '🏊', Plumbing: '🔧', HVAC: '❄️',
  Kitchen: '🍳', 'Fire Safety': '🔥', Landscape: '🌿', Security: '📷',
};
const mtypeColor = {
  repair:      'text-red-500    bg-red-50',
  inspection:  'text-green-500  bg-green-50',
  pm:          'text-blue-500   bg-blue-50',
  replacement: 'text-purple-500 bg-purple-50',
};
const docTypeIcon: Record<string, string> = {
  manual: '📖', warranty: '🛡️', certificate: '🏅', invoice: '💵', inspection: '🔍',
};

const statusDot: Record<string, string> = {
  open: 'bg-red-500', in_progress: 'bg-yellow-400', done: 'bg-green-500',
};
const recurrenceLabel: Record<string, string> = {
  never: 'One-off', daily: 'Daily', weekly: 'Weekly', biweekly: 'Every 2 weeks',
  monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly',
};

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

const parseLocalDate = (s: string): Date | undefined => {
  if (!s) return undefined;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export default function AssetPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { assets, updateAsset, deleteAsset, tasks, plannedTasks, addTask, groups } = useNotifications();

  const asset = assets.find(a => a.id === id);
  const [tab, setTab] = useState<Tab>('details');
  const [editing, setEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [showUploadDoc, setShowUploadDoc] = useState(false);
  const [showPrintQR, setShowPrintQR] = useState(false);
  const [showReportIssue, setShowReportIssue] = useState(false);
  const [showNfcInfo, setShowNfcInfo] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const handleQRReady = useCallback((canvas: HTMLCanvasElement) => { qrCanvasRef.current = canvas; }, []);

  // edit state
  const [editName,   setEditName]   = useState('');
  const [editCat,    setEditCat]    = useState('');
  const [editLoc,    setEditLoc]    = useState('');
  const [editSerial, setEditSerial] = useState('');
  const [editModel,  setEditModel]  = useState('');
  const [editMfg,    setEditMfg]    = useState('');
  const [editVendor, setEditVendor] = useState('');
  const [editPrice,  setEditPrice]  = useState('');
  const [editStatus, setEditStatus] = useState<Asset['status']>('active');
  const [editCrit,   setEditCrit]   = useState<Asset['criticality']>('medium');
  const [editNotes,         setEditNotes]         = useState('');
  const [editVendorContact, setEditVendorContact] = useState('');
  const [editWarrantyExpiry,setEditWarrantyExpiry]= useState('');
  const [editInstallDate,   setEditInstallDate]   = useState('');
  const [editPurchaseDate,  setEditPurchaseDate]  = useState('');

  if (!asset) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400">
        <Package size={48} strokeWidth={1.5} className="mb-3" />
        <p className="text-lg font-medium">Asset not found</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-sm text-blue-600 hover:underline">Back</button>
      </div>
    );
  }

  // linked data
  const linkedTasks    = tasks.filter(t => t.assetId === asset.id);
  const linkedPlanned  = plannedTasks.filter(p => p.assetId === asset.id);
  const linkedCount    = linkedTasks.length + linkedPlanned.length;

  const sc   = statusConfig[asset.status];
  const cc   = critConfig[asset.criticality];
  const icon = categoryIcon[asset.category] ?? '📦';
  const totalCost = asset.maintenanceHistory.reduce((s, r) => s + r.cost, 0);
  const repairVsReplace = asset.purchasePrice ? Math.round((totalCost / asset.purchasePrice) * 100) : null;
  const assetHealth = computeHealthScore(asset);

  // warranty expiry
  const warrantyDaysLeft = asset.warrantyExpiry ? differenceInDays(asset.warrantyExpiry, new Date()) : null;
  const warrantyExpired  = warrantyDaysLeft !== null && warrantyDaysLeft < 0;
  const warrantySoon     = warrantyDaysLeft !== null && warrantyDaysLeft >= 0 && warrantyDaysLeft <= 90;

  const monthlyCostData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    return {
      label: format(d, 'MMM'),
      cost: asset.maintenanceHistory
        .filter(r => r.date.getFullYear() === d.getFullYear() && r.date.getMonth() === d.getMonth())
        .reduce((s, r) => s + r.cost, 0),
    };
  });

  const startEdit = () => {
    setEditName(asset.name); setEditCat(asset.category); setEditLoc(asset.location);
    setEditSerial(asset.serialNumber ?? ''); setEditModel(asset.model ?? '');
    setEditMfg(asset.manufacturer ?? ''); setEditVendor(asset.vendorName ?? '');
    setEditPrice(asset.purchasePrice?.toString() ?? ''); setEditStatus(asset.status);
    setEditCrit(asset.criticality); setEditNotes(asset.notes ?? '');
    setEditVendorContact(asset.vendorContact ?? '');
    setEditWarrantyExpiry(asset.warrantyExpiry ? format(asset.warrantyExpiry, 'yyyy-MM-dd') : '');
    setEditInstallDate(asset.installDate ? format(asset.installDate, 'yyyy-MM-dd') : '');
    setEditPurchaseDate(asset.purchaseDate ? format(asset.purchaseDate, 'yyyy-MM-dd') : '');
    setEditing(true);
  };

  const saveEdit = () => {
    updateAsset(asset.id, {
      name: editName.trim() || asset.name, category: editCat, location: editLoc,
      serialNumber: editSerial || undefined, model: editModel || undefined,
      manufacturer: editMfg || undefined, vendorName: editVendor || undefined,
      purchasePrice: editPrice ? Number(editPrice) : undefined,
      status: editStatus, criticality: editCrit, notes: editNotes || undefined,
      vendorContact: editVendorContact || undefined,
      warrantyExpiry: parseLocalDate(editWarrantyExpiry),
      installDate:    parseLocalDate(editInstallDate),
      purchaseDate:   parseLocalDate(editPurchaseDate),
    });
    setEditing(false);
  };

  const handleDelete = () => { deleteAsset(asset.id); navigate(-1); };

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'details',     label: 'Details',     icon: <Tag size={14} />           },
    { key: 'maintenance', label: 'Maintenance',  icon: <Wrench size={14} />,        count: asset.maintenanceHistory.length },
    { key: 'documents',   label: 'Documents',    icon: <FileText size={14} />,      count: asset.assetDocuments.length },
    { key: 'tasks',       label: 'Tasks',        icon: <ListChecks size={14} />,    count: linkedCount || undefined },
    { key: 'photos',      label: 'Photos',       icon: <Camera size={14} />,        count: asset.photos?.length || undefined },
    { key: 'qrtag',       label: 'QR / Tag',     icon: <QrCode size={14} />        },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ backgroundColor: '#3b82f620' }}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-gray-900 truncate">{asset.name}</h1>
            <p className="text-xs text-gray-400">{asset.category} · {asset.location}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowReportIssue(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-orange-500 hover:bg-orange-600 rounded-lg">
              <Flag size={14} /> Report
            </button>
            {!editing && (
              <button onClick={startEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                <Edit2 size={14} /> Edit
              </button>
            )}
            <button onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600">
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* Status + Criticality badges */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium ${sc.cls}`}>
            {sc.icon} {sc.label}
          </span>
          <span className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium ${cc.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cc.dot}`} /> {cc.label} Criticality
          </span>
          {asset.qrCode && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <QrCode size={12} /> {asset.qrCode}
            </span>
          )}
        </div>

        {/* Warranty expiry warning */}
        {warrantyExpired && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-3">
            <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-700 font-medium">
              Warranty expired {Math.abs(warrantyDaysLeft!)} day{Math.abs(warrantyDaysLeft!) !== 1 ? 's' : ''} ago
              {asset.warrantyExpiry && ` (${format(asset.warrantyExpiry, 'MMM d, yyyy')})`}
            </p>
          </div>
        )}
        {warrantySoon && !warrantyExpired && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3">
            <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700 font-medium">
              Warranty expires in {warrantyDaysLeft} day{warrantyDaysLeft !== 1 ? 's' : ''}
              {asset.warrantyExpiry && ` (${format(asset.warrantyExpiry, 'MMM d, yyyy')})`}
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap
                ${tab === t.key ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100 border border-gray-200'}`}>
              {t.icon}{t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`text-[10px] font-bold px-1 rounded-full ${tab === t.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-4 space-y-4">

          {/* ════ DETAILS ════ */}
          {tab === 'details' && (
            editing ? (
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Edit Asset</h3>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                  <input value={editName} onChange={e => setEditName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                    <input value={editCat} onChange={e => setEditCat(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">Location</label>
                    <input value={editLoc} onChange={e => setEditLoc(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">Model</label>
                    <input value={editModel} onChange={e => setEditModel(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">Manufacturer</label>
                    <input value={editMfg} onChange={e => setEditMfg(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">Serial Number</label>
                    <input value={editSerial} onChange={e => setEditSerial(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">Purchase Price ($)</label>
                    <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">Vendor</label>
                    <input value={editVendor} onChange={e => setEditVendor(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">Vendor Contact</label>
                    <input value={editVendorContact} onChange={e => setEditVendorContact(e.target.value)}
                      placeholder="+1 555 0100"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">Purchase Date</label>
                    <input type="date" value={editPurchaseDate} onChange={e => setEditPurchaseDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">Install Date</label>
                    <input type="date" value={editInstallDate} onChange={e => setEditInstallDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">Warranty Expiry</label>
                    <input type="date" value={editWarrantyExpiry} onChange={e => setEditWarrantyExpiry(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                    <select value={editStatus} onChange={e => setEditStatus(e.target.value as Asset['status'])}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      <option value="active">Active</option><option value="maintenance">Maintenance</option><option value="retired">Retired</option>
                    </select></div>
                  <div><label className="block text-xs font-medium text-gray-500 mb-1">Criticality</label>
                    <select value={editCrit} onChange={e => setEditCrit(e.target.value as Asset['criticality'])}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      <option value="high">🔴 High</option><option value="medium">🟡 Medium</option><option value="low">🟢 Low</option>
                    </select></div>
                </div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                  <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div className="flex gap-3">
                  <button onClick={() => setEditing(false)}
                    className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5">
                    <X size={14} /> Cancel</button>
                  <button onClick={saveEdit}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-1.5">
                    <Check size={14} /> Save</button>
                </div>
              </div>
            ) : (
              <>
                {/* Health Score */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">Health Score</h3>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full
                      ${assetHealth >= 75 ? 'bg-green-100 text-green-700' : assetHealth >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>
                      {assetHealth >= 75 ? 'Good' : assetHealth >= 50 ? 'Fair' : 'Needs Attention'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-3xl font-bold ${assetHealth >= 75 ? 'text-green-600' : assetHealth >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {assetHealth}%
                    </span>
                    <div className="flex-1">
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${assetHealth >= 75 ? 'bg-green-500' : assetHealth >= 50 ? 'bg-yellow-500' : 'bg-red-400'}`}
                          style={{ width: `${assetHealth}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {assetHealth >= 75 ? 'Asset in good condition' : assetHealth >= 50 ? 'Monitor closely' : 'Action required'}
                      </p>
                    </div>
                  </div>
                </div>

              {/* Quick status change */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">Change Status</p>
                  <div className="flex gap-2">
                    {(Object.keys(statusConfig) as Asset['status'][]).map(s => (
                      <button key={s} onClick={() => updateAsset(asset.id, { status: s })}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-1
                          ${asset.status === s ? statusConfig[s].cls + ' border-transparent' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                        {statusConfig[s].label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info fields */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Asset Information</h3>
                  <div className="space-y-3">
                    {[
                      { icon: <MapPin size={15} className="text-blue-500" />,    label: 'Location',         value: asset.location },
                      { icon: <Tag size={15} className="text-blue-500" />,       label: 'Category',         value: asset.category },
                      { icon: <Hash size={15} className="text-blue-500" />,      label: 'Serial Number',    value: asset.serialNumber, mono: true },
                      { icon: <Package size={15} className="text-blue-500" />,   label: 'Model',            value: asset.model },
                      { icon: <Building2 size={15} className="text-blue-500" />, label: 'Manufacturer',     value: asset.manufacturer },
                      { icon: <Building2 size={15} className="text-blue-500" />, label: 'Vendor',           value: asset.vendorName },
                      { icon: <Phone size={15} className="text-blue-500" />,     label: 'Vendor Contact',   value: asset.vendorContact },
                      { icon: <DollarSign size={15} className="text-blue-500" />,label: 'Purchase Price',   value: asset.purchasePrice ? `$${asset.purchasePrice.toLocaleString()}` : undefined },
                      { icon: <Calendar size={15} className="text-blue-500" />,  label: 'Purchase Date',    value: asset.purchaseDate ? format(asset.purchaseDate, 'MMMM d, yyyy') : undefined },
                      { icon: <Calendar size={15} className="text-blue-500" />,  label: 'Install Date',     value: asset.installDate ? format(asset.installDate, 'MMMM d, yyyy') : undefined },
                      { icon: <ShieldCheck size={15} className={warrantyExpired ? 'text-red-500' : warrantySoon ? 'text-amber-500' : 'text-blue-500'} />, label: 'Warranty Expiry', value: asset.warrantyExpiry ? format(asset.warrantyExpiry, 'MMMM d, yyyy') : undefined },
                    ].filter(f => f.value).map(f => (
                      <div key={f.label} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">{f.icon}</div>
                        <div>
                          <p className="text-xs text-gray-400">{f.label}</p>
                          <p className={`text-sm font-medium ${f.mono ? 'font-mono text-gray-800' : warrantyExpired && f.label === 'Warranty Expiry' ? 'text-red-600' : warrantySoon && f.label === 'Warranty Expiry' ? 'text-amber-600' : 'text-gray-800'}`}>
                            {f.value}
                          </p>
                        </div>
                      </div>
                    ))}
                    {asset.nfcTagId && (
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Wifi size={15} className="text-blue-500" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">NFC Tag ID</p>
                          <p className="text-sm font-medium text-gray-800 font-mono">{asset.nfcTagId}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {asset.notes && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                    <p className="text-xs font-semibold text-amber-700 mb-1">Notes</p>
                    <p className="text-sm text-amber-800 leading-relaxed">{asset.notes}</p>
                  </div>
                )}
              </>
            )
          )}

          {/* ════ MAINTENANCE ════ */}
          {tab === 'maintenance' && (
            <>
              {/* Cost summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign size={16} className="text-blue-500" />
                    <span className="text-xs text-gray-500">Total Maintenance Cost</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">${totalCost.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-1">{asset.maintenanceHistory.length} records</p>
                </div>
                {repairVsReplace !== null && (
                  <div className={`rounded-xl border p-4 ${repairVsReplace >= 75 ? 'bg-red-50 border-red-200' : repairVsReplace >= 40 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp size={16} className={repairVsReplace >= 75 ? 'text-red-500' : repairVsReplace >= 40 ? 'text-yellow-500' : 'text-green-500'} />
                      <span className="text-xs text-gray-500">Repair vs Replace</span>
                    </div>
                    <p className={`text-2xl font-bold ${repairVsReplace >= 75 ? 'text-red-600' : repairVsReplace >= 40 ? 'text-yellow-600' : 'text-green-600'}`}>{repairVsReplace}%</p>
                    <p className="text-xs text-gray-500 mt-1">of purchase price spent on repairs</p>
                    {repairVsReplace >= 75 && <p className="text-xs text-red-600 font-medium mt-1">⚠ Consider replacement</p>}
                  </div>
                )}
              </div>

              {/* Maintenance type breakdown */}
              {asset.maintenanceHistory.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Breakdown by Type</h3>
                  <div className="space-y-2.5">
                    {(['pm', 'repair', 'inspection', 'replacement'] as MaintenanceRecord['type'][]).map(type => {
                      const recs = asset.maintenanceHistory.filter(r => r.type === type);
                      const cost = recs.reduce((s, r) => s + r.cost, 0);
                      const pct  = (recs.length / asset.maintenanceHistory.length) * 100;
                      const barCls = type === 'pm' ? 'bg-blue-400' : type === 'repair' ? 'bg-red-400' : type === 'inspection' ? 'bg-green-400' : 'bg-purple-400';
                      const lblCls = type === 'pm' ? 'text-blue-600' : type === 'repair' ? 'text-red-500' : type === 'inspection' ? 'text-green-600' : 'text-purple-600';
                      const label  = type === 'pm' ? 'PM' : type.charAt(0).toUpperCase() + type.slice(1);
                      return (
                        <div key={type} className="flex items-center gap-3">
                          <span className={`text-[11px] font-semibold min-w-[76px] capitalize ${lblCls}`}>{label}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-full rounded-full ${barCls}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-4 text-right flex-shrink-0">{recs.length}</span>
                          {cost > 0 && (
                            <span className="text-xs font-medium text-gray-600 w-16 text-right flex-shrink-0">${cost.toLocaleString()}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {asset.maintenanceHistory.some(r => r.downtimeHours) && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                      <Clock size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-500">Total downtime:</span>
                      <span className="text-xs font-semibold text-gray-700">
                        {asset.maintenanceHistory.reduce((s, r) => s + (r.downtimeHours ?? 0), 0)}h
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Monthly cost trend */}
              {monthlyCostData.some(d => d.cost > 0) && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Monthly Cost Trend</h3>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={monthlyCostData} barSize={24}>
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={44}
                        tickFormatter={v => (v as number) >= 1000 ? `$${((v as number)/1000).toFixed(0)}k` : `$${v}`} />
                      <Tooltip formatter={(v: number | undefined) => v != null ? [`$${v.toLocaleString()}`, 'Cost'] : ['—', 'Cost']} />
                      <Bar dataKey="cost" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Add record button */}
              <button onClick={() => setShowAddRecord(true)}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                <Plus size={16} /> Log Maintenance Record
              </button>

              {/* History */}
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {[...asset.maintenanceHistory].sort((a,b) => b.date.getTime() - a.date.getTime()).map(rec => (
                  <div key={rec.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${mtypeColor[rec.type]}`}>
                          {rec.type}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 leading-snug">{rec.description}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><Calendar size={11} />{format(rec.date, 'MMM d, yyyy')}</span>
                          <span className="flex items-center gap-1"><Clock size={11} />{differenceInDays(new Date(), rec.date)} days ago</span>
                          <span>{rec.technician}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        {rec.cost > 0
                          ? <p className="text-sm font-semibold text-gray-800">${rec.cost.toLocaleString()}</p>
                          : <p className="text-sm text-gray-400">—</p>
                        }
                      </div>
                    </div>
                  </div>
                ))}
                {asset.maintenanceHistory.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Wrench size={32} strokeWidth={1.5} className="mb-2" />
                    <p className="text-sm">No maintenance records yet</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ════ DOCUMENTS ════ */}
          {tab === 'documents' && (
            <>
              <button onClick={() => setShowUploadDoc(true)}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                <Plus size={16} /> Upload Document
              </button>
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {asset.assetDocuments.map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-xl flex-shrink-0">{docTypeIcon[doc.type] ?? '📄'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{doc.type} · Uploaded {format(doc.uploadedAt, 'MMM d, yyyy')}</p>
                    </div>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${doc.fileType === 'pdf' ? 'bg-red-50' : doc.fileType === 'doc' ? 'bg-blue-50' : 'bg-green-50'}`}>
                      <span className={`text-[10px] font-bold uppercase ${doc.fileType === 'pdf' ? 'text-red-500' : doc.fileType === 'doc' ? 'text-blue-500' : 'text-green-500'}`}>
                        {doc.fileType}
                      </span>
                    </div>
                  </div>
                ))}
                {asset.assetDocuments.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <FileText size={32} strokeWidth={1.5} className="mb-2" />
                    <p className="text-sm">No documents attached</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ════ TASKS ════ */}
          {tab === 'tasks' && (
            <>
              {/* Fix / Work Orders */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700">Work Orders (Fix)</h3>
                  <span className="text-xs text-gray-400">{linkedTasks.length} task{linkedTasks.length !== 1 ? 's' : ''}</span>
                </div>
                {linkedTasks.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-10 text-gray-400">
                    <Wrench size={28} strokeWidth={1.5} className="mb-2" />
                    <p className="text-sm">No linked Fix tasks</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                    {linkedTasks.map(task => (
                      <div key={task.id}
                        onClick={() => navigate(`/fix/task/${task.id}`)}
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusDot[task.status]}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-gray-400">{task.groupName}</span>
                            <span className="text-[10px] text-gray-300">·</span>
                            <span className="text-[10px] text-gray-400">{format(task.createdAt, 'MMM d')}</span>
                          </div>
                        </div>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize flex-shrink-0
                          ${task.priority === 'high' ? 'bg-red-50 text-red-600' : task.priority === 'medium' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}`}>
                          {task.priority}
                        </span>
                        <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* PPM / Planned Tasks */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700">Planned Maintenance (PPM)</h3>
                  <span className="text-xs text-gray-400">{linkedPlanned.length} schedule{linkedPlanned.length !== 1 ? 's' : ''}</span>
                </div>
                {linkedPlanned.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-10 text-gray-400">
                    <Calendar size={28} strokeWidth={1.5} className="mb-2" />
                    <p className="text-sm">No planned maintenance schedules</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                    {linkedPlanned.map(pt => (
                      <div key={pt.id}
                        onClick={() => navigate(`/plan/${pt.id}`)}
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${pt.enabled ? 'bg-blue-500' : 'bg-gray-300'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{pt.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-gray-400">{recurrenceLabel[pt.recurrence] ?? pt.recurrence}</span>
                            <span className="text-[10px] text-gray-300">·</span>
                            <span className="text-[10px] text-gray-400">{format(pt.scheduledAt, 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0
                          ${pt.enabled ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                          {pt.enabled ? 'Active' : 'Disabled'}
                        </span>
                        <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Create task shortcut */}
              <button
                onClick={() => navigate('/fix')}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                <Plus size={16} /> Create Work Order in Fix
              </button>
            </>
          )}

          {/* ════ PHOTOS ════ */}
          {tab === 'photos' && (
            <>
              <button
                onClick={() => {
                  const url = `https://picsum.photos/seed/${asset.id}-${Date.now()}/600/400`;
                  updateAsset(asset.id, { photos: [...(asset.photos ?? []), url] });
                }}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <Camera size={16} /> Add Photo
              </button>
              {asset.photos && asset.photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {asset.photos.map((url, i) => (
                    <div key={i} className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => updateAsset(asset.id, { photos: asset.photos!.filter((_, idx) => idx !== i) })}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Camera size={40} strokeWidth={1.5} className="mb-3" />
                  <p className="text-sm font-medium text-gray-500">No photos yet</p>
                  <p className="text-xs mt-1">Document the asset condition with photos</p>
                </div>
              )}
            </>
          )}

          {/* ════ QR / TAG ════ */}
          {tab === 'qrtag' && (
            <>
              {/* QR Code — real scannable */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center gap-4">
                <h3 className="text-sm font-semibold text-gray-700 self-start">QR Code</h3>
                <QRCodeCanvas
                  value={`${window.location.origin}/assets/${asset.id}`}
                  size={192}
                  onReady={handleQRReady}
                />
                <p className="text-sm font-mono text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">{asset.qrCode}</p>
                <p className="text-xs text-gray-400 text-center max-w-xs">
                  Scan this code to instantly access this asset's profile, log issues, or create work orders.
                </p>
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => qrCanvasRef.current && printQRCode(qrCanvasRef.current, asset.name)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                    <QrCode size={16} /> Print Label
                  </button>
                  <button
                    onClick={() => qrCanvasRef.current && downloadCanvasAsPng(qrCanvasRef.current, `qr-${asset.name}.png`)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
                    Download PNG
                  </button>
                </div>
              </div>

              {/* NFC Tag */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">NFC Smart Tag</h3>
                {asset.nfcTagId ? (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Wifi size={22} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Tag linked</p>
                      <p className="text-xs font-mono text-gray-500 mt-0.5">{asset.nfcTagId}</p>
                      <p className="text-xs text-gray-400 mt-1">Tap an NFC-enabled device to this tag to open the asset profile instantly.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-6 text-center">
                    <Wifi size={32} className="text-gray-200 mb-3" strokeWidth={1.5} />
                    <p className="text-sm text-gray-400 mb-3">No NFC tag linked to this asset</p>
                    <button onClick={() => setShowNfcInfo(true)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                      <Plus size={14} /> Link NFC Tag
                    </button>
                  </div>
                )}
              </div>

              {/* Scan instructions */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                <h4 className="text-xs font-semibold text-gray-600 mb-2">How to use</h4>
                <ul className="space-y-1.5 text-xs text-gray-500">
                  <li className="flex items-start gap-2"><span className="font-bold text-gray-400 flex-shrink-0">1.</span> Open the NEO app on your mobile device</li>
                  <li className="flex items-start gap-2"><span className="font-bold text-gray-400 flex-shrink-0">2.</span> Tap <strong>+</strong> → Scan QR or tap NFC tag</li>
                  <li className="flex items-start gap-2"><span className="font-bold text-gray-400 flex-shrink-0">3.</span> Instantly view this asset and create a work order or log a maintenance record</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Maintenance Record Modal */}
      {showAddRecord && (
        <AddMaintenanceModal
          assetId={asset.id}
          onClose={() => setShowAddRecord(false)}
          onSave={(rec) => {
            updateAsset(asset.id, {
              maintenanceHistory: [...asset.maintenanceHistory, rec],
            });
            setShowAddRecord(false);
          }}
        />
      )}

      {/* Upload Document Modal */}
      {showUploadDoc && (
        <UploadDocumentModal
          onClose={() => setShowUploadDoc(false)}
          onSave={doc => {
            updateAsset(asset.id, { assetDocuments: [...asset.assetDocuments, doc] });
            setShowUploadDoc(false);
          }}
        />
      )}

      {/* Print QR Modal */}
      {showPrintQR && <PrintQRModal asset={asset} onClose={() => setShowPrintQR(false)} />}

      {/* NFC Info Modal */}
      {showNfcInfo && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <Wifi size={36} className="text-blue-500 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-2">NFC Smart Tags</h3>
            <p className="text-sm text-gray-500 mb-5">
              Linking an NFC tag requires a physical NFC sticker/tag and an NFC-capable mobile device. In production, tap your phone to the tag to pair it with this asset — staff can then tap to open the asset profile instantly without scanning a QR code.
            </p>
            <button onClick={() => setShowNfcInfo(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-semibold">
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Report Issue Modal */}
      {showReportIssue && (
        <ReportIssueModal
          asset={asset}
          groups={groups}
          onClose={() => setShowReportIssue(false)}
          onSubmit={(title, description, groupId, priority) => {
            const group = groups.find(g => g.id === groupId);
            if (!group) return;
            addTask({
              id: `t${Date.now()}`,
              title,
              groupId: group.id,
              groupName: group.name,
              groupColor: group.color,
              status: 'open',
              priority,
              createdAt: new Date(),
              assignees: [],
              comments: [],
              assetId: asset.id,
              assetName: asset.name,
              description: description || undefined,
            });
          }}
        />
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-4 sm:items-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Delete Asset?</h3>
            <p className="text-sm text-gray-500 mb-6">"{asset.name}" will be permanently deleted.</p>
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

// ── Add Maintenance Record Modal ────────────────────────────
function AddMaintenanceModal({ assetId, onClose, onSave }: {
  assetId: string;
  onClose: () => void;
  onSave: (r: MaintenanceRecord) => void;
}) {
  const [type,     setType]     = useState<MaintenanceRecord['type']>('pm');
  const [desc,     setDesc]     = useState('');
  const [cost,     setCost]     = useState('');
  const [tech,     setTech]     = useState('');
  const [downtime, setDowntime] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim()) return;
    onSave({
      id: `mr-${assetId}-${Date.now()}`,
      date: new Date(), type,
      description: desc.trim(),
      cost: cost ? Number(cost) : 0,
      technician: tech.trim() || 'Unknown',
      downtimeHours: downtime ? Number(downtime) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Log Maintenance Record</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={type} onChange={e => setType(e.target.value as MaintenanceRecord['type'])}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="pm">Preventive Maintenance (PM)</option>
              <option value="repair">Repair</option>
              <option value="inspection">Inspection</option>
              <option value="replacement">Replacement</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} required rows={2}
              placeholder="Describe the work done…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost ($)</label>
              <input type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Technician</label>
              <input type="text" value={tech} onChange={e => setTech(e.target.value)} placeholder="Name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Downtime (h)</label>
              <input type="number" value={downtime} onChange={e => setDowntime(e.target.value)} placeholder="0" min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit"
              className="flex-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg py-2.5 text-sm font-medium">Save Record</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Upload Document Modal ────────────────────────────────────
function UploadDocumentModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (doc: AssetDocument) => void;
}) {
  const [name,     setName]     = useState('');
  const [docType,  setDocType]  = useState<AssetDocument['type']>('manual');
  const [fileType, setFileType] = useState<AssetDocument['fileType']>('pdf');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    // Auto-fill name if empty
    if (!name.trim()) {
      setName(file.name.replace(/\.[^.]+$/, ''));
    }
    // Auto-detect file type
    if (file.type === 'application/pdf') setFileType('pdf');
    else if (file.type.startsWith('image/')) setFileType('img');
    else setFileType('doc');

    const reader = new FileReader();
    reader.onload = ev => setFileDataUrl(ev.target!.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      id: `doc-${Date.now()}`,
      name: name.trim(),
      type: docType,
      fileType,
      uploadedAt: new Date(),
      fileDataUrl: fileDataUrl ?? undefined,
    } as AssetDocument);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Upload Document</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required autoFocus
              placeholder="e.g. AC Unit Manual 2023"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
              <select value={docType} onChange={e => setDocType(e.target.value as AssetDocument['type'])}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="manual">📖 Manual</option>
                <option value="warranty">🛡️ Warranty</option>
                <option value="certificate">🏅 Certificate</option>
                <option value="invoice">💵 Invoice</option>
                <option value="inspection">🔍 Inspection</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File Type</label>
              <select value={fileType} onChange={e => setFileType(e.target.value as AssetDocument['fileType'])}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="pdf">PDF</option>
                <option value="doc">DOC</option>
                <option value="img">Image</option>
              </select>
            </div>
          </div>

          {/* Real file picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
            {selectedFile ? (
              <div className="flex items-center gap-3 border border-gray-200 rounded-xl p-3 bg-gray-50">
                <FileText size={20} className="text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <button type="button" onClick={() => { setSelectedFile(null); setFileDataUrl(null); }}
                  className="text-gray-400 hover:text-red-500"><X size={14} /></button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 hover:border-blue-300 rounded-xl p-6 flex flex-col items-center text-gray-400 text-sm transition-colors hover:bg-blue-50/30"
              >
                <FileText size={28} strokeWidth={1.5} className="mb-2" />
                <p>Click to select a file</p>
                <p className="text-xs mt-0.5 text-gray-300">PDF, DOC, or Image</p>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit"
              className="flex-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg py-2.5 text-sm font-medium">Upload</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Report Issue Modal ───────────────────────────────────────
function ReportIssueModal({ asset, groups, onClose, onSubmit }: {
  asset: Asset;
  groups: Group[];
  onClose: () => void;
  onSubmit: (title: string, description: string, groupId: string, priority: Priority) => void;
}) {
  const [title,    setTitle]    = useState(`Issue with ${asset.name}`);
  const [desc,     setDesc]     = useState('');
  const [groupId,  setGroupId]  = useState(groups[0]?.id ?? '');
  const [priority, setPriority] = useState<Priority>('medium');

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flag size={18} className="text-orange-500" />
            <h3 className="text-base font-semibold text-gray-900">Report Issue</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Asset badge */}
        <div className="flex items-center gap-2 bg-orange-50 rounded-xl px-3 py-2.5 mb-4 border border-orange-100">
          <span className="text-xl">{categoryIcon[asset.category] ?? '📦'}</span>
          <div>
            <p className="text-xs font-semibold text-orange-800">{asset.name}</p>
            <p className="text-xs text-orange-500">{asset.location}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Issue Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} autoFocus
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Description (optional)</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
              placeholder="Describe the issue…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Assign to Group</label>
            <select value={groupId} onChange={e => setGroupId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
              {groups.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Priority</label>
            <div className="flex gap-2">
              {(['high', 'medium', 'low'] as Priority[]).map(p => (
                <button key={p} onClick={() => setPriority(p)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-colors capitalize ${
                    priority === p
                      ? p === 'high' ? 'bg-red-50 border-red-500 text-red-700'
                        : p === 'medium' ? 'bg-yellow-50 border-yellow-500 text-yellow-700'
                        : 'bg-green-50 border-green-500 text-green-700'
                      : 'border-gray-100 text-gray-400 hover:border-gray-300'
                  }`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => {
              if (title.trim() && groupId) {
                onSubmit(title.trim(), desc.trim(), groupId, priority);
                onClose();
              }
            }}
            disabled={!title.trim() || !groupId}
            className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold disabled:opacity-40 hover:bg-orange-600">
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Print QR Label Modal ────────────────────────────────────
function PrintQRModal({ asset, onClose }: { asset: Asset; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">QR Label Preview</h3>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><X size={18} /></button>
        </div>
        <div className="border-2 border-gray-200 rounded-xl p-5 mb-4 flex flex-col items-center gap-3 bg-white">
          <div className="w-36 h-36">
            <svg viewBox="0 0 100 100" className="w-full h-full text-gray-800">
              <rect x="5"  y="5"  width="28" height="28" rx="3" fill="none" stroke="currentColor" strokeWidth="5"/>
              <rect x="12" y="12" width="14" height="14" rx="1" fill="currentColor"/>
              <rect x="67" y="5"  width="28" height="28" rx="3" fill="none" stroke="currentColor" strokeWidth="5"/>
              <rect x="74" y="12" width="14" height="14" rx="1" fill="currentColor"/>
              <rect x="5"  y="67" width="28" height="28" rx="3" fill="none" stroke="currentColor" strokeWidth="5"/>
              <rect x="12" y="74" width="14" height="14" rx="1" fill="currentColor"/>
              {[42,49,56,63].map(x => [42,49,56,63].map(y => (
                Math.sin(x * y) > 0 && <rect key={`${x}${y}`} x={x} y={y} width="6" height="6" fill="currentColor"/>
              )))}
              <rect x="42" y="5"  width="6" height="6" fill="currentColor"/>
              <rect x="56" y="5"  width="6" height="6" fill="currentColor"/>
              <rect x="5"  y="42" width="6" height="6" fill="currentColor"/>
              <rect x="5"  y="56" width="6" height="6" fill="currentColor"/>
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-gray-900">{asset.name}</p>
            <p className="text-xs text-gray-500">{asset.location}</p>
            <p className="text-[10px] font-mono text-gray-400 mt-1">{asset.qrCode}</p>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium"
        >
          🖨 Print Label
        </button>
      </div>
    </div>
  );
}
