import React, { useState, useRef } from 'react';
import { Icon } from './Icon';
import { Backup } from '../types';
import { BackupActions } from '../hooks/useData';
import { ConfirmationModal } from './ConfirmationModal';

interface BackupRestoreProps {
    backups: Backup[];
    actions: BackupActions;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const BackupRestore: React.FC<BackupRestoreProps> = ({ backups, actions, showToast }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [actionToConfirm, setActionToConfirm] = useState<{ type: 'restore' | 'delete' | 'restoreFile', backup?: Backup, fileContent?: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCreateBackup = async () => {
        setIsCreating(true);
        try {
            await actions.create();
            showToast('Backup created successfully!', 'success');
        } catch (error) {
            showToast('Failed to create backup.', 'error');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDownload = (backup: Backup) => {
        const blob = new Blob([backup.data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const dateStr = new Date(backup.date).toISOString().split('T')[0];
        a.download = `alkahaf_backup_${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                setActionToConfirm({ type: 'restoreFile', fileContent: content });
            };
            reader.readAsText(file);
        }
        // Reset file input to allow selecting the same file again
        event.target.value = ''; 
    };

    const handleConfirm = async () => {
        if (!actionToConfirm) return;

        try {
            if (actionToConfirm.type === 'restore' && actionToConfirm.backup) {
                await actions.restore(actionToConfirm.backup.id);
                showToast(`Restored from backup created on ${new Date(actionToConfirm.backup.date).toLocaleString()}.`, 'success');
            } else if (actionToConfirm.type === 'delete' && actionToConfirm.backup) {
                await actions.delete(actionToConfirm.backup.id);
                showToast('Backup deleted.', 'success');
            } else if (actionToConfirm.type === 'restoreFile' && actionToConfirm.fileContent) {
                const result = await actions.restoreFromFile(actionToConfirm.fileContent);
                if (result.success) {
                    showToast('Successfully restored data from file.', 'success');
                } else {
                    showToast(result.error || 'An unknown error occurred.', 'error');
                }
            }
        } catch (error: any) {
            showToast(error.message || 'An error occurred.', 'error');
        }
        
        setActionToConfirm(null);
    };
    
    const getConfirmationMessage = () => {
        if (!actionToConfirm) return '';
        switch(actionToConfirm.type) {
            case 'restore':
                return `Are you sure you want to restore from this backup? All current data will be overwritten with the data from ${new Date(actionToConfirm.backup!.date).toLocaleString()}. This action cannot be undone.`;
            case 'delete':
                return 'Are you sure you want to permanently delete this backup?';
            case 'restoreFile':
                 return 'Are you sure you want to restore from this file? All current data in the application will be overwritten. This action cannot be undone.';
            default:
                return 'Are you sure?'
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <div className="p-4 flex flex-wrap gap-4 justify-between items-center border-b dark:border-gray-700">
                <h2 className="text-xl font-semibold">Backup & Restore</h2>
                <div className="flex items-center space-x-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".json" className="hidden"/>
                    <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 flex items-center text-sm">
                        <Icon name="import" className="h-4 w-4 mr-2" /> Restore from File
                    </button>
                    <button onClick={handleCreateBackup} disabled={isCreating} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition duration-200 flex items-center text-sm disabled:opacity-50">
                        <Icon name="plus" className="h-4 w-4 mr-2" /> {isCreating ? 'Creating...' : 'Create Backup Now'}
                    </button>
                </div>
            </div>
            <div className="p-4">
                 <p className="text-sm text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg">
                    <strong>Warning:</strong> Restoring from a backup will replace all existing data with the data from the selected backup file. This action cannot be undone.
                 </p>
            </div>
            <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="p-4 font-semibold">Backup Date</th>
                            <th className="p-4 font-semibold">File Size</th>
                            <th className="p-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {backups.length > 0 ? backups.map(backup => (
                            <tr key={backup.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="p-4">
                                    <div className="font-medium text-gray-900 dark:text-white">{new Date(backup.date).toLocaleString()}</div>
                                </td>
                                <td className="p-4 text-gray-500 dark:text-gray-400">{formatBytes(backup.size)}</td>
                                <td className="p-4 text-right space-x-2">
                                    <button onClick={() => handleDownload(backup)} className="px-3 py-1 text-sm border dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">Download</button>
                                    <button onClick={() => setActionToConfirm({ type: 'restore', backup })} className="px-3 py-1 text-sm text-yellow-700 border border-yellow-300 dark:border-yellow-700 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/50">Restore</button>
                                    <button onClick={() => setActionToConfirm({ type: 'delete', backup })} className="px-3 py-1 text-sm text-red-700 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/50">Delete</button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={3} className="text-center p-8 text-gray-500">No backups found. Create one to get started.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <ConfirmationModal 
                isOpen={!!actionToConfirm}
                title="Confirm Action"
                message={getConfirmationMessage()}
                onConfirm={handleConfirm}
                onCancel={() => setActionToConfirm(null)}
            />
        </div>
    );
};