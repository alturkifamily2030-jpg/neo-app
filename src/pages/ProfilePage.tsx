import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus, Search, X, Mail, Phone, Shield, Users,
  ChevronRight, Check, Clock, LayoutGrid, List, ArrowUpDown,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { currentUser } from '../data/mockData';
import { useNotifications } from '../context/NotificationContext';
import type { User } from '../types';

/* ── Role helpers ── */
type AccountRole = NonNullable<User['accountRole']>;

const ROLE_LABELS: Record<AccountRole, string> = {
  account_admin: 'Account Admin',
  group_admin:   'Group Admin',
  user:          'User',
  family:        'Family',
};

const ROLE_COLORS: Record<AccountRole, string> = {
  account_admin: 'bg-red-100 text-red-700',
  group_admin:   'bg-purple-100 text-purple-700',
  user:          'bg-gray-100 text-gray-600',
  family:        'bg-pink-100 text-pink-700',
};

const STATUS_DOT: Record<User['status'], string> = {
  online:  'bg-green-400',
  away:    'bg-yellow-400',
  offline: 'bg-gray-300',
};

type TeamTab      = 'members' | 'groups' | 'invited';
type RoleFilter   = 'all' | AccountRole;
type StatusFilter = 'all' | User['status'];
type ViewMode     = 'list' | 'grid';
type SortBy       = 'name' | 'tasks' | 'status';

