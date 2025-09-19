import { donationPurposes, recurringOptions } from './data/constants';

export type View =
  | 'dashboard'
  | 'donors'
  | 'donations'
  | 'pledges'
  | 'recurring'
  | 'reports'
  | 'outbox'
  | 'settings'
  | 'user-management'
  | 'communication-settings'
  | 'audit'
  | 'backup-restore'
  | 'profile-settings'
  | 'donor-profile'
  // FIX: Add 'communication-queue' to View type to support the multi-channel sending view.
  | 'communication-queue';

export interface ReceiptOutboxInfo {
  type: 'receipt';
  donationId: string;
}
export interface TemplateOutboxInfo {
  type: 'template';
  donorId: string;
  templateId: string;
}
export type OutboxItem = {
    id: string;
    status: 'Ready to Send' | 'Sent' | 'Failed';
    addedAt: string;
    sentAt?: string;
    error?: string;
} & (ReceiptOutboxInfo | TemplateOutboxInfo);


// FIX: Add Segment type for bulk communication feature.
export interface Segment {
    id: string;
    name: string;
    filters: {
        location?: string;
        lastDonationStart?: string;
        lastDonationEnd?: string;
        totalDonatedMin?: string;
        totalDonatedMax?: string;
        purpose?: DonationPurpose | 'All';
        tags?: string;
    };
}

// FIX: Add QueuedCommunication type for bulk communication feature.
export interface QueuedCommunication {
    id: string;
    donorId: string;
    templateId: string;
    channel: 'Email' | 'WhatsApp';
    status: 'Queued' | 'Sent' | 'Failed';
    queuedAt: string;
    sentAt?: string;
    error?: string;
}

export interface DonationHistory {
    date: string;
    amount: number;
    receiptId: string;
}

export interface CommunicationLog {
    id: string;
    date: string;
    channel: 'Email' | 'WhatsApp' | 'Call' | 'Meeting' | 'Print' | 'Download';
    subjectOrTemplate: string;
    notes: string;
    userId: string;
}

export interface Contact {
    id: string;
    name: string;
    relationship: string;
    email: string;
    phone: string;
    isPrimary: boolean;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Donor {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    joinDate: string;
    donationHistory: DonationHistory[];
    tagIds?: string[];
    notes?: string;
    communicationLogs?: CommunicationLog[];
    contacts?: Contact[];
}

export type DonationPurpose = typeof donationPurposes[number];
export type RecurringDonation = typeof recurringOptions[number];

export interface Donation {
    id: string;
    donorId: string;
    amount: number;
    date: string;
    method: 'Online' | 'Cash';
    purpose: DonationPurpose;
    customPurpose?: string;
    recurring: RecurringDonation;
}

export interface PledgeTask {
    id: string;
    description: string;
    completed: boolean;
}

export interface Pledge {
    id: string;
    donorId: string;
    amount: number;
    dueDate: string;
    status: 'Pending' | 'Due' | 'Completed';
    tasks?: PledgeTask[];
}

export interface RecurringProfile {
    id: string;
    donorId: string;
    amount: number;
    frequency: 'Monthly' | 'Annually' | 'Weekly';
    startDate: string;
    nextDueDate: string;
    status: 'Active' | 'Paused' | 'Cancelled';
    purpose: DonationPurpose;
    customPurpose?: string;
    method: 'Online' | 'Cash';
}

export type Permission = 
    | 'donors:view'
    | 'donors:create'
    | 'donors:edit'
    | 'donors:delete'
    | 'receipts:view'
    | 'receipts:create'
    | 'receipts:delete'
    | 'reports:view'
    | 'settings:manage'
    | 'users:manage';
    
export const PERMISSIONS: Record<Permission, string> = {
    'donors:view': 'View Donors',
    'donors:create': 'Create Donors',
    'donors:edit': 'Edit Donors',
    'donors:delete': 'Delete Donors',
    'receipts:view': 'View Receipts',
    'receipts:create': 'Create Receipts',
    'receipts:delete': 'Delete Receipts',
    'reports:view': 'View Reports',
    'settings:manage': 'Manage Settings',
    'users:manage': 'Manage Users',
};

export interface Role {
    id: string;
    name: string;
    permissions: Permission[];
    isSystemRole?: boolean;
}

export interface User {
    id: string;
    name: string;
    email: string;
    roleId: string;
    status: 'Active' | 'Inactive';
    avatar?: string;
    lastLogin: string;
}

export interface CommunicationTemplate {
    id: string;
    name: string;
    type: 'DonationThankYou' | 'PledgeReminder' | 'GeneralUpdate';
    channel: 'Email' | 'WhatsApp';
    subject?: string;
    body: string;
}

export interface OrganizationSettings {
    name: string;
    logo: string;
    address: string;
    website: string;
    phone: string;
    email: string;
    whatsappNumber: string;
    receiptThankYouMessage: string;
    communicationTemplates: CommunicationTemplate[];
    tags: Tag[];
}

export interface Backup {
    id: string;
    date: string;
    size: number; // in bytes
    data: string; // JSON string of the application state
}