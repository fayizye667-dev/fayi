
import React, { useState, useMemo, useEffect } from 'react';
import type { Donation, Donor, OrganizationSettings, CommunicationLog, User } from '../types';
import { DonationForm } from './DonationForm';
import { exportToCsv } from '../utils/export';
import { ConfirmationModal } from './ConfirmationModal';
import { ReceiptPreviewModal } from './ReceiptPreviewModal';
import { Icon } from './Icon';
import { Pagination } from './Pagination';
import { EmptyState } from './EmptyState';
import { donationPurposes, recurringOptions } from '../data/constants';
import { DonationActions } from '../hooks/useData';

type SortKey = 'donorName' | 'amount' | 'date' | 'purpose' | 'method' | 'id';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
    key: SortKey;
    direction: SortDirection;
}

interface DonationListProps {
    donations: Donation[];
    donors: Donor[];
    actions: DonationActions;
    settings: OrganizationSettings;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    initialPayload?: { action?: 'add'; donorId?: string; searchTerm?: string };
    onClearPayload: () => void;
    onViewProfile: (donorId: string) => void;
    onLogCommunication: (donorId: string, logData: Omit<CommunicationLog, 'id'>) => Promise<void>;
    currentUser: User | null;
    onAddToOutbox: (donationId: string) => void;
}

const ITEMS_PER_PAGE = 10;

const SortableHeader: React.FC<{
    label: string;
    sortKey: SortKey;
    sortConfigs: SortConfig[];
    requestSort: (key: SortKey, event: React.MouseEvent) => void;
}> = ({ label, sortKey, sortConfigs, requestSort }) => {
    const sortConfig = sortConfigs.find(c => c.key === sortKey);
    const sortIndex = sortConfigs.findIndex(c => c.key === sortKey);
    const isSorted = !!sortConfig;
    const directionIcon = isSorted ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕';

    return (
        <th className="p-4 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={(e) => requestSort(sortKey, e)}>
            <div className="flex items-center">
                {label}
                <span className={`ml-2 flex items-center gap-1 ${isSorted ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400'}`}>
                    {isSorted && sortConfigs.length > 1 && (
                        <span className="text-xs bg-gray-200 dark:bg-gray-600 rounded-full w-4 h-4 flex items-center justify-center font-normal">
                            {sortIndex + 1}
                        </span>
                    )}
                    <span className="text-xs">{directionIcon}</span>
                </span>
            </div>
        </th>
    );
};

