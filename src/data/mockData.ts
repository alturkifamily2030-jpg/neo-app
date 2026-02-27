import type { Group, Area, Task, PlannedTask, Asset, ChatChannel, ChatMessage, User, MaintenanceRecord, AssetDocument } from '../types';

export const currentUser: User = {
  id: 'u1',
  name: 'A. alturkifamily2030',
  email: 'alturkifamily2030@gmail.com',
  role: 'Admin',
  accountRole: 'account_admin',
  phone: '+971 50 000 0000',
  status: 'online',
  groupIds: ['g1', 'g3', 'g5', 'g7', 'g10'],
  accepted: true,
};

export const teamMembers: User[] = [
  {
    id: 'u1',
    name: 'A. alturkifamily2030',
    email: 'alturkifamily2030@gmail.com',
    role: 'Admin',
    accountRole: 'account_admin',
    phone: '+971 50 000 0000',
    status: 'online',
    groupIds: ['g1', 'g3', 'g5', 'g7', 'g10'],
    accepted: true,
  },
  {
    id: 'u2',
    name: 'Mohammed Al-Rashid',
    email: 'mohammed@neo.app',
    role: 'Maintenance Supervisor',
    accountRole: 'group_admin',
    phone: '+971 55 123 4567',
    status: 'online',
    groupIds: ['g1', 'g7', 'g9'],
    accepted: true,
  },
  {
    id: 'u3',
    name: 'Ahmed Hassan',
    email: 'ahmed@neo.app',
    role: 'Technician',
    accountRole: 'user',
    phone: '+971 56 234 5678',
    status: 'away',
    groupIds: ['g3', 'g7'],
    accepted: true,
  },
  {
    id: 'u4',
    name: 'Khalid Al-Mansouri',
    email: 'khalid@neo.app',
    role: 'Technician',
    accountRole: 'user',
    phone: '+971 50 345 6789',
    status: 'online',
    groupIds: ['g1', 'g3'],
    accepted: true,
  },
  {
    id: 'u5',
    name: 'Fatima Al-Zahra',
    email: 'fatima@neo.app',
    role: 'Housekeeping Manager',
    accountRole: 'group_admin',
    phone: '+971 54 456 7890',
    status: 'online',
    groupIds: ['g16', 'g18'],
    accepted: true,
  },
  {
    id: 'u6',
    name: 'Omar Suleiman',
    email: 'omar@neo.app',
    role: 'Landscape Specialist',
    accountRole: 'user',
    phone: '+971 52 567 8901',
    status: 'offline',
    groupIds: ['g4', 'g15'],
    accepted: true,
  },
  {
    id: 'u7',
    name: 'Sara Al-Khatib',
    email: 'sara@neo.app',
    role: 'Security Officer',
    accountRole: 'user',
    phone: '+971 55 678 9012',
    status: 'online',
    groupIds: ['g17'],
    accepted: true,
  },
  {
    id: 'u8',
    name: 'Rami Al-Turki',
    email: 'rami@neo.app',
    role: 'Operations Manager',
    accountRole: 'group_admin',
    phone: '+971 50 789 0123',
    status: 'away',
    groupIds: ['g5', 'g10', 'g12'],
    accepted: true,
  },
  // ── Invited (pending acceptance) ────────────────────────────
  {
    id: 'u9',
    name: 'David Lee',
    email: 'david.lee@example.com',
    role: 'Maintenance Technician',
    accountRole: 'user',
    status: 'offline',
    groupIds: ['g1'],
    invitedAt: new Date(Date.now() - 86400000),
    accepted: false,
  },
  {
    id: 'u10',
    name: 'Nour Al-Ahmad',
    email: 'nour.ahmad@example.com',
    role: 'Site Inspector',
    accountRole: 'group_admin',
    phone: '+971 56 111 2222',
    status: 'offline',
    groupIds: ['g5'],
    invitedAt: new Date(Date.now() - 2 * 86400000),
    accepted: false,
  },
  {
    id: 'u11',
    name: 'James Okafor',
    email: 'james.okafor@example.com',
    role: 'Electrical Engineer',
    accountRole: 'user',
    status: 'offline',
    groupIds: ['g3'],
    invitedAt: new Date(Date.now() - 4 * 86400000),
    accepted: false,
  },
];

const ALL_MEMBERS = ['u1','u2','u3','u4','u5','u6','u7','u8'];

export const groups: Group[] = [
  { id: 'g1', name: 'Daily Maintenance', description: 'Log Daily active work', icon: '🔧', color: '#3b82f6', counts: { red: 0, yellow: 3, green: 304 }, notificationsOn: false, memberIds: ALL_MEMBERS },
  { id: 'g2', name: 'Carpenter', description: 'Carpenter Work', icon: '🪚', color: '#8b5cf6', counts: { red: 1, yellow: 0, green: 103 }, notificationsOn: false, memberIds: ALL_MEMBERS },
  { id: 'g3', name: 'Electrical/Plumbing work', description: 'New group', icon: '⚡', color: '#6b7280', counts: { red: 3, yellow: 2, green: 347 }, notificationsOn: false, memberIds: ALL_MEMBERS },
  { id: 'g4', name: 'Landscape', description: 'New group', icon: '🌿', color: '#10b981', counts: { red: 0, yellow: 1, green: 62 }, notificationsOn: false, memberIds: ALL_MEMBERS },
  { id: 'g5', name: 'Site Inspections', description: 'Track all site inspection in one place', icon: '🔍', color: '#3b82f6', counts: { red: 1, yellow: 0, green: 3 }, notificationsOn: false, memberIds: ALL_MEMBERS },
  { id: 'g6', name: 'MD Mysa house', description: 'New group', icon: '🏠', color: '#6b7280', counts: { red: 0, yellow: 1, green: 7 }, notificationsOn: false, memberIds: ALL_MEMBERS },
  { id: 'g7', name: 'Engine/Electrick/Mecanical', description: 'New group', icon: '⚙️', color: '#f59e0b', counts: { red: 0, yellow: 3, green: 152 }, notificationsOn: false, memberIds: ALL_MEMBERS },
  { id: 'g8', name: 'Pest Control', description: 'Pest control Scheduling work and maintenance', icon: '🪲', color: '#ef4444', counts: { red: 0, yellow: 0, green: 24 }, notificationsOn: false, memberIds: ALL_MEMBERS },
  { id: 'g9', name: 'AC', description: 'New group', icon: '❄️', color: '#6b7280', counts: { red: 0, yellow: 0, green: 87 }, notificationsOn: false, memberIds: ALL_MEMBERS },
  { id: 'g10', name: 'Fire Safety Checks', description: 'Schedule periodic checks', icon: '🔥', color: '#ef4444', counts: { red: 10, yellow: 0, green: 8 }, notificationsOn: false, memberIds: ALL_MEMBERS },
  { id: 'g11', name: 'MD Rasha', description: 'New group', icon: '👤', color: '#8b5cf6', counts: { red: 0, yellow: 1, green: 7 }, notificationsOn: false, memberIds: ALL_MEMBERS },
  { id: 'g12', name: 'MR Rami', description: 'New group', icon: '👤', color: '#6b7280', counts: { red: 2, yellow: 2, green: 0 }, notificationsOn: false, memberIds: ALL_MEMBERS },
  { id: 'g13', name: 'Lost & Found', description: 'Keep track of items', icon: '🔎', color: '#10b981', counts: { red: 1, yellow: 1, green: 2 }, notificationsOn: false, memberIds: ALL_MEMBERS },
  { id: 'g14', name: 'MD Maha', description: 'New group', icon: '👤', color: '#3b82f6', counts: { red: 0, yellow: 0, green: 4 }, notificationsOn: false, memberIds: ALL_MEMBERS },
  { id: 'g15', name: 'Equipment Tracking', description: 'A simple asset tracking group', icon: '📍', color: '#3b82f6', counts: { red: 0, yellow: 3, green: 0 }, notificationsOn: false, memberIds: ALL_MEMBERS },
  { id: 'g16', name: 'Housekeeping', description: 'Log tasks for housekeeping', icon: '🧹', color: '#10b981', counts: { red: 0, yellow: 0, green: 1 }, notificationsOn: false, memberIds: ALL_MEMBERS },
  { id: 'g17', name: 'Accident / Incident Reports', description: 'Keep track of any incidents', icon: '⚠️', color: '#ef4444', counts: { red: 0, yellow: 0, green: 1 }, notificationsOn: false, memberIds: ALL_MEMBERS },
  { id: 'g18', name: 'Butler', description: 'New group', icon: '🤵', color: '#10b981', counts: { red: 0, yellow: 0, green: 0 }, notificationsOn: false, memberIds: ALL_MEMBERS },
  { id: 'g19', name: 'Guest', description: 'Event Schedule', icon: '🎭', color: '#6b7280', counts: { red: 0, yellow: 0, green: 10 }, notificationsOn: false, memberIds: ALL_MEMBERS },
  { id: 'g_family', name: 'Family', description: 'Family requests & tasks', icon: '🏡', color: '#8b5cf6', counts: { red: 0, yellow: 0, green: 0 }, notificationsOn: true, memberIds: ALL_MEMBERS },
];

