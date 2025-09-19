import { useState, useEffect } from 'react';
import {
    mockDonors, mockDonations, mockPledges, mockRecurringProfiles,
    mockUsers, mockRoles, mockSettings, mockTags
} from '../data/mockData';
import type {
    Donor, Donation, Pledge, RecurringProfile, User, Role,
    OrganizationSettings, PledgeTask, CommunicationLog, OutboxItem,
    QueuedCommunication, Tag, Backup
} from '../types';

// Simulate API latency
const apiDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

export interface QueueActions {
    add: (items: Omit<QueuedCommunication, 'id'>[]) => Promise<void>;
}

export interface TagActions {
    add: (tagData: Omit<Tag, 'id'>) => Promise<Tag>;
    update: (tag: Tag) => Promise<Tag>;
    delete: (id: string) => Promise<void>;
}

export interface AllActions {
    donors: DonorActions;
    donations: DonationActions;
    pledges: PledgeActions;
    recurring: RecurringActions;
    users: UserActions;
    roles: RoleActions;
    settings: SettingsActions;
    outbox: OutboxActions;
    queue: QueueActions;
    tags: TagActions;
    backups: BackupActions;
}

export interface DonorActions {
    add: (data: Omit<Donor, 'id' | 'donationHistory'>) => Promise<Donor>;
    update: (data: Donor) => Promise<Donor>;
    delete: (id: string) => Promise<void>;
    deleteBulk: (ids: string[]) => Promise<void>;
    logCommunication: (donorId: string, logData: Omit<CommunicationLog, 'id'>) => Promise<void>;
    logCommunicationBulk: (donorIds: string[], logData: Omit<CommunicationLog, 'id'>) => Promise<void>;
}

export interface DonationActions {
    add: (data: Donation) => Promise<Donation>;
    deleteBulk: (ids: string[]) => Promise<void>;
}

export interface PledgeActions {
    add: (data: Omit<Pledge, 'id' | 'status' | 'tasks'>) => Promise<Pledge>;
    update: (data: Pledge) => Promise<Pledge>;
    deleteBulk: (ids: string[]) => Promise<void>;
    updateStatusBulk: (ids: string[], status: Pledge['status']) => Promise<void>;
    addTask: (pledgeId: string, taskData: Omit<PledgeTask, 'id' | 'completed'>) => Promise<void>;
    toggleTask: (pledgeId: string, taskId: string) => Promise<void>;
}
export interface RecurringActions {
    add: (data: Omit<RecurringProfile, 'id' | 'status' | 'nextDueDate'>) => Promise<RecurringProfile>;
    updateStatus: (id: string, status: RecurringProfile['status']) => Promise<void>;
    updateStatusBulk: (ids: string[], status: RecurringProfile['status']) => Promise<void>;
}

export interface UserActions {
    add: (data: Omit<User, 'id' | 'lastLogin'>) => Promise<User>;
    update: (data: User) => Promise<User>;
    updateStatus: (id: string, status: User['status']) => Promise<void>;
}

export interface RoleActions {
    add: (data: Omit<Role, 'id'>) => Promise<Role>;
    update: (data: Role) => Promise<Role>;
    delete: (id: string) => Promise<{ error: string } | void>;
}

export interface SettingsActions {
    update: (data: OrganizationSettings) => Promise<void>;
}

export interface OutboxActions {
    add: (donationId: string) => Promise<void>;
    addBulk: (donorIds: string[], templateId: string) => Promise<void>;
    updateStatus: (outboxId: string, status: OutboxItem['status'], error?: string) => Promise<void>;
    retry: (outboxId: string) => Promise<void>;
}

export interface BackupActions {
    create: () => Promise<Backup>;
    restore: (backupId: string) => Promise<void>;
    restoreFromFile: (jsonData: string) => Promise<{ success: boolean; error?: string }>;
    delete: (backupId: string) => Promise<void>;
}


