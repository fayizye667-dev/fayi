import React from 'react';
import type { View, OrganizationSettings, User, Role, Backup } from '../types';
import { AuditLogs } from './AuditLogs';
import { UserManagement } from './UserManagement';
import { BackupRestore } from './BackupRestore';
import { CommunicationSettings } from './CommunicationSettings';
import { UserActions, RoleActions, TagActions, BackupActions } from '../hooks/useData';

interface SettingsProps {
    currentView: View;
    setView: (view: View) => void;
    settings: OrganizationSettings;
    onUpdateSettings: (settings: OrganizationSettings) => void;
    users: User[];
    roles: Role[];
    backups: Backup[];
    actions: {
        users: UserActions;
        roles: RoleActions;
        tags: TagActions;
        backups: BackupActions;
    };
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const SettingsNavItem: React.FC<{
    view: View;
    currentView: View;
    setView: (view: View) => void;
    label: string;
}> = ({ view, currentView, setView, label }) => {
    // If the main view is 'settings', default the active tab to 'user-management'
    const isActive = currentView === view || (view === 'user-management' && currentView === 'settings');
    
    return (
        <button
            onClick={() => setView(view)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                    ? 'bg-teal-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
        >
            {label}
        </button>
    );
};


export const Settings: React.FC<SettingsProps> = (props) => {
    const { currentView, setView, settings, onUpdateSettings, users, roles, actions, showToast, backups } = props;
    
    const renderContent = () => {
        // Default to user management if the view is 'settings' itself
        const activeView = currentView === 'settings' ? 'user-management' : currentView;

        switch(activeView) {
            case 'audit':
                return <AuditLogs />;
            case 'user-management':
                return <UserManagement 
                            users={users}
                            roles={roles}
                            actions={actions}
                            showToast={showToast}
                        />;
            case 'backup-restore':
                return <BackupRestore 
                            backups={backups}
                            actions={actions.backups}
                            showToast={showToast}
                        />;
            case 'communication-settings':
                return <CommunicationSettings settings={settings} onSave={onUpdateSettings} actions={actions} showToast={showToast} />;
            default:
                return <UserManagement 
                            users={users}
                            roles={roles}
                            actions={actions}
                            showToast={showToast}
                        />;
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Settings</h1>
            <div className="flex flex-wrap items-center gap-2 border-b dark:border-gray-700 pb-4 mb-8">
                <SettingsNavItem view="user-management" currentView={currentView} setView={setView} label="User Management" />
                <SettingsNavItem view="communication-settings" currentView={currentView} setView={setView} label="Communication & Tags" />
                <SettingsNavItem view="audit" currentView={currentView} setView={setView} label="Audit Logs" />
                <SettingsNavItem view="backup-restore" currentView={currentView} setView={setView} label="Backup & Restore" />
            </div>
            
            {renderContent()}
        </div>
    );
};