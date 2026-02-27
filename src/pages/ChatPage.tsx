import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, MessageSquare, Search, BellOff, Hash,
  UserCircle, X, ChevronRight, Users,
} from 'lucide-react';
import ContextMenu from '../components/ui/ContextMenu';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { currentUser } from '../data/mockData';
import { useNotifications } from '../context/NotificationContext';
import type { ChatChannel } from '../types';

/* ── Mute state persisted to localStorage ── */
function useMuteChannels() {
  const [muted, setMuted] = useState<Set<string>>(() => {
    try {
      const s = localStorage.getItem('neo_muted');
      return new Set(s ? (JSON.parse(s) as string[]) : []);
    } catch { return new Set<string>(); }
  });

  const toggleMute = (id: string) => {
    setMuted(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem('neo_muted', JSON.stringify([...next]));
      return next;
    });
  };

  return { muted, toggleMute };
}

/* ── Emoji choices for new channel ── */
const CHANNEL_EMOJIS = ['📢', '🔧', '📊', '🧹', '🔥', '🔍', '❄️', '🛡️', '🌿', '💼', '⚡', '🏊', '🔑', '🛠️', '📋'];

/* ── New Group Channel Modal ── */
function NewChannelModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (channel: ChatChannel) => void;
}) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📢');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-gray-900">New Group Channel</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Emoji picker */}
        <p className="text-xs font-medium text-gray-500 mb-2">Channel Icon</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {CHANNEL_EMOJIS.map(e => (
            <button
              key={e}
              onClick={() => setIcon(e)}
              className={`w-10 h-10 text-xl rounded-xl border-2 transition-colors ${icon === e ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-gray-50 hover:border-gray-300'}`}
            >
              {e}
            </button>
          ))}
        </div>

        {/* Name */}
        <p className="text-xs font-medium text-gray-500 mb-1.5">Channel Name</p>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Swimming Pool"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => {
              if (!name.trim()) return;
              onCreate({ id: `ch_${Date.now()}`, name: name.trim(), type: 'custom', icon, unread: 0 });
              onClose();
            }}
            disabled={!name.trim()}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium disabled:opacity-40"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── New Direct Message Modal ── */
