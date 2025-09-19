




import React, { useState, useMemo } from 'react';
import type { User, Role } from '../types';
import { UserForm } from './UserForm';
import { RoleForm } from './RoleForm';
import { ConfirmationModal } from './ConfirmationModal';
import * as api from '../utils/api';
import { InfoModal } from './InfoModal';
import { Icon } from './Icon';
import { UserActions, RoleActions } from '../hooks/useData';

interface UserManagementProps {
    users: User[];
    roles: Role[];
    actions: {
        users: UserActions;
        roles: RoleActions;
    };
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

type SortKey = 'name' | 'role' | 'status' | 'lastLogin';
type SortDirection = 'asc' | 'desc';
type Tab = 'users' | 'roles';

const timeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    if (date.getFullYear() < 2000) return 'Never';
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "Just now";
};

// --- Roles Management Component ---
const RolesManager: React.FC<{
    roles: Role[];
    users: User[];
    actions: RoleActions;
    showToast: UserManagementProps['showToast'];
}> = ({ roles, users, actions, showToast }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

    const usersPerRole = useMemo(() => {
        return roles.reduce((acc, role) => {
            acc[role.id] = users.filter(u => u.roleId === role.id).length;
            return acc;
        }, {} as Record<string, number>);
    }, [roles, users]);
    
    const handleAddClick = () => {
        setEditingRole(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (role: Role) => {
        setEditingRole(role);
        setIsFormOpen(true);
    };
    
    const handleDeleteClick = (role: Role) => {
        setRoleToDelete(role);
    };

    const handleConfirmDelete = async () => {
        if (!roleToDelete) return;
        
        if (roleToDelete.isSystemRole) {
            showToast("System roles cannot be deleted.", "error");
            setRoleToDelete(null);
            return;
        }
        
        if (usersPerRole[roleToDelete.id] > 0) {
            showToast("Cannot delete a role that is assigned to users.", "error");
            setRoleToDelete(null);
            return;
        }

        const result = await actions.delete(roleToDelete.id);
        // FIX: Safely check if the result object contains an error property.
        if (result && 'error' in result) {
            showToast(result.error, 'error');
        } else {
            showToast(`Role "${roleToDelete.name}" deleted successfully.`);
        }
        setRoleToDelete(null);
    };

    const handleSaveRole = (data: Omit<Role, 'id'>) => {
        if (editingRole) {
            actions.update({ ...editingRole, ...data });
        } else {
            actions.add(data);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <div className="p-4 flex justify-between items-center border-b dark:border-gray-700">
                <h3 className="text-lg font-semibold">Manage Roles</h3>
                <button onClick={handleAddClick} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm flex items-center">
                    <Icon name="plus" className="h-4 w-4 mr-1"/> Add New Role
                </button>
            </div>
            <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="border-b dark:border-gray-700">
                        <tr>
                            <th className="p-4 font-semibold">Role Name</th>
                            <th className="p-4 font-semibold">Users</th>
                            <th className="p-4 font-semibold">Permissions</th>
                            <th className="p-4 font-semibold text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roles.map(role => (
                            <tr key={role.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="p-4 font-medium">{role.name} {role.isSystemRole && <span className="text-xs text-gray-400">(System)</span>}</td>
                                <td className="p-4">{usersPerRole[role.id] || 0}</td>
                                <td className="p-4 text-sm text-gray-500">{role.permissions.length} granted</td>
                                <td className="p-4 text-center">
                                    <button onClick={() => handleEditClick(role)} className="p-2 text-gray-400 hover:text-teal-500"><Icon name="pencil"/></button>
                                    <button onClick={() => handleDeleteClick(role)} disabled={role.isSystemRole} className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"><Icon name="trash"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
            </div>
            {isFormOpen && (
                <RoleForm role={editingRole} onSave={handleSaveRole} onClose={() => setIsFormOpen(false)} />
            )}
             <ConfirmationModal
                isOpen={!!roleToDelete}
                title={`Delete Role: ${roleToDelete?.name}`}
                message={`Are you sure you want to delete this role? This action cannot be undone.`}
                onConfirm={handleConfirmDelete}
                onCancel={() => setRoleToDelete(null)}
            />
        </div>
    );
};


// --- Users Management Component ---
const UsersManager: React.FC<{
    users: User[];
    roles: Role[];
    actions: UserActions;
    showToast: UserManagementProps['showToast'];
}> = ({ users, roles, actions, showToast }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<string>('All');
    const [filterStatus, setFilterStatus] = useState<User['status'] | 'All'>('All');
    
    const [confirmAction, setConfirmAction] = useState<{ action: 'deactivate' | 'activate' | 'resetPassword', user: User | null }>({ action: 'deactivate', user: null });
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

    const roleMap = useMemo(() => new Map(roles.map(r => [r.id, r.name])), [roles]);

    const filteredUsers = useMemo(() => {
        let filtered = [...users];
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(u => u.name.toLowerCase().includes(lowercasedTerm) || u.email.toLowerCase().includes(lowercasedTerm));
        }
        if (filterRole !== 'All') {
            filtered = filtered.filter(u => u.roleId === filterRole);
        }
        if (filterStatus !== 'All') {
            filtered = filtered.filter(u => u.status === filterStatus);
        }
        return filtered;
    }, [users, searchTerm, filterRole, filterStatus]);

    const handleAddClick = () => {
        setEditingUser(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (user: User) => {
        setEditingUser(user);
        setIsFormOpen(true);
    };

    const handleStatusClick = (user: User) => {
        setConfirmAction({ action: user.status === 'Active' ? 'deactivate' : 'activate', user });
        setIsConfirmOpen(true);
    };
    
    const handleResetPasswordClick = (user: User) => {
        setConfirmAction({ action: 'resetPassword', user });
        setIsConfirmOpen(true);
    }

    const handleConfirm = async () => {
        if (!confirmAction.user) return;
        
        if (confirmAction.action === 'resetPassword') {
            try {
                const tempPassword = await api.resetUserPassword(confirmAction.user.id);
                setNewPassword(tempPassword);
                setIsInfoModalOpen(true);
            } catch (error) {
                showToast('Failed to reset password.', 'error');
            }
        } else {
            const newStatus = confirmAction.action === 'activate' ? 'Active' : 'Inactive';
            actions.updateStatus(confirmAction.user.id, newStatus);
        }
        
        setIsConfirmOpen(false);
        setConfirmAction({ action: 'deactivate', user: null });
    };
    
    const handleSaveUser = (data: Omit<User, 'id' | 'lastLogin'>) => {
        if (editingUser) {
            actions.update({ ...editingUser, ...data });
        } else {
            actions.add(data);
        }
    };
    
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <div className="p-4 flex flex-wrap gap-4 justify-between items-center border-b dark:border-gray-700">
                <h3 className="text-lg font-semibold">Manage Users</h3>
                <button onClick={handleAddClick} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm flex items-center">
                    <Icon name="plus" className="h-4 w-4 mr-1" /> Add New User
                </button>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600" />
                <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600">
                    <option value="All">All Roles</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600">
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </select>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="p-4 font-semibold">User</th>
                            <th className="p-4 font-semibold">Role</th>
                            <th className="p-4 font-semibold">Status</th>
                            <th className="p-4 font-semibold">Last Login</th>
                            <th className="p-4 font-semibold text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="p-4">
                                    <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                                </td>
                                <td className="p-4 text-gray-500 dark:text-gray-400">{roleMap.get(user.roleId) || 'Unknown Role'}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-gray-500 dark:text-gray-400">{timeAgo(user.lastLogin)}</td>
                                <td className="p-4 text-center">
                                    <div className="flex justify-center items-center space-x-2">
                                        <button onClick={() => handleEditClick(user)} className="p-2 text-gray-400 hover:text-teal-500" title="Edit User"><Icon name="pencil" /></button>
                                        <button onClick={() => handleStatusClick(user)} className="p-2 text-gray-400" title={user.status === 'Active' ? 'Deactivate User' : 'Activate User'}>
                                            {user.status === 'Active' ? <Icon name="toggleOff" className="hover:text-red-500"/> : <Icon name="toggleOn" className="hover:text-green-500"/>}
                                        </button>
                                        <button onClick={() => handleResetPasswordClick(user)} className="p-2 text-gray-400 hover:text-blue-500" title="Reset Password"><Icon name="key" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             {isFormOpen && (
                <UserForm 
                    user={editingUser}
                    roles={roles}
                    onSave={handleSaveUser}
                    onClose={() => setIsFormOpen(false)}
                />
            )}
             <ConfirmationModal
                isOpen={isConfirmOpen}
                title={`Confirm ${confirmAction.action}`}
                message={
                    confirmAction.action === 'resetPassword' ? `Are you sure you want to reset the password for ${confirmAction.user?.name}? A new temporary password will be generated.` :
                    `Are you sure you want to ${confirmAction.action} the user ${confirmAction.user?.name}?`
                }
                onConfirm={handleConfirm}
                onCancel={() => setIsConfirmOpen(false)}
            />
             <InfoModal
                isOpen={isInfoModalOpen}
                title="Password Reset Successful"
                message={`The temporary password for ${confirmAction.user?.name} is:`}
                content={<div className="my-2 p-2 bg-gray-100 dark:bg-gray-700 rounded font-mono text-center text-teal-500 dark:text-teal-400">{newPassword}</div>}
                onClose={() => setIsInfoModalOpen(false)}
            />
        </div>
    );
}

// --- Main Component ---
export const UserManagement: React.FC<UserManagementProps> = ({ users, roles, actions, showToast }) => {
    const [activeTab, setActiveTab] = useState<Tab>('users');

    return (
        <div>
            <div className="flex border-b dark:border-gray-700 mb-6">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'users' ? 'border-b-2 border-teal-500 text-teal-600 dark:text-teal-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    Users
                </button>
                <button
                    onClick={() => setActiveTab('roles')}
                    className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'roles' ? 'border-b-2 border-teal-500 text-teal-600 dark:text-teal-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    Roles & Permissions
                </button>
            </div>

            {activeTab === 'users' ? <UsersManager users={users} roles={roles} actions={actions.users} showToast={showToast} /> : <RolesManager roles={roles} users={users} actions={actions.roles} showToast={showToast} />}
        </div>
    );
};