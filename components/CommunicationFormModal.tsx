





import React, { useState, useMemo } from 'react';
import type { Donor, OrganizationSettings, CommunicationTemplate, CommunicationLog, User } from '../types';
import { Modal } from './Modal';
import { sendToWhatsApp } from '../utils/communication';

interface CommunicationFormModalProps {
    donor: Donor;
    settings: OrganizationSettings;
    currentUser: User | null;
    onSend: (logData: Omit<CommunicationLog, 'id'>) => void;
    onClose: () => void;
}

export const CommunicationFormModal: React.FC<CommunicationFormModalProps> = ({ donor, settings, currentUser, onSend, onClose }) => {
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>(settings.communicationTemplates[0]?.id || '');
    const [customMessage, setCustomMessage] = useState('');
    
    const selectedTemplate = settings.communicationTemplates.find(t => t.id === selectedTemplateId);
    
    // FIX: Re-introduce useMemo for performance and to address potential cryptic type errors from recalculating on every render.
    const finalMessage = useMemo(() => {
        let message = customMessage || selectedTemplate?.body || '';
        if (message) {
            message = message.replace(/{{donorName}}/g, donor.name);
            message = message.replace(/{{orgName}}/g, settings.name);
        }
        return message;
    }, [customMessage, selectedTemplate, donor.name, settings.name]);
    // Add more placeholder replacements here if needed (e.g., {{amount}})

    const handleSend = () => {
        if (!selectedTemplate) {
            alert('Please select a template.');
            return;
        }

        if (selectedTemplate.channel === 'WhatsApp') {
            sendToWhatsApp(donor.phone, finalMessage);
        } else if (selectedTemplate.channel === 'Email') {
            // Simulate Email
            window.location.href = `mailto:${donor.email}?subject=${encodeURIComponent(selectedTemplate.subject || '')}&body=${encodeURIComponent(finalMessage)}`;
        }

        onSend({
            date: new Date().toISOString(),
            channel: selectedTemplate.channel,
            subjectOrTemplate: selectedTemplate.name,
            notes: `Sent '${selectedTemplate.name}' template.`,
            userId: currentUser?.id || 'system'
        });
    };

    const footer = (
        <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition duration-200">Cancel</button>
            <button onClick={handleSend} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition duration-200">
                Send {selectedTemplate?.channel}
            </button>
        </div>
    );

    return (
        <Modal isOpen={true} onClose={onClose} title={`Send Communication to ${donor.name}`} footer={footer} size="lg">
            <div className="space-y-4">
                <div>
                    <label htmlFor="template" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Template</label>
                    <select
                        id="template"
                        value={selectedTemplateId}
                        onChange={e => setSelectedTemplateId(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                    >
                        {settings.communicationTemplates.map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.channel})</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="message-preview" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message Preview & Editor</label>
                    <textarea
                        id="message-preview"
                        rows={10}
                        value={finalMessage}
                        onChange={e => setCustomMessage(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm font-mono text-sm"
                    />
                    {/* FIX: Corrected JSX syntax to render literal curly braces correctly. */}
                     <p className="text-xs text-gray-500 mt-1">You can edit the message here before sending. Placeholders like {`{{donorName}}`} are automatically filled.</p>
                </div>
            </div>
        </Modal>
    );
};