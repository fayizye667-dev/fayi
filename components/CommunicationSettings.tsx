import React, { useState, useEffect, useRef } from 'react';
import type { OrganizationSettings, CommunicationTemplate, Tag } from '../types';
import { Modal } from './Modal';
import { Icon } from './Icon';
import { ConfirmationModal } from './ConfirmationModal';
import { TagActions } from '../hooks/useData';

interface CommunicationSettingsProps {
    settings: OrganizationSettings;
    onSave: (settings: OrganizationSettings) => void;
    actions: { tags: TagActions };
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const tagColors = [
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
];

// --- Tag Manager Component ---
const TagManager: React.FC<{
    tags: Tag[];
    actions: TagActions;
    showToast: CommunicationSettingsProps['showToast'];
}> = ({ tags, actions, showToast }) => {
    const [newTagName, setNewTagName] = useState('');
    const [editingTag, setEditingTag] = useState<Tag | null>(null);
    const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);

    const handleAddTag = async () => {
        if (!newTagName.trim()) return;
        const existing = tags.find(t => t.name.toLowerCase() === newTagName.trim().toLowerCase());
        if(existing) {
            showToast('A tag with this name already exists.', 'error');
            return;
        }
        await actions.add({
            name: newTagName.trim(),
            color: tagColors[tags.length % tagColors.length]
        });
        setNewTagName('');
    };
    
    const handleUpdateTag = (tag: Tag) => {
        actions.update(tag);
        setEditingTag(null);
    }
    
    const handleConfirmDelete = () => {
        if(!tagToDelete) return;
        actions.delete(tagToDelete.id);
        showToast(`Tag "${tagToDelete.name}" deleted.`, 'success');
        setTagToDelete(null);
    }

    return (
        <div className="p-4 border rounded-lg dark:border-gray-700">
            <h3 className="font-semibold text-lg mb-4">Tag Management</h3>
            <div className="flex items-center gap-2 mb-4">
                <input
                    type="text"
                    value={newTagName}
                    onChange={e => setNewTagName(e.target.value)}
                    placeholder="New tag name..."
                    className="flex-grow p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600"
                />
                <button onClick={handleAddTag} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm">Add Tag</button>
            </div>
            <div className="space-y-2">
                {tags.map(tag => (
                    <div key={tag.id} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex justify-between items-center">
                        {editingTag?.id === tag.id ? (
                            <input
                                type="text"
                                value={editingTag.name}
                                onChange={e => setEditingTag({ ...editingTag, name: e.target.value })}
                                onBlur={() => handleUpdateTag(editingTag)}
                                onKeyDown={e => e.key === 'Enter' && handleUpdateTag(editingTag)}
                                className="p-1 border rounded bg-white dark:bg-gray-800"
                                autoFocus
                            />
                        ) : (
                             <span className={`px-2 py-1 text-sm rounded-full ${tag.color}`}>{tag.name}</span>
                        )}
                        <div className="space-x-2">
                            <button onClick={() => setEditingTag(tag)} className="p-1 text-gray-400 hover:text-teal-500"><Icon name="pencil" className="h-4 w-4"/></button>
                            <button onClick={() => setTagToDelete(tag)} className="p-1 text-gray-400 hover:text-red-500"><Icon name="trash" className="h-4 w-4"/></button>
                        </div>
                    </div>
                ))}
            </div>
            <ConfirmationModal
                isOpen={!!tagToDelete}
                title={`Delete Tag: ${tagToDelete?.name}`}
                message="Are you sure? Deleting this tag will remove it from all donors."
                onConfirm={handleConfirmDelete}
                onCancel={() => setTagToDelete(null)}
            />
        </div>
    );
}

// --- Template Form Component ---
const TemplateForm: React.FC<{
    template: CommunicationTemplate | null;
    onSave: (template: CommunicationTemplate) => void;
    onClose: () => void;
}> = ({ template, onSave, onClose }) => {
    const [formData, setFormData] = useState<Omit<CommunicationTemplate, 'id'>>({
        name: '',
        type: 'GeneralUpdate',
        channel: 'Email',
        subject: '',
        body: ''
    });

    useEffect(() => {
        if (template) {
            setFormData(template);
        }
    }, [template]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: template?.id || crypto.randomUUID(),
            ...formData
        });
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={template ? "Edit Template" : "Add Template"} size="lg">
            <form id="template-form" onSubmit={handleSubmit} className="space-y-4">
                <input type="text" placeholder="Template Name" value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} required className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600" />
                <select value={formData.type} onChange={e => setFormData(f => ({ ...f, type: e.target.value as any }))} className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600">
                    <option value="DonationThankYou">Donation Thank You</option>
                    <option value="PledgeReminder">Pledge Reminder</option>
                    <option value="GeneralUpdate">General Update</option>
                </select>
                <select value={formData.channel} onChange={e => setFormData(f => ({ ...f, channel: e.target.value as any }))} className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600">
                    <option value="Email">Email</option>
                    <option value="WhatsApp">WhatsApp</option>
                </select>
                {formData.channel === 'Email' && <input type="text" placeholder="Email Subject" value={formData.subject} onChange={e => setFormData(f => ({ ...f, subject: e.target.value }))} className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600" />}
                <textarea placeholder="Template Body..." value={formData.body} onChange={e => setFormData(f => ({ ...f, body: e.target.value }))} rows={6} className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 font-mono text-sm" />
                <div className="flex justify-end space-x-2">
                    <button type="button" onClick={onClose} className="px-3 py-1 border rounded-lg">Cancel</button>
                    <button type="submit" className="px-3 py-1 bg-teal-600 text-white rounded-lg">Save</button>
                </div>
            </form>
        </Modal>
    );
}

