export type PoolType = 'CRM' | 'BLASTER' | 'WARMUP';

export type SessionStatus = 'connecting' | 'connected' | 'disconnected' | 'qr_required' | 'pairing_required';

export interface Session {
  id: string;
  name: string;
  pool: PoolType;
  status: SessionStatus;
  phone?: string;
  lastSeen?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  roleId: string;
  role?: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  phone: string;
  name?: string;
  system: "crm" | "blaster" | "warmup";
  tags: string[];
  optOut: boolean;
  lastContactAt?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export type TemplateKind = "text" | "image" | "audio" | "button" | "text_button" | "text_image" | "image_text_button";

export interface Template {
  id: string;
  name: string;
  kind: TemplateKind;
  allowed_in: PoolType[];
  content_json: any;
  preview?: string;
  user_id?: string;
  admin_id?: string;
  created_at: string;
  updated_at: string;
}

export type BroadcastStatus = 'draft' | 'queued' | 'running' | 'paused' | 'completed' | 'failed';

export interface BroadcastJob {
  id: string;
  name: string;
  pool: PoolType;
  template_id: string;
  template?: Template;
  target_contacts: string[];
  status: BroadcastStatus;
  plan_json: {
    delayMin: number;
    delayMax: number;
    sessions: string[];
    schedule?: {
      startAt?: string;
      endAt?: string;
      quietHours?: number[];
    };
  };
  stats: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
  };
  user_id?: string;
  admin_id?: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface BroadcastLog {
  id: string;
  jobId: string;
  contactId: string;
  sessionId: string;
  status: 'sent' | 'failed' | 'pending';
  message?: string;
  error?: string;
  sentAt?: string;
  createdAt: string;
}

export type MessageDirection = 'incoming' | 'outgoing';

export interface InboxMessage {
  id: string;
  pool: PoolType;
  sessionId: string;
  contactPhone: string;
  contactName?: string;
  direction: MessageDirection;
  content: any;
  messageType: string;
  isRead: boolean;
  threadId: string;
  createdAt: string;
}

export interface AIAgentSetting {
  id: string;
  pool: PoolType;
  isEnabled: boolean;
  schedule: {
    activeHours: number[];
    quietHours: number[];
    timezone: string;
  };
  knowledgeBase: string;
  rateLimit: {
    maxRepliesPerContact: number;
    timeWindowHours: number;
  };
  userId: string;
  updatedAt: string;
}

export interface WarmingPolicy {
  id: string;
  curve: {
    hour: number;
    maxMessages: number;
  }[];
  quietHours: number[];
  mediaRatio: {
    text: number;
    emoji: number;
    image: number;
  };
  maxPerHour: number;
  updatedAt: string;
}

export interface QRData {
  qr: string;
  sessionId: string;
  expiresAt: string;
}

export interface Stats {
  sessions: {
    total: number;
    connected: number;
    byPool: Record<PoolType, number>;
  };
  messages: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    byPool: Record<PoolType, number>;
  };
  broadcasts: {
    active: number;
    completed: number;
    failed: number;
  };
  contacts: {
    total: number;
    optedOut: number;
  };
}