function NewDMModal({
  onClose,
  onSelect,
  chatChannels,
}: {
  onClose: () => void;
  onSelect: (userId: string, userName: string) => void;
  chatChannels: ChatChannel[];
}) {
  const { teamMembers } = useNotifications();
  const [search, setSearch] = useState('');

  const others = teamMembers.filter(m => m.id !== currentUser.id);
  const filtered = others.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-base font-semibold text-gray-900">New Direct Message</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-2">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search team members..."
              className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Member list */}
        <div className="max-h-72 overflow-y-auto pb-4">
          {filtered.map(member => {
            const existingDM = chatChannels.find(c => c.type === 'dm' && c.dmUserId === member.id);
            const statusColor = member.status === 'online' ? 'bg-green-500' : member.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400';
            return (
              <button
                key={member.id}
                onClick={() => { onSelect(member.id, member.name); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold">
                    {member.name.charAt(0)}
                  </div>
                  <span className={`absolute bottom-0 right-0 w-3 h-3 ${statusColor} rounded-full border-2 border-white`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{member.name}</p>
                  <p className="text-xs text-gray-400">{member.role}</p>
                </div>
                {existingDM ? (
                  <span className="text-xs text-blue-600 flex-shrink-0">Open chat</span>
                ) : (
                  <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                )}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="flex items-center justify-center py-10 text-gray-400 text-sm">No members found</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── + Action Menu ── */
function NewActionMenu({
  onNewChannel,
  onNewDM,
  onClose,
}: {
  onNewChannel: () => void;
  onNewDM: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="absolute right-4 top-14 bg-white rounded-xl shadow-xl border border-gray-100 z-40 overflow-hidden w-52">
        <button
          onClick={() => { onClose(); onNewChannel(); }}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
        >
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Hash size={14} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">New Channel</p>
            <p className="text-[11px] text-gray-400">Create a group channel</p>
          </div>
        </button>
        <div className="h-px bg-gray-100" />
        <button
          onClick={() => { onClose(); onNewDM(); }}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
        >
          <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
            <UserCircle size={14} className="text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Direct Message</p>
            <p className="text-[11px] text-gray-400">Message a team member</p>
          </div>
        </button>
      </div>
    </>
  );
}

/* ── Main Component ── */
export default function ChatPage() {
  const navigate = useNavigate();
  const { chatMessages, chatChannels, addChatChannel, updateChatChannel, teamMembers } = useNotifications();
  const { muted } = useMuteChannels();

  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [showDMModal, setShowDMModal] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'unread'>('all');

  const groupChannels = chatChannels.filter(c => c.type !== 'dm');
  const dmChannels = chatChannels.filter(c => c.type === 'dm');

  const filterChannels = (list: ChatChannel[]) =>
    search ? list.filter(c => c.name.toLowerCase().includes(search.toLowerCase())) : list;

  const filteredGroups = filterChannels(groupChannels);
  const filteredDMs = filterChannels(dmChannels);

  const visibleGroups = filterTab === 'unread'
    ? filteredGroups.filter(c => c.unread > 0 && !muted.has(c.id))
    : filteredGroups;
  const visibleDMs = filterTab === 'unread'
    ? filteredDMs.filter(c => c.unread > 0 && !muted.has(c.id))
    : filteredDMs;

  function getChannelPreview(ch: ChatChannel) {
    const msgs = chatMessages.filter(m => m.channel === ch.id);
    const last = msgs.at(-1);
    return {
      text: last?.text ?? ch.lastMessage ?? '',
      time: last?.timestamp ?? ch.lastTime,
    };
  }

  function getMemberStatus(userId: string) {
    return teamMembers.find(m => m.id === userId)?.status ?? 'offline';
  }

  function formatChannelTime(date: Date): string {
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Yesterday';
    if (isThisWeek(date, { weekStartsOn: 1 })) return format(date, 'EEE');
    return format(date, 'MMM d');
  }

  function handleSelectDMUser(userId: string, userName: string) {
    const existing = chatChannels.find(c => c.type === 'dm' && c.dmUserId === userId);
    if (existing) {
      navigate(`/chat/${existing.id}`);
    } else {
      const newChannel: ChatChannel = {
        id: `dm_${Date.now()}`,
        name: userName,
        type: 'dm',
        dmUserId: userId,
        unread: 0,
      };
      addChatChannel(newChannel);
      navigate(`/chat/${newChannel.id}`);
    }
  }

  const totalUnread = chatChannels.filter(c => !muted.has(c.id)).reduce((s, c) => s + c.unread, 0);

  function ChannelRow({ channel, isDM }: { channel: ChatChannel; isDM: boolean }) {
    const { text, time } = getChannelPreview(channel);
    const isMuted = muted.has(channel.id);
    const { toggleMute } = useMuteChannels();
    const showBadge = !isMuted && channel.unread > 0;
    const statusColor = isDM && channel.dmUserId
      ? getMemberStatus(channel.dmUserId) === 'online' ? 'bg-green-500'
        : getMemberStatus(channel.dmUserId) === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
      : '';

    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

    const contextMenuItems = [
      {
        label: 'Open',
        onClick: () => navigate(`/chat/${channel.id}`),
      },
      {
        label: isMuted ? 'Unmute' : 'Mute notifications',
        onClick: () => toggleMute(channel.id),
      },
      {
        label: 'Mark as read',
        onClick: () => updateChatChannel(channel.id, { unread: 0 }),
      },
    ];

    return (
      <>
      <button
        onClick={() => navigate(`/chat/${channel.id}`)}
        onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY }); }}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left border-b border-gray-100 last:border-b-0"
      >
        {/* Icon / Avatar */}
        {isDM ? (
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold text-lg">
              {channel.name.charAt(0)}
            </div>
            <span className={`absolute bottom-0.5 right-0.5 w-3 h-3 ${statusColor} rounded-full border-2 border-white`} />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl flex-shrink-0">
            {channel.icon ?? <Hash size={20} className="text-blue-400" />}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className={`text-sm font-semibold truncate ${isMuted ? 'text-gray-400' : 'text-gray-900'}`}>
                {channel.name}
              </p>
              {isMuted && <BellOff size={11} className="text-gray-400 flex-shrink-0" />}
            </div>
            {time && (
              <p className="text-[11px] text-gray-400 flex-shrink-0">{formatChannelTime(time)}</p>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p className={`text-xs truncate ${showBadge ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
              {text || 'No messages yet'}
            </p>
            {showBadge && (
              <span className="bg-blue-600 text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 flex-shrink-0">
                {channel.unread}
              </span>
            )}
          </div>
        </div>
      </button>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />
      )}
      </>
    );
  }

  return (
    <div className="h-full flex flex-col relative">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Chat</h1>
          {totalUnread > 0 && (
            <p className="text-xs text-blue-600 font-medium">{totalUnread} unread</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowSearch(v => !v); setSearch(''); }}
            className={`p-2 rounded-xl transition-colors ${showSearch ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:bg-gray-100'}`}
          >
            <Search size={18} />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(v => !v)}
              className="w-9 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <Plus size={18} />
            </button>
            {showMenu && (
              <NewActionMenu
                onNewChannel={() => setShowChannelModal(true)}
                onNewDM={() => setShowDMModal(true)}
                onClose={() => setShowMenu(false)}
              />
            )}
          </div>
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
              placeholder="Search channels and messages…"
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

      {/* Filter tabs */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-gray-100">
        {(['all', 'unread'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab === 'all' ? 'All' : `Unread${totalUnread > 0 ? ` (${totalUnread})` : ''}`}
          </button>
        ))}
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Group Channels ── */}
        <div>
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50/80 border-b border-gray-100 sticky top-0 z-10">
            <div className="flex items-center gap-1.5">
              <Users size={13} className="text-gray-400" />
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Channels</span>
            </div>
            <span className="text-[11px] text-gray-400">{visibleGroups.length}</span>
          </div>

          {visibleGroups.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-400 text-sm">
              {search ? 'No channels match your search' : filterTab === 'unread' ? 'No unread channels' : 'No channels yet'}
            </div>
          ) : (
            visibleGroups.map(ch => <ChannelRow key={ch.id} channel={ch} isDM={false} />)
          )}
        </div>

        {/* ── Direct Messages ── */}
        <div>
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50/80 border-b border-gray-100 border-t border-gray-200 sticky top-0 z-10">
            <div className="flex items-center gap-1.5">
              <UserCircle size={13} className="text-gray-400" />
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Direct Messages</span>
            </div>
            <span className="text-[11px] text-gray-400">{visibleDMs.length}</span>
          </div>

          {visibleDMs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-400">
              <MessageSquare size={28} strokeWidth={1.5} />
              <p className="text-sm">{search ? 'No DMs match your search' : filterTab === 'unread' ? 'No unread messages' : 'No direct messages'}</p>
              {!search && filterTab !== 'unread' && (
                <button
                  onClick={() => setShowDMModal(true)}
                  className="text-xs text-blue-600 font-medium mt-1"
                >
                  Start a conversation
                </button>
              )}
            </div>
          ) : (
            visibleDMs.map(ch => <ChannelRow key={ch.id} channel={ch} isDM={true} />)
          )}
        </div>
      </div>

      {/* Modals */}
      {showChannelModal && (
        <NewChannelModal
          onClose={() => setShowChannelModal(false)}
          onCreate={c => { addChatChannel(c); navigate(`/chat/${c.id}`); }}
        />
      )}
      {showDMModal && (
        <NewDMModal
          onClose={() => setShowDMModal(false)}
          onSelect={handleSelectDMUser}
          chatChannels={chatChannels}
        />
      )}
    </div>
  );
}
