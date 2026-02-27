import { useState } from 'react';
import {
  ChevronLeft, ChevronRight, Copy, Check, Plus, X,
  Bell, Users, Tag, Palette, CreditCard,
  Link2, HelpCircle, Info, Globe, Key,
  Moon, Sun, Monitor, Mail, Smartphone, Volume2,
  Shield, Edit2, Camera, Zap, Building2, Database,
  CheckSquare, Wrench, Calendar, Package, AlertTriangle,
  Clock, LogOut, Fingerprint, Laptop, QrCode, MessageSquare,
  BarChart2, MapPin, Hash, UserPlus, Trash2, Home,
} from 'lucide-react';
import { currentUser } from '../data/mockData';
import { useNotifications } from '../context/NotificationContext';

/* ── Section types ── */
type Section =
  | null
  | 'account'
  | 'notifications'
  | 'groups'
  | 'tags'
  | 'appearance'
  | 'subscription'
  | 'integrations'
  | 'security'
  | 'workspace'
  | 'about'
  | 'team';

/* ── Role helpers ── */
type AccountRole = 'account_admin' | 'group_admin' | 'user' | 'family';
const ROLE_LABELS: Record<AccountRole, string> = {
  account_admin: 'Account Admin',
  group_admin:   'Group Admin',
  user:          'User',
  family:        'Family',
};
const ROLE_COLORS: Record<AccountRole, string> = {
  account_admin: 'bg-blue-100 text-blue-700',
  group_admin:   'bg-purple-100 text-purple-700',
  user:          'bg-gray-100 text-gray-700',
  family:        'bg-pink-100 text-pink-700',
};
function RoleBadge({ role }: { role: AccountRole }) {
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_COLORS[role]}`}>
      {ROLE_LABELS[role]}
    </span>
  );
}

/* ── Tag categories ── */
type TagCategory = 'location' | 'equipment' | 'category';
const DEFAULT_TAGS: Record<TagCategory, string[]> = {
  location:  ['Lobby', 'Pool', 'Gym', 'Restaurant', 'Guest Room', 'Corridor', 'Parking', 'Garden', 'Rooftop', 'Basement'],
  equipment: ['HVAC/AC', 'Generator', 'Elevator', 'Fire System', 'Pool Pump', 'Boiler', 'CCTV', 'Chiller', 'AHU'],
  category:  ['Repair', 'Inspection', 'Cleaning', 'Installation', 'Testing', 'PPM', 'Emergency', 'Compliance'],
};

/* ── Plan modules ── */
const PLAN_MODULES = [
  { key: 'fix',    name: 'Fix',    icon: <Wrench    size={20} className="text-blue-600"   />, desc: 'Task management & photo documentation',      active: true  },
  { key: 'plan',   name: 'Plan',   icon: <Calendar  size={20} className="text-purple-600" />, desc: 'Preventive maintenance & PPM scheduling',    active: true  },
  { key: 'track',  name: 'Track',  icon: <Package   size={20} className="text-amber-600"  />, desc: 'Asset registry & maintenance history',       active: true  },
  { key: 'comply', name: 'Comply', icon: <Shield    size={20} className="text-green-600"  />, desc: 'Compliance checklists & inspections',        active: true  },
];

/* ── PMS Integrations ── */
const PMS_LIST = [
  { name: 'Oracle Opera Cloud', icon: '🏨', connected: false, desc: 'Two-way room status & housekeeping sync' },
  { name: 'Guestline',          icon: '🏩', connected: false, desc: 'Property management integration' },
  { name: 'Cloudbeds',          icon: '☁️', connected: false, desc: 'Real-time room occupancy sync' },
  { name: 'Hotsoft',            icon: '🖥️', connected: false, desc: 'Front-desk & housekeeping integration' },
];

/* ── Shared UI helpers ── */
function SectionHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
      <button onClick={onBack} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-600">
        <ChevronLeft size={20} />
      </button>
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
    </div>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  onClick,
  danger,
  last,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onClick?: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${onClick ? 'hover:bg-gray-50 active:bg-gray-100' : ''} ${!last ? 'border-b border-gray-100' : ''}`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${danger ? 'bg-red-100' : 'bg-gray-100'}`}>
        <span className={danger ? 'text-red-600' : 'text-gray-600'}>{icon}</span>
      </div>
      <span className={`flex-1 text-sm font-medium ${danger ? 'text-red-600' : 'text-gray-800'}`}>{label}</span>
      {value && <span className="text-xs text-gray-400 mr-1">{value}</span>}
      {onClick && <ChevronRight size={15} className={`flex-shrink-0 ${danger ? 'text-red-300' : 'text-gray-300'}`} />}
    </Wrapper>
  );
}

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-4 mb-1">{title}</p>
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
        {children}
      </div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-blue-600' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  );
}

/* ── Account Section ── */
function AccountSection({ onBack }: { onBack: () => void }) {
  const { teamMembers, updateUser } = useNotifications();
  const me = teamMembers.find(u => u.id === currentUser.id) ?? currentUser;

  const [name,  setName]  = useState(me.name);
  const [email, setEmail] = useState(me.email);
  const [phone, setPhone] = useState(me.phone ?? '');
  const [role,  setRole]  = useState(me.role);
  const [saved, setSaved] = useState(false);

  const save = () => {
    updateUser(me.id, { name: name.trim() || me.name, email: email.trim() || me.email, phone: phone.trim() || undefined, role: role.trim() || me.role });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="h-full flex flex-col">
      <SectionHeader title="My Account" onBack={onBack} />
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
        {/* Avatar */}
        <div className="flex flex-col items-center py-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold">
              {me.name.charAt(0).toUpperCase()}
            </div>
            <button className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white border-2 border-white hover:bg-blue-700">
              <Camera size={13} />
            </button>
          </div>
          <p className="mt-2 text-sm font-semibold text-gray-900">{me.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Shield size={12} className="text-blue-500" />
            <p className="text-xs text-blue-600">{me.accountRole === 'account_admin' ? 'Account Admin' : me.accountRole === 'group_admin' ? 'Group Admin' : 'User'}</p>
          </div>
        </div>

        {/* Edit fields */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Profile Information</h3>
          {[
            { label: 'Full Name',     value: name,  set: setName,  type: 'text'  },
            { label: 'Email Address', value: email, set: setEmail, type: 'email' },
            { label: 'Phone Number',  value: phone, set: setPhone, type: 'tel'   },
            { label: 'Job Title',     value: role,  set: setRole,  type: 'text'  },
          ].map(f => (
            <div key={f.label}>
              <label className="text-xs font-semibold text-gray-500 block mb-1">{f.label}</label>
              <input
                type={f.type}
                value={f.value}
                onChange={e => f.set(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          <button
            onClick={save}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center justify-center gap-2"
          >
            {saved ? <><Check size={15} /> Saved!</> : 'Save Changes'}
          </button>
        </div>

        {/* Status */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">My Status</h3>
          <div className="flex gap-2">
            {(['online', 'away', 'offline'] as const).map(s => {
              const dotColor = s === 'online' ? 'bg-green-400' : s === 'away' ? 'bg-yellow-400' : 'bg-gray-300';
              const active   = me.status === s;
              return (
                <button key={s} onClick={() => updateUser(me.id, { status: s })}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border-2 transition-colors capitalize ${active ? (s === 'online' ? 'border-green-400 bg-green-50 text-green-700' : s === 'away' ? 'border-yellow-400 bg-yellow-50 text-yellow-700' : 'border-gray-300 bg-gray-100 text-gray-600') : 'border-gray-100 text-gray-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Change password */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Change Password</h3>
          <input type="password" placeholder="Current password" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="password" placeholder="New password"     className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="password" placeholder="Confirm password" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold">Update Password</button>
        </div>
      </div>
    </div>
  );
}

/* ── Notifications Section ── */
function NotificationsSection({ onBack }: { onBack: () => void }) {
  const [prefs, setPrefs] = useState({
    push:       true,
    email:      true,
    sound:      true,
    newTask:    true,
    taskUpdate: true,
    comment:    true,
    digest:     true,
    mentioned:  true,
    quietHours: false,
  });
  const [quietFrom, setQuietFrom] = useState('22:00');
  const [quietTo,   setQuietTo]   = useState('07:00');
  const [browserPermission, setBrowserPermission] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const toggle = (key: keyof typeof prefs) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const requestBrowserPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setBrowserPermission(result);
  };

  return (
    <div className="h-full flex flex-col">
      <SectionHeader title="Notifications" onBack={onBack} />
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">

        {/* Browser Push Notifications */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Browser Notifications</p>
          </div>
          <div className="px-4 py-4">
            {browserPermission === 'granted' ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
                  <Bell size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">Browser notifications enabled</p>
                  <p className="text-xs text-gray-400">You'll receive desktop alerts for new notifications</p>
                </div>
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">Active</span>
              </div>
            ) : browserPermission === 'denied' ? (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-600 flex-shrink-0">
                  <Bell size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">Notifications blocked</p>
                  <p className="text-xs text-gray-400">Enable notifications in your browser settings to receive alerts</p>
                </div>
              </div>
            ) : browserPermission === 'unsupported' ? (
              <p className="text-sm text-gray-400">Browser notifications not supported on this device.</p>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                  <Bell size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">Enable browser notifications</p>
                  <p className="text-xs text-gray-400">Get desktop alerts when new tasks or comments arrive</p>
                </div>
                <button
                  onClick={requestBrowserPermission}
                  className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg flex-shrink-0"
                >
                  Enable
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Channels */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Channels</p>
          </div>
          {[
            { key: 'push',  icon: <Smartphone size={16} />, label: 'Push Notifications', desc: 'Alerts on your device' },
            { key: 'email', icon: <Mail       size={16} />, label: 'Email Notifications', desc: 'Sent to your email' },
            { key: 'sound', icon: <Volume2    size={16} />, label: 'Notification Sound',  desc: 'Play sound on alert' },
          ].map(({ key, icon, label, desc }) => (
            <div key={key} className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 last:border-b-0">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">{icon}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <Toggle value={prefs[key as keyof typeof prefs]} onChange={() => toggle(key as keyof typeof prefs)} />
            </div>
          ))}
        </div>

        {/* Quiet Hours */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
              <Clock size={16} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">Quiet Hours (Do Not Disturb)</p>
              <p className="text-xs text-gray-400">Silence notifications during set hours</p>
            </div>
            <Toggle value={prefs.quietHours} onChange={() => toggle('quietHours')} />
          </div>
          {prefs.quietHours && (
            <div className="px-4 py-3 bg-indigo-50/50 flex items-center gap-3">
              <Clock size={14} className="text-indigo-400 flex-shrink-0" />
              <div className="flex items-center gap-2 flex-1">
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">From</p>
                  <input
                    type="time"
                    value={quietFrom}
                    onChange={e => setQuietFrom(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                  />
                </div>
                <span className="text-gray-400 mt-4">→</span>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">To</p>
                  <input
                    type="time"
                    value={quietTo}
                    onChange={e => setQuietTo(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Events */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Events</p>
          </div>
          {[
            { key: 'newTask',    label: 'Task Assigned to Me',   desc: 'When a task is assigned to you' },
            { key: 'taskUpdate', label: 'Task Updated',          desc: 'When a task you follow is changed' },
            { key: 'comment',   label: 'New Comment',           desc: 'When someone comments on your task' },
            { key: 'mentioned', label: 'Mentioned',             desc: 'When someone @mentions you' },
            { key: 'digest',    label: 'Daily Summary',         desc: 'Morning digest of all activities' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 last:border-b-0">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <Toggle value={prefs[key as keyof typeof prefs]} onChange={() => toggle(key as keyof typeof prefs)} />
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 text-center px-4">
          Per-group notification settings are managed in the Groups section.
        </p>
      </div>
    </div>
  );
}

/* ── Groups Section ── */
function GroupsSection({ onBack }: { onBack: () => void }) {
  const { groups, updateGroup } = useNotifications();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="h-full flex flex-col">
      <SectionHeader title="Group Settings" onBack={onBack} />
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-2">
        <p className="text-xs text-gray-400 px-1 mb-3">
          Toggle notifications per group. Group Admins can further configure tags and traffic light labels.
        </p>
        {groups.map(g => (
          <div key={g.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* Group row */}
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: g.color + '20' }}>
                {g.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{g.name}</p>
                <p className="text-xs text-gray-400">{g.memberIds.length} members</p>
              </div>
              <Toggle
                value={g.notificationsOn}
                onChange={v => updateGroup(g.id, { notificationsOn: v })}
              />
              <button
                onClick={() => setExpanded(expanded === g.id ? null : g.id)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 ml-1"
              >
                <ChevronRight size={14} className={`transition-transform ${expanded === g.id ? 'rotate-90' : ''}`} />
              </button>
            </div>

            {/* Expanded panel */}
            {expanded === g.id && (
              <div className="border-t border-gray-100 bg-gray-50">
                {/* Approval & daily summary toggles */}
                <div className="px-4 py-3 space-y-2 border-b border-gray-100">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Group Settings</p>
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-800">Requires Approval</p>
                      <p className="text-[11px] text-gray-400">Tasks must be approved before closing</p>
                    </div>
                    <Toggle
                      value={g.requiresApproval ?? false}
                      onChange={v => updateGroup(g.id, { requiresApproval: v })}
                    />
                  </div>
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-800">Daily Summary Email</p>
                      <p className="text-[11px] text-gray-400">Receive morning digest for this group</p>
                    </div>
                    <Toggle
                      value={g.dailySummary ?? false}
                      onChange={v => updateGroup(g.id, { dailySummary: v })}
                    />
                  </div>
                </div>
                {/* Traffic light labels */}
                <div className="px-4 py-3 space-y-2">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Traffic Light Labels</p>
                  {[
                    { key: 'open',       label: 'Open (Red)',           placeholder: 'e.g. New / Reported',     defaultVal: 'Open' },
                    { key: 'inProgress', label: 'In Progress (Yellow)', placeholder: 'e.g. Assigned / Pending', defaultVal: 'In Progress' },
                    { key: 'done',       label: 'Done (Green)',         placeholder: 'e.g. Completed / Closed', defaultVal: 'Done' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full flex-shrink-0 ${item.key === 'open' ? 'bg-red-500' : item.key === 'inProgress' ? 'bg-yellow-400' : 'bg-green-500'}`} />
                      <input
                        type="text"
                        defaultValue={item.defaultVal}
                        placeholder={item.placeholder}
                        className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  ))}
                  <p className="text-[10px] text-gray-400 pt-1">
                    Labels are shown to members when creating or updating tasks in this group.
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Tags Section ── */
function TagsSection({ onBack }: { onBack: () => void }) {
  const [tags, setTags] = useState<Record<TagCategory, string[]>>(DEFAULT_TAGS);
  const [newTag, setNewTag] = useState<Partial<Record<TagCategory, string>>>({});
  const [adding, setAdding] = useState<TagCategory | null>(null);

  const addTag = (cat: TagCategory) => {
    const val = (newTag[cat] ?? '').trim();
    if (!val || tags[cat].includes(val)) return;
    setTags(t => ({ ...t, [cat]: [...t[cat], val] }));
    setNewTag(n => ({ ...n, [cat]: '' }));
    setAdding(null);
  };

  const removeTag = (cat: TagCategory, tag: string) =>
    setTags(t => ({ ...t, [cat]: t[cat].filter(v => v !== tag) }));

  const catConfig: { key: TagCategory; label: string; icon: string; color: string }[] = [
    { key: 'location',  label: 'Location Tags',  icon: '📍', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { key: 'equipment', label: 'Equipment Tags',  icon: '⚙️', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { key: 'category',  label: 'Category Tags',   icon: '🏷️', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  ];

  return (
    <div className="h-full flex flex-col">
      <SectionHeader title="Tags" onBack={onBack} />
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
        <p className="text-xs text-gray-400 px-1">
          Tags help categorize tasks by location, equipment, and type. Use the # icon when creating tasks.
        </p>
        {catConfig.map(({ key, label, icon, color }) => (
          <div key={key} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{icon}</span>
                <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
                <span className="text-[11px] text-gray-400">({tags[key].length})</span>
              </div>
              <button
                onClick={() => setAdding(adding === key ? null : key)}
                className="flex items-center gap-1 text-xs text-blue-600 font-semibold hover:text-blue-700"
              >
                <Plus size={13} /> Add
              </button>
            </div>

            {/* Add input */}
            {adding === key && (
              <div className="flex gap-2 mb-3">
                <input
                  autoFocus
                  type="text"
                  value={newTag[key] ?? ''}
                  onChange={e => setNewTag(n => ({ ...n, [key]: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') addTag(key); if (e.key === 'Escape') setAdding(null); }}
                  placeholder="New tag name…"
                  className="flex-1 border border-blue-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={() => addTag(key)} className="px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
                  Add
                </button>
              </div>
            )}

            {/* Tag chips */}
            <div className="flex flex-wrap gap-2">
              {tags[key].map(tag => (
                <span
                  key={tag}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${color}`}
                >
                  {tag}
                  <button onClick={() => removeTag(key, tag)} className="text-current opacity-60 hover:opacity-100">
                    <X size={11} />
                  </button>
                </span>
              ))}
              {tags[key].length === 0 && (
                <p className="text-xs text-gray-400">No tags yet. Click Add to create one.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Appearance Section ── */
function AppearanceSection({ onBack }: { onBack: () => void }) {
  const [language,   setLanguage]   = useState('English');
  const [theme,      setTheme]      = useState<'light' | 'dark' | 'system'>('light');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [timezone,   setTimezone]   = useState('Asia/Dubai (UTC+4)');

  const LANGUAGES = ['English', 'Arabic (عربي)', 'Russian (Русский)', 'Spanish (Español)', 'French (Français)'];
  const TIMEZONES = ['Asia/Dubai (UTC+4)', 'Asia/Riyadh (UTC+3)', 'Europe/London (UTC+0)', 'America/New_York (UTC-5)', 'Asia/Singapore (UTC+8)'];
  const DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];

  return (
    <div className="h-full flex flex-col">
      <SectionHeader title="Appearance" onBack={onBack} />
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
        {/* Theme */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Theme</h3>
          <div className="flex gap-2">
            {([
              { key: 'light' as const, icon: <Sun    size={16} />, label: 'Light'  },
              { key: 'dark'  as const, icon: <Moon   size={16} />, label: 'Dark'   },
              { key: 'system'as const, icon: <Monitor size={16}/>, label: 'System' },
            ]).map(t => (
              <button
                key={t.key}
                onClick={() => setTheme(t.key)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-semibold transition-colors ${theme === t.key ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-500 hover:border-gray-300'}`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
          {theme === 'dark' && (
            <p className="text-[11px] text-amber-600 mt-2 bg-amber-50 px-3 py-2 rounded-lg">
              Dark mode is coming soon. Light mode is currently active.
            </p>
          )}
        </div>

        {/* Language */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Language</h3>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {LANGUAGES.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>

        {/* Date & Time */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Date & Time</h3>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">Date Format</label>
            <select
              value={dateFormat}
              onChange={e => setDateFormat(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {DATE_FORMATS.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">Timezone</label>
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {TIMEZONES.map(tz => <option key={tz}>{tz}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Subscription Section ── */
function SubscriptionSection({ onBack }: { onBack: () => void }) {
  return (
    <div className="h-full flex flex-col">
      <SectionHeader title="Subscription & Billing" onBack={onBack} />
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
        {/* Plan header */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold opacity-70 uppercase tracking-wider mb-1">Current Plan</p>
              <h3 className="text-2xl font-bold">Professional</h3>
              <p className="text-sm opacity-80 mt-1">All 4 modules active · Unlimited users</p>
            </div>
            <span className="text-xs px-2.5 py-1 bg-white/20 rounded-full font-semibold">Annual</span>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20 flex justify-between text-sm">
            <span className="opacity-70">Next renewal</span>
            <span className="font-semibold">March 1, 2027</span>
          </div>
        </div>

        {/* Usage stats */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Usage</h3>
          {[
            { label: 'Active Users',    used: 8, total: 25,    unit: 'users',  color: 'bg-blue-500' },
            { label: 'Storage Used',    used: 2.4, total: 10,  unit: 'GB',     color: 'bg-purple-500' },
            { label: 'Tasks This Month',used: 143, total: 500, unit: 'tasks',  color: 'bg-green-500' },
          ].map(({ label, used, total, unit, color }) => {
            const pct = Math.round(used / total * 100);
            return (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-700">{label}</span>
                  <span className="text-gray-400">{used} / {total} {unit}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5 text-right">{pct}% used</p>
              </div>
            );
          })}
        </div>

        {/* Modules */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Active Modules</h3>
          <div className="grid grid-cols-2 gap-3">
            {PLAN_MODULES.map(m => (
              <div key={m.key} className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex-shrink-0 mt-0.5">{m.icon}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                    {m.active && <Check size={12} className="text-green-600 flex-shrink-0" />}
                  </div>
                  <p className="text-[11px] text-gray-400 leading-tight">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Billing info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Billing Details</h3>
          <div className="flex justify-between text-sm py-1 border-b border-gray-100">
            <span className="text-gray-500">Billing email</span>
            <span className="text-gray-800 font-medium">alturkifamily2030@gmail.com</span>
          </div>
          <div className="flex justify-between text-sm py-1 border-b border-gray-100">
            <span className="text-gray-500">Payment method</span>
            <span className="text-gray-800 font-medium">•••• 4242</span>
          </div>
          <div className="flex justify-between text-sm py-1">
            <span className="text-gray-500">Billing cycle</span>
            <span className="text-gray-800 font-medium">Annual · Auto-renew</span>
          </div>
        </div>

        <button className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
          Manage Billing
        </button>
      </div>
    </div>
  );
}

/* ── Integrations Section ── */
function IntegrationsSection({ onBack }: { onBack: () => void }) {
  const FULL_KEY = 'sk-neo-a4f2e8b1c9d3e7f2a81c4b9d6e3f0a7f2';
  const [showKey, setShowKey]   = useState(false);
  const [copied, setCopied]     = useState(false);
  const [infoModal, setInfoModal] = useState<string | null>(null);

  const copyKey = () => {
    navigator.clipboard.writeText(FULL_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maskedKey = FULL_KEY.slice(0, 10) + '••••••••••••••••••••' + FULL_KEY.slice(-4);

  return (
    <div className="h-full flex flex-col">
      <SectionHeader title="Integrations" onBack={onBack} />
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">

        {/* API Key */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Key size={16} className="text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">API Access</h3>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Use your API key to connect NEO with external systems, IoT devices, and analytics platforms.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-2 mb-3">
            <code className="flex-1 text-xs font-mono text-gray-700 break-all">
              {showKey ? FULL_KEY : maskedKey}
            </code>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowKey(v => !v)}
              className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              {showKey ? 'Hide Key' : 'Show Key'}
            </button>
            <button
              onClick={copyKey}
              className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1.5"
            >
              {copied ? <><Check size={13} className="text-green-600" /> Copied!</> : <><Copy size={13} /> Copy</>}
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 text-center">
            Keep this key secret. <span className="text-red-500 cursor-pointer hover:underline">Regenerate</span> if compromised.
          </p>
        </div>

        {/* PMS Integrations */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Building2 size={16} className="text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">Property Management Systems</h3>
          </div>
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-3">
            PMS integrations require server-side setup with your IT team. Contact support@neo.app to enable.
          </p>
          <div className="space-y-2">
            {PMS_LIST.map(pms => (
              <div key={pms.name} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-b-0">
                <span className="text-2xl flex-shrink-0">{pms.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{pms.name}</p>
                  <p className="text-xs text-gray-400 truncate">{pms.desc}</p>
                </div>
                <button
                  onClick={() => setInfoModal(`${pms.name} integration requires server-side OAuth configuration. Please contact your NEO account manager to set up this integration.`)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 font-semibold hover:bg-blue-50 flex-shrink-0"
                >
                  Connect
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Messaging integrations */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={16} className="text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">Messaging & Collaboration</h3>
          </div>
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-3">
            Messaging integrations require a webhook URL and server-side configuration. Contact support to enable.
          </p>
          <div className="space-y-2">
            {[
              { name: 'Slack',            icon: '💬', desc: 'Send task alerts to Slack channels',   connected: false, color: 'text-purple-600 border-purple-200 hover:bg-purple-50' },
              { name: 'Microsoft Teams',  icon: '🟦', desc: 'Post notifications to Teams channels', connected: false, color: 'text-blue-600 border-blue-200 hover:bg-blue-50' },
              { name: 'WhatsApp Business',icon: '📱', desc: 'Send task updates via WhatsApp',       connected: false, color: 'text-green-600 border-green-200 hover:bg-green-50' },
            ].map(item => (
              <div key={item.name} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-b-0">
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-400 truncate">{item.desc}</p>
                </div>
                <button
                  onClick={() => setInfoModal(`${item.name} integration requires a webhook URL configured by your IT administrator. Contact support@neo.app to get started.`)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-semibold flex-shrink-0 ${item.color}`}
                >
                  Connect
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Info Modal */}
        {infoModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setInfoModal(null)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Info size={20} className="text-blue-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">Integration Info</h3>
              </div>
              <p className="text-sm text-gray-600 mb-5">{infoModal}</p>
              <button
                onClick={() => setInfoModal(null)}
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {/* IoT */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">IoT & Smart Building</h3>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-2xl">⚡</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Acutrace Energy</p>
              <p className="text-xs text-gray-400">Auto-create tasks from energy threshold alerts</p>
            </div>
            <span className="text-[10px] px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-bold flex-shrink-0">Soon</span>
          </div>
        </div>

        {/* Webhooks */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Database size={16} className="text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">Webhooks</h3>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Receive real-time event notifications to your endpoints when tasks change.
          </p>
          <button className="w-full py-2.5 rounded-xl border border-dashed border-gray-300 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
            <Plus size={15} /> Add Webhook Endpoint
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Workspace Section ── */
function WorkspaceSection({ onBack }: { onBack: () => void }) {
  const [orgName,    setOrgName]    = useState('Grand Hyatt Dubai');
  const [orgEmail,   setOrgEmail]   = useState('ops@grandhyatt.ae');
  const [orgPhone,   setOrgPhone]   = useState('+971 4 317 1234');
  const [orgAddress, setOrgAddress] = useState('Sheikh Zayed Road, Dubai');
  const [industry,   setIndustry]   = useState('Hospitality');
  const [saved,      setSaved]      = useState(false);

  const INDUSTRIES = ['Hospitality', 'Facility Management', 'Healthcare', 'Education', 'Retail', 'Manufacturing', 'Real Estate', 'Other'];

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="h-full flex flex-col">
      <SectionHeader title="Workspace" onBack={onBack} />
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">

        {/* Logo */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-3xl font-bold shadow">
            GH
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800">Company Logo</p>
            <p className="text-xs text-gray-400 mt-0.5">Shown on reports and exports</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50">
            <Camera size={13} /> Upload Logo
          </button>
        </div>

        {/* Organization info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Organization Details</h3>
          {[
            { label: 'Organization Name', value: orgName,    set: setOrgName,    type: 'text'  },
            { label: 'Contact Email',     value: orgEmail,   set: setOrgEmail,   type: 'email' },
            { label: 'Contact Phone',     value: orgPhone,   set: setOrgPhone,   type: 'tel'   },
            { label: 'Address',           value: orgAddress, set: setOrgAddress, type: 'text'  },
          ].map(f => (
            <div key={f.label}>
              <label className="text-xs font-semibold text-gray-500 block mb-1">{f.label}</label>
              <input
                type={f.type}
                value={f.value}
                onChange={e => f.set(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Industry</label>
            <select
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
          <button
            onClick={save}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center justify-center gap-2"
          >
            {saved ? <><Check size={15} /> Saved!</> : 'Save Changes'}
          </button>
        </div>

        {/* QR / NFC asset tagging */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <QrCode size={16} className="text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">Asset Tagging (QR / NFC)</h3>
          </div>
          <p className="text-xs text-gray-400">
            Print QR codes or program NFC tags to instantly link physical assets to their digital records in Track.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <QrCode size={24} className="text-blue-600" />
              <span className="text-xs font-semibold text-gray-700">Print QR Codes</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors">
              <span className="text-2xl">📡</span>
              <span className="text-xs font-semibold text-gray-700">Configure NFC</span>
            </button>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 mt-1">
            <Hash size={16} className="text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-700">Tag Prefix</p>
              <p className="text-[11px] text-gray-400">Used in generated QR codes</p>
            </div>
            <input
              type="text"
              defaultValue="NEO-"
              className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
            />
          </div>
        </div>

        {/* Location / property */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={16} className="text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">Properties</h3>
          </div>
          <p className="text-xs text-gray-400">Add multiple properties or sites managed under this workspace.</p>
          {[
            { name: 'Grand Hyatt Dubai – Main Tower', floors: 37 },
            { name: 'Grand Hyatt Dubai – Residences', floors: 12 },
          ].map(prop => (
            <div key={prop.name} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-b-0">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                <Building2 size={16} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{prop.name}</p>
                <p className="text-xs text-gray-400">{prop.floors} floors</p>
              </div>
              <ChevronRight size={14} className="text-gray-300" />
            </div>
          ))}
          <button className="w-full py-2 rounded-xl border border-dashed border-gray-300 text-xs font-semibold text-gray-500 hover:border-blue-400 hover:text-blue-600 flex items-center justify-center gap-1.5">
            <Plus size={13} /> Add Property
          </button>
        </div>

      </div>
    </div>
  );
}

/* ── Security Section ── */
function SecuritySection({ onBack }: { onBack: () => void }) {
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [showSetup,    setShowSetup]    = useState(false);

  const SESSIONS = [
    { device: 'iPhone 15 Pro',    location: 'Dubai, UAE',      lastSeen: 'Now',         current: true  },
    { device: 'MacBook Pro',      location: 'Dubai, UAE',      lastSeen: '2h ago',      current: false },
    { device: 'Chrome / Windows', location: 'Riyadh, SA',      lastSeen: '3 days ago',  current: false },
  ];

  const LOGIN_HISTORY = [
    { event: 'Successful login',   device: 'iPhone 15 Pro',    time: 'Today, 09:12',      ok: true  },
    { event: 'Successful login',   device: 'MacBook Pro',      time: 'Today, 08:45',      ok: true  },
    { event: 'Failed login attempt', device: 'Unknown device', time: 'Yesterday, 23:10',  ok: false },
    { event: 'Successful login',   device: 'iPhone 15 Pro',    time: 'Yesterday, 08:30',  ok: true  },
  ];

  return (
    <div className="h-full flex flex-col">
      <SectionHeader title="Security" onBack={onBack} />
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">

        {/* 2FA */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Fingerprint size={16} className="text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">Two-Factor Authentication</h3>
          </div>
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">Enable 2FA</p>
              <p className="text-xs text-gray-400">Protect your account with an authenticator app</p>
            </div>
            <Toggle value={twoFAEnabled} onChange={v => { setTwoFAEnabled(v); if (v) setShowSetup(true); }} />
          </div>
          {showSetup && !twoFAEnabled && null}
          {twoFAEnabled && (
            <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-100 flex items-center gap-2">
              <Check size={15} className="text-green-600 flex-shrink-0" />
              <p className="text-xs text-green-700 font-medium">2FA is active. Your account is protected.</p>
            </div>
          )}
          {showSetup && twoFAEnabled && (
            <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100 space-y-2">
              <p className="text-xs font-semibold text-blue-800">Setup: Scan with Authenticator App</p>
              <div className="flex justify-center py-2">
                {/* Placeholder QR */}
                <div className="w-28 h-28 bg-white border-2 border-blue-200 rounded-xl flex items-center justify-center">
                  <QrCode size={64} className="text-blue-400" />
                </div>
              </div>
              <p className="text-[11px] text-blue-600 text-center">Or enter manually: <code className="font-mono bg-white px-1 rounded">JBSWY3DPEHPK3PXP</code></p>
            </div>
          )}
        </div>

        {/* Active Sessions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Laptop size={16} className="text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">Active Sessions</h3>
          </div>
          <div className="space-y-1">
            {SESSIONS.map((s, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-b-0">
                <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 flex-shrink-0">
                  <Smartphone size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-800 truncate">{s.device}</p>
                    {s.current && <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-bold flex-shrink-0">Current</span>}
                  </div>
                  <p className="text-xs text-gray-400">{s.location} · {s.lastSeen}</p>
                </div>
                {!s.current && (
                  <button className="text-xs text-red-500 font-semibold hover:text-red-600 flex-shrink-0">
                    <LogOut size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button className="mt-3 w-full py-2 rounded-xl border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center justify-center gap-1.5">
            <LogOut size={13} /> Sign Out All Other Sessions
          </button>
        </div>

        {/* Login History */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 size={16} className="text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">Login History</h3>
          </div>
          <div className="space-y-1">
            {LOGIN_HISTORY.map((h, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-b-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${h.ok ? 'bg-green-100' : 'bg-red-100'}`}>
                  {h.ok ? <Check size={13} className="text-green-600" /> : <X size={13} className="text-red-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800">{h.event}</p>
                  <p className="text-[11px] text-gray-400">{h.device} · {h.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Change Password shortcut */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 text-left">
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 flex-shrink-0">
              <Key size={16} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">Change Password</p>
              <p className="text-xs text-gray-400">Update your account password</p>
            </div>
            <ChevronRight size={14} className="text-gray-300" />
          </button>
        </div>

      </div>
    </div>
  );
}

/* ── About Section ── */
function AboutSection({ onBack }: { onBack: () => void }) {
  return (
    <div className="h-full flex flex-col">
      <SectionHeader title="About NEO" onBack={onBack} />
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
        {/* App info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="w-4 h-4 rounded-full bg-red-500" />
            <span className="w-4 h-4 rounded-full bg-yellow-400" />
            <span className="w-4 h-4 rounded-full bg-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">NEO</h2>
          <p className="text-sm text-gray-500 mt-1">Facilities Management Platform</p>
          <p className="text-xs text-gray-400 mt-0.5">Version 1.0.0 · Build 2026.02</p>
        </div>

        {/* Links */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {[
            { icon: <HelpCircle size={16} />, label: 'Help Center',    desc: 'Guides & support articles' },
            { icon: <Info       size={16} />, label: 'Privacy Policy', desc: 'How we handle your data'  },
            { icon: <CheckSquare size={16}/>, label: 'Terms of Service', desc: 'Usage terms & conditions' },
            { icon: <Mail       size={16} />, label: 'Contact Support', desc: 'support@neo.app'          },
          ].map((item, i, arr) => (
            <div key={item.label} className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-50 ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 flex-shrink-0">{item.icon}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
              <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
            </div>
          ))}
        </div>

        {/* Security */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">Security</h3>
          </div>
          <div className="flex items-center gap-3 py-2 border-b border-gray-100">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">Two-Factor Authentication</p>
              <p className="text-xs text-gray-400">Add extra security to your account</p>
            </div>
            <span className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-semibold">Off</span>
          </div>
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">Active Sessions</p>
              <p className="text-xs text-gray-400">1 device logged in</p>
            </div>
            <button className="text-xs text-red-600 font-semibold hover:text-red-700">Manage</button>
          </div>
        </div>

        <p className="text-[11px] text-gray-400 text-center">
          © 2026 NEO · All rights reserved
        </p>
      </div>
    </div>
  );
}

/* ── Team Members Section ── */
function TeamMembersSection({ onBack }: { onBack: () => void }) {
  const { teamMembers, addUser, updateUser, deleteUser, groups } = useNotifications();
  const [showInvite, setShowInvite] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Invite form state
  const [invName,    setInvName]    = useState('');
  const [invEmail,   setInvEmail]   = useState('');
  const [invRole,    setInvRole]    = useState<AccountRole>('user');
  const [invGroups,  setInvGroups]  = useState<string[]>(['g_family']);
  const [invSent,    setInvSent]    = useState(false);

  const resetInvite = () => {
    setInvName(''); setInvEmail(''); setInvRole('user');
    setInvGroups(['g_family']); setInvSent(false);
  };

  const sendInvite = () => {
    if (!invName.trim() || !invEmail.trim()) return;
    const newUser = {
      id:          `u_${Date.now()}`,
      name:        invName.trim(),
      email:       invEmail.trim(),
      role:        invRole === 'family' ? 'Family Member' : invRole === 'account_admin' ? 'Account Admin' : invRole === 'group_admin' ? 'Group Admin' : 'User',
      accountRole: invRole as 'account_admin' | 'group_admin' | 'user' | 'family',
      status:      'offline' as const,
      groupIds:    invRole === 'family' ? invGroups : [],
      invitedAt:   new Date(),
      accepted:    false,
    };
    addUser(newUser);
    setInvSent(true);
    setTimeout(() => { setShowInvite(false); resetInvite(); }, 1800);
  };

  const toggleInvGroup = (gid: string) => {
    setInvGroups(prev => prev.includes(gid) ? prev.filter(x => x !== gid) : [...prev, gid]);
  };

  const staffMembers  = teamMembers.filter(u => u.accountRole !== 'family');
  const familyMembers = teamMembers.filter(u => u.accountRole === 'family');

  const MemberRow = ({ user }: { user: typeof teamMembers[0] }) => {
    const role = (user.accountRole ?? 'user') as AccountRole;
    const isEditing = editingId === user.id;
    const userGroups = groups.filter(g => user.groupIds?.includes(g.id));

    return (
      <div className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0">
        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-900">{user.name}</p>
            <RoleBadge role={role} />
            {user.accepted === false && (
              <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">Pending</span>
            )}
          </div>
          <p className="text-xs text-gray-400 truncate">{user.email}</p>
          {role === 'family' && userGroups.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {userGroups.map(g => (
                <span key={g.id} className="text-[10px] bg-purple-50 text-purple-600 border border-purple-100 rounded-full px-1.5 py-0.5">
                  {g.icon} {g.name}
                </span>
              ))}
            </div>
          )}
          {isEditing && role === 'family' && (
            <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden">
              <p className="text-[11px] font-semibold text-gray-500 px-3 py-1.5 bg-gray-50 border-b border-gray-100">Groups access</p>
              {groups.filter(g => !g.archived).map(g => (
                <label key={g.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0">
                  <input
                    type="checkbox"
                    checked={user.groupIds?.includes(g.id) ?? false}
                    onChange={() => {
                      const current = user.groupIds ?? [];
                      updateUser(user.id, { groupIds: current.includes(g.id) ? current.filter(x => x !== g.id) : [...current, g.id] });
                    }}
                    className="rounded accent-purple-600"
                  />
                  <span className="text-base">{g.icon}</span>
                  <span className="text-xs text-gray-700">{g.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
          {role === 'family' && (
            <button
              onClick={() => setEditingId(isEditing ? null : user.id)}
              className="p-1.5 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-purple-600 transition-colors"
              title="Edit groups"
            >
              <Edit2 size={13} />
            </button>
          )}
          <button
            onClick={() => { if (window.confirm(`Remove ${user.name}?`)) deleteUser(user.id); }}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
            title="Remove"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <SectionHeader title="Team Members" onBack={onBack} />
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">

        {/* Invite button */}
        <button
          onClick={() => setShowInvite(true)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold text-sm transition-colors"
        >
          <UserPlus size={16} /> Invite Team Member
        </button>

        {/* Staff */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <Users size={13} className="text-gray-400" />
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Staff ({staffMembers.length})</p>
          </div>
          {staffMembers.map(u => <MemberRow key={u.id} user={u} />)}
        </div>

        {/* Family */}
        <div className="bg-white rounded-2xl border border-pink-100 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-pink-50 border-b border-pink-100">
            <Home size={13} className="text-pink-400" />
            <p className="text-[11px] font-bold text-pink-500 uppercase tracking-widest">Family ({familyMembers.length})</p>
            <span className="ml-auto text-[10px] text-pink-400">Managed by Account Admin</span>
          </div>
          {familyMembers.length === 0 ? (
            <p className="text-xs text-gray-400 px-4 py-4 text-center">No family members yet. Invite with the button above.</p>
          ) : (
            familyMembers.map(u => <MemberRow key={u.id} user={u} />)
          )}
          {/* Family role info */}
          <div className="px-4 py-3 bg-pink-50/50 border-t border-pink-100">
            <p className="text-[11px] text-pink-600 font-medium mb-1">Family role permissions</p>
            <ul className="space-y-0.5">
              {[
                'Can choose which groups to join',
                'Can view all tasks and activity',
                'Can create tasks → auto-routed to Family group',
                'Can assign tasks to User or Account Admin only',
                'Can generate reports',
                'Not visible in regular staff lists',
              ].map(p => (
                <li key={p} className="flex items-start gap-1.5 text-[10px] text-pink-500">
                  <Check size={9} className="mt-0.5 flex-shrink-0" /> {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Invite Team Member</h2>
              <button onClick={() => { setShowInvite(false); resetInvite(); }} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X size={16} />
              </button>
            </div>

            {invSent ? (
              <div className="flex flex-col items-center py-10 gap-3">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                  <Check size={28} className="text-green-600" />
                </div>
                <p className="text-sm font-semibold text-gray-900">Invitation sent!</p>
                <p className="text-xs text-gray-400">{invEmail}</p>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                {/* Name */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={invName}
                    onChange={e => setInvName(e.target.value)}
                    placeholder="e.g. Sarah Johnson"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* Email */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={invEmail}
                    onChange={e => setInvEmail(e.target.value)}
                    placeholder="e.g. sarah@example.com"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* Role */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['account_admin', 'group_admin', 'user', 'family'] as AccountRole[]).map(r => (
                      <button
                        key={r}
                        onClick={() => { setInvRole(r); if (r === 'family') setInvGroups(['g_family']); }}
                        className={`flex flex-col items-start gap-1 p-3 rounded-xl border-2 text-left transition-colors ${invRole === r ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <RoleBadge role={r} />
                        <p className="text-[10px] text-gray-500 leading-tight">
                          {r === 'account_admin' && 'Full control over all groups and members'}
                          {r === 'group_admin'   && 'Manage assigned groups and their tasks'}
                          {r === 'user'          && 'Create and manage tasks in their groups'}
                          {r === 'family'        && 'Submit requests, choose groups, see status'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Family: group selector */}
                {invRole === 'family' && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Groups they can join</label>
                    <div className="border border-gray-200 rounded-xl overflow-hidden max-h-44 overflow-y-auto">
                      {groups.filter(g => !g.archived).map(g => (
                        <label key={g.id} className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0">
                          <input
                            type="checkbox"
                            checked={invGroups.includes(g.id)}
                            onChange={() => toggleInvGroup(g.id)}
                            className="rounded accent-purple-600"
                          />
                          <span className="text-base">{g.icon}</span>
                          <span className="text-xs text-gray-700 font-medium">{g.name}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Family group is always included. Tasks auto-route there.</p>
                  </div>
                )}

                {/* Send */}
                <button
                  onClick={sendInvite}
                  disabled={!invName.trim() || !invEmail.trim()}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Mail size={15} /> Send Invitation
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Settings Page ── */
export default function SettingsPage() {
  const { teamMembers, groups } = useNotifications();
  const [section, setSection] = useState<Section>(null);

  const me = teamMembers.find(u => u.id === currentUser.id) ?? currentUser;

  const totalTags = Object.values(DEFAULT_TAGS).flat().length;
  const notifsOn  = groups.filter(g => g.notificationsOn).length;

  // Section sub-pages
  if (section === 'account')       return <AccountSection       onBack={() => setSection(null)} />;
  if (section === 'notifications') return <NotificationsSection onBack={() => setSection(null)} />;
  if (section === 'groups')        return <GroupsSection        onBack={() => setSection(null)} />;
  if (section === 'tags')          return <TagsSection          onBack={() => setSection(null)} />;
  if (section === 'appearance')    return <AppearanceSection    onBack={() => setSection(null)} />;
  if (section === 'subscription')  return <SubscriptionSection  onBack={() => setSection(null)} />;
  if (section === 'integrations')  return <IntegrationsSection  onBack={() => setSection(null)} />;
  if (section === 'security')      return <SecuritySection      onBack={() => setSection(null)} />;
  if (section === 'workspace')     return <WorkspaceSection     onBack={() => setSection(null)} />;
  if (section === 'about')         return <AboutSection         onBack={() => setSection(null)} />;
  if (section === 'team')          return <TeamMembersSection   onBack={() => setSection(null)} />;

  /* ── Main menu ── */
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50">
        {/* Profile card */}
        <button
          onClick={() => setSection('account')}
          className="w-full bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
        >
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
              {me.name.charAt(0).toUpperCase()}
            </div>
            <span className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${me.status === 'online' ? 'bg-green-400' : me.status === 'away' ? 'bg-yellow-400' : 'bg-gray-300'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{me.name}</p>
            <p className="text-xs text-gray-500 truncate">{me.email}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Shield size={11} className="text-blue-500" />
              <span className="text-[11px] text-blue-600 font-medium">
                {me.accountRole === 'account_admin' ? 'Account Admin' : me.accountRole === 'group_admin' ? 'Group Admin' : 'User'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Edit2 size={14} className="text-gray-400" />
            <ChevronRight size={15} className="text-gray-300" />
          </div>
        </button>

        <div className="p-4 space-y-5">
          {/* Workspace */}
          <SettingsGroup title="Workspace">
            <SettingsRow icon={<Building2 size={16} />} label="Organization"   value="Grand Hyatt Dubai"  onClick={() => setSection('workspace')} />
            <SettingsRow icon={<Bell size={16}  />}     label="Notifications"  value={`${notifsOn > 0 ? notifsOn + ' groups on' : 'All off'}`} onClick={() => setSection('notifications')} />
            <SettingsRow icon={<Users size={16} />}     label="Group Settings" value={`${groups.length} groups`} onClick={() => setSection('groups')} />
            <SettingsRow icon={<Tag size={16}   />}     label="Tags"           value={`${totalTags} tags`} onClick={() => setSection('tags')} />
            <SettingsRow
              icon={<UserPlus size={16} />}
              label="Team Members"
              value={`${teamMembers.length} members · ${teamMembers.filter(u => u.accountRole === 'family').length} family`}
              onClick={() => setSection('team')}
              last
            />
          </SettingsGroup>

          {/* Preferences */}
          <SettingsGroup title="Preferences">
            <SettingsRow icon={<Globe size={16}   />} label="Language"   value="English"     onClick={() => setSection('appearance')} />
            <SettingsRow icon={<Palette size={16} />} label="Appearance" value="Light theme"  onClick={() => setSection('appearance')} />
            <SettingsRow icon={<Clock size={16}   />} label="Timezone"   value="UTC+4 Dubai"  onClick={() => setSection('appearance')} last />
          </SettingsGroup>

          {/* Account */}
          <SettingsGroup title="Account">
            <SettingsRow icon={<CreditCard size={16} />} label="Subscription & Billing" value="Professional" onClick={() => setSection('subscription')} />
            <SettingsRow icon={<Link2 size={16}      />} label="Integrations & API"     value="API Key"      onClick={() => setSection('integrations')} />
            <SettingsRow icon={<Shield size={16}     />} label="Security"               value="2FA Off"      onClick={() => setSection('security')} last />
          </SettingsGroup>

          {/* Support */}
          <SettingsGroup title="Support & Legal">
            <SettingsRow icon={<HelpCircle size={16} />} label="Help Center"    onClick={() => {}} />
            <SettingsRow icon={<Info size={16}       />} label="About NEO"      value="v1.0.0" onClick={() => setSection('about')} last />
          </SettingsGroup>

          {/* Danger zone */}
          <div className="bg-white rounded-2xl overflow-hidden border border-red-100">
            <SettingsRow
              icon={<AlertTriangle size={16} />}
              label="Log Out of NEO"
              danger
              onClick={() => window.location.reload()}
              last
            />
          </div>
        </div>
      </div>
    </div>
  );
}
