import { useState, useEffect, useRef, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Send, Info, Bell, BellOff,
  Paperclip, Mic, MoreVertical, X, CheckSquare,
  Pin, Smile, Reply, Pencil, Trash2, CheckCheck,
  Users, ChevronDown,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { currentUser } from '../data/mockData';
import { useNotifications } from '../context/NotificationContext';
import type { ChatMessage, Priority } from '../types';

/* ── Quick reactions ── */
const QUICK_REACTIONS = ['👍', '❤️', '😂', '✅', '🔥', '😮'];

/* ── Compose emoji palette ── */
const COMPOSE_EMOJIS = [
  '😀', '😂', '😊', '😍', '🤔', '😢', '😡', '😤', '🥺', '😎',
  '👍', '👎', '👏', '🙌', '💪', '❤️', '🔥', '✅', '❌', '⭐',
  '🎉', '🚨', '⚠️', '📋', '🔧', '🏆', '💬', '📸', '🛠️', '✔️',
];

/* ── Mute state (synced via localStorage) ── */
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

/* ── Date separator label ── */
function dateSeparator(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
}

/* ── Reaction picker overlay ── */
function ReactionPicker({
  onSelect,
  onClose,
  isOwn,
}: {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  isOwn: boolean;
}) {
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className={`absolute ${isOwn ? 'right-0' : 'left-0'} -top-12 bg-white rounded-2xl shadow-xl border border-gray-100 z-40 px-2 py-1.5 flex gap-0.5`}>
        {QUICK_REACTIONS.map(e => (
          <button
            key={e}
            onClick={() => { onSelect(e); onClose(); }}
            className="w-9 h-9 flex items-center justify-center text-xl hover:bg-gray-100 rounded-xl transition-colors"
          >
            {e}
          </button>
        ))}
      </div>
    </>
  );
}