export const areas: Area[] = [
  { id: 'a1', name: 'Barefoot Kids room', description: '-', counts: { red: 0, yellow: 0, green: 4 } },
  { id: 'a2', name: 'Barefoot Kids room toilet', description: '-', counts: { red: 0, yellow: 0, green: 1 } },
  { id: 'a3', name: 'Barefoot Kitchen', description: '-', counts: { red: 0, yellow: 0, green: 2 } },
  { id: 'a4', name: 'Barefoot Main Hall', description: 'Main Hall', counts: { red: 0, yellow: 0, green: 2 } },
  { id: 'a5', name: 'Barefoot Main Toilet', description: '-', counts: { red: 0, yellow: 0, green: 0 } },
  { id: 'a6', name: 'Barefoot Outside Zone', description: '-', counts: { red: 0, yellow: 0, green: 17 } },
  { id: 'a7', name: 'Barefoot Pantry', description: '-', counts: { red: 0, yellow: 0, green: 0 } },
  { id: 'a8', name: 'Barefoot Staff Coridor', description: '-', counts: { red: 0, yellow: 0, green: 0 } },
  { id: 'a9', name: 'Barefoot Stff Toilet', description: '-', counts: { red: 0, yellow: 0, green: 0 } },
  { id: 'a10', name: 'Beach Club', description: '-', counts: { red: 0, yellow: 0, green: 6 } },
  { id: 'a11', name: 'BOH A Zone', description: '-', counts: { red: 0, yellow: 2, green: 6 } },
  { id: 'a12', name: 'BOH accomodation old', description: '-', counts: { red: 0, yellow: 0, green: 1 } },
  { id: 'a13', name: 'BOH B Zone', description: '-', counts: { red: 1, yellow: 1, green: 4 } },
  { id: 'a14', name: 'Cup Building', description: '-', counts: { red: 0, yellow: 1, green: 1 } },
  { id: 'a15', name: 'Date palms', description: '-', counts: { red: 0, yellow: 0, green: 8 } },
  { id: 'a16', name: 'Dining Bar', description: '-', counts: { red: 0, yellow: 0, green: 0 } },
  { id: 'a17', name: 'Dining Guest Toilet', description: '-', counts: { red: 0, yellow: 0, green: 0 } },
  { id: 'a18', name: 'Dining Kitchen', description: '-', counts: { red: 1, yellow: 0, green: 13 } },
  { id: 'a19', name: 'Dining Main Hall', description: '-', counts: { red: 0, yellow: 1, green: 2 } },
  { id: 'a20', name: 'Dining Outside Zone', description: '-', counts: { red: 0, yellow: 0, green: 3 } },
  { id: 'a21', name: 'Driver Building', description: '-', counts: { red: 0, yellow: 0, green: 1 } },
  { id: 'a22', name: 'Farm House', description: '-', counts: { red: 0, yellow: 1, green: 5 } },
  { id: 'a23', name: 'Generator Room', description: '-', counts: { red: 0, yellow: 0, green: 3 } },
  { id: 'a24', name: 'Guest House', description: '-', counts: { red: 0, yellow: 2, green: 12 } },
  { id: 'a25', name: 'Main Entrance', description: '-', counts: { red: 0, yellow: 0, green: 5 } },
  { id: 'a26', name: 'Pool Area', description: '-', counts: { red: 1, yellow: 0, green: 8 } },
  { id: 'a27', name: 'Security Post', description: '-', counts: { red: 0, yellow: 0, green: 2 } },
  { id: 'a28', name: 'Staff Accommodation', description: '-', counts: { red: 0, yellow: 1, green: 7 } },
  { id: 'a29', name: 'Store Room', description: '-', counts: { red: 0, yellow: 0, green: 4 } },
  { id: 'a30', name: 'Workshop', description: '-', counts: { red: 0, yellow: 2, green: 9 } },
];

const now = new Date();
const d = (daysAgo: number, hour = 8, min = 0) => {
  const dt = new Date(now);
  dt.setDate(dt.getDate() - daysAgo);
  dt.setHours(hour, min, 0, 0);
  return dt;
};

