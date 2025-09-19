



import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { View, User, Donor, Donation, Role } from '../types';
import { Icon } from './Icon';

interface TopBarProps {
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    onLogout: () => void;
    // FIX: Update 'setView' prop type to accept an optional payload argument.
    setView: (view: View, payload?: any) => void;
    user: User | null;
    roles: Role[];
    donors: Donor[];
    donations: Donation[];
    onSearchResultSelect: (result: { type: 'donor' | 'donation'; id: string }) => void;
    upcomingPledgesCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({ theme, setTheme, onLogout, setView, user, roles, donors, donations, onSearchResultSelect, upcomingPledgesCount }) => {
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [language, setLanguage] = useState('EN');

    const [globalSearchTerm, setGlobalSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<{ donors: Donor[]; donations: (Donation & { donorName: string })[] }>({ donors: [], donations: [] });
    const [isSearchActive, setIsSearchActive] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const donorMap = useMemo(() => new Map(donors.map(d => [d.id, d.name])), [donors]);
    const roleMap = useMemo(() => new Map(roles.map(r => [r.id, r.name])), [roles]);
    const userRoleName = user ? roleMap.get(user.roleId) : 'Role';

    useEffect(() => {
        const handler = setTimeout(() => {
            if (globalSearchTerm.length < 2) {
                setSearchResults({ donors: [], donations: [] });
                return;
            }

            const lowercasedTerm = globalSearchTerm.toLowerCase();
            const numericTerm = globalSearchTerm.replace(/[^0-9]/g, '');

            const filteredDonors = donors.filter(d =>
                d.name.toLowerCase().includes(lowercasedTerm) ||
                d.email.toLowerCase().includes(lowercasedTerm) ||
                (numericTerm && d.phone.replace(/[^0-9]/g, '').includes(numericTerm))
            ).slice(0, 3);

            const filteredDonations = donations.map(d => ({ ...d, donorName: donorMap.get(d.donorId) || 'Unknown' })).filter(d =>
                d.id.toLowerCase().includes(lowercasedTerm) ||
                d.donorName.toLowerCase().includes(lowercasedTerm)
            ).slice(0, 3);

            setSearchResults({ donors: filteredDonors, donations: filteredDonations });
        }, 300); // Debounce

        return () => clearTimeout(handler);
    }, [globalSearchTerm, donors, donations, donorMap]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchActive(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [searchRef]);

    const handleSelect = (result: { type: 'donor' | 'donation'; id: string }) => {
        onSearchResultSelect(result);
        setGlobalSearchTerm('');
        setIsSearchActive(false);
    };


    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    const toggleLanguage = () => {
        setLanguage(lang => lang === 'EN' ? 'UR' : 'EN');
    };
    
    const handlePrint = () => {
        window.print();
    }

    return (
        <header className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-between items-center z-10">
            {/* Global Search Bar */}
            <div ref={searchRef} className="relative hidden md:block">
                <Icon name="search" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Global Search (Donor Name, Email, Phone)..."
                    className="bg-light-gray dark:bg-gray-700 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-teal-500 w-64 lg:w-96 transition-all"
                    value={globalSearchTerm}
                    onChange={(e) => setGlobalSearchTerm(e.target.value)}
                    onFocus={() => setIsSearchActive(true)}
                />
                {(isSearchActive && (searchResults.donors.length > 0 || searchResults.donations.length > 0)) && (
                    <div className="absolute mt-2 w-full lg:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 overflow-hidden">
                        {searchResults.donors.length > 0 && (
                            <div>
                                <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50">Donors</h3>
                                <ul>{searchResults.donors.map(donor => <li key={donor.id} onClick={() => handleSelect({ type: 'donor', id: donor.id })} className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">{donor.name} <span className="text-gray-400 ml-2">{donor.email}</span></li>)}</ul>
                            </div>
                        )}
                        {searchResults.donations.length > 0 && (
                            <div>
                                <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50">Receipts</h3>
                                <ul>{searchResults.donations.map(donation => <li key={donation.id} onClick={() => handleSelect({ type: 'donation', id: donation.id })} className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">{donation.donorName} - <span className="font-mono text-teal-500">${donation.amount}</span> <span className="text-gray-400 ml-2">({donation.id})</span></li>)}</ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
             <div className="md:hidden">
                {/* Placeholder for mobile menu toggle if needed */}
            </div>

            {/* Right-side controls */}
            <div className="flex items-center space-x-2 sm:space-x-4 ml-auto">
                <button 
                    onClick={handlePrint}
                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    aria-label="Universal Print"
                    title="Print Current View"
                >
                    <Icon name="print" />
                </button>
                 <button 
                    onClick={toggleLanguage}
                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    aria-label="Toggle Language"
                >
                    <span className="font-bold text-sm">{language}</span>
                </button>
                <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    aria-label="Toggle theme"
                >
                    {theme === 'light' ? <Icon name="moon" /> : <Icon name="sun" />}
                </button>
                <button 
                    className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    aria-label="Notifications"
                    onClick={() => setView('pledges', { filters: { status: 'Due' }})}
                >
                    <Icon name="bell" />
                    {upcomingPledgesCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-red-500 text-white text-xs">{upcomingPledgesCount}</span>
                        </span>
                    )}
                </button>

                {/* User Menu */}
                <div className="relative">
                    <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center space-x-2">
                        <img 
                            src={user?.avatar || `https://i.pravatar.cc/40?u=${user?.id || 'admin'}`}
                            alt="User avatar" 
                            className="w-9 h-9 rounded-full object-cover"
                            crossOrigin="anonymous"
                        />
                         <div className="hidden lg:block text-left">
                            <p className="font-semibold text-sm">{user?.name || 'User'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{userRoleName || 'Role'}</p>
                        </div>
                    </button>
                    {userMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-20 border border-gray-200 dark:border-gray-700">
                            <button onClick={() => { setView('profile-settings'); setUserMenuOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Profile</button>
                            <button onClick={() => { setView('settings'); setUserMenuOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Settings</button>
                            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                            <button onClick={onLogout} className="w-full text-left block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700">Logout</button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};