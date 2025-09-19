import React, { useMemo, useState } from 'react';
import type { Segment, Donor, Donation, OrganizationSettings, View, QueuedCommunication, Tag } from '../types';
import { Icon } from './Icon';
import { BulkCommunicationModal } from './BulkCommunicationModal';
import { QueueActions } from '../hooks/useData';

interface MultiChannelSendingProps {
    segment: Segment;
    donors: Donor[];
    donations: Donation[];
    settings: OrganizationSettings;
    onBack: () => void;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    onQueueCommunications: QueueActions['add'];
    setView: (view: View, payload?: any) => void;
}

export const MultiChannelSending: React.FC<MultiChannelSendingProps> = ({ segment, donors, donations, settings, onBack, showToast, onQueueCommunications, setView }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const donorTotals = useMemo(() => {
        const totals = new Map<string, { total: number, lastDate: string }>();
        donations.forEach(d => {
            const current = totals.get(d.donorId) || { total: 0, lastDate: '1970-01-01' };
            current.total += d.amount;
            if (d.date > current.lastDate) {
                current.lastDate = d.date;
            }
            totals.set(d.donorId, current);
        });
        return totals;
    }, [donations]);

    const tagMap = useMemo(() => new Map(settings.tags.map(t => [t.id, t])), [settings.tags]);

    const filteredDonors = useMemo(() => {
        return donors.filter(donor => {
            const donorStats = donorTotals.get(donor.id) || { total: 0, lastDate: donor.joinDate };
            const filters = segment.filters;
            if (filters.location && !donor.address.toLowerCase().includes(filters.location.toLowerCase())) return false;
            if (filters.lastDonationStart && donorStats.lastDate < filters.lastDonationStart) return false;
            if (filters.lastDonationEnd && donorStats.lastDate > filters.lastDonationEnd) return false;
            if (filters.totalDonatedMin && donorStats.total < parseFloat(filters.totalDonatedMin)) return false;
            if (filters.totalDonatedMax && donorStats.total > parseFloat(filters.totalDonatedMax)) return false;
            if (filters.purpose !== 'All' && !donations.some(d => d.donorId === donor.id && d.purpose === filters.purpose)) return false;
            if (filters.tags) {
                const requiredTags = filters.tags.toLowerCase().split(',').map(t => t.trim()).filter(Boolean);
                // FIX: Replace `donor.tags` with a lookup using `donor.tagIds` and a `tagMap`.
                const donorTagNames = (donor.tagIds || []).map(id => tagMap.get(id)?.name);
                if (requiredTags.length > 0 && !requiredTags.every(tag => donorTagNames.some(dTag => dTag && dTag.toLowerCase().includes(tag)))) return false;
            }
            return true;
        });
    }, [donors, segment.filters, donorTotals, donations, tagMap]);

    const handleQueue = (templateId: string) => {
        const template = settings.communicationTemplates.find(t => t.id === templateId);
        if (!template) {
            showToast('Selected template not found.', 'error');
            return;
        }

        const communicationsToQueue: Omit<QueuedCommunication, 'id'>[] = filteredDonors.map(donor => ({
            donorId: donor.id,
            templateId: template.id,
            channel: template.channel,
            status: 'Queued',
            queuedAt: new Date().toISOString()
        }));
        
        // 1. Add to queue state
        onQueueCommunications(communicationsToQueue);
        
        // 2. Close modal and show feedback
        setIsModalOpen(false);
        showToast(`Successfully queued ${communicationsToQueue.length} messages. Navigating to queue...`, 'success');
        
        // 3. Navigate to queue page after a short delay for UX
        setTimeout(() => {
            setView('communication-queue');
        }, 1500);
    };

    return (
        <div>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <button onClick={onBack} className="flex items-center text-sm text-teal-600 dark:text-teal-400 hover:underline mb-2">
                        <Icon name="arrowLeft" className="h-4 w-4 mr-1" /> Back to Reports
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Multi-Channel Sending</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Sending to segment: <span className="font-semibold text-teal-500">{segment.name}</span></p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Target Audience ({filteredDonors.length} Donors)</h2>
                    <div className="max-h-96 overflow-y-auto">
                        <ul className="divide-y dark:divide-gray-700">
                            {filteredDonors.map(donor => (
                                <li key={donor.id} className="py-2">
                                    <p className="font-medium">{donor.name}</p>
                                    <p className="text-sm text-gray-500">{donor.email}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Compose & Send</h2>
                     <div className="space-y-4">
                        <p>Select a pre-defined communication template to send to this segment. The system will use the appropriate channel (Email or WhatsApp) defined in the template and add it to the communication queue for processing.</p>
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition duration-200 flex items-center justify-center"
                        >
                            <Icon name="paperAirplane" className="h-5 w-5 mr-2"/>
                            Choose Template & Add to Queue
                        </button>
                    </div>
                </div>
            </div>
            
            {isModalOpen && (
                <BulkCommunicationModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSend={handleQueue}
                    templates={settings.communicationTemplates}
                    targetCount={filteredDonors.length}
                    donors={filteredDonors}
                    settings={settings}
                />
            )}
        </div>
    );
};