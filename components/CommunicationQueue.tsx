import React, { useMemo, useState } from 'react';
import type { OutboxItem, Donor, Donation, OrganizationSettings, User, CommunicationLog, CommunicationTemplate } from '../types';
import { Icon } from './Icon';
import { EmptyState } from './EmptyState';
import { OutboxActions } from '../hooks/useData';
import { ReceiptPreviewModal } from './ReceiptPreviewModal';
import { sendToWhatsApp, formatReceiptForWhatsApp } from '../utils/communication';

interface OutboxProps {
    outboxItems: OutboxItem[];
    donations: Donation[];
    donors: Donor[];
    settings: OrganizationSettings;
    actions: OutboxActions;
    currentUser: User | null;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    onLogCommunication: (donorId: string, logData: Omit<CommunicationLog, 'id'>) => Promise<void>;
}

export const Outbox: React.FC<OutboxProps> = ({ outboxItems, donations, donors, settings, actions, currentUser, showToast, onLogCommunication }) => {
    const [filterStatus, setFilterStatus] = useState<OutboxItem['status'] | 'All'>('All');
    const [viewingDonation, setViewingDonation] = useState<Donation | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [filterDate, setFilterDate] = useState({ start: '', end: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAmount, setFilterAmount] = useState({ min: '', max: '' });
    const [filterMethod, setFilterMethod] = useState<'All' | 'Cash' | 'Online'>('All');

    const donorMap = useMemo(() => new Map(donors.map(d => [d.id, d])), [donors]);
    const donationMap = useMemo(() => new Map(donations.map(d => [d.id, d])), [donations]);
    const templateMap = useMemo(() => new Map(settings.communicationTemplates.map(t => [t.id, t])), [settings.communicationTemplates]);

    const getStatusChip = (status: OutboxItem['status']) => {
        const baseClasses = 'px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5';
        switch (status) {
            case 'Ready to Send': return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`;
            case 'Sent': return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
            case 'Failed': return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`;
        }
    };
    
    const resetFilters = () => {
        setFilterStatus('All');
        setFilterDate({ start: '', end: '' });
        setSearchTerm('');
        setFilterAmount({ min: '', max: '' });
        setFilterMethod('All');
        setShowFilters(false);
    };
    
    const setDateRange = (period: 'today' | 'week' | 'month') => {
        const end = new Date();
        const start = new Date();
        if (period === 'today') {
            // start is already today
        } else if (period === 'week') {
            start.setDate(start.getDate() - 6);
        } else if (period === 'month') {
            start.setDate(start.getDate() - 29);
        }
        setFilterDate({
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        });
    };

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (searchTerm) count++;
        if (filterStatus !== 'All') count++;
        if (filterDate.start || filterDate.end) count++;
        if (filterAmount.min || filterAmount.max) count++;
        if (filterMethod !== 'All') count++;
        return count;
    }, [searchTerm, filterStatus, filterDate, filterAmount, filterMethod]);


    const processedItems = useMemo(() => {
        let items = outboxItems.map(item => {
            if (item.type === 'receipt') {
                const donation = donationMap.get(item.donationId);
                const donor = donation ? donorMap.get(donation.donorId) : undefined;
                return { ...item, donation, donor, template: null };
            } else { // 'template'
                const donor = donorMap.get(item.donorId);
                const template = templateMap.get(item.templateId);
                return { ...item, donation: null, donor, template };
            }
        });

        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            items = items.filter(item => 
                item.donor?.name.toLowerCase().includes(lowercasedTerm) ||
                (item.donation && item.donation.id.toLowerCase().includes(lowercasedTerm)) ||
                (item.template && item.template.name.toLowerCase().includes(lowercasedTerm))
            );
        }

        if (filterStatus !== 'All') {
            items = items.filter(item => item.status === filterStatus);
        }
        
        if (filterAmount.min) {
            items = items.filter(item => item.donation && item.donation.amount >= parseFloat(filterAmount.min));
        }
        if (filterAmount.max) {
            items = items.filter(item => item.donation && item.donation.amount <= parseFloat(filterAmount.max));
        }

        if (filterMethod !== 'All') {
            items = items.filter(item => item.donation && item.donation.method === filterMethod);
        }

        if (filterDate.start) {
            const startOfDay = new Date(filterDate.start);
            startOfDay.setHours(0, 0, 0, 0);
            items = items.filter(item => new Date(item.addedAt) >= startOfDay);
        }
        if (filterDate.end) {
            const endOfDay = new Date(filterDate.end);
            endOfDay.setHours(23, 59, 59, 999);
            items = items.filter(item => new Date(item.addedAt) <= endOfDay);
        }

        return items;
    }, [outboxItems, filterStatus, filterDate, searchTerm, filterAmount, filterMethod, donationMap, donorMap, templateMap]);

    const handleSend = async (outboxItem: (typeof processedItems)[0], channel: 'WhatsApp' | 'Email') => {
        const { id: outboxId, donor } = outboxItem;
        if (!donor) {
            actions.updateStatus(outboxId, 'Failed', 'Missing donor data.');
            showToast('Could not send: Missing donor data.', 'error');
            return;
        }

        try {
            let message = '';
            let subject = '';
            let logSubject = '';

            if (outboxItem.type === 'receipt' && outboxItem.donation) {
                const { donation } = outboxItem;
                logSubject = `Receipt: ${donation.id}`;
                if (channel === 'WhatsApp') {
                    message = formatReceiptForWhatsApp(donation, donor, settings);
                } else {
                    subject = `Donation Receipt ${donation.id} from ${settings.name}`;
                    message = `Dear ${donor.name},\n\nThank you for your generous donation of $${donation.amount}.\nPlease find your receipt attached to this email.\n\nTo view your receipt, please download the JPG from the outbox before sending this email.\n\nSincerely,\nThe ${settings.name} Team`;
                }
            } else if (outboxItem.type === 'template' && outboxItem.template) {
                const { template } = outboxItem;
                logSubject = `Template: ${template.name}`;
                subject = (template.subject || logSubject).replace(/{{donorName}}/g, donor.name).replace(/{{orgName}}/g, settings.name);
                message = template.body.replace(/{{donorName}}/g, donor.name).replace(/{{orgName}}/g, settings.name);
            } else {
                throw new Error('Invalid outbox item data.');
            }

            if (channel === 'WhatsApp') {
                if (!donor.phone) throw new Error('Donor has no phone number.');
                sendToWhatsApp(donor.phone, message);
                showToast(`Opening WhatsApp for ${donor.name}. Please attach any required images.`, 'info');
            } else { // Email
                if (!donor.email) throw new Error('Donor has no email address.');
                window.location.href = `mailto:${donor.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
                showToast(`Opening email client for ${donor.name}.`, 'info');
            }
            
            await onLogCommunication(donor.id, {
                date: new Date().toISOString(),
                channel,
                subjectOrTemplate: logSubject,
                notes: `Message sent via ${channel} from Outbox.`,
                userId: currentUser?.id || 'system',
            });
            actions.updateStatus(outboxId, 'Sent');

        } catch (error: any) {
            actions.updateStatus(outboxId, 'Failed', error.message);
            showToast(error.message, 'error');
        }
    };


    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Outbox</h1>
            
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="relative flex-grow">
                         <input type="text" placeholder="Search by donor, receipt ID, or template..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                         <Icon name="search" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    <button onClick={() => setShowFilters(!showFilters)} className="px-4 py-2 border dark:border-gray-600 rounded-lg flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-nowrap">
                        <Icon name="filter" /> 
                        <span>Filters</span>
                         {activeFilterCount > 0 && (
                            <span className="ml-2 bg-teal-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{activeFilterCount}</span>
                        )}
                    </button>
                    <button onClick={resetFilters} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Reset</button>
                </div>
                {showFilters && (
                    <div className="mt-4 border-t dark:border-gray-700 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Status</label>
                                <select
                                    value={filterStatus}
                                    onChange={e => setFilterStatus(e.target.value as any)}
                                    className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value="All">All</option>
                                    <option value="Ready to Send">Ready to Send</option>
                                    <option value="Sent">Sent</option>
                                    <option value="Failed">Failed</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Method (Receipts Only)</label>
                                <select value={filterMethod} onChange={e => setFilterMethod(e.target.value as any)} className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600">
                                    <option value="All">All</option>
                                    <option>Cash</option>
                                    <option>Online</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Amount (Receipts Only)</label>
                                <div className="flex items-center space-x-2">
                                    <input type="number" placeholder="Min" value={filterAmount.min} onChange={e => setFilterAmount(p => ({ ...p, min: e.target.value }))} className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600" />
                                    <span>to</span>
                                    <input type="number" placeholder="Max" value={filterAmount.max} onChange={e => setFilterAmount(p => ({ ...p, max: e.target.value }))} className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                            </div>
                            <div className="lg:col-span-2">
                                <label className="block text-sm font-medium mb-1">'Added to Outbox' Date</label>
                                <div className="flex items-center space-x-2 mb-2">
                                    <button onClick={() => setDateRange('today')} className="px-2 py-1 text-xs border dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">Today</button>
                                    <button onClick={() => setDateRange('week')} className="px-2 py-1 text-xs border dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">Last 7 Days</button>
                                    <button onClick={() => setDateRange('month')} className="px-2 py-1 text-xs border dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">Last 30 Days</button>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input type="date" value={filterDate.start} onChange={e => setFilterDate(p => ({ ...p, start: e.target.value }))} className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600"/>
                                    <span className="text-gray-500">to</span>
                                    <input type="date" value={filterDate.end} onChange={e => setFilterDate(p => ({ ...p, end: e.target.value }))} className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600"/>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-x-auto">
                <table className="w-full text-left">
                     <thead className="border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="p-4 font-semibold">Donor</th>
                            <th className="p-4 font-semibold">Subject</th>
                            <th className="p-4 font-semibold">Added to Outbox</th>
                            <th className="p-4 font-semibold">Status</th>
                            <th className="p-4 font-semibold text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processedItems.map(item => (
                            <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="p-4">{item.donor?.name || '...'}</td>
                                <td className="p-4">
                                    {item.type === 'receipt' && item.donation && (
                                        <>
                                            <span className="font-mono text-xs">{item.donation.id}</span>
                                            <span className="font-medium text-teal-500 ml-2">${item.donation.amount.toLocaleString()}</span>
                                        </>
                                    )}
                                    {item.type === 'template' && item.template && (
                                        <span className="text-sm">{item.template.name}</span>
                                    )}
                                </td>
                                <td className="p-4 text-sm text-gray-500 dark:text-gray-400">{new Date(item.addedAt).toLocaleString()}</td>
                                <td className="p-4">
                                    <div className="flex flex-col">
                                        <span className={getStatusChip(item.status)}>{item.status}</span>
                                        {item.status === 'Failed' && <span className="text-xs text-red-500 mt-1 truncate" title={item.error}>{item.error}</span>}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-center items-center space-x-2">
                                        {item.status !== 'Sent' && (
                                             <button onClick={() => handleSend(item, 'WhatsApp')} disabled={!item.donor?.phone || (item.type === 'template' && item.template?.channel !== 'WhatsApp')} className="p-2 text-gray-400 hover:text-green-500 disabled:opacity-30 disabled:cursor-not-allowed" title="Send via WhatsApp"><Icon name="whatsapp" /></button>
                                        )}
                                        {item.status !== 'Sent' && (
                                            <button onClick={() => handleSend(item, 'Email')} disabled={!item.donor?.email || (item.type === 'template' && item.template?.channel !== 'Email')} className="p-2 text-gray-400 hover:text-blue-500 disabled:opacity-30 disabled:cursor-not-allowed" title="Send via Email"><Icon name="message" /></button>
                                        )}
                                        {item.status === 'Failed' && (
                                             <button onClick={() => actions.retry(item.id)} className="p-2 text-gray-400 hover:text-teal-500" title="Retry"><Icon name="refresh" /></button>
                                        )}
                                        {item.type === 'receipt' && item.donation && (
                                            <button onClick={() => setViewingDonation(item.donation!)} className="p-2 text-gray-400 hover:text-indigo-500" title="View/Print/Download"><Icon name="eye" /></button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {processedItems.length === 0 && (
                     <EmptyState
                        title="No Items Found"
                        message="Try adjusting your filters, or create a new receipt to see it here."
                     />
                )}
            </div>

            {viewingDonation && (
                 <ReceiptPreviewModal
                    donation={viewingDonation}
                    donors={donors}
                    settings={settings}
                    onClose={() => setViewingDonation(null)}
                    showToast={showToast}
                    onLogCommunication={onLogCommunication}
                    currentUser={currentUser}
                    onSendAgain={(donationId) => { actions.add(donationId); setViewingDonation(null); }}
                />
            )}
        </div>
    );
};