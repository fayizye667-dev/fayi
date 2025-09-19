import React, { useState, useMemo } from 'react';
import type { RecurringProfile, Donor } from '../types';
import { RecurringDonationForm } from './RecurringDonationForm';
import { Icon } from './Icon';
import { RecurringActions } from '../hooks/useData';

interface RecurringListProps {
    recurringProfiles: RecurringProfile[];
    donors: Donor[];
    actions: RecurringActions;
}

type SortKey = 'donorName' | 'amount' | 'nextDueDate' | 'status' | 'frequency';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
    key: SortKey;
    direction: SortDirection;
}

const SortableHeader: React.FC<{
    label: string;
    sortKey: SortKey;
    sortConfig: SortConfig | null;
    requestSort: (key: SortKey) => void;
}> = ({ label, sortKey, sortConfig, requestSort }) => {
    const isSorted = sortConfig?.key === sortKey;
    const directionIcon = isSorted ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕';

    return (
        <th className="p-4 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => requestSort(sortKey)}>
            <div className="flex items-center">{label} <span className={`ml-2 text-xs ${isSorted ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400'}`}>{directionIcon}</span></div>
        </th>
    );
};

export const RecurringList: React.FC<RecurringListProps> = ({ recurringProfiles, donors, actions }) => {
    const { add, updateStatus, updateStatusBulk } = actions;
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState<RecurringProfile['status'] | 'All'>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'nextDueDate', direction: 'asc' });
    
    const [selectedProfiles, setSelectedProfiles] = useState<Record<string, boolean>>({});
    const [bulkStatus, setBulkStatus] = useState<RecurringProfile['status']>('Active');
    
    const donorMap = useMemo(() => new Map(donors.map(d => [d.id, d.name])), [donors]);

    const getDonorName = (donorId: string) => donorMap.get(donorId) || 'Unknown Donor';

    const getStatusChip = (status: RecurringProfile['status']) => {
        const baseClasses = 'px-2 py-1 text-xs font-semibold rounded-full';
        switch (status) {
            case 'Active': return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
            case 'Paused': return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
            case 'Cancelled': return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`;
        }
    };

    const filteredProfiles = useMemo(() => {
        let processed = recurringProfiles.map(p => ({
            ...p,
            donorName: getDonorName(p.donorId)
        }));

        if (filterStatus !== 'All') {
            processed = processed.filter(p => p.status === filterStatus);
        }

        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            processed = processed.filter(p => p.donorName.toLowerCase().includes(lowercasedTerm));
        }

        if (sortConfig !== null) {
            processed.sort((a, b) => {
                let aValue: any = a[sortConfig.key];
                let bValue: any = b[sortConfig.key];
                
                if (sortConfig.key === 'nextDueDate') {
                    aValue = new Date(aValue).getTime();
                    bValue = new Date(bValue).getTime();
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return processed;
    }, [recurringProfiles, donors, filterStatus, searchTerm, sortConfig]);

    const selectedCount = Object.values(selectedProfiles).filter(Boolean).length;

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newSelected: Record<string, boolean> = {};
        if (e.target.checked) {
            filteredProfiles.forEach(p => newSelected[p.id] = true);
        }
        setSelectedProfiles(newSelected);
    };

    const handleSelectOne = (id: string) => {
        setSelectedProfiles(prev => ({...prev, [id]: !prev[id]}));
    };

    const handleUpdateStatusSelected = () => {
        if (selectedCount > 0) {
            const idsToUpdate = Object.keys(selectedProfiles).filter(id => selectedProfiles[id]);
            updateStatusBulk(idsToUpdate, bulkStatus);
            setSelectedProfiles({});
        }
    };

    const requestSort = (key: SortKey) => {
        let direction: SortDirection = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Recurring Donations</h1>
                 <div className="flex items-center space-x-3">
                    {selectedCount > 0 && (
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">{selectedCount} selected</span>
                            <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value as any)} className="p-2 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600">
                                <option value="Active">Active</option>
                                <option value="Paused">Paused</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                            <button onClick={handleUpdateStatusSelected} className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Update Status</button>
                        </div>
                    )}
                    <button onClick={() => setIsFormOpen(true)} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition duration-200 flex items-center">
                        <Icon name="plus" className="h-5 w-5 mr-1" />
                        Add Recurring
                    </button>
                </div>
            </div>

             <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative flex-grow">
                         <input type="text" placeholder="Search by donor name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                         <Icon name="search" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    <div className="flex items-center space-x-2">
                        <label htmlFor="status-filter" className="font-medium text-sm">Status:</label>
                        <select
                            id="status-filter"
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value as any)}
                            className="p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600"
                        >
                            <option value="All">All</option>
                            <option value="Active">Active</option>
                            <option value="Paused">Paused</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="p-4 w-12"><input type="checkbox" onChange={handleSelectAll} checked={selectedCount > 0 && selectedCount === filteredProfiles.length && filteredProfiles.length > 0} className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500" /></th>
                            <SortableHeader label="Donor" sortKey="donorName" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader label="Amount" sortKey="amount" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader label="Frequency" sortKey="frequency" sortConfig={sortConfig} requestSort={requestSort} />
                            <th className="p-4 font-semibold">Purpose</th>
                            <SortableHeader label="Next Due Date" sortKey="nextDueDate" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} requestSort={requestSort} />
                            <th className="p-4 font-semibold text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProfiles.map((profile) => (
                            <tr key={profile.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="p-4"><input type="checkbox" checked={!!selectedProfiles[profile.id]} onChange={() => handleSelectOne(profile.id)} className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500" /></td>
                                <td className="p-4">{profile.donorName}</td>
                                <td className="p-4 font-medium text-teal-600 dark:text-teal-400">${profile.amount.toLocaleString()}</td>
                                <td className="p-4">{profile.frequency}</td>
                                <td className="p-4">{profile.purpose === 'Custom' ? profile.customPurpose : profile.purpose}</td>
                                <td className="p-4">{new Date(profile.nextDueDate).toLocaleDateString()}</td>
                                <td className="p-4"><span className={getStatusChip(profile.status)}>{profile.status}</span></td>
                                <td className="p-4 text-center">
                                    <div className="flex justify-center items-center space-x-2">
                                        <button className="p-2 text-gray-400 hover:text-teal-500" title="Edit"><Icon name="pencil" /></button>
                                        {profile.status === 'Active' && (
                                            <>
                                                <button onClick={() => updateStatus(profile.id, 'Paused')} className="p-2 text-gray-400 hover:text-yellow-500" title="Pause"><Icon name="pause" /></button>
                                                <button onClick={() => updateStatus(profile.id, 'Cancelled')} className="p-2 text-gray-400 hover:text-red-500" title="Cancel"><Icon name="cancel" /></button>
                                            </>
                                        )}
                                        {profile.status === 'Paused' && <button onClick={() => updateStatus(profile.id, 'Active')} className="p-2 text-gray-400 hover:text-green-500" title="Resume"><Icon name="play" /></button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                         {filteredProfiles.length === 0 && (
                            <tr>
                                <td colSpan={8} className="text-center p-8 text-gray-500 dark:text-gray-400">
                                    No recurring donations match the selected filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isFormOpen && (
                <RecurringDonationForm
                    donors={donors}
                    onSave={add}
                    onClose={() => setIsFormOpen(false)}
                />
            )}
        </div>
    );
};