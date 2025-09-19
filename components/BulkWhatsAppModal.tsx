import React, { useState, useMemo, useEffect } from 'react';
import type { Donor, OrganizationSettings, CommunicationTemplate } from '../types';
import { Modal } from './Modal';
import { Icon } from './Icon';

interface BulkWhatsAppModalProps {
    isOpen: boolean;
    onClose: () => void;
    donorIds: string[];
    donors: Donor[];
    settings: OrganizationSettings;
    onAddToOutboxBulk: (donorIds: string[], templateId: string) => Promise<void>;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const BulkWhatsAppModal: React.FC<BulkWhatsAppModalProps> = ({ isOpen, onClose, donorIds, donors, settings, onAddToOutboxBulk, showToast }) => {
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [body, setBody] = useState('');

    const targetDonors = useMemo(() => {
        const idSet = new Set(donorIds);
        return donors.filter(d => idSet.has(d.id));
    }, [donorIds, donors]);

    const whatsAppTemplates = useMemo(() => {
        return settings.communicationTemplates.filter(t => t.channel === 'WhatsApp');
    }, [settings.communicationTemplates]);

    // Set initial template on component open
    useEffect(() => {
        if (whatsAppTemplates.length > 0 && !selectedTemplateId) {
            setSelectedTemplateId(whatsAppTemplates[0].id);
        }
    }, [whatsAppTemplates, selectedTemplateId]);

    // Update form when template changes
    useEffect(() => {
        const template = whatsAppTemplates.find(t => t.id === selectedTemplateId);
        if (template) {
            setBody(template.body || '');
        } else {
            setBody('');
        }
    }, [selectedTemplateId, whatsAppTemplates]);
    
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

    const handleConfirm = () => {
        if (!selectedTemplateId) {
            showToast('Please select a template.', 'error');
            return;
        }

        const validDonors = targetDonors.filter(d => d.phone);
        if (validDonors.length < targetDonors.length) {
            showToast(`Warning: ${targetDonors.length - validDonors.length} donors without a phone number were skipped.`, 'info');
        }

        if (validDonors.length > 0) {
            onAddToOutboxBulk(validDonors.map(d => d.id), selectedTemplateId);
            showToast(`${validDonors.length} WhatsApp messages have been added to the Outbox.`, 'success');
        } else {
            showToast('No selected donors have a phone number.', 'error');
        }
        
        onClose();
    };

    const footer = (
        <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
            <button onClick={handleConfirm} disabled={!selectedTemplateId || targetDonors.length === 0} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
                <div className="flex items-center">
                    <Icon name="queue" className="h-4 w-4 mr-2" />
                    Add {targetDonors.length} to Outbox
                </div>
            </button>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Compose Bulk WhatsApp" footer={footer} size="lg">
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
                        {whatsAppTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
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
                        <p>{previewBody}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Preview shown for the first selected donor: {targetDonors[0]?.name || 'N/A'}</p>
                </div>
            </div>
        </Modal>
    );
};