export const tasks: Task[] = [
  { id: 't1',  title: 'dyna and jcb put diesel',                      groupId: 'g1',  groupName: 'Daily Maintenance',          groupColor: '#3b82f6', areaId: 'a23', status: 'done',        priority: 'medium', image: 'https://picsum.photos/seed/t1/80/80',  createdAt: d(0, 12, 50), assignees: ['u2'], comments: [], tags: { location: 'Generator Room', equipment: 'Dyna Truck', category: 'Maintenance' }, assetId: 'as4', assetName: 'Dyna Truck (Toyota)' },
  { id: 't2',  title: 'guest house indoor repairs',                    groupId: 'g2',  groupName: 'Carpenter',                  groupColor: '#8b5cf6', areaId: 'a24', status: 'done',        priority: 'medium', image: 'https://picsum.photos/seed/t2/80/80',  createdAt: d(0, 12,  5), assignees: ['u4'], comments: [], tags: { location: 'Guest House', category: 'Repair' } },
  { id: 't3',  title: 'evi bycicle servicing',                         groupId: 'g1',  groupName: 'Daily Maintenance',          groupColor: '#3b82f6', areaId: 'a11', status: 'done',        priority: 'medium', image: 'https://picsum.photos/seed/t3/80/80',  createdAt: d(0, 11, 47), assignees: ['u3'], comments: [], tags: { equipment: 'Bicycle', category: 'Maintenance' } },
  { id: 't4',  title: 'fresh harvest to main kitchen',                 groupId: 'g1',  groupName: 'Daily Maintenance',          groupColor: '#3b82f6', areaId: 'a3',  status: 'done',        priority: 'low',    image: 'https://picsum.photos/seed/t4/80/80',  createdAt: d(0,  8, 19), assignees: [], comments: [], tags: { location: 'Barefoot Kitchen', category: 'Operations' } },
  { id: 't5',  title: 'Guest house entrance water coming',             groupId: 'g1',  groupName: 'Daily Maintenance',          groupColor: '#3b82f6', areaId: 'a24', status: 'done',        priority: 'high',   image: 'https://picsum.photos/seed/t5/80/80',  createdAt: d(0,  7, 54), assignees: ['u2', 'u4'], comments: [], tags: { location: 'Guest House', category: 'Repair' } },
  { id: 't6',  title: 'bycicle servicing',                             groupId: 'g1',  groupName: 'Daily Maintenance',          groupColor: '#3b82f6', areaId: 'a11', status: 'done',        priority: 'medium', image: 'https://picsum.photos/seed/t6/80/80',  createdAt: d(0,  7, 48), assignees: [], comments: [], tags: { equipment: 'Bicycle', category: 'Maintenance' } },
  { id: 't7',  title: 'showerRoom cartn fixing',                       groupId: 'g2',  groupName: 'Carpenter',                  groupColor: '#8b5cf6', areaId: 'a1',  status: 'open',        priority: 'high',   image: 'https://picsum.photos/seed/t7/80/80',  createdAt: d(0,  7, 34), assignees: ['u4'], comments: [], tags: { location: 'Barefoot Kids room', category: 'Repair' } },
  { id: 't8',  title: 'saudi ready mix mechanic remove hydraulic hose',groupId: 'g1',  groupName: 'Daily Maintenance',          groupColor: '#3b82f6', areaId: 'a30', status: 'done',        priority: 'medium', image: 'https://picsum.photos/seed/t8/80/80',  createdAt: d(0,  5, 59), assignees: ['u2'], comments: [], tags: { location: 'Workshop', equipment: 'JCB', category: 'Repair' }, assetId: 'as3', assetName: 'JCB Backhoe Loader' },
  { id: 't9',  title: 'JCB hydrauluc pressure pipe broken',            groupId: 'g7',  groupName: 'Engine/Electrick/Mecanical', groupColor: '#f59e0b', areaId: 'a30', status: 'in_progress', priority: 'high',   image: 'https://picsum.photos/seed/t9/80/80',  createdAt: d(0,  5, 30), assignees: ['u2', 'u3'], comments: [], tags: { location: 'Workshop', equipment: 'JCB', category: 'Repair' }, assetId: 'as3', assetName: 'JCB Backhoe Loader' },
  { id: 't10', title: 'Pool pump maintenance check',                   groupId: 'g3',  groupName: 'Electrical/Plumbing work',   groupColor: '#6b7280', areaId: 'a26', status: 'in_progress', priority: 'medium', image: 'https://picsum.photos/seed/t10/80/80', createdAt: d(1, 14, 20), assignees: ['u3'], comments: [], tags: { location: 'Pool Area', equipment: 'Pool Pump', category: 'Inspection' }, assetId: 'as5', assetName: 'Pool Pump – Main Pool' },
  { id: 't11', title: 'AC unit filter replacement - Guest Suite 3',    groupId: 'g9',  groupName: 'AC',                         groupColor: '#6b7280', areaId: 'a24', status: 'open',        priority: 'high',   image: 'https://picsum.photos/seed/t11/80/80', createdAt: d(1, 10,  5), assignees: ['u8'], comments: [], tags: { location: 'Guest House', equipment: 'AC Unit', category: 'Maintenance' } },
  { id: 't12', title: 'Garden irrigation system leak',                 groupId: 'g4',  groupName: 'Landscape',                  groupColor: '#10b981', areaId: 'a15', status: 'done',        priority: 'medium', image: 'https://picsum.photos/seed/t12/80/80', createdAt: d(1,  9, 30), assignees: ['u6'], comments: [], tags: { location: 'Date palms', category: 'Repair' } },
  { id: 't13', title: 'Fire extinguisher inspection - Block A',        groupId: 'g10', groupName: 'Fire Safety Checks',         groupColor: '#ef4444', areaId: 'a13', status: 'open',        priority: 'high',   image: 'https://picsum.photos/seed/t13/80/80', createdAt: d(2, 11,  0), assignees: ['u7', 'u8'], comments: [], tags: { location: 'BOH B Zone', equipment: 'Fire Extinguisher', category: 'Inspection' } },
  { id: 't14', title: 'Pest control - kitchen area',                   groupId: 'g8',  groupName: 'Pest Control',               groupColor: '#ef4444', areaId: 'a18', status: 'done',        priority: 'medium', image: 'https://picsum.photos/seed/t14/80/80', createdAt: d(2,  8, 45), assignees: [], comments: [], tags: { location: 'Dining Kitchen', category: 'Maintenance' } },
  { id: 't15', title: 'Lost item: guest wallet found at pool',         groupId: 'g13', groupName: 'Lost & Found',               groupColor: '#10b981', areaId: 'a26', status: 'in_progress', priority: 'medium', image: 'https://picsum.photos/seed/t15/80/80', createdAt: d(3, 16, 20), assignees: ['u7'], comments: [], tags: { location: 'Pool Area', category: 'Operations' } },
];

