import React, { useState, useMemo, useEffect } from 'react';
import type { Donor, OrganizationSettings, CommunicationTemplate, CommunicationLog, User } from '../types';
import { Modal } from './Modal';
import { Icon } from './Icon';

interface BulkEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    donorIds: string[];
    donors: Donor[];
    settings: OrganizationSettings;
    currentUser: User | null;
    onLogCommunicationBulk: (donorIds: string[], logData: Omit<CommunicationLog, 'id'>) => Promise<void>;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const BulkEmailModal: React.FC<BulkEmailModalProps> = ({ isOpen, onClose, donorIds, donors, settings, currentUser, onLogCommunicationBulk, showToast }) => {
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');

    const targetDonors = useMemo(() => {
        const idSet = new Set(donorIds);
        return donors.filter(d => idSet.has(d.id));
    }, [donorIds, donors]);

    const emailTemplates = useMemo(() => {
        return settings.communicationTemplates.filter(t => t.channel === 'Email');
    }, [settings.communicationTemplates]);

    // Set initial template on component open
    useEffect(() => {
        if(emailTemplates.length > 0 && !selectedTemplateId) {
            setSelectedTemplateId(emailTemplates[0].id);
        }
    }, [emailTemplates, selectedTemplateId]);

    // Update form when template changes
    useEffect(() => {
        const template = emailTemplates.find(t => t.id === selectedTemplateId);
        if (template) {
            setSubject(template.subject || '');
            setBody(template.body || '');
        } else {
            setSubject('');
            setBody('');
        }
    }, [selectedTemplateId, emailTemplates]);
    
    // Memoize the preview to avoid re-calculating on every render
    const previewBody = useMemo(() => {
        let preview = body;
        const previewDonor = targetDonors[0];
        if (previewDonor) {
            preview = preview.replace(/{{donorName}}/g, previewDonor.name);
        }
        preview = preview.replace(/{{orgName}}/g, settings.name);
        return preview;
    }, [body, targetDonors, settings.name]);

    const handleSend = () => {
        const emails = targetDonors.map(d => d.email).filter(Boolean);
        if (emails.length === 0) {
            showToast('No valid email addresses found for the selected donors.', 'error');
            return;
        }

        const bcc = emails.join(',');
        window.location.href = `mailto:?bcc=${bcc}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        onLogCommunicationBulk(donorIds, {
            date: new Date().toISOString(),
            channel: 'Email',
            subjectOrTemplate: `Bulk Email: ${subject}`,
            notes: `Sent bulk email to ${donorIds.length} donors.`,
            userId: currentUser?.id || 'system',
        });
        
        showToast(`Opened email client to send to ${donorIds.length} donors.`, 'success');
        onClose();
    };

    const footer = (
        <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
            <button onClick={handleSend} disabled={!subject || !body || targetDonors.length === 0} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
                <div className="flex items-center">
                    <Icon name="paperAirplane" className="h-4 w-4 mr-2" />
                    Send to {targetDonors.length} Donor(s)
                </div>
            </button>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Compose Bulk Email" footer={footer} size="2xl">
            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
                <div>
                    <label htmlFor="template" className="block text-sm font-medium">Template</label>
                    <select
                        id="template"
                        value={selectedTemplateId}
                        onChange={e => setSelectedTemplateId(e.target.value)}
                        className="mt-1 block w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600"
                    >
                        <option value="" disabled>Select a template</option>
                        {emailTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="subject" className="block text-sm font-medium">Subject</label>
                    <input
                        type="text"
                        id="subject"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        className="mt-1 block w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600"
                    />
                </div>
                <div>
                    <label htmlFor="body" className="block text-sm font-medium">Body</label>
                    <textarea
                        id="body"
                        rows={10}
                        value={body}
                        onChange={e => setBody(e.target.value)}
                         className="mt-1 block w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Use placeholders like {'{{donorName}}'} and {'{{orgName}}'}.</p>
                </div>
                <div>
                    <h4 className="text-sm font-medium">Preview</h4>
                    <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-900 border rounded-lg text-sm whitespace-pre-wrap">
                        <p className="font-semibold">{subject}</p>
                        <hr className="my-2 dark:border-gray-600"/>
                        <p>{previewBody}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Preview shown for the first selected donor: {targetDonors[0]?.name || 'N/A'}</p>
                </div>
            </div>
        </Modal>
    );
};
