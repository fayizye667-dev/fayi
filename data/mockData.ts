import type { Donor, Donation, Pledge, RecurringProfile, User, Role, OrganizationSettings, Tag } from '../types';
import { ALL_PERMISSIONS } from './permissions';

export const mockRoles: Role[] = [
    {
        id: 'role-1',
        name: 'Administrator',
        permissions: ALL_PERMISSIONS,
        isSystemRole: true,
    },
    {
        id: 'role-2',
        name: 'Staff',
        permissions: ['donors:view', 'donors:create', 'donors:edit', 'receipts:view', 'receipts:create'],
    },
    {
        id: 'role-3',
        name: 'Viewer',
        permissions: ['donors:view', 'receipts:view', 'reports:view'],
    }
];

export const mockUsers: User[] = [
    {
        id: 'user-1',
        name: 'Admin User',
        email: 'admin@alkahaf.org',
        roleId: 'role-1',
        status: 'Active',
        avatar: 'https://i.pravatar.cc/150?u=admin',
        lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'user-2',
        name: 'John Doe',
        email: 'john.doe@example.com',
        roleId: 'role-2',
        status: 'Active',
        avatar: 'https://i.pravatar.cc/150?u=john',
        lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'user-3',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        roleId: 'role-3',
        status: 'Inactive',
        avatar: 'https://i.pravatar.cc/150?u=jane',
        lastLogin: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    }
];

export const mockTags: Tag[] = [
    { id: 'tag-1', name: 'Volunteer', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    { id: 'tag-2', name: 'Gala 2023', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
    { id: 'tag-3', name: 'Corporate', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    { id: 'tag-4', name: 'Major Donor', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
];

export const mockDonors: Donor[] = [
    { id: 'donor-1', name: 'Alice Johnson', email: 'alice.j@example.com', phone: '123-456-7890', address: '123 Maple St, Springfield', joinDate: '2023-01-15', donationHistory: [], tagIds: ['tag-1', 'tag-2'], notes: 'Interested in child sponsorship programs.' },
    { id: 'donor-2', name: 'Bob Williams', email: 'bob.w@example.com', phone: '234-567-8901', address: '456 Oak Ave, Metropolis', joinDate: '2023-02-20', donationHistory: [] },
];

export const mockDonations: Donation[] = [
    { id: 'donation-1', donorId: 'donor-1', amount: 100, date: '2023-03-10', method: 'Online', purpose: 'Sadaqa/Hadiya/Atiyat', recurring: 'None' },
    { id: 'donation-2', donorId: 'donor-2', amount: 50, date: '2023-04-15', method: 'Cash', purpose: 'Zakat', recurring: 'None' },
    { id: 'donation-3', donorId: 'donor-1', amount: 200, date: '2023-05-20', method: 'Online', purpose: 'Sponsor a Child', recurring: 'Monthly' },
];

export const mockPledges: Pledge[] = [
    { id: 'pledge-1', donorId: 'donor-1', amount: 500, dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'Pending', tasks: [{id: 't1', description: 'Follow up call', completed: false}] },
    { id: 'pledge-2', donorId: 'donor-2', amount: 1000, dueDate: new Date().toISOString().split('T')[0], status: 'Due' },
];

export const mockRecurringProfiles: RecurringProfile[] = [
    { id: 'rec-1', donorId: 'donor-1', amount: 200, frequency: 'Monthly', startDate: '2023-05-20', nextDueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0], status: 'Active', purpose: 'Sponsor a Child', method: 'Online' }
];

export const mockSettings: OrganizationSettings = {
    name: 'Alkahaf Donor System',
    logo: '', // empty for no broken images
    address: '123 Charity Lane, Kindness City, 12345',
    website: 'www.alkahaf.org',
    phone: '1-800-GIVE-NOW',
    email: 'info@alkahaf.org',
    whatsappNumber: '12223334444',
    receiptThankYouMessage: 'Thank you for your generous contribution!',
    communicationTemplates: [
        { id: 'template-1', name: 'Standard Thank You (Email)', type: 'DonationThankYou', channel: 'Email', subject: 'Thank you for your donation!', body: 'Dear {{donorName}},\n\nThank you for your generous donation to {{orgName}}.' },
        { id: 'template-2', name: 'Standard Thank You (WhatsApp)', type: 'DonationThankYou', channel: 'WhatsApp', body: 'Dear {{donorName}}, thank you for your generous donation to {{orgName}}!' },
    ],
    tags: mockTags
};