export const plannedTasks: PlannedTask[] = [
  // Daily
  { id: 'p1', title: 'Daily lobby cleanliness inspection', groupId: 'g5', groupName: 'Site Inspections', groupColor: '#3b82f6', scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0), recurrence: 'daily', enabled: true, priority: 'low', estimatedMinutes: 15, image: 'https://picsum.photos/seed/p1/80/80', description: 'Check lobby areas for cleanliness and presentation standards.' },
  // Weekly
  { id: 'p2', title: 'Inspection Accommodation Part B', groupId: 'g5', groupName: 'Site Inspections', groupColor: '#3b82f6', scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 0), recurrence: 'weekly', enabled: true, priority: 'high', estimatedMinutes: 60, image: 'https://picsum.photos/seed/p2/80/80' },
  { id: 'p3', title: 'RO system back wash', groupId: 'g3', groupName: 'Electrical/Plumbing work', groupColor: '#6b7280', scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 30), recurrence: 'weekly', enabled: true, priority: 'medium', estimatedMinutes: 30, assetId: 'as12', assetName: 'RO Water Purification System', image: 'https://picsum.photos/seed/p3/80/80' },
  { id: 'p4', title: 'Staff accommodation inspection Part A', groupId: 'g5', groupName: 'Site Inspections', groupColor: '#3b82f6', scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 8, 0), recurrence: 'weekly', enabled: true, priority: 'high', estimatedMinutes: 90, image: 'https://picsum.photos/seed/p4/80/80' },
  { id: 'p5', title: 'Weekly AC filter check', groupId: 'g9', groupName: 'AC', groupColor: '#6b7280', scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 9, 0), recurrence: 'weekly', enabled: true, priority: 'medium', estimatedMinutes: 45, image: 'https://picsum.photos/seed/p5/80/80' },
  // Bi-weekly
  { id: 'p6', title: 'Bi-weekly fire extinguisher check', groupId: 'g10', groupName: 'Fire Safety Checks', groupColor: '#ef4444', scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 4, 10, 0), recurrence: 'biweekly', enabled: true, priority: 'high', estimatedMinutes: 30, image: 'https://picsum.photos/seed/p6/80/80', description: 'Check all fire extinguishers for pressure, seals, and accessibility.' },
  // Monthly
  { id: 'p7', title: 'Fire safety monthly inspection', groupId: 'g10', groupName: 'Fire Safety Checks', groupColor: '#ef4444', scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5, 10, 0), recurrence: 'monthly', enabled: true, priority: 'high', estimatedMinutes: 120, image: 'https://picsum.photos/seed/p7/80/80' },
  { id: 'p8', title: 'Monthly legionella water temperature check', groupId: 'g3', groupName: 'Electrical/Plumbing work', groupColor: '#6b7280', scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 6, 9, 0), recurrence: 'monthly', enabled: true, priority: 'high', estimatedMinutes: 45, image: 'https://picsum.photos/seed/p8/80/80', description: 'Test and record hot/cold water temperatures at all designated outlets.' },
  { id: 'p9', title: 'Pest control full property', groupId: 'g8', groupName: 'Pest Control', groupColor: '#ef4444', scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 7, 0), recurrence: 'monthly', enabled: false, priority: 'low', estimatedMinutes: 180, image: 'https://picsum.photos/seed/p9/80/80' },
  // Quarterly
  { id: 'p10', title: 'Quarterly pool chemical balance check', groupId: 'g3', groupName: 'Electrical/Plumbing work', groupColor: '#6b7280', scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 10, 8, 0), recurrence: 'quarterly', enabled: true, priority: 'medium', estimatedMinutes: 60, image: 'https://picsum.photos/seed/p10/80/80', description: 'Test pH, chlorine, and alkalinity levels. Adjust chemical dosing as needed.' },
  // Yearly
  { id: 'p11', title: 'Annual main generator service', groupId: 'g3', groupName: 'Electrical/Plumbing work', groupColor: '#6b7280', scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14, 6, 0), recurrence: 'yearly', enabled: true, priority: 'high', estimatedMinutes: 240, assetId: 'as1', assetName: 'Main Generator (CAT 500kVA)', image: 'https://picsum.photos/seed/p11/80/80', description: 'Full annual service: oil change, filters, belts, coolant flush, and full load test.' },
  { id: 'p12', title: 'Annual fire suppression system test', groupId: 'g10', groupName: 'Fire Safety Checks', groupColor: '#ef4444', scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 20, 10, 0), recurrence: 'yearly', enabled: true, priority: 'high', estimatedMinutes: 180, image: 'https://picsum.photos/seed/p12/80/80', description: 'Full functional test of all fire suppression systems. Third-party certified contractor required.' },
];

const mRec = (id: string, daysAgo: number, type: MaintenanceRecord['type'], desc: string, cost: number, tech: string): MaintenanceRecord => ({
  id, date: d(daysAgo), type, description: desc, cost, technician: tech,
});
const aDoc = (id: string, name: string, type: AssetDocument['type'], fileType: AssetDocument['fileType'], daysAgo: number): AssetDocument => ({
  id, name, type, fileType, uploadedAt: d(daysAgo),
});

