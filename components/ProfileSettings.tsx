import React, { useState } from 'react';
import type { User, Role } from '../types';

interface ProfileSettingsProps {
    user: User;
    roles: Role[];
    onUpdateUser: (user: User) => void;
    showToast: (message: string) => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, roles, onUpdateUser, showToast }) => {
    const [activeTab, setActiveTab] = useState<'details' | 'security'>('details');
    const [profileData, setProfileData] = useState({ name: user.name, email: user.email, avatar: user.avatar });
    const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
    const [passwordError, setPasswordError] = useState('');

    const userRole = roles.find(r => r.id === user.roleId);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileData(prev => ({ ...prev, avatar: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateUser({ ...user, ...profileData });
    };
    
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        if (passwordData.new !== passwordData.confirm) {
            setPasswordError("New passwords do not match.");
            return;
        }
        if (passwordData.new.length < 8) {
             setPasswordError("New password must be at least 8 characters long.");
            return;
        }
        // In a real app, you would verify the current password here via an API call.
        console.log("Password change requested for user:", user.email);
        showToast("Password updated successfully!");
        setPasswordData({ current: '', new: '', confirm: '' });
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Profile & Settings</h1>
            
            <div className="flex border-b dark:border-gray-700 mb-8">
                <button
                    onClick={() => setActiveTab('details')}
                    className={`px-6 py-3 font-medium text-sm transition-colors ${
                        activeTab === 'details'
                            ? 'border-b-2 border-teal-500 text-teal-600 dark:text-teal-400'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    Profile Details
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`px-6 py-3 font-medium text-sm transition-colors ${
                        activeTab === 'security'
                            ? 'border-b-2 border-teal-500 text-teal-600 dark:text-teal-400'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    Security
                </button>
            </div>

            {activeTab === 'details' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md max-w-2xl">
                    <form onSubmit={handleProfileSubmit}>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profile Photo</label>
                                <div className="mt-2 flex items-center space-x-4">
                                    <img 
                                        src={profileData.avatar || `https://i.pravatar.cc/100?u=${user.id}`} 
                                        alt="Current avatar" 
                                        className="w-20 h-20 rounded-full object-cover"
                                        crossOrigin="anonymous"
                                    />
                                    <div>
                                        <input type="file" id="avatar-upload" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                        <label htmlFor="avatar-upload" className="cursor-pointer px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600">
                                            Change
                                        </label>
                                    </div>
                                </div>
                            </div>
                             <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                                <input type="text" name="name" id="name" value={profileData.name} onChange={handleProfileChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                                <input type="email" name="email" id="email" value={profileData.email} onChange={handleProfileChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                                <p className="mt-1 text-gray-500 dark:text-gray-400">{userRole?.name || 'Unknown Role'}</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 rounded-b-xl text-right">
                            <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition duration-200">Save Changes</button>
                        </div>
                    </form>
                </div>
            )}
            
            {activeTab === 'security' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md max-w-2xl">
                    <form onSubmit={handlePasswordSubmit}>
                        <div className="p-6 space-y-4">
                             <div>
                                <label htmlFor="current" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
                                <input type="password" name="current" id="current" value={passwordData.current} onChange={handlePasswordChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                            </div>
                            <div>
                                <label htmlFor="new" className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                                <input type="password" name="new" id="new" value={passwordData.new} onChange={handlePasswordChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                            </div>
                            <div>
                                <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
                                <input type="password" name="confirm" id="confirm" value={passwordData.confirm} onChange={handlePasswordChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                            </div>
                            {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 rounded-b-xl text-right">
                             <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition duration-200">Update Password</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};