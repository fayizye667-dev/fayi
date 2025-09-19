import React, { useState, useEffect } from 'react';
import type { Role, Permission } from '../types';
import { PERMISSIONS } from '../types';
import { Modal } from './Modal';

interface RoleFormProps {
    role: Role | null;
    onSave: (roleData: Omit<Role, 'id'>) => void;
    onClose: () => void;
}

const permissionGroups: Record<string, Permission[]> = {
    'Donors': ['donors:view', 'donors:create', 'donors:edit', 'donors:delete'],
    'Receipts': ['receipts:view', 'receipts:create', 'receipts:delete'],
    'System': ['reports:view', 'settings:manage', 'users:manage']
};

export const RoleForm: React.FC<RoleFormProps> = ({ role, onSave, onClose }) => {
    const [name, setName] = useState('');
    const [permissions, setPermissions] = useState<Permission[]>([]);
    
    useEffect(() => {
        if (role) {
            setName(role.name);
            setPermissions(role.permissions);
        }
    }, [role]);

    const handlePermissionChange = (permission: Permission, isChecked: boolean) => {
        if (isChecked) {
            setPermissions(prev => [...prev, permission]);
        } else {
            setPermissions(prev => prev.filter(p => p !== permission));
        }
    };

    const handleGroupPermissionChange = (groupPermissions: Permission[], isChecked: boolean) => {
        if (isChecked) {
            // Add all permissions from the group, avoiding duplicates
            setPermissions(prev => [...new Set([...prev, ...groupPermissions])]);
        } else {
            // Remove all permissions that are in this group
            const groupPermsSet = new Set(groupPermissions);
            setPermissions(prev => prev.filter(p => !groupPermsSet.has(p)));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, permissions, isSystemRole: role?.isSystemRole || false });
        onClose();
    };
    
    const isSystemRole = role?.isSystemRole || false;

    const footer = (
        <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition duration-200">Cancel</button>
            <button type="submit" form="role-form" disabled={isSystemRole} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition duration-200 disabled:bg-teal-400 disabled:cursor-not-allowed">Save Role</button>
        </div>
    );
    
    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={role ? `Edit Role: ${role.name}`: 'Add New Role'}
            footer={footer}
            size="2xl"
        >
             <form id="role-form" onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role Name</label>
                    <input
                        type="text"
                        name="name"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={isSystemRole}
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100 dark:disabled:bg-gray-700/50"
                    />
                     {isSystemRole && <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">System roles cannot be renamed.</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Permissions</label>
                     {isSystemRole && <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Permissions for system roles cannot be changed.</p>}
                    <div className="mt-2 border dark:border-gray-600 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(permissionGroups).map(([group, perms]) => {
                            const areAllSelected = perms.every(p => permissions.includes(p));
                            return (
                                <div key={group}>
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{group}</h4>
                                    <div className="space-y-2">
                                        <label className="flex items-center text-xs text-gray-500 dark:text-gray-400 uppercase pb-2 mb-2 border-b dark:border-gray-700">
                                            <input
                                                type="checkbox"
                                                checked={areAllSelected}
                                                onChange={(e) => handleGroupPermissionChange(perms, e.target.checked)}
                                                disabled={isSystemRole}
                                                className="h-4 w-4 text-teal-600 border-gray-300 dark:border-gray-500 rounded focus:ring-teal-500 disabled:opacity-50"
                                            />
                                            <span className="ml-3 font-bold">Select All</span>
                                        </label>
                                        {perms.map(permission => (
                                            <label key={permission} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={permissions.includes(permission)}
                                                    onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                                                    disabled={isSystemRole}
                                                    className="h-4 w-4 text-teal-600 border-gray-300 dark:border-gray-500 rounded focus:ring-teal-500 disabled:opacity-50"
                                                />
                                                <span className={`ml-3 text-sm ${isSystemRole ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {PERMISSIONS[permission]}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
             </form>
        </Modal>
    )
}