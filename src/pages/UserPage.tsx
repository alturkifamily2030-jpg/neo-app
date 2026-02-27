import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Mail, Phone, Shield, Edit2, Check, X,
  Camera, User as UserIcon, MessageSquare, Trash2,
  CheckSquare, Clock, AlertCircle, Calendar, ChevronRight,
  Wrench,
} from 'lucide-react';
import { format } from 'date-fns';
import { currentUser } from '../data/mockData';
import { useNotifications } from '../context/NotificationContext';
import type { User } from '../types';

type AccountRole = NonNullable<User['accountRole']>;
type UserPageTab = 'profile' | 'tasks' | 'scheduled';

const ROLE_LABELS: Record<AccountRole, string> = {
  account_admin: 'Account Admin',
  group_admin:   'Group Admin',
  user:          'User',
};

const ROLE_COLORS: Record<AccountRole, string> = {
  account_admin: 'bg-red-100 text-red-700 border-red-200',
  group_admin:   'bg-purple-100 text-purple-700 border-purple-200',
  user:          'bg-gray-100 text-gray-600 border-gray-200',
};

const STATUS_DOT: Record<User['status'], string> = {
  online:  'bg-green-400',
  away:    'bg-yellow-400',
  offline: 'bg-gray-300',
};
const STATUS_LABEL: Record<User['status'], string> = {
  online: 'Online', away: 'Away', offline: 'Offline',
};

const PRIORITY_COLORS: Record<string, string> = {
  high:   'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low:    'bg-green-100 text-green-700',
};

const STATUS_COLORS: Record<string, string> = {
  open:        'bg-red-50 text-red-600',
  in_progress: 'bg-yellow-50 text-yellow-700',
  done:        'bg-green-50 text-green-700',
};
const STATUS_LABEL2: Record<string, string> = {
  open: 'Open', in_progress: 'In Progress', done: 'Done',
};