/* ── Invite Modal ── */
function InviteModal({
  onClose,
  onInvite,
}: {
  onClose: () => void;
  onInvite: (u: User) => void;
}) {
  const { groups } = useNotifications();
  const [method, setMethod]           = useState<'email' | 'sms'>('email');
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [phone, setPhone]             = useState('');
  const [accountRole, setAccountRole] = useState<AccountRole>('user');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [sent, setSent]               = useState(false);

  const toggleGroup = (gid: string) =>
    setSelectedGroups(prev =>
      prev.includes(gid) ? prev.filter(id => id !== gid) : [...prev, gid]
    );

  const canSend = name.trim() && (method === 'email' ? email.trim() : phone.trim());

  const handleSend = () => {
    if (!canSend) return;
    onInvite({
      id: `u${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      role: ROLE_LABELS[accountRole],
      accountRole,
      status: 'offline',
      groupIds: selectedGroups,
      invitedAt: new Date(),
      accepted: false,
    });
    setSent(true);
    setTimeout(onClose, 1800);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 pt-5 pb-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-blue-600" />
            <h3 className="text-base font-semibold text-gray-900">Invite Team Member</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        {sent ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check size={28} className="text-green-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900">Invitation Sent!</p>
            <p className="text-xs text-gray-400 text-center px-6">
              {name} will receive an invite link and can join the team.
            </p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Invite method */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Invite via</p>
              <div className="flex gap-2">
                {(['email', 'sms'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 flex items-center justify-center gap-1.5 transition-colors ${method === m ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-400 hover:border-gray-300'}`}
                  >
                    {m === 'email' ? <Mail size={13} /> : <Phone size={13} />}
                    {m === 'email' ? 'Email' : 'SMS'}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Full Name *</label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Sarah Ahmed"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {method === 'email' ? (
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Phone Number *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+971 50 000 0000"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Permission role */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-2 block">Permission Role</label>
              <div className="space-y-2">
                {(Object.entries(ROLE_LABELS) as [AccountRole, string][]).map(([role, label]) => {
                  const desc = role === 'account_admin'
                    ? 'Full control — users, billing, and account settings'
                    : role === 'group_admin'
                    ? 'Manage tasks, members, and settings within groups'
                    : 'View and update tasks in assigned groups';
                  return (
                    <button
                      key={role}
                      onClick={() => setAccountRole(role)}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-colors ${accountRole === role ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-300'}`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${accountRole === role ? 'border-blue-500' : 'border-gray-300'}`}>
                        {accountRole === role && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{label}</p>
                        <p className="text-xs text-gray-400">{desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Groups */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-2 block">
                Assign to Groups <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {groups.map(g => (
                  <button
                    key={g.id}
                    onClick={() => toggleGroup(g.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${selectedGroups.includes(g.id) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    <span>{g.icon}</span>
                    <span className="max-w-[80px] truncate">{g.name}</span>
                    {selectedGroups.includes(g.id) && <Check size={11} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={!canSend}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-40 hover:bg-blue-700"
              >
                Send Invite
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Member card – list view ── */
function MemberRowList({ user, isMe, taskCount, groupCount }: {
  user: User;
  isMe?: boolean;
  taskCount: number;
  groupCount: number;
}) {
  const navigate = useNavigate();
  const roleKey = user.accountRole ?? 'user';

  return (
    <button
      onClick={() => navigate(`/profile/${user.id}`)}
      className="w-full bg-white border border-gray-100 rounded-2xl p-3.5 flex items-center gap-3 hover:shadow-md hover:border-blue-100 active:scale-[0.99] transition-all text-left"
    >
      <div className="relative flex-shrink-0">
        <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-base">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${STATUS_DOT[user.status]}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
          {isMe && (
            <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold flex-shrink-0">
              Me
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 truncate">{user.role}</p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${ROLE_COLORS[roleKey]}`}>
            {ROLE_LABELS[roleKey]}
          </span>
          {groupCount > 0 && (
            <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
              <Users size={10} /> {groupCount}
            </span>
          )}
          {taskCount > 0 && (
            <span className="text-[11px] text-blue-600 font-semibold">
              {taskCount} open
            </span>
          )}
        </div>
      </div>

      <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
    </button>
  );
}

/* ── Member card – grid view ── */
function MemberCardGrid({ user, isMe, taskCount }: {
  user: User;
  isMe?: boolean;
  taskCount: number;
}) {
  const navigate = useNavigate();
  const roleKey = user.accountRole ?? 'user';

  return (
    <button
      onClick={() => navigate(`/profile/${user.id}`)}
      className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center gap-2 hover:shadow-md hover:border-blue-100 active:scale-[0.99] transition-all text-center"
    >
      <div className="relative">
        <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${STATUS_DOT[user.status]}`} />
      </div>
      <div className="w-full min-w-0">
        <div className="flex items-center justify-center gap-1">
          <p className="text-sm font-semibold text-gray-900 truncate">{user.name.split(' ')[0]}</p>
          {isMe && <span className="text-[9px] px-1 py-0.5 bg-blue-100 text-blue-700 rounded font-bold flex-shrink-0">Me</span>}
        </div>
        <p className="text-[11px] text-gray-400 truncate mt-0.5">{user.role}</p>
        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold mt-1 ${ROLE_COLORS[roleKey]}`}>
          {ROLE_LABELS[roleKey]}
        </span>
        {taskCount > 0 && (
          <p className="text-[11px] text-blue-600 font-semibold mt-1">{taskCount} open tasks</p>
        )}
      </div>
    </button>
  );
}

/* ── Main Component ── */
export default function ProfilePage() {
  const navigate   = useNavigate();
  const { teamMembers, tasks, groups, addUser, deleteUser } = useNotifications();

  const [tab, setTab]               = useState<TeamTab>('members');
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showSearch, setShowSearch] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [viewMode, setViewMode]     = useState<ViewMode>('list');
  const [sortBy, setSortBy]         = useState<SortBy>('name');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const accepted = teamMembers.filter(u => u.accepted !== false);
  const invited  = teamMembers.filter(u => u.accepted === false);

  const online  = accepted.filter(u => u.status === 'online').length;
  const away    = accepted.filter(u => u.status === 'away').length;
  const offline = accepted.filter(u => u.status === 'offline').length;

  function getTaskCount(userId: string) {
    return tasks.filter(t => t.assignees.includes(userId) && t.status !== 'done').length;
  }
  function getGroupCount(userId: string) {
    return groups.filter(g => g.memberIds.includes(userId)).length;
  }

  const filteredMembers = useMemo(() => {
    let list = accepted.filter(u => {
      if (search) {
        const q = search.toLowerCase();
        if (!u.name.toLowerCase().includes(q) && !u.role.toLowerCase().includes(q)) return false;
      }
      if (roleFilter !== 'all' && (u.accountRole ?? 'user') !== roleFilter) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      return true;
    });

    // Sort
    list = [...list].sort((a, b) => {
      if (sortBy === 'tasks') return getTaskCount(b.id) - getTaskCount(a.id);
      if (sortBy === 'status') {
        const order = { online: 0, away: 1, offline: 2 };
        return order[a.status] - order[b.status];
      }
      return a.name.localeCompare(b.name);
    });

    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accepted, search, roleFilter, statusFilter, sortBy]);

  const me     = accepted.find(u => u.id === currentUser.id);
  const others = filteredMembers.filter(u => u.id !== currentUser.id);
  const meInFilter = filteredMembers.find(u => u.id === currentUser.id);

  const roleCounts = {
    account_admin: accepted.filter(u => u.accountRole === 'account_admin').length,
    group_admin:   accepted.filter(u => u.accountRole === 'group_admin').length,
    user:          accepted.filter(u => (u.accountRole ?? 'user') === 'user').length,
  };

  const SORT_LABELS: Record<SortBy, string> = {
    name:   'Name (A–Z)',
    tasks:  'Open Tasks',
    status: 'Status',
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">People</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {accepted.length} members{invited.length > 0 ? ` · ${invited.length} pending` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowSearch(v => !v); setSearch(''); }}
            className={`p-2 rounded-xl transition-colors ${showSearch ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:bg-gray-100'}`}
          >
            <Search size={18} />
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <UserPlus size={15} />
            Invite
          </button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="bg-white border-b border-gray-100 px-4 py-2.5">
          <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3.5 py-2">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or role…"
              className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 placeholder-gray-400"
            />
            {search && (
              <button onClick={() => setSearch('')}>
                <X size={14} className="text-gray-400" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Status bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-2.5 flex items-center gap-4 overflow-x-auto">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="text-xs font-bold text-gray-700">{online}</span>
          <span className="text-xs text-gray-400">Online</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="text-xs font-bold text-gray-700">{away}</span>
          <span className="text-xs text-gray-400">Away</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
          <span className="text-xs font-bold text-gray-700">{offline}</span>
          <span className="text-xs text-gray-400">Offline</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
          <Shield size={12} className="text-red-400" />
          <span className="text-xs text-gray-400">{roleCounts.account_admin} Admin</span>
          <span className="text-xs text-gray-300">·</span>
          <span className="text-xs text-gray-400">{roleCounts.group_admin} Gr.Admin</span>
          <span className="text-xs text-gray-300">·</span>
          <span className="text-xs text-gray-400">{roleCounts.user} User</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 flex">
        {([
          { key: 'members' as TeamTab, label: 'Members',  count: accepted.length },
          { key: 'groups'  as TeamTab, label: 'Groups',   count: groups.length   },
          { key: 'invited' as TeamTab, label: 'Invited',  count: invited.length  },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">

        {/* ── Members tab ── */}
        {tab === 'members' && (
          <div>
            {/* Toolbar: filters + view/sort */}
            <div className="bg-white border-b border-gray-100 px-4 py-2.5 flex gap-2 items-center">
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value as RoleFilter)}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="account_admin">Account Admin</option>
                <option value="group_admin">Group Admin</option>
                <option value="user">User</option>
              </select>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="online">Online</option>
                <option value="away">Away</option>
                <option value="offline">Offline</option>
              </select>
              {(roleFilter !== 'all' || statusFilter !== 'all') && (
                <button
                  onClick={() => { setRoleFilter('all'); setStatusFilter('all'); }}
                  className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 px-2 py-1.5"
                >
                  <X size={12} /> Clear
                </button>
              )}
              <div className="ml-auto flex items-center gap-1.5">
                {/* Sort */}
                <div className="relative">
                  <button
                    onClick={() => setShowSortMenu(v => !v)}
                    className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 whitespace-nowrap"
                  >
                    <ArrowUpDown size={11} />
                    {SORT_LABELS[sortBy]}
                  </button>
                  {showSortMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                      <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden w-36">
                        {(Object.entries(SORT_LABELS) as [SortBy, string][]).map(([key, label]) => (
                          <button
                            key={key}
                            onClick={() => { setSortBy(key); setShowSortMenu(false); }}
                            className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs transition-colors ${sortBy === key ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
                          >
                            {sortBy === key && <Check size={11} />}
                            {label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                {/* View mode toggle */}
                <button
                  onClick={() => setViewMode(v => v === 'list' ? 'grid' : 'list')}
                  className={`p-1.5 rounded-lg border border-gray-200 transition-colors ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-gray-400 hover:bg-gray-50'}`}
                >
                  {viewMode === 'grid' ? <List size={14} /> : <LayoutGrid size={14} />}
                </button>
              </div>
            </div>

            <div className="p-4">
              {viewMode === 'list' ? (
                <div className="space-y-3">
                  {/* My profile */}
                  {meInFilter && me && (
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">My Profile</p>
                      <MemberRowList
                        user={me}
                        isMe
                        taskCount={getTaskCount(me.id)}
                        groupCount={getGroupCount(me.id)}
                      />
                    </div>
                  )}

                  {/* Other members, grouped by role */}
                  {others.length > 0 && (() => {
                    const admins      = others.filter(u => u.accountRole === 'account_admin');
                    const groupAdmins = others.filter(u => u.accountRole === 'group_admin');
                    const users       = others.filter(u => (u.accountRole ?? 'user') === 'user');

                    const sections: { label: string; list: User[] }[] = [];
                    if (admins.length)      sections.push({ label: 'Account Admins', list: admins });
                    if (groupAdmins.length) sections.push({ label: 'Group Admins', list: groupAdmins });
                    if (users.length)       sections.push({ label: 'Team Members', list: users });

                    // If filter active, show flat
                    if (roleFilter !== 'all' || sections.length === 0) {
                      return (
                        <div className="space-y-2">
                          {others.map(u => (
                            <MemberRowList key={u.id} user={u} taskCount={getTaskCount(u.id)} groupCount={getGroupCount(u.id)} />
                          ))}
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {sections.map(sec => (
                          <div key={sec.label}>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                              {sec.label} ({sec.list.length})
                            </p>
                            <div className="space-y-2">
                              {sec.list.map(u => (
                                <MemberRowList key={u.id} user={u} taskCount={getTaskCount(u.id)} groupCount={getGroupCount(u.id)} />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {filteredMembers.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                      <Users size={36} strokeWidth={1.5} />
                      <p className="text-sm font-medium">No members match your filters</p>
                      <button
                        onClick={() => { setRoleFilter('all'); setStatusFilter('all'); setSearch(''); }}
                        className="text-xs text-blue-600 mt-1"
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Grid view */
                <div>
                  {meInFilter && me && (
                    <div className="mb-4">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">My Profile</p>
                      <div className="grid grid-cols-2 gap-3">
                        <MemberCardGrid user={me} isMe taskCount={getTaskCount(me.id)} />
                      </div>
                    </div>
                  )}
                  {others.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                        Team ({others.length})
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {others.map(u => (
                          <MemberCardGrid key={u.id} user={u} taskCount={getTaskCount(u.id)} />
                        ))}
                      </div>
                    </div>
                  )}
                  {filteredMembers.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                      <Users size={36} strokeWidth={1.5} />
                      <p className="text-sm font-medium">No members match your filters</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Groups tab ── */}
        {tab === 'groups' && (
          <div className="p-4 space-y-3">
            <p className="text-xs text-gray-400 px-1">{groups.length} groups in your account</p>
            {groups.map(g => {
              const members = accepted.filter(u => g.memberIds.includes(u.id));
              const openTasks = tasks.filter(t => t.groupId === g.id && t.status !== 'done').length;
              const totalTasks = tasks.filter(t => t.groupId === g.id).length;
              const visibleMembers = members.slice(0, 5);
              const extraCount = Math.max(0, members.length - 5);

              return (
                <button
                  key={g.id}
                  onClick={() => navigate(`/fix/group/${g.id}`)}
                  className="w-full bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md hover:border-blue-100 active:scale-[0.99] transition-all text-left"
                >
                  {/* Color stripe */}
                  <div className="h-1.5" style={{ backgroundColor: g.color }} />
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: g.color + '20' }}>
                        {g.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900 truncate">{g.name}</p>
                          <ChevronRight size={15} className="text-gray-300 flex-shrink-0" />
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{g.description}</p>

                        {/* Stats row */}
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1">
                            <Users size={12} className="text-gray-400" />
                            <span className="text-xs text-gray-600 font-medium">{members.length}</span>
                          </div>
                          {openTasks > 0 && (
                            <span className="text-xs font-semibold text-red-600">{openTasks} open</span>
                          )}
                          {totalTasks > 0 && (
                            <span className="text-xs text-gray-400">{totalTasks} total tasks</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Member avatars */}
                    {members.length > 0 && (
                      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100">
                        <div className="flex -space-x-2">
                          {visibleMembers.map(m => (
                            <div
                              key={m.id}
                              className="w-7 h-7 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 relative"
                              title={m.name}
                            >
                              {m.name.charAt(0)}
                              <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${STATUS_DOT[m.status]}`} />
                            </div>
                          ))}
                          {extraCount > 0 && (
                            <div className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-gray-600 text-[10px] font-bold flex-shrink-0">
                              +{extraCount}
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-400 ml-2">
                          {members.map(m => m.name.split(' ')[0]).slice(0, 3).join(', ')}
                          {members.length > 3 ? ` +${members.length - 3}` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
            {groups.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                <Users size={36} strokeWidth={1.5} />
                <p className="text-sm font-medium">No groups yet</p>
              </div>
            )}
          </div>
        )}

        {/* ── Invited tab ── */}
        {tab === 'invited' && (
          <div className="p-4">
            {invited.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <Mail size={28} strokeWidth={1.5} />
                </div>
                <p className="text-sm font-semibold text-gray-600">No pending invitations</p>
                <p className="text-xs text-gray-400 text-center">
                  Invite team members using the Invite button above
                </p>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="mt-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700"
                >
                  Invite Member
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-400 mb-1">
                  {invited.length} invitation{invited.length !== 1 ? 's' : ''} pending acceptance
                </p>
                {invited.map(u => (
                  <div key={u.id} className="bg-white border border-gray-100 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-base flex-shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email || u.phone}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${ROLE_COLORS[u.accountRole ?? 'user']}`}>
                            {ROLE_LABELS[u.accountRole ?? 'user']}
                          </span>
                          {u.invitedAt && (
                            <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                              <Clock size={10} />
                              {formatDistanceToNow(u.invitedAt, { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full font-bold flex items-center gap-0.5 flex-shrink-0">
                        <Clock size={9} /> Pending
                      </span>
                    </div>

                    {u.groupIds.length > 0 && (
                      <div className="mt-2.5 pt-2.5 border-t border-gray-100">
                        <p className="text-[11px] text-gray-400 mb-1.5">Assigned groups:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {u.groupIds.map(gid => {
                            const grp = groups.find(g => g.id === gid);
                            return (
                              <span key={gid} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg">
                                {grp ? `${grp.icon} ${grp.name}` : gid}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-3">
                      <button className="flex-1 py-2 rounded-xl border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5">
                        <Mail size={12} /> Resend Invite
                      </button>
                      <button
                        onClick={() => deleteUser(u.id)}
                        className="flex-1 py-2 rounded-xl border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* My profile footer */}
      {me && tab !== 'groups' && (
        <div className="bg-white border-t border-gray-200 px-4 py-3">
          <button
            onClick={() => navigate(`/profile/${me.id}`)}
            className="w-full flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
          >
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                {me.name.charAt(0)}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white bg-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{me.name}</p>
              <p className="text-xs text-gray-400">View my profile</p>
            </div>
            <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
          </button>
        </div>
      )}

      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          onInvite={u => { addUser(u); setTab('invited'); }}
        />
      )}
    </div>
  );
}