export const useData = () => {
    const [donors, setDonors] = useState<Donor[]>([]);
    const [donations, setDonations] = useState<Donation[]>([]);
    const [pledges, setPledges] = useState<Pledge[]>([]);
    const [recurringProfiles, setRecurringProfiles] = useState<RecurringProfile[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [settings, setSettings] = useState<OrganizationSettings>(mockSettings);
    const [outbox, setOutbox] = useState<OutboxItem[]>([]);
    const [communicationQueue, setCommunicationQueue] = useState<QueuedCommunication[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [backups, setBackups] = useState<Backup[]>([]);
    const [loading, setLoading] = useState(true);

    const restoreStateFromData = (data: any) => {
        // Add validation here for a real app
        setDonors(data.donors || []);
        setDonations(data.donations || []);
        setPledges(data.pledges || []);
        setRecurringProfiles(data.recurringProfiles || []);
        setUsers(data.users || []);
        setRoles(data.roles || []);
        setSettings(data.settings || mockSettings);
        setOutbox(data.outbox || []);
        setCommunicationQueue(data.communicationQueue || []);
        setTags(data.tags || []);
        // Backups are not restored from a backup file to prevent nested backups.
    };

    useEffect(() => {
        const loadData = async () => {
            await apiDelay(500); // Simulate loading
            setDonors(mockDonors);
            setDonations(mockDonations);
            setPledges(mockPledges);
            setRecurringProfiles(mockRecurringProfiles);
            setUsers(mockUsers);
            setRoles(mockRoles);
            setTags(mockTags);
            setSettings({ ...mockSettings, tags: mockTags });
            setOutbox([]);
            setCommunicationQueue([]);
            setBackups([]);
            setLoading(false);
        };
        loadData();
    }, []);

    const actions: AllActions = {
        donors: {
            add: async (data) => {
                const newDonor: Donor = { ...data, id: `donor-${Date.now()}`, donationHistory: [] };
                setDonors(d => [...d, newDonor]);
                return newDonor;
            },
            update: async (data) => {
                setDonors(d => d.map(donor => donor.id === data.id ? data : donor));
                return data;
            },
            delete: async (id) => {
                setDonors(d => d.filter(donor => donor.id !== id));
                setDonations(d => d.filter(donation => donation.donorId !== id));
                setPledges(p => p.filter(pledge => pledge.donorId !== id));
            },
            deleteBulk: async (ids) => {
                const idSet = new Set(ids);
                setDonors(d => d.filter(donor => !idSet.has(donor.id)));
                setDonations(d => d.filter(donation => !idSet.has(donation.donorId)));
                setPledges(p => p.filter(pledge => !idSet.has(pledge.donorId)));
            },
            logCommunication: async (donorId, logData) => {
                const newLog: CommunicationLog = { ...logData, id: `comm-${Date.now()}`};
                setDonors(d => d.map(donor => {
                    if (donor.id === donorId) {
                        return { ...donor, communicationLogs: [...(donor.communicationLogs || []), newLog] };
                    }
                    return donor;
                }));
            },
            logCommunicationBulk: async (donorIds, logData) => {
                const idSet = new Set(donorIds);
                setDonors(d => d.map(donor => {
                    if (idSet.has(donor.id)) {
                         const newLog: CommunicationLog = { ...logData, id: `comm-${donor.id}-${Date.now()}`};
                        return { ...donor, communicationLogs: [...(donor.communicationLogs || []), newLog] };
                    }
                    return donor;
                }))
            }
        },
        donations: {
            add: async (data) => {
                setDonations(d => [...d, data]);
                // Also update donor's history
                setDonors(donors => donors.map(donor => {
                    if (donor.id === data.donorId) {
                        return { ...donor, donationHistory: [...donor.donationHistory, { date: data.date, amount: data.amount, receiptId: data.id }] };
                    }
                    return donor;
                }));
                 // Add to outbox for sending
                actions.outbox.add(data.id);
                 // If donation creates a recurring profile
                if (data.recurring && data.recurring !== 'None') {
                    const newProfile: Omit<RecurringProfile, 'id' | 'status' | 'nextDueDate'> = {
                        donorId: data.donorId,
                        amount: data.amount,
                        frequency: data.recurring,
                        startDate: data.date,
                        purpose: data.purpose,
                        customPurpose: data.customPurpose,
                        method: data.method,
                    };
                    actions.recurring.add(newProfile);
                }
                return data;
            },
            deleteBulk: async (ids) => {
                const idSet = new Set(ids);
                setDonations(d => d.filter(donation => !idSet.has(donation.id)));
                setOutbox(o => o.filter(item => item.type === 'receipt' ? !idSet.has(item.donationId) : true));
            }
        },
        pledges: {
            add: async (data) => {
                const newPledge: Pledge = { ...data, id: `pledge-${Date.now()}`, status: 'Pending', tasks: [] };
                setPledges(p => [...p, newPledge]);
                return newPledge;
            },
            update: async (data) => {
                setPledges(p => p.map(pledge => pledge.id === data.id ? data : pledge));
                return data;
            },
            deleteBulk: async (ids) => {
                const idSet = new Set(ids);
                setPledges(p => p.filter(pledge => !idSet.has(pledge.id)));
            },
            updateStatusBulk: async (ids, status) => {
                const idSet = new Set(ids);
                setPledges(p => p.map(pledge => idSet.has(pledge.id) ? { ...pledge, status } : pledge));
            },
            addTask: async (pledgeId, taskData) => {
                const newTask: PledgeTask = { ...taskData, id: `task-${Date.now()}`, completed: false };
                setPledges(p => p.map(pledge => {
                    if (pledge.id === pledgeId) {
                        return { ...pledge, tasks: [...(pledge.tasks || []), newTask] };
                    }
                    return pledge;
                }));
            },
            toggleTask: async (pledgeId, taskId) => {
                setPledges(p => p.map(pledge => {
                    if (pledge.id === pledgeId) {
                        return { ...pledge, tasks: (pledge.tasks || []).map(task => task.id === taskId ? { ...task, completed: !task.completed } : task) };
                    }
                    return pledge;
                }));
            }
        },
        recurring: {
             add: async (data) => {
                 const calculateNextDueDate = (startDate: string, frequency: RecurringProfile['frequency']) => {
                    const d = new Date(startDate);
                    if (frequency === 'Weekly') d.setDate(d.getDate() + 7);
                    if (frequency === 'Monthly') d.setMonth(d.getMonth() + 1);
                    if (frequency === 'Annually') d.setFullYear(d.getFullYear() + 1);
                    return d.toISOString().split('T')[0];
                };
                const newProfile: RecurringProfile = { 
                    ...data, 
                    id: `rec-${Date.now()}`, 
                    status: 'Active', 
                    nextDueDate: calculateNextDueDate(data.startDate, data.frequency)
                };
                setRecurringProfiles(p => [...p, newProfile]);
                return newProfile;
            },
            updateStatus: async (id, status) => {
                setRecurringProfiles(p => p.map(profile => profile.id === id ? { ...profile, status } : profile));
            },
            updateStatusBulk: async (ids, status) => {
                 const idSet = new Set(ids);
                setRecurringProfiles(p => p.map(profile => idSet.has(profile.id) ? { ...profile, status } : profile));
            }
        },
        users: {
            add: async (data) => {
                const newUser: User = { ...data, id: `user-${Date.now()}`, lastLogin: '1970-01-01T00:00:00.000Z' };
                setUsers(u => [...u, newUser]);
                return newUser;
            },
            update: async (data) => {
                setUsers(u => u.map(user => user.id === data.id ? data : user));
                return data;
            },
            updateStatus: async (id, status) => {
                setUsers(u => u.map(user => user.id === id ? { ...user, status } : user));
            }
        },
        roles: {
            add: async (data) => {
                const newRole: Role = { ...data, id: `role-${Date.now()}` };
                setRoles(r => [...r, newRole]);
                return newRole;
            },
            update: async (data) => {
                setRoles(r => r.map(role => role.id === data.id ? data : role));
                return data;
            },
            delete: async (id) => {
                const role = roles.find(r => r.id === id);
                if (role?.isSystemRole) return { error: "System roles cannot be deleted." };
                const isAssigned = users.some(u => u.roleId === id);
                if (isAssigned) return { error: "Cannot delete a role that is assigned to users." };
                
                setRoles(r => r.filter(role => role.id !== id));
            }
        },
        settings: {
            update: async (data) => {
                setSettings(data);
                // Also update the global tags list if it's part of the settings update
                setTags(data.tags);
            }
        },
        outbox: {
            add: async (donationId) => {
                const newItem: OutboxItem = {
                    id: `outbox-${Date.now()}`,
                    donationId,
                    type: 'receipt',
                    status: 'Ready to Send',
                    addedAt: new Date().toISOString()
                };
                setOutbox(o => [newItem, ...o]);
            },
             addBulk: async (donorIds, templateId) => {
                const newItems: OutboxItem[] = donorIds.map(donorId => ({
                    id: `outbox-${Date.now()}-${donorId}`,
                    status: 'Ready to Send',
                    addedAt: new Date().toISOString(),
                    type: 'template',
                    donorId,
                    templateId,
                }));
                setOutbox(o => [...newItems, ...o]);
            },
            updateStatus: async (outboxId, status, error) => {
                setOutbox(o => o.map(item =>
                    item.id === outboxId ? { ...item, status, error: error || item.error, sentAt: status === 'Sent' ? new Date().toISOString() : item.sentAt } : item
                ));
            },
            retry: async (outboxId) => {
                setOutbox(o => o.map(item =>
                    item.id === outboxId ? { ...item, status: 'Ready to Send', error: undefined } : item
                ));
            }
        },
        queue: {
            add: async (items) => {
                const newItems = items.map(item => ({ ...item, id: `q-${Date.now()}-${Math.random()}` }));
                setCommunicationQueue(q => [...q, ...newItems]);
            }
        },
        tags: {
            add: async (tagData) => {
                const newTag: Tag = { ...tagData, id: `tag-${Date.now()}` };
                setTags(t => [...t, newTag]);
                setSettings(s => ({...s, tags: [...s.tags, newTag]}));
                return newTag;
            },
            update: async (tag) => {
                setTags(t => t.map(t_ => t_.id === tag.id ? tag : t_));
                setSettings(s => ({...s, tags: s.tags.map(t_ => t_.id === tag.id ? tag : t_)}));
                return tag;
            },
            delete: async (id) => {
                setTags(t => t.filter(t_ => t_.id !== id));
                setSettings(s => ({...s, tags: s.tags.filter(t_ => t_.id !== id)}));
                // Also remove tag from donors
                setDonors(d => d.map(donor => ({
                    ...donor,
                    tagIds: (donor.tagIds || []).filter(tagId => tagId !== id)
                })));
            }
        },
        backups: {
            create: async () => {
                await apiDelay(300); // Simulate processing time
                const stateToBackup = { donors, donations, pledges, recurringProfiles, users, roles, settings, outbox, communicationQueue, tags };
                const dataString = JSON.stringify(stateToBackup, null, 2);
                const newBackup: Backup = {
                    id: `backup-${Date.now()}`,
                    date: new Date().toISOString(),
                    size: new Blob([dataString]).size,
                    data: dataString,
                };
                setBackups(b => [newBackup, ...b]);
                return newBackup;
            },
            restore: async (backupId) => {
                const backup = backups.find(b => b.id === backupId);
                if (!backup) throw new Error("Backup not found");
                
                const parsedData = JSON.parse(backup.data);
                restoreStateFromData(parsedData);
            },
            restoreFromFile: async (jsonData) => {
                try {
                    const parsedData = JSON.parse(jsonData);
                     // Basic validation
                    if (!parsedData.donors || !parsedData.donations) {
                        return { success: false, error: "Invalid backup file format." };
                    }
                    restoreStateFromData(parsedData);
                    return { success: true };
                } catch (error) {
                    return { success: false, error: "Failed to parse backup file." };
                }
            },
            delete: async (backupId) => {
                setBackups(b => b.filter(backup => backup.id !== backupId));
            }
        }
    };

    return { state: { donors, donations, pledges, recurringProfiles, users, roles, settings, outbox, communicationQueue, tags, backups }, actions, loading };
};