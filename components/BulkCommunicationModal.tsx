import React, { useState, useMemo } from 'react';
import type { Donor, OrganizationSettings, CommunicationTemplate } from '../types';
import { Modal } from './Modal';

interface BulkCommunicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (templateId: string) => void;
    templates: CommunicationTemplate[];
    targetCount: number;
    donors: Donor[]; // for preview
    settings: OrganizationSettings;
}

export const BulkCommunicationModal: React.FC<BulkCommunicationModalProps> = ({ isOpen, onClose, onSend, templates, targetCount, donors, settings }) => {
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');
    
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
    const previewDonor = donors[0];

    const previewMessage = useMemo(() => {
        if (!selectedTemplate || !previewDonor) return 'Select a template to see a preview.';
        let message = selectedTemplate.body;
        message = message.replace(/{{donorName}}/g, previewDonor.name);
        message = message.replace(/{{orgName}}/g, settings.name);
        return message;
    }, [selectedTemplate, previewDonor, settings]);

    const handleConfirm = () => {
        if (selectedTemplateId) {
            onSend(selectedTemplateId);
        }
    };

    const footer = (
        <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
            <button onClick={handleConfirm} disabled={!selectedTemplateId} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
                Send to {targetCount} Donor(s)
            </button>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Send Bulk Communication" footer={footer} size="lg">
            <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">You are about to send a message to <span className="font-bold">{targetCount}</span> donor(s). Please select a template and review the message before sending.</p>
                <div>
                    <label htmlFor="template-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Communication Template</label>
                    <select
                        id="template-select"
                        value={selectedTemplateId}
                        onChange={e => setSelectedTemplateId(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                    >
                        <option value="" disabled>-- Select a template --</option>
                        {templates.map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.channel})</option>
                        ))}
                    </select>
                </div>
                <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message Preview</label>
                     <div className="mt-1 p-3 h-48 overflow-y-auto bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md whitespace-pre-wrap font-mono text-xs">
                        {previewMessage}
                     </div>
                     <p className="text-xs text-gray-500 mt-1">Preview is shown for the first selected donor: {previewDonor?.name}.</p>
                </div>
            </div>
        </Modal>
    );
};