/* ── Message context menu ── */
function MessageMenu({
  isOwn,
  isPinned,
  onReact,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onCreateTask,
  onCopy,
  onClose,
}: {
  isOwn: boolean;
  isPinned: boolean;
  onReact: () => void;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPin: () => void;
  onCreateTask: () => void;
  onCopy: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="absolute right-8 -top-2 bg-white rounded-xl shadow-xl border border-gray-100 z-40 overflow-hidden w-48">
        <button
          onClick={() => { onReact(); onClose(); }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-gray-50 text-left"
        >
          <Smile size={14} className="text-purple-500" />
          <span className="text-sm text-gray-700">Add reaction</span>
        </button>
        <div className="h-px bg-gray-100" />
        <button
          onClick={() => { onReply(); onClose(); }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-gray-50 text-left"
        >
          <Reply size={14} className="text-blue-500" />
          <span className="text-sm text-gray-700">Reply</span>
        </button>
        {isOwn && (
          <>
            <div className="h-px bg-gray-100" />
            <button
              onClick={() => { onEdit(); onClose(); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-gray-50 text-left"
            >
              <Pencil size={14} className="text-gray-500" />
              <span className="text-sm text-gray-700">Edit</span>
            </button>
          </>
        )}
        <div className="h-px bg-gray-100" />
        <button
          onClick={() => { onPin(); onClose(); }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-gray-50 text-left"
        >
          <Pin size={14} className={isPinned ? 'text-orange-500' : 'text-gray-500'} />
          <span className="text-sm text-gray-700">{isPinned ? 'Unpin' : 'Pin message'}</span>
        </button>
        <div className="h-px bg-gray-100" />
        <button
          onClick={() => { onCreateTask(); onClose(); }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-gray-50 text-left"
        >
          <CheckSquare size={14} className="text-blue-600" />
          <span className="text-sm text-gray-700">Create Task</span>
        </button>
        <div className="h-px bg-gray-100" />
        <button
          onClick={() => { onCopy(); onClose(); }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-gray-50 text-left"
        >
          <span className="text-sm text-gray-700">Copy text</span>
        </button>
        {isOwn && (
          <>
            <div className="h-px bg-gray-100" />
            <button
              onClick={() => { onDelete(); onClose(); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-red-50 text-left"
            >
              <Trash2 size={14} className="text-red-500" />
              <span className="text-sm text-red-600">Delete</span>
            </button>
          </>
        )}
      </div>
    </>
  );
}

/* ── Pinned Messages Sheet ── */
function PinnedSheet({
  pinnedMsgs,
  onClose,
  onScrollTo,
}: {
  pinnedMsgs: ChatMessage[];
  onClose: () => void;
  onScrollTo: (id: string) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Pin size={16} className="text-orange-500" />
            <h3 className="text-base font-semibold text-gray-900">Pinned Messages</h3>
            <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{pinnedMsgs.length}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
          {pinnedMsgs.map(msg => (
            <button
              key={msg.id}
              onClick={() => { onScrollTo(msg.id); onClose(); }}
              className="w-full px-4 py-3 hover:bg-gray-50 text-left transition-colors"
            >
              <p className="text-xs font-semibold text-gray-600 mb-0.5">{msg.userName}</p>
              <p className="text-sm text-gray-800 line-clamp-2">{msg.text}</p>
              <p className="text-[10px] text-gray-400 mt-1">{format(msg.timestamp, 'MMM d, HH:mm')}</p>
            </button>
          ))}
          {pinnedMsgs.length === 0 && (
            <div className="flex items-center justify-center py-10 text-gray-400 text-sm">No pinned messages</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Create Task from Message Modal ── */
function CreateTaskModal({
  messageText,
  onClose,
  onSubmit,
}: {
  messageText: string;
  onClose: () => void;
  onSubmit: (title: string, groupId: string, priority: Priority) => void;
}) {
  const { groups } = useNotifications();
  const [title, setTitle] = useState(messageText.substring(0, 120));
  const [groupId, setGroupId] = useState(groups[0]?.id ?? '');
  const [priority, setPriority] = useState<Priority>('medium');

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-5 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckSquare size={18} className="text-blue-600" />
            <h3 className="text-base font-semibold text-gray-900">Create Task</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Group</label>
            <select
              value={groupId}
              onChange={e => setGroupId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.icon} {g.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Priority</label>
            <div className="flex gap-2">
              {(['high', 'medium', 'low'] as Priority[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-colors capitalize ${
                    priority === p
                      ? p === 'high' ? 'bg-red-50 border-red-500 text-red-700'
                        : p === 'medium' ? 'bg-yellow-50 border-yellow-500 text-yellow-700'
                        : 'bg-green-50 border-green-500 text-green-700'
                      : 'border-gray-100 text-gray-400 hover:border-gray-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (title.trim() && groupId) {
                onSubmit(title.trim(), groupId, priority);
                onClose();
              }
            }}
            disabled={!title.trim() || !groupId}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-40 hover:bg-blue-700"
          >
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function ChannelPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    chatMessages, chatChannels, addChatMessage, updateChatMessage, toggleReaction, pinMessage,
    systemMessages, addTask, groups, teamMembers,
  } = useNotifications();
  const { muted, toggleMute } = useMuteChannels();

  const [input, setInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [openMenuMsgId, setOpenMenuMsgId] = useState<string | null>(null);
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState<string | null>(null);
  const [createTaskMsg, setCreateTaskMsg] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showPins, setShowPins] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const msgRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const hasSetUnreadDivider = useRef(false);
  const unreadDividerRef = useRef<string | null>(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const channel = chatChannels.find(c => c.id === id);
  const isMuted = id ? muted.has(id) : false;
  const isDM = channel?.type === 'dm';

  // Merge chat + system messages
  const channelMsgs = chatMessages.filter(m => m.channel === id);
  const sysMsgs = channel
    ? systemMessages.filter(sm =>
        channel.name.toLowerCase().includes(sm.channelHint.toLowerCase()) ||
        sm.channelHint.toLowerCase().includes(channel.name.toLowerCase())
      )
    : [];
  const systemAsChatMsgs: ChatMessage[] = sysMsgs.map(sm => ({
    id: sm.id,
    userId: 'system',
    userName: '🤖 NEO System',
    text: sm.text,
    timestamp: sm.timestamp,
    channel: id!,
  }));

  const allMessages = [...channelMsgs, ...systemAsChatMsgs]
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const pinnedMsgs = allMessages.filter(m => m.pinned && m.userId !== 'system');
  const pinCount = pinnedMsgs.length;

  // Compute unread divider once (before first message from unread batch)
  if (!hasSetUnreadDivider.current && channel?.unread && allMessages.length > 0) {
    hasSetUnreadDivider.current = true;
    const dividerIdx = Math.max(0, allMessages.length - channel.unread);
    if (dividerIdx < allMessages.length) {
      unreadDividerRef.current = allMessages[dividerIdx].id;
    }
  }

  useEffect(() => {
    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [allMessages.length]);

  // Simulated typing indicator: random channel member "types" briefly after you send
  const simulateTyping = () => {
    const channelMembers = teamMembers.filter(m => m.id !== currentUser.id);
    if (channelMembers.length === 0 || isDM) return;
    const idx = Math.floor(Math.random() * Math.min(channelMembers.length, 3));
    const name = channelMembers[idx].name.split(' ')[0];
    setTimeout(() => {
      setTypingUser(name);
      setTimeout(() => setTypingUser(null), 2800);
    }, 600);
  };

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    isAtBottomRef.current = atBottom;
    setShowScrollBtn(!atBottom);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    addChatMessage({
      id: `m${Date.now()}`,
      userId: currentUser.id,
      userName: 'You',
      text: input.trim(),
      timestamp: new Date(),
      channel: id!,
      replyTo: replyingTo ? { messageId: replyingTo.id, userName: replyingTo.userName, text: replyingTo.text } : undefined,
    });
    setInput('');
    setReplyingTo(null);
    simulateTyping();
  };

  const submitEdit = (msgId: string) => {
    if (editText.trim()) {
      updateChatMessage(msgId, { text: editText.trim(), edited: true });
    }
    setEditingMsgId(null);
    setEditText('');
  };

  const handleCreateTask = (title: string, groupId: string, priority: Priority) => {
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
    });
  };

  const scrollToMessage = (msgId: string) => {
    const el = msgRefs.current[msgId];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  if (!channel) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
        <p className="text-lg font-medium text-gray-600">Channel not found</p>
        <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline">
          Back to Chat
        </button>
      </div>
    );
  }

  // Group messages by date
  const grouped: { dateLabel: string; msgs: ChatMessage[] }[] = [];
  for (const msg of allMessages) {
    const label = dateSeparator(msg.timestamp);
    const last = grouped.at(-1);
    if (last && last.dateLabel === label) {
      last.msgs.push(msg);
    } else {
      grouped.push({ dateLabel: label, msgs: [msg] });
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-3 py-3 flex items-center gap-2.5">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl hover:bg-gray-100">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>

        {/* Channel avatar */}
        {isDM ? (
          <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold flex-shrink-0">
            {channel.name.charAt(0)}
          </div>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-xl flex-shrink-0">
            {channel.icon ?? '#'}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{channel.name}</p>
          <p className="text-xs text-gray-400">
            {isDM ? 'Direct message' : `${channel.type === 'custom' ? 'Custom' : 'Group'} channel`}
            {' · '}{allMessages.length} messages
          </p>
        </div>

        {/* Pinned count button */}
        {pinCount > 0 && (
          <button
            onClick={() => setShowPins(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors"
          >
            <Pin size={12} className="text-orange-500" />
            <span className="text-[11px] font-semibold text-orange-600">{pinCount}</span>
          </button>
        )}

        {/* Mute toggle */}
        <button
          onClick={() => id && toggleMute(id)}
          title={isMuted ? 'Unmute channel' : 'Mute channel'}
          className={`p-1.5 rounded-xl transition-colors ${isMuted ? 'text-orange-500 bg-orange-50' : 'text-gray-400 hover:bg-gray-100'}`}
        >
          {isMuted ? <BellOff size={17} /> : <Bell size={17} />}
        </button>

        <button
          onClick={() => { setShowInfo(v => !v); setShowMembers(false); }}
          className={`p-1.5 rounded-xl transition-colors ${showInfo ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:bg-gray-100'}`}
        >
          <Info size={17} />
        </button>
      </div>

      {/* Info panel */}
      {showInfo && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-3">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-xs font-semibold text-blue-800 mb-0.5">{channel.name}</p>
              <p className="text-xs text-blue-600">
                {isDM
                  ? 'Private conversation between you and this team member.'
                  : `Shared channel for ${channel.name} team coordination. All messages are visible to channel members.`}
              </p>
            </div>
            <button onClick={() => setShowInfo(false)} className="text-blue-400 flex-shrink-0">
              <X size={16} />
            </button>
          </div>
          {!isDM && (
            <button
              onClick={() => setShowMembers(v => !v)}
              className="flex items-center gap-1.5 text-xs text-blue-700 font-medium"
            >
              <Users size={13} />
              {showMembers ? 'Hide members' : 'Show members'}
              <ChevronDown size={12} className={`transition-transform ${showMembers ? 'rotate-180' : ''}`} />
            </button>
          )}
          {showMembers && (
            <div className="mt-2 space-y-1.5">
              {teamMembers.slice(0, 6).map(m => {
                const dotColor = m.status === 'online' ? 'bg-green-500' : m.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400';
                return (
                  <div key={m.id} className="flex items-center gap-2">
                    <div className="relative">
                      <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-white text-[10px] font-bold">
                        {m.name.charAt(0)}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 ${dotColor} rounded-full border border-blue-50`} />
                    </div>
                    <span className="text-xs text-blue-800">{m.name}</span>
                    <span className="text-[10px] text-blue-500 capitalize">{m.status}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Muted banner */}
      {isMuted && (
        <div className="bg-orange-50 border-b border-orange-100 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellOff size={13} className="text-orange-500" />
            <p className="text-xs text-orange-700 font-medium">This channel is muted</p>
          </div>
          <button onClick={() => id && toggleMute(id)} className="text-xs text-orange-600 font-semibold">
            Unmute
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="relative flex-1 overflow-hidden">
      <div ref={scrollContainerRef} onScroll={handleScroll} className="h-full overflow-y-auto bg-gray-50 p-4 space-y-1">
        {allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl">
              {isDM ? channel.name.charAt(0) : (channel.icon ?? '#')}
            </div>
            <p className="text-sm font-medium text-gray-600">{channel.name}</p>
            <p className="text-xs text-gray-400">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          grouped.map(group => (
            <div key={group.dateLabel}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium px-2">{group.dateLabel}</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div className="space-y-3">
                {group.msgs.map(msg => {
                  const isOwn = msg.userId === currentUser.id;
                  const isSystem = msg.userId === 'system';
                  const isMenuOpen = openMenuMsgId === msg.id;
                  const isReactionOpen = reactionPickerMsgId === msg.id;
                  const isEditing = editingMsgId === msg.id;

                  return (
                    <Fragment key={msg.id}>
                      {unreadDividerRef.current === msg.id && (
                        <div className="flex items-center gap-3 my-2">
                          <div className="h-px flex-1 bg-blue-200" />
                          <span className="text-xs font-semibold text-blue-500 px-3 py-0.5 bg-blue-50 rounded-full">New messages</span>
                          <div className="h-px flex-1 bg-blue-200" />
                        </div>
                      )}
                      {isSystem ? (
                        <div className="flex justify-center">
                          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 max-w-sm text-center">
                            <p className="text-xs font-semibold text-blue-700 mb-0.5">{msg.userName}</p>
                            <p className="text-xs text-blue-600">{msg.text}</p>
                            <p className="text-[10px] text-blue-400 mt-1">{format(msg.timestamp, 'HH:mm')}</p>
                          </div>
                        </div>
                      ) : (
                    <div
                      ref={el => { msgRefs.current[msg.id] = el; }}
                      className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
                    >
                      {!isOwn && (
                        <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700 flex-shrink-0 mb-0.5">
                          {msg.userName.charAt(0)}
                        </div>
                      )}
                      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[72%] relative`}>
                        {!isOwn && (
                          <span className="text-xs font-medium text-gray-600 mb-1 ml-1">{msg.userName}</span>
                        )}

                        {/* Pinned indicator */}
                        {msg.pinned && (
                          <div className={`flex items-center gap-1 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                            <Pin size={10} className="text-orange-400" />
                            <span className="text-[10px] text-orange-500 font-medium">Pinned</span>
                          </div>
                        )}

                        {/* Bubble */}
                        {msg.deleted ? (
                          <div className="px-4 py-2.5 rounded-2xl bg-gray-100 border border-gray-200 text-sm text-gray-400 italic">
                            Message deleted
                          </div>
                        ) : isEditing ? (
                          <div className="w-full min-w-[200px]">
                            <input
                              autoFocus
                              value={editText}
                              onChange={e => setEditText(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') submitEdit(msg.id);
                                if (e.key === 'Escape') { setEditingMsgId(null); setEditText(''); }
                              }}
                              className="w-full border-2 border-blue-400 rounded-2xl px-4 py-2.5 text-sm focus:outline-none bg-white"
                            />
                            <div className="flex gap-2 mt-1 justify-end">
                              <button
                                onClick={() => { setEditingMsgId(null); setEditText(''); }}
                                className="text-xs text-gray-400 hover:text-gray-600"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => submitEdit(msg.id)}
                                className="text-xs text-blue-600 font-semibold"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                            ${isOwn
                              ? 'bg-blue-600 text-white rounded-br-sm'
                              : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'}`}
                          >
                            {/* Reply-to quote */}
                            {msg.replyTo && (
                              <button
                                onClick={() => scrollToMessage(msg.replyTo!.messageId)}
                                className={`block w-full text-left mb-2 pl-2 border-l-2 ${isOwn ? 'border-blue-300' : 'border-blue-400'} rounded`}
                              >
                                <p className={`text-[10px] font-semibold ${isOwn ? 'text-blue-200' : 'text-blue-600'}`}>
                                  {msg.replyTo.userName}
                                </p>
                                <p className={`text-[11px] truncate ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                                  {msg.replyTo.text}
                                </p>
                              </button>
                            )}
                            {msg.text}
                            {msg.edited && (
                              <span className={`text-[10px] ml-1.5 ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
                                (edited)
                              </span>
                            )}
                          </div>
                        )}

                        {/* Reactions row */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {msg.reactions.map(r => (
                              <button
                                key={r.emoji}
                                onClick={() => toggleReaction(msg.id, r.emoji)}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                                  r.reactedByMe
                                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}
                              >
                                <span>{r.emoji}</span>
                                <span className="font-medium">{r.count}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Timestamp + controls row */}
                        {!msg.deleted && (
                          <div className={`flex items-center gap-1.5 mt-1 mx-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                            <span className="text-[10px] text-gray-400">{format(msg.timestamp, 'HH:mm')}</span>
                            {/* Read receipt for own messages */}
                            {isOwn && (
                              <CheckCheck size={13} className="text-blue-400" />
                            )}
                            {/* Reaction picker trigger */}
                            <div className="relative">
                              <button
                                onClick={() => setReactionPickerMsgId(isReactionOpen ? null : msg.id)}
                                className="p-0.5 rounded hover:bg-gray-200 text-gray-300 hover:text-yellow-500 transition-colors"
                              >
                                <Smile size={11} />
                              </button>
                              {isReactionOpen && (
                                <ReactionPicker
                                  isOwn={isOwn}
                                  onSelect={emoji => toggleReaction(msg.id, emoji)}
                                  onClose={() => setReactionPickerMsgId(null)}
                                />
                              )}
                            </div>
                            {/* Message menu */}
                            <div className="relative">
                              <button
                                onClick={() => setOpenMenuMsgId(isMenuOpen ? null : msg.id)}
                                className="p-0.5 rounded hover:bg-gray-200 text-gray-300 hover:text-gray-500 transition-colors"
                              >
                                <MoreVertical size={12} />
                              </button>
                              {isMenuOpen && (
                                <MessageMenu
                                  isOwn={isOwn}
                                  isPinned={!!msg.pinned}
                                  onReact={() => setReactionPickerMsgId(msg.id)}
                                  onReply={() => setReplyingTo(msg)}
                                  onEdit={() => { setEditingMsgId(msg.id); setEditText(msg.text); }}
                                  onDelete={() => updateChatMessage(msg.id, { deleted: true, text: '' })}
                                  onPin={() => pinMessage(msg.id)}
                                  onCreateTask={() => setCreateTaskMsg(msg.text)}
                                  onCopy={() => navigator.clipboard.writeText(msg.text)}
                                  onClose={() => setOpenMenuMsgId(null)}
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                      )}
                    </Fragment>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {typingUser && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700 flex-shrink-0">
              {typingUser.charAt(0)}
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm shadow-sm px-4 py-3 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
      {showScrollBtn && (
        <button
          onClick={() => {
            isAtBottomRef.current = true;
            setShowScrollBtn(false);
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="absolute bottom-4 right-4 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors z-10"
        >
          <ChevronDown size={20} />
        </button>
      )}
      </div>

      {/* Reply bar */}
      {replyingTo && (
        <div className="bg-blue-50 border-t border-blue-100 px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Reply size={14} className="text-blue-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-blue-700">{replyingTo.userName}</p>
              <p className="text-xs text-blue-600 truncate">{replyingTo.text}</p>
            </div>
          </div>
          <button onClick={() => setReplyingTo(null)} className="text-blue-400 flex-shrink-0">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Input bar */}
      <div className="bg-white border-t border-gray-200 px-3 py-3 relative">
        {showEmojiPicker && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setShowEmojiPicker(false)} />
            <div className="absolute bottom-full left-3 right-3 mb-1 bg-white rounded-2xl border border-gray-200 shadow-xl p-3 z-30">
              <div className="flex flex-wrap gap-1">
                {COMPOSE_EMOJIS.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setInput(prev => prev + e)}
                    className="w-9 h-9 flex items-center justify-center text-xl hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
        <form onSubmit={sendMessage} className="flex items-center gap-2">
          <button
            type="button"
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
            title="Attach file"
          >
            <Paperclip size={18} />
          </button>
          <button
            type="button"
            onClick={() => setShowEmojiPicker(v => !v)}
            className={`p-2 rounded-xl transition-colors flex-shrink-0 ${showEmojiPicker ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-100'}`}
          >
            <Smile size={18} />
          </button>

          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={replyingTo ? `Reply to ${replyingTo.userName}…` : `Message ${channel.name}…`}
            className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 min-w-0"
          />

          {input.trim() ? (
            <button
              type="submit"
              className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors flex-shrink-0"
            >
              <Send size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
              title="Voice message"
            >
              <Mic size={18} />
            </button>
          )}
        </form>
      </div>

      {/* Modals */}
      {createTaskMsg !== null && (
        <CreateTaskModal
          messageText={createTaskMsg}
          onClose={() => setCreateTaskMsg(null)}
          onSubmit={handleCreateTask}
        />
      )}
      {showPins && (
        <PinnedSheet
          pinnedMsgs={pinnedMsgs}
          onClose={() => setShowPins(false)}
          onScrollTo={scrollToMessage}
        />
      )}
    </div>
  );
}