export default function UserPage() {
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();
  const {
    teamMembers, updateUser, deleteUser, tasks, groups,
    chatChannels, addChatChannel, plannedTasks,
  } = useNotifications();

  const user   = teamMembers.find(u => u.id === id);
  const isMe   = id === currentUser.id;
  const meUser = teamMembers.find(u => u.id === currentUser.id);
  const isAdmin = meUser?.accountRole === 'account_admin';

  const [tab, setTab]             = useState<UserPageTab>('profile');
  const [editing, setEditing]     = useState(false);
  const [editName, setEditName]   = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole]   = useState('');
  const [editAccountRole, setEditAccountRole] = useState<AccountRole>('user');
  const [saved, setSaved]         = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  if (!user) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
        <UserIcon size={48} strokeWidth={1.5} className="mb-1" />
        <p className="text-lg font-semibold text-gray-600">User not found</p>
        <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const startEdit = () => {
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone ?? '');
    setEditRole(user.role);
    setEditAccountRole(user.accountRole ?? 'user');
    setEditing(true);
  };

  const saveEdit = () => {
    updateUser(user.id, {
      name:        editName.trim()  || user.name,
      email:       editEmail.trim() || user.email,
      phone:       editPhone.trim() || undefined,
      role:        editRole.trim()  || user.role,
      accountRole: editAccountRole,
    });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleRemove = () => {
    deleteUser(user.id);
    navigate('/profile');
  };

  const handleSendDM = () => {
    const existing = chatChannels.find(c => c.type === 'dm' && c.dmUserId === user.id);
    if (existing) {
      navigate(`/chat/${existing.id}`);
    } else {
      const newCh = {
        id: `dm_${Date.now()}`,
        name: user.name,
        type: 'dm' as const,
        dmUserId: user.id,
        unread: 0,
      };
      addChatChannel(newCh);
      navigate(`/chat/${newCh.id}`);
    }
  };

  // Task stats
  const userTasks       = tasks.filter(t => t.assignees.includes(user.id));
  const openTasks       = userTasks.filter(t => t.status === 'open').length;
  const inProgressTasks = userTasks.filter(t => t.status === 'in_progress').length;
  const doneTasks       = userTasks.filter(t => t.status === 'done').length;

  // Active tasks (not done) + done — all tasks
  const activeTasks = userTasks.filter(t => t.status !== 'done');
  const recentDone  = userTasks.filter(t => t.status === 'done').slice(0, 5);

  // Planned tasks assigned to this user
  const userPlanned = plannedTasks.filter(p => p.assigneeIds?.includes(user.id));

  const userGroups = groups.filter(g => g.memberIds.includes(user.id));
  const roleKey    = user.accountRole ?? 'user';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl hover:bg-gray-100">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-gray-900 truncate">{user.name}</h1>
          <p className="text-xs text-gray-400">{isMe ? 'My Profile' : 'Team Member'}</p>
        </div>
        {(isMe || isAdmin) && !editing && (
          <button
            onClick={startEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            <Edit2 size={14} /> Edit
          </button>
        )}
        {saved && <span className="text-sm text-green-600 font-semibold">✓ Saved</span>}
      </div>

      {/* Profile hero */}
      <div className="bg-white border-b border-gray-100 px-5 py-5 flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${STATUS_DOT[user.status]}`} />
          {isMe && (
            <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 border-2 border-white">
              <Camera size={13} />
            </button>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-gray-900 truncate">{user.name}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{user.role}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${ROLE_COLORS[roleKey]}`}>
              <Shield size={11} className="inline mr-1 -mt-0.5" />
              {ROLE_LABELS[roleKey]}
            </span>
            <span className={`text-xs font-semibold flex items-center gap-1 ${user.status === 'online' ? 'text-green-600' : user.status === 'away' ? 'text-yellow-600' : 'text-gray-400'}`}>
              <span className={`w-2 h-2 rounded-full ${STATUS_DOT[user.status]}`} />
              {STATUS_LABEL[user.status]}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons (non-self) */}
      {!isMe && (
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex gap-2">
          <button
            onClick={handleSendDM}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <MessageSquare size={16} /> Message
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowRemoveConfirm(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 flex">
        {([
          { key: 'profile'   as UserPageTab, label: 'Profile'   },
          { key: 'tasks'     as UserPageTab, label: 'Tasks',     count: userTasks.length     },
          { key: 'scheduled' as UserPageTab, label: 'Scheduled', count: userPlanned.length   },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">

        {/* ── Profile tab ── */}
        {tab === 'profile' && (
          <div className="p-4 space-y-4">
            {/* Task activity summary */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Task Activity</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center gap-1 py-3 rounded-xl bg-red-50">
                  <AlertCircle size={18} className="text-red-500" />
                  <span className="text-xl font-bold text-red-600">{openTasks}</span>
                  <span className="text-[11px] text-red-400 font-medium">Open</span>
                </div>
                <div className="flex flex-col items-center gap-1 py-3 rounded-xl bg-yellow-50">
                  <Clock size={18} className="text-yellow-500" />
                  <span className="text-xl font-bold text-yellow-600">{inProgressTasks}</span>
                  <span className="text-[11px] text-yellow-400 font-medium">In Progress</span>
                </div>
                <div className="flex flex-col items-center gap-1 py-3 rounded-xl bg-green-50">
                  <CheckSquare size={18} className="text-green-500" />
                  <span className="text-xl font-bold text-green-600">{doneTasks}</span>
                  <span className="text-[11px] text-green-400 font-medium">Done</span>
                </div>
              </div>
              {/* Workload bar */}
              {userTasks.length > 0 && (
                <div className="mt-3">
                  <p className="text-[11px] text-gray-400 mb-1.5">Workload</p>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                    {openTasks > 0 && (
                      <div className="bg-red-400 h-full" style={{ width: `${(openTasks / userTasks.length) * 100}%` }} />
                    )}
                    {inProgressTasks > 0 && (
                      <div className="bg-yellow-400 h-full" style={{ width: `${(inProgressTasks / userTasks.length) * 100}%` }} />
                    )}
                    {doneTasks > 0 && (
                      <div className="bg-green-400 h-full" style={{ width: `${(doneTasks / userTasks.length) * 100}%` }} />
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">{userTasks.length} total tasks</p>
                </div>
              )}
            </div>

            {editing ? (
              /* Edit form */
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Edit Profile</h3>

                <Field label="Full Name" icon={<UserIcon size={15} className="text-gray-400" />}>
                  <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>

                <Field label="Email Address" icon={<Mail size={15} className="text-gray-400" />}>
                  <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>

                <Field label="Phone Number" icon={<Phone size={15} className="text-gray-400" />}>
                  <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>

                <Field label="Job Title" icon={<Shield size={15} className="text-gray-400" />}>
                  <input type="text" value={editRole} onChange={e => setEditRole(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>

                {isAdmin && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Permission Role</label>
                    <div className="flex gap-2">
                      {(Object.entries(ROLE_LABELS) as [AccountRole, string][]).map(([role, label]) => (
                        <button
                          key={role}
                          onClick={() => setEditAccountRole(role)}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-colors ${editAccountRole === role ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-400'}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setEditing(false)}
                    className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1.5">
                    <X size={14} /> Cancel
                  </button>
                  <button onClick={saveEdit}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5">
                    <Check size={14} /> Save
                  </button>
                </div>

                {isMe && (
                  <div className="pt-3 border-t border-gray-100">
                    <h4 className="text-xs font-semibold text-gray-600 mb-3">Notification Preferences</h4>
                    <div className="space-y-3">
                      {[
                        { label: 'Task assignments', desc: 'When a task is assigned to you' },
                        { label: 'Task updates',     desc: "When a task you're following is updated" },
                        { label: 'Comments',         desc: 'When someone comments on your task' },
                        { label: 'Daily digest',     desc: 'Daily summary of all activities' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-700">{item.label}</p>
                            <p className="text-xs text-gray-400">{item.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" defaultChecked={i < 3} className="sr-only peer" />
                            <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-blue-600
                              after:content-[''] after:absolute after:top-0.5 after:left-0.5
                              after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all
                              peer-checked:after:translate-x-5" />
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Contact */}
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Mail size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400">Email</p>
                        <p className="text-sm font-medium text-gray-800">{user.email}</p>
                      </div>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <Phone size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-400">Phone</p>
                          <p className="text-sm font-medium text-gray-800">{user.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status selector (own) */}
                {isMe && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">My Status</h3>
                    <div className="flex gap-2">
                      {(['online', 'away', 'offline'] as User['status'][]).map(s => (
                        <button
                          key={s}
                          onClick={() => updateUser(user.id, { status: s })}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border-2 transition-colors capitalize ${user.status === s
                            ? s === 'online' ? 'bg-green-50 text-green-700 border-green-400'
                              : s === 'away' ? 'bg-yellow-50 text-yellow-700 border-yellow-400'
                              : 'bg-gray-100 text-gray-600 border-gray-300'
                            : 'border-gray-100 text-gray-400 hover:border-gray-300'}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${STATUS_DOT[s]}`} />
                          {STATUS_LABEL[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Groups */}
                {userGroups.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Groups ({userGroups.length})
                    </h3>
                    <div className="space-y-2">
                      {userGroups.map(g => (
                        <button
                          key={g.id}
                          onClick={() => navigate(`/fix/group/${g.id}`)}
                          className="w-full flex items-center gap-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-left"
                        >
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                            style={{ backgroundColor: g.color + '20' }}
                          >
                            {g.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{g.name}</p>
                            <p className="text-xs text-gray-400 truncate">{g.description}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-gray-400">{g.memberIds.length} members</span>
                            <ChevronRight size={13} className="text-gray-300" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Change password (own) */}
                {isMe && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Change Password</h3>
                    <div className="space-y-3">
                      <input type="password" placeholder="Current password"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <input type="password" placeholder="New password"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <input type="password" placeholder="Confirm new password"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <button className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors">
                        Update Password
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Tasks tab ── */}
        {tab === 'tasks' && (
          <div className="p-4 space-y-3">
            {/* Active tasks */}
            {activeTasks.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                  Active ({activeTasks.length})
                </p>
                <div className="space-y-2">
                  {activeTasks.map(task => (
                    <button
                      key={task.id}
                      onClick={() => navigate(`/fix/task/${task.id}`)}
                      className="w-full bg-white border border-gray-100 rounded-2xl p-3.5 hover:shadow-md hover:border-blue-100 active:scale-[0.99] transition-all text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: task.groupColor + '20' }}>
                          <Wrench size={14} style={{ color: task.groupColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">{task.title}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] text-gray-500">{task.groupName}</span>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[task.status]}`}>
                              {STATUS_LABEL2[task.status]}
                            </span>
                            {task.priority && (
                              <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize ${PRIORITY_COLORS[task.priority]}`}>
                                {task.priority}
                              </span>
                            )}
                          </div>
                          {task.createdAt && (
                            <p className="text-[10px] text-gray-400 mt-1.5">
                              Created {format(task.createdAt, 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                        <ChevronRight size={14} className="text-gray-300 flex-shrink-0 mt-1" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recently done */}
            {recentDone.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1 mt-2">
                  Recently Completed
                </p>
                <div className="space-y-2">
                  {recentDone.map(task => (
                    <button
                      key={task.id}
                      onClick={() => navigate(`/fix/task/${task.id}`)}
                      className="w-full bg-white border border-gray-100 rounded-2xl p-3.5 hover:shadow-md hover:border-blue-100 active:scale-[0.99] transition-all text-left opacity-70"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                          <CheckSquare size={14} className="text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 line-clamp-1 line-through">{task.title}</p>
                          <p className="text-[11px] text-gray-400">{task.groupName}</p>
                        </div>
                        <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {userTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
                <CheckSquare size={40} strokeWidth={1.5} />
                <p className="text-sm font-medium text-gray-600">No tasks assigned</p>
                <p className="text-xs text-gray-400">
                  {user.name.split(' ')[0]} has no tasks yet
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Scheduled tab ── */}
        {tab === 'scheduled' && (
          <div className="p-4 space-y-3">
            {userPlanned.length > 0 ? (
              <>
                <p className="text-xs text-gray-400 px-1">
                  {userPlanned.length} scheduled task{userPlanned.length !== 1 ? 's' : ''} assigned to {user.name.split(' ')[0]}
                </p>
                {userPlanned.map(p => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/plan/${p.id}`)}
                    className="w-full bg-white border border-gray-100 rounded-2xl p-3.5 hover:shadow-md hover:border-blue-100 active:scale-[0.99] transition-all text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: p.groupColor + '20' }}>
                        <Calendar size={14} style={{ color: p.groupColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">{p.title}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] text-gray-500">{p.groupName}</span>
                          <span className="text-[11px] font-medium text-blue-600 capitalize">{p.recurrence}</span>
                          {!p.enabled && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Paused</span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1.5">
                          Next: {format(p.scheduledAt, 'MMM d, yyyy')}
                          {p.estimatedMinutes ? ` · ${p.estimatedMinutes} min` : ''}
                        </p>
                      </div>
                      <ChevronRight size={14} className="text-gray-300 flex-shrink-0 mt-1" />
                    </div>
                  </button>
                ))}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
                <Calendar size={40} strokeWidth={1.5} />
                <p className="text-sm font-medium text-gray-600">No scheduled tasks</p>
                <p className="text-xs text-gray-400">
                  {user.name.split(' ')[0]} has no PPM schedules assigned
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Remove confirmation modal */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center" onClick={() => setShowRemoveConfirm(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={22} className="text-red-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 text-center mb-1">Remove Member</h3>
            <p className="text-sm text-gray-500 text-center mb-5">
              Remove <strong>{user.name}</strong> from the team? They will lose access to all groups.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRemoveConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Helper: form field with leading icon */
function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>
        {children}
      </div>
    </div>
  );
}
