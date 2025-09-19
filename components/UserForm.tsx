import React, { useState, useEffect } from 'react';
import type { User, Permission, Role } from '../types';
import { PERMISSIONS } from '../types';
import { Modal } from './Modal';

interface UserFormProps {
    user: User | null;
    roles: Role[];
    onSave: (userData: Omit<User, 'id' | 'lastLogin'>) => void;
    onClose: () => void;
}

const permissionGroups = {
    'Donors': ['donors:view', 'donors:create', 'donors:edit', 'donors:delete'],
    'Receipts': ['receipts:view', 'receipts:create', 'receipts:delete'],
    'System': ['reports:view', 'settings:manage', 'users:manage']
};

export const UserForm: React.FC<UserFormProps> = ({ user, roles, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        roleId: roles.find(r => r.name === 'Staff')?.id || roles[0]?.id || '',
    });
    const [passwordData, setPasswordData] = useState({ password: '', confirm: ''});
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                email: user.email,
                roleId: user.roleId,
            });
        }
    }, [user]);
    
    const selectedRole = roles.find(r => r.id === formData.roleId);
    const permissions = selectedRole?.permissions || [];

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value as any }));
    };
    
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!user) { // Only validate password for new users
            if (passwordData.password.length < 8) {
                setError('Password must be at least 8 characters long.');
                return;
            }
            if (passwordData.password !== passwordData.confirm) {
                setError('Passwords do not match.');
                return;
            }
        }
        
        onSave({ 
            ...formData, 
            status: user ? user.status : 'Active', // Ensure status is passed
            avatar: user?.avatar, // Preserve existing avatar
        });
        onClose();
    };

    const footer = (
        <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition duration-200">Cancel</button>
            <button type="submit" form="user-form" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition duration-200">Save</button>
        </div>
    );

    return (
        <Modal 
            isOpen={true} 
            onClose={onClose} 
            title={user ? 'Edit User' : 'Add New User'}
            footer={footer}
            size="lg"
        >
             <form id="user-form" onSubmit={handleSubmit} className="overflow-y-auto pr-2 max-h-[60vh]">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input type="email" name="email" id="email" value={formData.email} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                    </div>
                    <div>
                        <label htmlFor="roleId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                        <select name="roleId" id="roleId" value={formData.roleId} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500">
                           {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>

                    {/* Permissions Section */}
                    <div className="space-y-2 pt-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Permissions inherited from '{selectedRole?.name}' role</label>
                        <div className="border dark:border-gray-600 rounded-lg p-3 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                            {Object.entries(permissionGroups).map(([groupName, groupPermissions]) => (
                                <div key={groupName}>
                                    <h4 className="font-semibold text-sm mb-1">{groupName}</h4>
                                    <div className="space-y-1">
                                        {(groupPermissions as Permission[]).map(p => (
                                            <label key={p} className="flex items-center text-sm">
                                                <input 
                                                    type="checkbox" 
                                                    checked={permissions.includes(p)}
                                                    disabled
                                                    className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 disabled:opacity-70"
                                                />
                                                <span className="ml-2 text-gray-500 dark:text-gray-400">{PERMISSIONS[p]}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {!user && (
                        <>
                            <hr className="dark:border-gray-600 pt-2"/>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                <input type="password" name="password" id="password" value={passwordData.password} onChange={handlePasswordChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                            </div>
                             <div>
                                <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
                                <input type="password" name="confirm" id="confirm" value={passwordData.confirm} onChange={handlePasswordChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                            </div>
                        </>
                    )}
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
            </form>
        </Modal>
    );
};