export const assets: Asset[] = [
  {
    id: 'as1', name: 'Main Generator (CAT 500kVA)', category: 'Power', location: 'Generator Room',
    serialNumber: 'CAT-2019-001', status: 'active', purchaseDate: new Date(2019, 3, 15),
    criticality: 'high', model: '500 EKWM', manufacturer: 'Caterpillar', warrantyExpiry: new Date(2026, 3, 15),
    installDate: new Date(2019, 4, 1), purchasePrice: 85000, vendorName: 'Gulf Power Systems',
    vendorContact: '+971 4 234 5678', qrCode: 'QR-as1-CAT500', nfcTagId: 'NFC-as1',
    notes: 'Critical power backup. Test monthly under load. Change oil every 500 hours.',
    maintenanceHistory: [
      mRec('mr1-1', 14,  'pm',       'Monthly load test and oil level check',           120,  'Tom Wilson'),
      mRec('mr1-2', 45,  'inspection','Annual service — filters, coolant, belts replaced',2800, 'Gulf Power Systems'),
      mRec('mr1-3', 90,  'repair',   'Starter motor replacement',                        950,  'Tom Wilson'),
      mRec('mr1-4', 180, 'pm',       'Bi-annual service',                                2400, 'Gulf Power Systems'),
    ],
    assetDocuments: [
      aDoc('d1-1', 'CAT 500 Operator Manual',      'manual',      'pdf', 500),
      aDoc('d1-2', 'Warranty Certificate 2019',     'warranty',    'pdf', 490),
      aDoc('d1-3', 'Annual Service Report 2024',    'inspection',  'pdf', 45),
    ],
  },
  {
    id: 'as2', name: 'Backup Generator (Perkins)', category: 'Power', location: 'Generator Room',
    serialNumber: 'PK-2020-007', status: 'maintenance', purchaseDate: new Date(2020, 7, 10),
    criticality: 'high', model: 'P88-5S', manufacturer: 'Perkins', warrantyExpiry: new Date(2025, 7, 10),
    installDate: new Date(2020, 8, 5), purchasePrice: 42000, vendorName: 'Gulf Power Systems',
    vendorContact: '+971 4 234 5678', qrCode: 'QR-as2-PKS88', nfcTagId: 'NFC-as2',
    notes: 'Currently under repair — fuel injector fault. Estimated return to service: 3 days.',
    maintenanceHistory: [
      mRec('mr2-1', 2,   'repair',    'Fuel injector fault — repair in progress',         0,    'Gulf Power Services'),
      mRec('mr2-2', 30,  'pm',        'Monthly test run and filter check',                80,   'Tom Wilson'),
      mRec('mr2-3', 120, 'inspection','Annual service',                                   1800, 'Gulf Power Systems'),
    ],
    assetDocuments: [
      aDoc('d2-1', 'Perkins P88 Manual',            'manual',      'pdf', 400),
      aDoc('d2-2', 'Warranty Certificate',           'warranty',    'pdf', 380),
    ],
  },
  {
    id: 'as3', name: 'JCB Backhoe Loader', category: 'Vehicle', location: 'Workshop',
    serialNumber: 'JCB-3CX-2021', status: 'active', purchaseDate: new Date(2021, 1, 20),
    criticality: 'medium', model: '3CX', manufacturer: 'JCB', warrantyExpiry: new Date(2026, 1, 20),
    installDate: new Date(2021, 2, 1), purchasePrice: 95000, vendorName: 'Al-Futtaim Machinery',
    vendorContact: '+971 4 887 0000', qrCode: 'QR-as3-JCB3CX', nfcTagId: undefined,
    notes: 'Hydraulic hose recently repaired. Service every 500 operating hours.',
    maintenanceHistory: [
      mRec('mr3-1', 3,   'repair',    'Hydraulic pressure pipe replacement',              430,  'Tom Wilson'),
      mRec('mr3-2', 60,  'pm',        '500-hour engine oil and filter service',           680,  'Al-Futtaim Machinery'),
      mRec('mr3-3', 150, 'inspection','Annual safety and roadworthiness inspection',      350,  'Al-Futtaim Machinery'),
    ],
    assetDocuments: [
      aDoc('d3-1', 'JCB 3CX Operator Manual',       'manual',      'pdf', 600),
      aDoc('d3-2', 'Annual Inspection Certificate',  'certificate', 'pdf', 150),
    ],
  },
  {
    id: 'as4', name: 'Dyna Truck (Toyota)', category: 'Vehicle', location: 'Workshop',
    serialNumber: 'TYT-DYNA-2018', status: 'active', purchaseDate: new Date(2018, 5, 5),
    criticality: 'medium', model: 'Dyna 200', manufacturer: 'Toyota', warrantyExpiry: new Date(2023, 5, 5),
    installDate: new Date(2018, 5, 10), purchasePrice: 38000, vendorName: 'Al-Futtaim Toyota',
    vendorContact: '+971 4 800 8888', qrCode: 'QR-as4-DYNA', nfcTagId: undefined,
    notes: 'Diesel filled regularly. Next service at 150,000 km.',
    maintenanceHistory: [
      mRec('mr4-1', 7,   'pm',        'Diesel top-up and tyre pressure check',            40,   'John Smith'),
      mRec('mr4-2', 35,  'pm',        'Engine oil + filter change',                       280,  'John Smith'),
      mRec('mr4-3', 200, 'inspection','Annual vehicle inspection',                         250,  'Al-Futtaim Toyota'),
    ],
    assetDocuments: [
      aDoc('d4-1', 'Vehicle Registration 2024',      'certificate', 'pdf', 50),
      aDoc('d4-2', 'Insurance Policy',               'invoice',     'pdf', 50),
    ],
  },
  {
    id: 'as5', name: 'Pool Pump – Main Pool', category: 'Pool', location: 'Pool Area',
    serialNumber: 'PP-MAIN-2020', status: 'active', purchaseDate: new Date(2020, 2, 12),
    criticality: 'high', model: 'EnergyLine Pro 11', manufacturer: 'Hayward', warrantyExpiry: new Date(2025, 2, 12),
    installDate: new Date(2020, 2, 20), purchasePrice: 8500, vendorName: 'Aqua Tech Middle East',
    vendorContact: '+971 4 330 9900', qrCode: 'QR-as5-PPMP', nfcTagId: 'NFC-as5',
    notes: 'Run 18 hours/day. Check pressure daily. Last seal replacement was satisfactory.',
    maintenanceHistory: [
      mRec('mr5-1', 1,   'pm',        'Daily pressure and flow rate check',               0,    'Mohammed Al-Rashid'),
      mRec('mr5-2', 14,  'repair',    'Mechanical seal replacement',                      320,  'Aqua Tech ME'),
      mRec('mr5-3', 90,  'inspection','Quarterly pump service and impeller check',        480,  'Aqua Tech ME'),
    ],
    assetDocuments: [
      aDoc('d5-1', 'Hayward EnergyLine Manual',      'manual',      'pdf', 700),
      aDoc('d5-2', 'Quarterly Service Report',        'inspection',  'pdf', 90),
    ],
  },
  {
    id: 'as6', name: 'Pool Pump – Kids Pool', category: 'Pool', location: 'Pool Area',
    serialNumber: 'PP-KIDS-2020', status: 'maintenance', purchaseDate: new Date(2020, 2, 12),
    criticality: 'medium', model: 'EnergyLine Pro 7', manufacturer: 'Hayward', warrantyExpiry: new Date(2025, 2, 12),
    installDate: new Date(2020, 2, 20), purchasePrice: 5200, vendorName: 'Aqua Tech Middle East',
    vendorContact: '+971 4 330 9900', qrCode: 'QR-as6-PPKD', nfcTagId: undefined,
    notes: 'Bearings worn — awaiting replacement parts from supplier.',
    maintenanceHistory: [
      mRec('mr6-1', 3,   'repair',    'Bearing wear detected — parts ordered',             0,    'Mohammed Al-Rashid'),
      mRec('mr6-2', 60,  'pm',        'Quarterly service',                                350,  'Aqua Tech ME'),
    ],
    assetDocuments: [
      aDoc('d6-1', 'Hayward Pro 7 Manual',           'manual',      'pdf', 700),
    ],
  },
  {
    id: 'as7', name: 'RO Water System Unit 1', category: 'Plumbing', location: 'BOH A Zone',
    serialNumber: 'RO-001-2019', status: 'active', purchaseDate: new Date(2019, 8, 22),
    criticality: 'high', model: 'RO-5000GPD', manufacturer: 'Pentair', warrantyExpiry: new Date(2024, 8, 22),
    installDate: new Date(2019, 9, 5), purchasePrice: 22000, vendorName: 'Water Solutions LLC',
    vendorContact: '+971 4 556 7788', qrCode: 'QR-as7-RO1', nfcTagId: 'NFC-as7',
    notes: 'Back-wash every Monday and Thursday. Replace membranes annually.',
    maintenanceHistory: [
      mRec('mr7-1', 4,   'pm',        'Back-wash cycle completed',                         0,    'Mohammed Al-Rashid'),
      mRec('mr7-2', 11,  'pm',        'Back-wash cycle completed',                         0,    'Mohammed Al-Rashid'),
      mRec('mr7-3', 120, 'replacement','Annual membrane replacement',                      3200, 'Water Solutions LLC'),
    ],
    assetDocuments: [
      aDoc('d7-1', 'RO System Manual',               'manual',      'pdf', 800),
      aDoc('d7-2', 'Membrane Change Record',          'inspection',  'pdf', 120),
    ],
  },
  {
    id: 'as8', name: 'RO Water System Unit 2', category: 'Plumbing', location: 'BOH A Zone',
    serialNumber: 'RO-002-2021', status: 'active', purchaseDate: new Date(2021, 0, 8),
    criticality: 'high', model: 'RO-5000GPD', manufacturer: 'Pentair', warrantyExpiry: new Date(2026, 0, 8),
    installDate: new Date(2021, 1, 1), purchasePrice: 22000, vendorName: 'Water Solutions LLC',
    vendorContact: '+971 4 556 7788', qrCode: 'QR-as8-RO2', nfcTagId: 'NFC-as8',
    notes: 'Back-wash every Tuesday and Friday.',
    maintenanceHistory: [
      mRec('mr8-1', 3,   'pm',        'Back-wash cycle completed',                         0,    'Mohammed Al-Rashid'),
      mRec('mr8-2', 90,  'inspection','6-month membrane pressure test',                    180,  'Water Solutions LLC'),
    ],
    assetDocuments: [
      aDoc('d8-1', 'RO System Manual',               'manual',      'pdf', 800),
    ],
  },
  {
    id: 'as9', name: 'Central AC Chiller', category: 'HVAC', location: 'BOH B Zone',
    serialNumber: 'AC-CHLL-2020', status: 'active', purchaseDate: new Date(2020, 10, 1),
    criticality: 'high', model: 'YVAA0190', manufacturer: 'York', warrantyExpiry: new Date(2025, 10, 1),
    installDate: new Date(2020, 11, 15), purchasePrice: 180000, vendorName: 'Johnson Controls ME',
    vendorContact: '+971 4 802 5500', qrCode: 'QR-as9-CHLL', nfcTagId: 'NFC-as9',
    notes: 'Critical system. Monthly service by Johnson Controls. Do not adjust setpoints without authorisation.',
    maintenanceHistory: [
      mRec('mr9-1', 10,  'pm',        'Monthly chiller service — refrigerant check',      580,  'Johnson Controls ME'),
      mRec('mr9-2', 40,  'pm',        'Monthly service',                                  580,  'Johnson Controls ME'),
      mRec('mr9-3', 180, 'inspection','Annual compressor inspection',                     4200, 'Johnson Controls ME'),
      mRec('mr9-4', 365, 'replacement','Condenser coil cleaning and refrigerant top-up',  2800, 'Johnson Controls ME'),
    ],
    assetDocuments: [
      aDoc('d9-1', 'York YVAA Service Manual',       'manual',      'pdf', 700),
      aDoc('d9-2', 'Annual Inspection Report 2024',  'inspection',  'pdf', 40),
      aDoc('d9-3', 'Refrigerant Handling Certificate','certificate', 'pdf', 180),
    ],
  },
  {
    id: 'as10', name: 'Guest House AC – Suite 1', category: 'HVAC', location: 'Guest House',
    serialNumber: 'GH-AC-S1-22', status: 'active', purchaseDate: new Date(2022, 4, 30),
    criticality: 'medium', model: 'RAV-SM1104AT', manufacturer: 'Toshiba', warrantyExpiry: new Date(2027, 4, 30),
    installDate: new Date(2022, 5, 10), purchasePrice: 3800, vendorName: 'Cool Tech LLC',
    vendorContact: '+971 4 445 6677', qrCode: 'QR-as10-GHS1', nfcTagId: undefined,
    notes: 'Filter cleaned monthly. Guest comfort critical.',
    maintenanceHistory: [
      mRec('mr10-1', 5,  'pm',        'Filter clean and coil wash',                        60,   'Ahmed Al-Rashid'),
      mRec('mr10-2', 35, 'pm',        'Filter clean',                                      40,   'Ahmed Al-Rashid'),
      mRec('mr10-3', 180,'inspection','Annual AC service',                                 320,  'Cool Tech LLC'),
    ],
    assetDocuments: [
      aDoc('d10-1', 'Toshiba AC Manual',             'manual',      'pdf', 600),
    ],
  },
  {
    id: 'as11', name: 'Guest House AC – Suite 2', category: 'HVAC', location: 'Guest House',
    serialNumber: 'GH-AC-S2-22', status: 'active', purchaseDate: new Date(2022, 4, 30),
    criticality: 'medium', model: 'RAV-SM1104AT', manufacturer: 'Toshiba', warrantyExpiry: new Date(2027, 4, 30),
    installDate: new Date(2022, 5, 10), purchasePrice: 3800, vendorName: 'Cool Tech LLC',
    vendorContact: '+971 4 445 6677', qrCode: 'QR-as11-GHS2', nfcTagId: undefined,
    notes: 'Filter cleaned monthly.',
    maintenanceHistory: [
      mRec('mr11-1', 5,  'pm',        'Filter clean and coil wash',                        60,   'Ahmed Al-Rashid'),
      mRec('mr11-2', 180,'inspection','Annual AC service',                                 320,  'Cool Tech LLC'),
    ],
    assetDocuments: [
      aDoc('d11-1', 'Toshiba AC Manual',             'manual',      'pdf', 600),
    ],
  },
  {
    id: 'as12', name: 'Kitchen Industrial Oven', category: 'Kitchen', location: 'Dining Kitchen',
    serialNumber: 'KO-IND-2019', status: 'active', purchaseDate: new Date(2019, 6, 18),
    criticality: 'medium', model: 'M200-GX', manufacturer: 'Rational', warrantyExpiry: new Date(2024, 6, 18),
    installDate: new Date(2019, 7, 1), purchasePrice: 28000, vendorName: 'Rational Middle East',
    vendorContact: '+971 4 321 0099', qrCode: 'QR-as12-OVEN', nfcTagId: 'NFC-as12',
    notes: 'Clean daily after service. Descale weekly. Gas connection inspected annually.',
    maintenanceHistory: [
      mRec('mr12-1', 7,  'pm',        'Weekly descaling and door seal check',               50,   'Sophie Brennan'),
      mRec('mr12-2', 90, 'inspection','Quarterly gas connection and burner inspection',    420,  'Rational ME'),
      mRec('mr12-3', 280,'replacement','Door gasket replacement',                           180,  'Rational ME'),
    ],
    assetDocuments: [
      aDoc('d12-1', 'Rational M200 Manual',          'manual',      'pdf', 500),
      aDoc('d12-2', 'Gas Safety Certificate 2024',   'certificate', 'pdf', 90),
      aDoc('d12-3', 'Warranty (expired 2024)',        'warranty',    'pdf', 490),
    ],
  },
  {
    id: 'as13', name: 'Kitchen Walk-in Freezer', category: 'Kitchen', location: 'Dining Kitchen',
    serialNumber: 'WF-2018-003', status: 'active', purchaseDate: new Date(2018, 11, 2),
    criticality: 'high', model: 'MF-1520', manufacturer: 'Hoshizaki', warrantyExpiry: new Date(2023, 11, 2),
    installDate: new Date(2018, 11, 15), purchasePrice: 35000, vendorName: 'Hoshizaki Gulf',
    vendorContact: '+971 4 887 6655', qrCode: 'QR-as13-FRZR', nfcTagId: 'NFC-as13',
    notes: 'Must maintain −18°C. Alarm tested monthly. Defrost cycle runs automatically at 3am.',
    maintenanceHistory: [
      mRec('mr13-1', 1,  'pm',        'Temperature log check (−19°C ✓)',                   0,    'Sophie Brennan'),
      mRec('mr13-2', 30, 'pm',        'Door seal inspection + condenser coil clean',       150,  'Hoshizaki Gulf'),
      mRec('mr13-3', 120,'inspection','Refrigerant level check',                           380,  'Hoshizaki Gulf'),
      mRec('mr13-4', 365,'pm',        'Annual compressor service',                         1800, 'Hoshizaki Gulf'),
    ],
    assetDocuments: [
      aDoc('d13-1', 'Hoshizaki Freezer Manual',      'manual',      'pdf', 700),
      aDoc('d13-2', 'Service Record 2024',            'inspection',  'pdf', 120),
    ],
  },
  {
    id: 'as14', name: 'Fire Suppression System', category: 'Fire Safety', location: 'BOH A Zone',
    serialNumber: 'FS-SYS-2020', status: 'active', purchaseDate: new Date(2020, 1, 25),
    criticality: 'high', model: 'Novec 1230', manufacturer: 'Kidde', warrantyExpiry: new Date(2025, 1, 25),
    installDate: new Date(2020, 2, 10), purchasePrice: 48000, vendorName: 'Fire Guard Arabia',
    vendorContact: '+971 4 667 7890', qrCode: 'QR-as14-FIRE', nfcTagId: 'NFC-as14',
    notes: 'Mandatory 6-month inspection. Last inspection passed. Next due March 2026.',
    maintenanceHistory: [
      mRec('mr14-1', 180,'inspection','6-month inspection — all cylinders charged, detectors functional', 1200, 'Fire Guard Arabia'),
      mRec('mr14-2', 360,'inspection','Annual inspection — full system test',             2400, 'Fire Guard Arabia'),
    ],
    assetDocuments: [
      aDoc('d14-1', 'Kidde Novec System Manual',     'manual',      'pdf', 600),
      aDoc('d14-2', 'Fire Suppression Certificate',  'certificate', 'pdf', 180),
      aDoc('d14-3', '6-Month Inspection Report',     'inspection',  'pdf', 180),
    ],
  },
  {
    id: 'as15', name: 'Golf Cart #1', category: 'Vehicle', location: 'Main Entrance',
    serialNumber: 'GC-001-2021', status: 'active', purchaseDate: new Date(2021, 9, 14),
    criticality: 'low', model: 'Precedent i2L', manufacturer: 'Club Car', warrantyExpiry: new Date(2026, 9, 14),
    installDate: new Date(2021, 9, 20), purchasePrice: 9500, vendorName: 'Club Car Gulf',
    vendorContact: '+971 4 330 1100', qrCode: 'QR-as15-GC1', nfcTagId: undefined,
    notes: 'Battery charge daily. Tyre pressure checked weekly.',
    maintenanceHistory: [
      mRec('mr15-1', 10, 'pm',        'Battery charge level check and tyre inspection',    20,   'John Smith'),
      mRec('mr15-2', 180,'pm',        'Full service — battery health test, brake check',   480,  'Club Car Gulf'),
    ],
    assetDocuments: [
      aDoc('d15-1', 'Club Car Operator Manual',      'manual',      'pdf', 600),
    ],
  },
  {
    id: 'as16', name: 'Golf Cart #2', category: 'Vehicle', location: 'Main Entrance',
    serialNumber: 'GC-002-2021', status: 'retired', purchaseDate: new Date(2021, 9, 14),
    criticality: 'low', model: 'Precedent i2L', manufacturer: 'Club Car', warrantyExpiry: new Date(2026, 9, 14),
    installDate: new Date(2021, 9, 20), purchasePrice: 9500, vendorName: 'Club Car Gulf',
    vendorContact: '+971 4 330 1100', qrCode: 'QR-as16-GC2', nfcTagId: undefined,
    notes: 'Retired due to battery failure. Replacement budgeted for Q2 2026.',
    maintenanceHistory: [
      mRec('mr16-1', 60, 'repair',    'Battery pack failed — replacement not cost effective', 0, 'Tom Wilson'),
    ],
    assetDocuments: [],
  },
  {
    id: 'as17', name: 'Irrigation Controller', category: 'Landscape', location: 'Date palms',
    serialNumber: 'IRR-CTL-2022', status: 'active', purchaseDate: new Date(2022, 3, 7),
    criticality: 'low', model: 'ESP-TM2', manufacturer: 'Rain Bird', warrantyExpiry: new Date(2027, 3, 7),
    installDate: new Date(2022, 3, 15), purchasePrice: 4200, vendorName: 'GreenTech Irrigation',
    vendorContact: '+971 4 234 9900', qrCode: 'QR-as17-IRR', nfcTagId: undefined,
    notes: 'Zone 3 has a slow leak — under investigation.',
    maintenanceHistory: [
      mRec('mr17-1', 5,  'repair',    'Zone 3 leak investigation started',                 0,    'Mohammed Al-Rashid'),
      mRec('mr17-2', 90, 'pm',        'Seasonal zone timing adjustment',                   80,   'Mohammed Al-Rashid'),
    ],
    assetDocuments: [
      aDoc('d17-1', 'Rain Bird Manual',              'manual',      'pdf', 600),
    ],
  },
  {
    id: 'as18', name: 'Security Camera System (NVR)', category: 'Security', location: 'Security Post',
    serialNumber: 'NVR-2021-SEC', status: 'active', purchaseDate: new Date(2021, 7, 11),
    criticality: 'medium', model: 'DS-9664NI-M8', manufacturer: 'Hikvision', warrantyExpiry: new Date(2026, 7, 11),
    installDate: new Date(2021, 8, 1), purchasePrice: 18000, vendorName: 'SecureVision ME',
    vendorContact: '+971 4 880 5500', qrCode: 'QR-as18-NVR', nfcTagId: 'NFC-as18',
    notes: '64-channel NVR with 32 cameras. HDD replaced in 2024. Storage: 30-day retention.',
    maintenanceHistory: [
      mRec('mr18-1', 20,  'pm',       'Camera health check — all 32 cameras online',       60,   'Khalid Al-Mansoori'),
      mRec('mr18-2', 90,  'replacement','HDD upgrade to 8TB per drive',                    2400, 'SecureVision ME'),
      mRec('mr18-3', 365, 'inspection','Annual system audit — firmware updated',           480,  'SecureVision ME'),
    ],
    assetDocuments: [
      aDoc('d18-1', 'Hikvision NVR Manual',          'manual',      'pdf', 600),
      aDoc('d18-2', 'System Audit Report 2024',       'inspection',  'pdf', 90),
    ],
  },
];

