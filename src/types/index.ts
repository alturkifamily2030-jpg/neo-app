export type TaskStatus = 'open' | 'in_progress' | 'done';
export type Priority = 'high' | 'medium' | 'low';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;                  // job title (Maintenance Supervisor, etc.)
  accountRole?: 'account_admin' | 'group_admin' | 'user' | 'family'; // Snapfix permission tier
  phone?: string;
  status: 'online' | 'away' | 'offline';
  groupIds: string[];
  invitedAt?: Date;              // when invitation was sent
  accepted?: boolean;            // false = invitation pending (not yet accepted)
}

export interface StatusCounts {
  red: number;   // open / urgent
  yellow: number; // in_progress
  green: number;  // done
}

export interface Group {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  counts: StatusCounts;
  notificationsOn: boolean;
  memberIds: string[];
  archived?: boolean;
  // Group Settings — existing
  trafficLightLabels?: { red: string; yellow: string; green: string };
  requiresApproval?: boolean;
  dailySummary?: boolean;
  activeTags?: { location: boolean; equipment: boolean; category: boolean };
  memberRoles?: Record<string, 'admin' | 'user'>; // userId → role within this group
  // TAG(S) REQUIRED FOR TASKS
  tagsRequired?: { location?: boolean; equipment?: boolean; category?: boolean };
  // ASSET & USER REQUIREMENTS
  assetRequired?: boolean;
  assigneeRequired?: boolean;
  // CHECKLIST AUTOMATIONS
  checklistAutoYellow?: boolean;  // auto → In Progress when first item ticked
  checklistAutoGreen?: boolean;   // auto → Done when all items ticked
  checklistMustComplete?: boolean; // block Done if checklist < 100%
  allowManualNfc?: boolean;       // allow bypass of NFC requirement
  // TASK COMPLETION & ARCHIVING
  autoArchiveGreen?: boolean;     // hide task after it reaches Done
  // COMMUNICATION & MEDIA
  blockGalleryPhotos?: boolean;   // camera only, no gallery upload
  // TASK ROOM / AREA REQUIREMENTS
  roomRequired?: 'room' | 'area' | 'either' | null;
}

export interface Area {
  id: string;
  name: string;
  description: string;
  counts: StatusCounts;
}

export interface TaskTags {
  location?: string;
  equipment?: string;
  category?: string;
}

export interface TaskActivity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: Date;
}

export interface TaskSubtask {
  id: string;
  text: string;
  done: boolean;
}

export interface TaskTimeEntry {
  id: string;
  date: Date;
  minutes: number;
  userId: string;
  userName: string;
  note?: string;
}

export interface Task {
  id: string;
  title: string;
  groupId: string;
  groupName: string;
  groupColor: string;
  areaId?: string;
  assetId?: string;
  assetName?: string;
  status: TaskStatus;
  priority: Priority;
  image?: string;
  photos?: string[];
  createdAt: Date;
  dueDate?: Date;
  estimatedMinutes?: number;
  assignees: string[];
  description?: string;
  comments: Comment[];
  tags?: TaskTags;
  watcherIds?: string[];
  activityLog?: TaskActivity[];
  subtasks?: TaskSubtask[];
  timeEntries?: TaskTimeEntry[];
  lastReminderAt?: string; // ISO string — updated each time a 24h reminder fires
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: Date;
}

export interface PPMChecklistStep {
  id: string;
  text: string;
}

export interface PlannedTask {
  id: string;
  title: string;
  groupId: string;
  groupName: string;
  groupColor: string;
  scheduledAt: Date;
  recurrence: 'never' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  enabled: boolean;
  image?: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
  areaId?: string;
  areaName?: string;
  assetId?: string;
  assetName?: string;
  estimatedMinutes?: number;
  assigneeIds?: string[];
  checklistSteps?: PPMChecklistStep[];
}

export type AssetCriticality = 'high' | 'medium' | 'low';

export interface MaintenanceRecord {
  id: string;
  date: Date;
  type: 'repair' | 'inspection' | 'pm' | 'replacement';
  description: string;
  cost: number;
  technician: string;
  taskId?: string;
  downtimeHours?: number;
}

export interface AssetDocument {
  id: string;
  name: string;
  type: 'manual' | 'warranty' | 'certificate' | 'invoice' | 'inspection';
  uploadedAt: Date;
  fileType: 'pdf' | 'img' | 'doc';
}

export interface Asset {
  id: string;
  name: string;
  category: string;
  location: string;
  serialNumber?: string;
  status: 'active' | 'maintenance' | 'retired';
  purchaseDate?: Date;
  // Track fields
  criticality: AssetCriticality;
  model?: string;
  manufacturer?: string;
  warrantyExpiry?: Date;
  installDate?: Date;
  purchasePrice?: number;
  vendorName?: string;
  vendorContact?: string;
  qrCode: string;
  nfcTagId?: string;
  notes?: string;
  photos?: string[];
  maintenanceHistory: MaintenanceRecord[];
  assetDocuments: AssetDocument[];
}

export interface MessageReaction {
  emoji: string;
  count: number;
  reactedByMe: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: Date;
  channel: string;
  reactions?: MessageReaction[];
  replyTo?: { messageId: string; userName: string; text: string };
  edited?: boolean;
  deleted?: boolean;
  pinned?: boolean;
}

export interface ChatChannel {
  id: string;
  name: string;
  unread: number;
  lastMessage?: string;
  lastTime?: Date;
  type?: 'group' | 'dm' | 'custom';
  icon?: string;       // emoji for group/custom channels
  dmUserId?: string;   // userId for DM channels
}

// ── Comply module ──────────────────────────────────────────

export interface ComplianceCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export type ResponseType = 'yes_no' | 'pass_flag_fail_na' | 'text' | 'number';
export type InspectionStatus = 'scheduled' | 'in_progress' | 'completed' | 'overdue';
export type ChecklistFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'once';

export interface ChecklistItem {
  id: string;
  label: string;
  responseType: ResponseType;
  mandatory: boolean;
  nfcEnabled: boolean;
  helpText?: string;
}

export interface ChecklistSection {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  categoryId: string;
  description: string;
  frequency: ChecklistFrequency;
  sections: ChecklistSection[];
  requiresSignature: boolean;
  estimatedMinutes: number;
}

export interface ItemResponse {
  value: string | null;
  notes: string;
  photos: string[];
}

export interface InspectionRun {
  id: string;
  templateId: string;
  templateName: string;
  categoryId: string;
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  status: InspectionStatus;
  assigneeId?: string;
  assigneeName?: string;
  responses: Record<string, ItemResponse>;
  signature?: string;
  score?: number;
}

export interface ComplianceDocument {
  id: string;
  name: string;
  category: 'permit' | 'certificate' | 'sop' | 'training' | 'insurance' | 'contractor';
  expiryDate?: Date;
  uploadedAt: Date;
  uploadedBy: string;
  fileType: 'pdf' | 'doc' | 'img';
}