export const CommunicationSettings: React.FC<CommunicationSettingsProps> = ({ settings, onSave, actions, showToast }) => {
    const [formData, setFormData] = useState<OrganizationSettings>(settings);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isTemplateFormOpen, setIsTemplateFormOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<CommunicationTemplate | null>(null);

    useEffect(() => {
        setFormData(settings);
    }, [settings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, logo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        showToast('Settings saved successfully.', 'success');
    };

    const removeLogo = () => {
        setFormData(prev => ({ ...prev, logo: '' }));
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
    
    const handleSaveTemplate = (template: CommunicationTemplate) => {
        const templates = formData.communicationTemplates || [];
        const existingIndex = templates.findIndex(t => t.id === template.id);
        if (existingIndex > -1) {
            templates[existingIndex] = template;
        } else {
            templates.push(template);
        }
        setFormData(f => ({ ...f, communicationTemplates: templates }));
    };

    const handleDeleteTemplate = (templateId: string) => {
        if(window.confirm('Are you sure you want to delete this template?')) {
            setFormData(f => ({...f, communicationTemplates: (f.communicationTemplates || []).filter(t => t.id !== templateId)}));
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-md h-fit">
                <div className="p-6 border-b dark:border-gray-700">
                    <h2 className="text-xl font-semibold">Communication Settings</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure your organization's branding and messaging.</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-8">
                        {/* Branding & Contact Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                                <label htmlFor="name" className="block text-sm font-medium">Organization Name</label>
                                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Logo</label>
                                <div className="mt-1 flex items-center space-x-4">
                                    {formData.logo ? <img src={formData.logo} alt="Logo" className="h-12 w-12 object-contain bg-gray-100 rounded" /> : <div className="h-12 w-12 bg-gray-100 rounded text-xs flex items-center justify-center">No Logo</div>}
                                    <div>
                                         <input type="file" ref={fileInputRef} onChange={handleLogoChange} accept="image/*" className="hidden" id="logo-upload" />
                                         <label htmlFor="logo-upload" className="cursor-pointer text-sm font-medium text-teal-600 hover:text-teal-500">Change</label>
                                         {formData.logo && <button type="button" onClick={removeLogo} className="text-xs text-red-500 block">Remove</button>}
                                    </div>
                                </div>
                            </div>
                             <div>
                                <label htmlFor="whatsappNumber" className="block text-sm font-medium">WhatsApp Number</label>
                                 <input type="tel" name="whatsappNumber" id="whatsappNumber" value={formData.whatsappNumber} onChange={handleChange} required placeholder="e.g., 12223334444" className="mt-1 block w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium">Email Address</label>
                                <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                        </div>

                        {/* Template Manager */}
                        <div className="p-4 border rounded-lg dark:border-gray-700">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-lg">Communication Templates</h3>
                                <button type="button" onClick={() => { setEditingTemplate(null); setIsTemplateFormOpen(true); }} className="px-3 py-1 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 flex items-center"><Icon name="plus" className="h-4 w-4 mr-1"/> Add Template</button>
                            </div>
                            <div className="space-y-2">
                                {(formData.communicationTemplates || []).map(template => (
                                    <div key={template.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{template.name}</p>
                                            <p className="text-xs text-gray-500">{template.channel} - {template.type}</p>
                                        </div>
                                        <div className="space-x-2">
                                            <button type="button" onClick={() => { setEditingTemplate(template); setIsTemplateFormOpen(true); }} className="p-1 text-gray-400 hover:text-teal-500"><Icon name="pencil" className="h-4 w-4"/></button>
                                            <button type="button" onClick={() => handleDeleteTemplate(template.id)} className="p-1 text-gray-400 hover:text-red-500"><Icon name="trash" className="h-4 w-4"/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 rounded-b-xl text-right">
                        <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition duration-200">Save All Settings</button>
                    </div>
                </form>
            </div>
             <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-md h-fit">
                <TagManager tags={settings.tags} actions={actions.tags} showToast={showToast} />
            </div>
             {isTemplateFormOpen && <TemplateForm template={editingTemplate} onSave={handleSaveTemplate} onClose={() => setIsTemplateFormOpen(false)} />}
        </div>
    );
};