export const chatChannels: ChatChannel[] = [
  // ── Group Channels ──────────────────────────────────────────
  { id: 'ch1', name: 'General', type: 'group', icon: '📢', unread: 3, lastMessage: 'Great, I will check it now', lastTime: d(0, 10, 30) },
  { id: 'ch2', name: 'Maintenance', type: 'group', icon: '🔧', unread: 1, lastMessage: 'Pool pump needs new seal', lastTime: d(0, 9, 15) },
  { id: 'ch3', name: 'Management', type: 'group', icon: '📊', unread: 0, lastMessage: 'Monthly report approved', lastTime: d(1, 16, 0) },
  { id: 'ch4', name: 'Housekeeping', type: 'group', icon: '🧹', unread: 0, lastMessage: 'Room 204 ready', lastTime: d(1, 14, 45) },
  { id: 'ch5', name: 'Fire Safety', type: 'group', icon: '🔥', unread: 2, lastMessage: 'All stairwell signage confirmed ✅', lastTime: d(0, 8, 10) },
  { id: 'ch6', name: 'Site Inspections', type: 'group', icon: '🔍', unread: 0, lastMessage: 'Compile into the weekly report', lastTime: d(1, 13, 0) },
  { id: 'ch7', name: 'AC & HVAC', type: 'group', icon: '❄️', unread: 0, lastMessage: 'Monitor chiller 2 closely', lastTime: d(2, 14, 30) },
  { id: 'ch8', name: 'Security', type: 'group', icon: '🛡️', unread: 1, lastMessage: 'CCTV feed restored', lastTime: d(0, 7, 30) },
  // ── Direct Messages ─────────────────────────────────────────
  { id: 'dm1', name: 'Mohammed Al-Rashid', type: 'dm', dmUserId: 'u2', unread: 1, lastMessage: 'Need sign-off before we order the parts', lastTime: d(0, 11, 8) },
  { id: 'dm2', name: 'Ahmed Hassan', type: 'dm', dmUserId: 'u3', unread: 0, lastMessage: 'On my way', lastTime: d(0, 9, 30) },
  { id: 'dm3', name: 'Fatima Al-Zahra', type: 'dm', dmUserId: 'u5', unread: 0, lastMessage: 'Housekeeping schedule sent', lastTime: d(1, 15, 0) },
];