export const DonationList: React.FC<DonationListProps> = ({ donations, donors, actions, settings, showToast, initialPayload, onClearPayload, onViewProfile, onLogCommunication, currentUser, onAddToOutbox }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ key: 'date', direction: 'desc' }]);
    const [selectedDonations, setSelectedDonations] = useState<Record<string, boolean>>({});
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [viewingReceipt, setViewingReceipt] = useState<Donation | null>(null);
    const [initialDonorId, setInitialDonorId] = useState<string | undefined>(undefined);

    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState({ start: '', end: '' });
    const [filterAmount, setFilterAmount] = useState({ min: '', max: '' });
    const [filterPurpose, setFilterPurpose] = useState<(typeof donationPurposes)[number] | 'All'>('All');
    const [filterCustomPurpose, setFilterCustomPurpose] = useState('');
    const [filterMethod, setFilterMethod] = useState<'All' | 'Cash' | 'Online'>('All');
    const [filterRecurring, setFilterRecurring] = useState<(typeof recurringOptions)[number] | 'All'>('All');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (initialPayload) {
            if (initialPayload.action === 'add' && initialPayload.donorId) {
                setInitialDonorId(initialPayload.donorId);
                setIsFormOpen(true);
            }
            if (initialPayload.searchTerm) {
                resetFilters(); // Reset other filters for clarity
                setSearchTerm(initialPayload.searchTerm);
            }
            onClearPayload();
        }
    }, [initialPayload, onClearPayload]);

    const donorMap = useMemo(() => new Map(donors.map(d => [d.id, d])), [donors]);

    const getDonor = (donorId: string) => {
        return donorMap.get(donorId);
    };
    
    const processedDonations = useMemo(() => {
        let filtered = donations.map(d => ({...d, donor: getDonor(d.donorId), donorName: getDonor(d.donorId)?.name || 'Unknown Donor'}));

        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            const numericTerm = searchTerm.replace(/[^0-9]/g, '');
            filtered = filtered.filter(d =>
                d.donorName.toLowerCase().includes(lowercasedTerm) ||
                d.id.toLowerCase().includes(lowercasedTerm) ||
                d.purpose.toLowerCase().includes(lowercasedTerm) ||
                (d.customPurpose && d.customPurpose.toLowerCase().includes(lowercasedTerm)) ||
                (numericTerm && d.donor?.phone && d.donor.phone.replace(/[^0-9]/g, '').includes(numericTerm))
            );
        }
        if (filterDate.start) {
            filtered = filtered.filter(d => new Date(d.date) >= new Date(filterDate.start));
        }
        if (filterDate.end) {
            filtered = filtered.filter(d => new Date(d.date) <= new Date(filterDate.end));
        }
        if (filterAmount.min) {
            filtered = filtered.filter(d => d.amount >= parseFloat(filterAmount.min));
        }
        if (filterAmount.max) {
            filtered = filtered.filter(d => d.amount <= parseFloat(filterAmount.max));
        }
        if (filterPurpose !== 'All') {
            filtered = filtered.filter(d => d.purpose === filterPurpose);
        }
        if (filterPurpose === 'Custom' && filterCustomPurpose) {
            filtered = filtered.filter(d => d.customPurpose && d.customPurpose.toLowerCase().includes(filterCustomPurpose.toLowerCase()));
        }
        if (filterMethod !== 'All') {
            filtered = filtered.filter(d => d.method === filterMethod);
        }
        if (filterRecurring !== 'All') {
            filtered = filtered.filter(d => d.recurring === filterRecurring);
        }
        
        return filtered;

    }, [donations, donorMap, searchTerm, filterDate, filterAmount, filterPurpose, filterCustomPurpose, filterMethod, filterRecurring]);


    const sortedDonations = useMemo(() => {
        let sortableItems = [...processedDonations];
        if (sortConfigs.length > 0) {
            sortableItems.sort((a, b) => {
                for (const config of sortConfigs) {
                    const { key, direction } = config;

                    let aValue: any = a[key as keyof typeof a];
                    let bValue: any = b[key as keyof typeof b];

                    if (key === 'date') {
                        aValue = new Date(aValue).getTime();
                        bValue = new Date(bValue).getTime();
                    }
                    
                    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
                    if (typeof bValue === 'string') bValue = bValue.toLowerCase();

                    if (aValue < bValue) {
                        return direction === 'asc' ? -1 : 1;
                    }
                    if (aValue > bValue) {
                        return direction === 'asc' ? 1 : -1;
                    }
                }
                return 0;
            });
        }
        return sortableItems;
    }, [processedDonations, sortConfigs]);
    
    const paginatedDonations = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedDonations.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [sortedDonations, currentPage]);


    const requestSort = (key: SortKey, event: React.MouseEvent) => {
        const isShiftPressed = event.shiftKey;
        let newConfigs = [...sortConfigs];
        const existingConfigIndex = newConfigs.findIndex(c => c.key === key);

        if (!isShiftPressed) {
            if (existingConfigIndex > -1 && newConfigs.length === 1) {
                if (newConfigs[0].direction === 'asc') {
                    setSortConfigs([{ key, direction: 'desc' }]);
                } else {
                    setSortConfigs([]);
                }
            } else {
                setSortConfigs([{ key, direction: 'asc' }]);
            }
        } else {
            if (existingConfigIndex > -1) {
                if (newConfigs[existingConfigIndex].direction === 'asc') {
                    newConfigs[existingConfigIndex].direction = 'desc';
                } else {
                    newConfigs.splice(existingConfigIndex, 1);
                }
            } else {
                newConfigs.push({ key, direction: 'asc' });
            }
            setSortConfigs(newConfigs);
        }
    };
    
    const selectedCount = Object.values(selectedDonations).filter(Boolean).length;

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newSelected: Record<string, boolean> = {};
        if (e.target.checked) {
            sortedDonations.forEach(d => newSelected[d.id] = true);
        }
        setSelectedDonations(newSelected);
    };

    const handleSelectOne = (id: string) => {
        setSelectedDonations(prev => ({...prev, [id]: !prev[id]}));
    };
    
    const handleDeleteClick = () => {
        if (selectedCount > 0) {
            setIsConfirmOpen(true);
        } else {
            showToast('Please select at least one receipt to delete.');
        }
    };
    
    const handleConfirmDelete = () => {
        const idsToDelete = Object.keys(selectedDonations).filter(id => selectedDonations[id]);
        actions.deleteBulk(idsToDelete);
        setSelectedDonations({});
        setIsConfirmOpen(false);
    };

    const resetFilters = () => {
        setShowFilters(false);
        setSearchTerm('');
        setFilterDate({ start: '', end: '' });
        setFilterAmount({ min: '', max: '' });
        setFilterPurpose('All');
        setFilterCustomPurpose('');
        setFilterMethod('All');
        setFilterRecurring('All');
        setCurrentPage(1);
    };
    
    const handleSaveDonation = (donation: Donation) => {
        actions.add(donation);
    };

    const handleExport = (type: 'selected' | 'current') => {
        let dataToExport;
        let filename = 'receipts_export.csv';
    
        if (type === 'selected') {
            const selectedIds = Object.keys(selectedDonations).filter(id => selectedDonations[id]);
            if (selectedIds.length === 0) {
                showToast('No receipts selected for export.');
                return;
            }
            dataToExport = sortedDonations.filter(d => selectedIds.includes(d.id));
            filename = `receipts_selected_${selectedIds.length}.csv`;
        } else {
            dataToExport = sortedDonations;
            filename = `receipts_view_${sortedDonations.length}.csv`;
        }
    
        const headers = [
            'Receipt ID', 'Date', 'Amount', 'Method', 'Purpose', 'Custom Purpose', 'Recurring',
            'Donor ID', 'Donor Name', 'Donor Email', 'Donor Phone'
        ];
    
        const rows = dataToExport.map(donation => [
            donation.id,
            donation.date,
            donation.amount,
            donation.method,
            donation.purpose,
            donation.customPurpose || '',
            donation.recurring,
            donation.donorId,
            donation.donor?.name || 'N/A',
            donation.donor?.email || 'N/A',
            donation.donor?.phone || 'N/A',
        ]);
    
        exportToCsv(filename, [headers, ...rows]);
        showToast(`${dataToExport.length} receipt(s) exported successfully.`);
    };
    
    const setDateRange = (period: 'today' | 'week' | 'month') => {
        const end = new Date();
        const start = new Date();
        if (period === 'today') {
            // start is already today
        } else if (period === 'week') {
            start.setDate(start.getDate() - 6); // Today + 6 previous days = 7 days
        } else if (period === 'month') {
            start.setDate(start.getDate() - 29); // Today + 29 previous days = 30 days
        }
        setFilterDate({
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        });
    };

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (searchTerm) count++;
        if (filterDate.start || filterDate.end) count++;
        if (filterAmount.min || filterAmount.max) count++;
        if (filterPurpose !== 'All') count++;
        if (filterMethod !== 'All') count++;
        if (filterRecurring !== 'All') count++;
        if (filterCustomPurpose && filterPurpose === 'Custom') count++;
        return count;
    }, [searchTerm, filterDate, filterAmount, filterPurpose, filterCustomPurpose, filterMethod, filterRecurring]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Receipts</h1>
                 <div className="flex items-center space-x-3">
                    {selectedCount > 0 && (
                        <button
                            onClick={handleDeleteClick}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200 flex items-center"
                        >
                            <Icon name="trash" className="h-5 w-5 mr-2" />
                            Delete ({selectedCount})
                        </button>
                    )}
                    
                    {selectedCount > 0 ? (
                        <button
                            onClick={() => handleExport('selected')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 flex items-center"
                        >
                            <Icon name="export" />
                            Export Selected ({selectedCount})
                        </button>
                    ) : (
                        <button
                            onClick={() => handleExport('current')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 flex items-center"
                        >
                            <Icon name="export" />
                            Export View ({sortedDonations.length})
                        </button>
                    )}

                    <button
                        onClick={() => {
                            setInitialDonorId(undefined);
                            setIsFormOpen(true);
                        }}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition duration-200 flex items-center"
                    >
                        <Icon name="plus" className="h-5 w-5 mr-2" />
                        Add Receipt
                    </button>
                </div>
            </div>
            
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="relative flex-grow">
                         <input type="text" placeholder="Search by donor name, phone, receipt ID, or purpose..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                         <Icon name="search" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    <button onClick={() => setShowFilters(!showFilters)} className="px-4 py-2 border dark:border-gray-600 rounded-lg flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-nowrap">
                        <Icon name="filter" /> 
                        <span>Filters</span>
                         {activeFilterCount > 0 && (
                            <span className="ml-2 bg-teal-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{activeFilterCount}</span>
                        )}
                    </button>
                    <button onClick={resetFilters} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Reset</button>
                </div>
                 {showFilters && (
                    <div className="mt-4 border-t dark:border-gray-700 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                             <div>
                                <label className="block text-sm font-medium mb-1">Donation Date</label>
                                <div className="flex items-center space-x-2">
                                    <input type="date" value={filterDate.start} onChange={e => setFilterDate(p => ({ ...p, start: e.target.value }))} className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600"/>
                                    <span className="text-gray-500">to</span>
                                    <input type="date" value={filterDate.end} onChange={e => setFilterDate(p => ({ ...p, end: e.target.value }))} className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600"/>
                                </div>
                                <div className="flex items-center space-x-2 mt-2">
                                    <button onClick={() => setDateRange('today')} className="px-2 py-1 text-xs border dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">Today</button>
                                    <button onClick={() => setDateRange('week')} className="px-2 py-1 text-xs border dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">Last 7 Days</button>
                                    <button onClick={() => setDateRange('month')} className="px-2 py-1 text-xs border dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">Last 30 Days</button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Amount ($)</label>
                                <div className="flex items-center space-x-2">
                                    <input type="number" placeholder="Min" value={filterAmount.min} onChange={e => setFilterAmount(p => ({ ...p, min: e.target.value }))} className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600" />
                                    <span>to</span>
                                    <input type="number" placeholder="Max" value={filterAmount.max} onChange={e => setFilterAmount(p => ({ ...p, max: e.target.value }))} className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Purpose</label>
                                <select value={filterPurpose} onChange={e => setFilterPurpose(e.target.value as any)} className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600">
                                    <option value="All">All</option>
                                    {donationPurposes.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            {filterPurpose === 'Custom' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Custom Purpose Contains</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g., 'Gala 2024'"
                                        value={filterCustomPurpose}
                                        onChange={e => setFilterCustomPurpose(e.target.value)}
                                        className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium mb-1">Method</label>
                                <select value={filterMethod} onChange={e => setFilterMethod(e.target.value as any)} className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600">
                                    <option value="All">All</option>
                                    <option>Cash</option>
                                    <option>Online</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Recurring</label>
                                <select value={filterRecurring} onChange={e => setFilterRecurring(e.target.value as any)} className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600">
                                    <option value="All">All</option>
                                    {recurringOptions.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="p-4 w-12"><input type="checkbox" onChange={handleSelectAll} checked={selectedCount > 0 && selectedCount === sortedDonations.length && sortedDonations.length > 0} className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500" /></th>
                            <SortableHeader label="Receipt ID" sortKey="id" sortConfigs={sortConfigs} requestSort={requestSort} />
                            <SortableHeader label="Donor Name" sortKey="donorName" sortConfigs={sortConfigs} requestSort={requestSort} />
                            <SortableHeader label="Amount" sortKey="amount" sortConfigs={sortConfigs} requestSort={requestSort} />
                            <SortableHeader label="Date" sortKey="date" sortConfigs={sortConfigs} requestSort={requestSort} />
                            <SortableHeader label="Purpose" sortKey="purpose" sortConfigs={sortConfigs} requestSort={requestSort} />
                            <SortableHeader label="Method" sortKey="method" sortConfigs={sortConfigs} requestSort={requestSort} />
                            <th className="p-4 font-semibold text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedDonations.map((donation) => (
                            <tr key={donation.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="p-4"><input type="checkbox" checked={!!selectedDonations[donation.id]} onChange={() => handleSelectOne(donation.id)} className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500" /></td>
                                <td className="p-4 font-mono text-xs text-gray-500 dark:text-gray-400">{donation.id}</td>
                                <td className="p-4">
                                    <button onClick={() => onViewProfile(donation.donorId)} className="font-medium hover:underline">
                                        {donation.donorName}
                                    </button>
                                </td>
                                <td className="p-4 font-medium text-teal-600 dark:text-teal-400">${donation.amount.toLocaleString()}</td>
                                <td className="p-4 text-gray-500 dark:text-gray-400">{new Date(donation.date).toLocaleDateString()}</td>
                                <td className="p-4 text-gray-500 dark:text-gray-400 text-sm">{donation.purpose === 'Custom' && donation.customPurpose ? donation.customPurpose : donation.purpose}</td>
                                <td className="p-4 text-gray-500 dark:text-gray-400">{donation.method}</td>
                                <td className="p-4 text-center">
                                    <button onClick={() => setViewingReceipt(donation)} className="p-2 text-gray-400 hover:text-blue-500" title="View Receipt & Actions">
                                        <Icon name="eye" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {sortedDonations.length === 0 && (
                    <EmptyState 
                        title="No Receipts Found"
                        message="Try adjusting your search or filters, or create a new receipt."
                        actionText="Add New Receipt"
                        onAction={() => setIsFormOpen(true)}
                    />
                )}
                {sortedDonations.length > 0 && (
                     <Pagination 
                        currentPage={currentPage}
                        totalItems={sortedDonations.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>

            {isFormOpen && (
                <DonationForm
                    donors={donors}
                    donations={donations}
                    onSave={handleSaveDonation}
                    onClose={() => setIsFormOpen(false)}
                    settings={settings}
                    initialDonorId={initialDonorId}
                    showToast={showToast}
                />
            )}
            {viewingReceipt && (
                 <ReceiptPreviewModal
                    donation={viewingReceipt}
                    donors={donors}
                    settings={settings}
                    onClose={() => setViewingReceipt(null)}
                    showToast={showToast}
                    onLogCommunication={onLogCommunication}
                    currentUser={currentUser}
                    onSendAgain={onAddToOutbox}
                />
            )}
            <ConfirmationModal
                isOpen={isConfirmOpen}
                title={`Delete ${selectedCount} Receipt(s)`}
                message="Are you sure you want to delete the selected receipts? This action cannot be undone."
                onConfirm={handleConfirmDelete}
                onCancel={() => setIsConfirmOpen(false)}
            />
        </div>
    );
};