export const chatMessages: ChatMessage[] = [
  // ── General (ch1) ───────────────────────────────────────────
  { id: 'm1', userId: 'u2', userName: 'Mohammed', text: 'Good morning everyone! Pool pump is making unusual noises.', timestamp: d(0, 8, 0), channel: 'ch1', pinned: true },
  { id: 'm2', userId: 'u3', userName: 'Ahmed', text: 'I can check it first thing. Probably needs a new seal.', timestamp: d(0, 8, 5), channel: 'ch1' },
  { id: 'm3', userId: 'u4', userName: 'Khalid', text: 'Same issue happened last month. Replacement part is in the storeroom.', timestamp: d(0, 8, 10), channel: 'ch1' },
  { id: 'm4', userId: 'u1', userName: 'Admin', text: 'Great, I will check it now', timestamp: d(0, 10, 30), channel: 'ch1' },
  { id: 'm5', userId: 'u2', userName: 'Mohammed', text: 'Pump seal replaced. Running normally now 👍', timestamp: d(0, 12, 0), channel: 'ch1', reactions: [{ emoji: '👍', count: 3, reactedByMe: true }, { emoji: '✅', count: 2, reactedByMe: false }] },
  { id: 'm6', userId: 'u1', userName: 'Admin', text: 'Excellent! Please update the task and attach a photo.', timestamp: d(0, 12, 5), channel: 'ch1', replyTo: { messageId: 'm5', userName: 'Mohammed', text: 'Pump seal replaced. Running normally now 👍' } },
  // ── Maintenance (ch2) ───────────────────────────────────────
  { id: 'm7', userId: 'u2', userName: 'Mohammed', text: 'Pool pump needs new seal - urgent', timestamp: d(0, 9, 0), channel: 'ch2' },
  { id: 'm8', userId: 'u4', userName: 'Khalid', text: 'On my way to the pool plant room.', timestamp: d(0, 9, 10), channel: 'ch2' },
  { id: 'm9', userId: 'u3', userName: 'Ahmed', text: 'I have the replacement seal in the van.', timestamp: d(0, 9, 15), channel: 'ch2' },
  { id: 'm10', userId: 'u2', userName: 'Mohammed', text: 'Meet me at the pool plant room.', timestamp: d(0, 9, 20), channel: 'ch2' },
  { id: 'm11', userId: 'u3', userName: 'Ahmed', text: 'Done. Job complete, area cleaned up.', timestamp: d(0, 11, 45), channel: 'ch2', reactions: [{ emoji: '✅', count: 4, reactedByMe: true }, { emoji: '👍', count: 2, reactedByMe: false }] },
  // ── Management (ch3) ────────────────────────────────────────
  { id: 'm12', userId: 'u1', userName: 'Admin', text: 'Q1 maintenance report is ready for review.', timestamp: d(1, 14, 0), channel: 'ch3' },
  { id: 'm13', userId: 'u2', userName: 'Mohammed', text: 'Looks comprehensive. Especially the PPM section.', timestamp: d(1, 15, 0), channel: 'ch3' },
  { id: 'm14', userId: 'u1', userName: 'Admin', text: 'Monthly report approved', timestamp: d(1, 16, 0), channel: 'ch3' },
  { id: 'm15', userId: 'u2', userName: 'Mohammed', text: 'Will share with the owners group.', timestamp: d(1, 16, 10), channel: 'ch3' },
  // ── Housekeeping (ch4) ──────────────────────────────────────
  { id: 'm16', userId: 'u5', userName: 'Fatima', text: 'All floors cleaned and inspected this morning.', timestamp: d(1, 10, 0), channel: 'ch4' },
  { id: 'm17', userId: 'u1', userName: 'Admin', text: 'Great work! Pool changing rooms also done?', timestamp: d(1, 11, 0), channel: 'ch4' },
  { id: 'm18', userId: 'u5', userName: 'Fatima', text: 'Yes, all done. Room 204 ready', timestamp: d(1, 14, 45), channel: 'ch4' },
  { id: 'm19', userId: 'u1', userName: 'Admin', text: 'Perfect, guest checking in at 15:00.', timestamp: d(1, 14, 50), channel: 'ch4' },
  // ── Fire Safety (ch5) ───────────────────────────────────────
  { id: 'm20', userId: 'u2', userName: 'Mohammed', text: 'Monthly fire extinguisher check completed on all floors.', timestamp: d(0, 7, 30), channel: 'ch5' },
  { id: 'm21', userId: 'u4', userName: 'Khalid', text: 'Extinguisher on B1 needs recharge. I have tagged it.', timestamp: d(0, 7, 45), channel: 'ch5' },
  { id: 'm22', userId: 'u1', userName: 'Admin', text: 'Task created for replacement. Fire exit B2 is clear.', timestamp: d(0, 8, 0), channel: 'ch5' },
  { id: 'm23', userId: 'u2', userName: 'Mohammed', text: 'All stairwell signage confirmed ✅', timestamp: d(0, 8, 10), channel: 'ch5', pinned: true, reactions: [{ emoji: '✅', count: 3, reactedByMe: true }] },
  // ── Site Inspections (ch6) ──────────────────────────────────
  { id: 'm24', userId: 'u3', userName: 'Ahmed', text: 'East wing inspection started. Minor paint issues noted.', timestamp: d(1, 9, 0), channel: 'ch6' },
  { id: 'm25', userId: 'u4', userName: 'Khalid', text: 'West wing complete. No critical issues.', timestamp: d(1, 11, 0), channel: 'ch6' },
  { id: 'm26', userId: 'u1', userName: 'Admin', text: 'Compile into the weekly report please.', timestamp: d(1, 13, 0), channel: 'ch6' },
  // ── AC & HVAC (ch7) ─────────────────────────────────────────
  { id: 'm27', userId: 'u3', userName: 'Ahmed', text: 'Chiller 1 filter cleaned and reset. Running at 100%.', timestamp: d(2, 13, 0), channel: 'ch7' },
  { id: 'm28', userId: 'u2', userName: 'Mohammed', text: 'Chiller 2 running at 95%. Will monitor.', timestamp: d(2, 14, 0), channel: 'ch7' },
  { id: 'm29', userId: 'u1', userName: 'Admin', text: 'Monitor chiller 2 closely. Call vendor if it drops below 90%.', timestamp: d(2, 14, 30), channel: 'ch7' },
  // ── Security (ch8) ──────────────────────────────────────────
  { id: 'm30', userId: 'u7', userName: 'Sara', text: 'Camera 3 on east perimeter is offline. Investigating.', timestamp: d(0, 7, 0), channel: 'ch8' },
  { id: 'm31', userId: 'u1', userName: 'Admin', text: 'Create a task and contact the CCTV vendor.', timestamp: d(0, 7, 15), channel: 'ch8' },
  { id: 'm32', userId: 'u7', userName: 'Sara', text: 'CCTV feed restored', timestamp: d(0, 7, 30), channel: 'ch8' },
  // ── DM: Mohammed (dm1) ──────────────────────────────────────
  { id: 'm33', userId: 'u2', userName: 'Mohammed', text: 'Can you review task #42?', timestamp: d(0, 11, 0), channel: 'dm1' },
  { id: 'm34', userId: 'u1', userName: 'Admin', text: 'Sure, looking at it now.', timestamp: d(0, 11, 5), channel: 'dm1' },
  { id: 'm35', userId: 'u2', userName: 'Mohammed', text: 'Need sign-off before we order the parts.', timestamp: d(0, 11, 8), channel: 'dm1' },
  // ── DM: Ahmed (dm2) ─────────────────────────────────────────
  { id: 'm36', userId: 'u3', userName: 'Ahmed', text: 'Will be 10 min late, traffic on the highway.', timestamp: d(0, 9, 20), channel: 'dm2' },
  { id: 'm37', userId: 'u1', userName: 'Admin', text: 'On my way', timestamp: d(0, 9, 30), channel: 'dm2' },
  // ── DM: Fatima (dm3) ────────────────────────────────────────
  { id: 'm38', userId: 'u5', userName: 'Fatima', text: 'Updated housekeeping schedule sent to the team.', timestamp: d(1, 14, 50), channel: 'dm3' },
  { id: 'm39', userId: 'u1', userName: 'Admin', text: 'Housekeeping schedule sent', timestamp: d(1, 15, 0), channel: 'dm3' },
];
