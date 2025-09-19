import React, { useState, useMemo } from 'react';
import type { Donor, Tag } from '../types';
import { DonorForm } from './DonorForm';
import { ConfirmationModal } from './ConfirmationModal';
import { exportToCsv } from '../utils/export';
import { Icon } from './Icon';
import { Pagination } from './Pagination';
import { EmptyState } from './EmptyState';
import { DonorActions, TagActions } from '../hooks/useData';

interface DonorListProps {
    donors: Donor[];
    tags: Tag[];
    actions: DonorActions & { tags: TagActions };
    onViewProfile: (donorId: string) => void;
    onOpenImport: () => void;
    onComposeEmail: (donorIds: string[]) => void;
    onComposeWhatsApp: (donorIds: string[]) => void;
}

type SortKey = 'name' | 'joinDate' | 'totalDonated';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
    key: SortKey;
    direction: SortDirection;
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


export const DonorList: React.FC<DonorListProps> = ({ donors, tags, actions, onViewProfile, onOpenImport, onComposeEmail, onComposeWhatsApp }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [donorToDelete, setDonorToDelete] = useState<string | null>(null);
    const [selectedDonors, setSelectedDonors] = useState<Record<string, boolean>>({});
    const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);
    
    // Filtering state
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filterJoinDate, setFilterJoinDate] = useState({ start: '', end: '' });
    const [filterDonation, setFilterDonation] = useState({ min: '', max: '' });
    const [filterTagIds, setFilterTagIds] = useState<string[]>([]);
    const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ key: 'joinDate', direction: 'desc' }]);
    const [currentPage, setCurrentPage] = useState(1);
    
    const tagMap = useMemo(() => new Map(tags.map(t => [t.id, t])), [tags]);

    const getTotalDonated = (donor: Donor) => {
        return donor.donationHistory.reduce((sum, history) => sum + history.amount, 0);
    };

    const filteredDonors = useMemo(() => {
        let filtered = donors.map(d => ({ ...d, totalDonated: getTotalDonated(d) }));

        // Search term
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(donor =>
                donor.name.toLowerCase().includes(lowercasedTerm) ||
                donor.email.toLowerCase().includes(lowercasedTerm) ||
                donor.phone.replace(/[^0-9]/g, '').includes(lowercasedTerm.replace(/[^0-9]/g, '')) ||
                donor.address.toLowerCase().includes(lowercasedTerm)
            );
        }

        // Join Date
        if (filterJoinDate.start) {
            filtered = filtered.filter(donor => new Date(donor.joinDate) >= new Date(filterJoinDate.start));
        }
        if (filterJoinDate.end) {
            filtered = filtered.filter(donor => new Date(donor.joinDate) <= new Date(filterJoinDate.end));
        }

        // Total Donated
        if (filterDonation.min) {
            filtered = filtered.filter(donor => donor.totalDonated >= parseFloat(filterDonation.min));
        }
        if (filterDonation.max) {
            filtered = filtered.filter(donor => donor.totalDonated <= parseFloat(filterDonation.max));
        }
        
        // Tags
        if (filterTagIds.length > 0) {
            filtered = filtered.filter(donor => 
                filterTagIds.every(tagId => donor.tagIds?.includes(tagId))
            );
        }
        
        if (sortConfigs.length > 0) {
            filtered.sort((a, b) => {
                for (const config of sortConfigs) {
                    const { key, direction } = config;
                    let aValue = a[key as keyof typeof a];
                    let bValue = b[key as keyof typeof b];

                    if (key === 'joinDate') {
                        aValue = new Date(aValue as string).getTime();
                        bValue = new Date(bValue as string).getTime();
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

        return filtered;
    }, [donors, searchTerm, filterJoinDate, filterDonation, filterTagIds, sortConfigs]);
    
    const paginatedDonors = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredDonors.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredDonors, currentPage]);

    const resetFilters = () => {
        setSearchTerm('');
        setFilterJoinDate({ start: '', end: '' });
        setFilterDonation({ min: '', max: '' });
        setFilterTagIds([]);
        setShowFilters(false);
        setCurrentPage(1);
    }
    
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

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (searchTerm) count++;
        if (filterJoinDate.start || filterJoinDate.end) count++;
        if (filterDonation.min || filterDonation.max) count++;
        if (filterTagIds.length > 0) count++;
        return count;
    }, [searchTerm, filterJoinDate, filterDonation, filterTagIds]);

    const selectedCount = Object.values(selectedDonors).filter(Boolean).length;

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newSelected: Record<string, boolean> = {};
        if (e.target.checked) {
            filteredDonors.forEach(d => newSelected[d.id] = true);
        }
        setSelectedDonors(newSelected);
    };

    const handleSelectOne = (id: string) => {
        setSelectedDonors(prev => ({...prev, [id]: !prev[id]}));
    };

    const handleAddNewDonor = () => {
        setSelectedDonor(null);
        setIsFormOpen(true);
    };

    const handleEditDonor = (donor: Donor) => {
        setSelectedDonor(donor);
        setIsFormOpen(true);
    };

    const handleDeleteClick = (donorId: string) => {
        setDonorToDelete(donorId);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
        if (donorToDelete) {
            actions.delete(donorToDelete);
        }
        setIsConfirmOpen(false);
        setDonorToDelete(null);
    };

    const handleDeleteSelectedClick = () => {
        if (selectedCount > 0) {
            setIsBulkConfirmOpen(true);
        }
    };
    
    const handleComposeEmail = () => {
        const donorIds = Object.keys(selectedDonors).filter(id => selectedDonors[id]);
        if(donorIds.length > 0) {
            onComposeEmail(donorIds);
        }
    }
    
    const handleComposeWhatsApp = () => {
        const donorIds = Object.keys(selectedDonors).filter(id => selectedDonors[id]);
        if(donorIds.length > 0) {
            onComposeWhatsApp(donorIds);
        }
    }

    const handleConfirmBulkDelete = () => {
        const idsToDelete = Object.keys(selectedDonors).filter(id => selectedDonors[id]);
        actions.deleteBulk(idsToDelete);
        setSelectedDonors({});
        setIsBulkConfirmOpen(false);
    };

    const handleSaveDonor = (donorData: Omit<Donor, 'id' | 'donationHistory'> | Donor) => {
        if ('id' in donorData) {
            actions.update(donorData as Donor);
        } else {
            actions.add(donorData);
        }
        setIsFormOpen(false);
        setSelectedDonor(null);
    };

    const handleExport = () => {
        const selectedIds = Object.keys(selectedDonors).filter(id => selectedDonors[id]);
        const isExportingSelected = selectedIds.length > 0;

        const dataToExport = isExportingSelected
            ? filteredDonors.filter(donor => selectedIds.includes(donor.id))
            : filteredDonors;

        if (dataToExport.length === 0) {
            alert('No donors to export.');
            return;
        }
        
        const headers = ['ID', 'Name', 'Email', 'Phone', 'Address', 'Join Date', 'Total Donated', 'Tags', 'Notes'];
        const rows = dataToExport.map(donor => [
            donor.id,
            donor.name,
            donor.email,
            donor.phone,
            donor.address,
            donor.joinDate,
            donor.totalDonated,
            donor.tagIds?.map(id => tagMap.get(id)?.name).join(', ') || '',
            donor.notes || ''
        ]);
        const filename = isExportingSelected ? `donors_selected_${selectedIds.length}.csv` : `donors_view_${dataToExport.length}.csv`;
        exportToCsv(filename, [headers, ...rows]);
    };
    
    const handleViewProfileAndCloseForm = (donorId: string) => {
        onViewProfile(donorId);
        setIsFormOpen(false);
    }

    return (
        <div>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Donors</h1>
                <div className="flex items-center space-x-2">
                    {selectedCount > 0 ? (
                        <>
                            <button onClick={handleComposeEmail} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 flex items-center"><Icon name="message" className="h-5 w-5 mr-2" /> Email ({selectedCount})</button>
                            <button onClick={handleComposeWhatsApp} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 flex items-center"><Icon name="whatsapp" className="h-5 w-5 mr-2" /> WhatsApp ({selectedCount})</button>
                            <button onClick={handleDeleteSelectedClick} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200 flex items-center"><Icon name="trash" className="h-5 w-5 mr-2" /> Delete ({selectedCount})</button>
                        </>
                    ) : (
                        <button onClick={handleExport} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 flex items-center"><Icon name="export" /> Export View ({filteredDonors.length})</button>
                    )}
                    <button onClick={onOpenImport} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 flex items-center"><Icon name="import" /> Bulk Import</button>
                    <button onClick={handleAddNewDonor} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition duration-200 flex items-center"><Icon name="plus" className="h-5 w-5 mr-2" /> Add Donor</button>
                </div>
            </div>
            
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="relative flex-grow">
                         <input type="text" placeholder="Search by name, email, or phone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                         <Icon name="search" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    <button onClick={() => setShowFilters(!showFilters)} className="px-4 py-2 border dark:border-gray-600 rounded-lg flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Icon name="filter" /> 
                        <span>Filters</span>
                        {activeFilterCount > 0 && (
                            <span className="ml-2 bg-teal-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{activeFilterCount}</span>
                        )}
                    </button>
                    <button onClick={resetFilters} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Reset</button>
                </div>
                 {showFilters && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 border-t dark:border-gray-700 pt-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Join Date</label>
                            <div className="flex items-center space-x-2">
                                <input type="date" value={filterJoinDate.start} onChange={e => setFilterJoinDate(p => ({ ...p, start: e.target.value }))} className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600"/>
                                <span>to</span>
                                <input type="date" value={filterJoinDate.end} onChange={e => setFilterJoinDate(p => ({ ...p, end: e.target.value }))} className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600"/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Total Donated ($)</label>
                             <div className="flex items-center space-x-2">
                                <input type="number" placeholder="Min" value={filterDonation.min} onChange={e => setFilterDonation(p => ({...p, min: e.target.value}))} className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600" />
                                <span>to</span>
                                <input type="number" placeholder="Max" value={filterDonation.max} onChange={e => setFilterDonation(p => ({...p, max: e.target.value}))} className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                        </div>
                        <div>
                             <label className="block text-sm font-medium mb-1">Tags (must have all selected)</label>
                             <select multiple value={filterTagIds} onChange={e => setFilterTagIds(Array.from(e.target.selectedOptions, option => option.value))} className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 h-24">
                                {tags.map(tag => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
                             </select>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="p-4 w-12"><input type="checkbox" onChange={handleSelectAll} checked={selectedCount > 0 && selectedCount === filteredDonors.length && filteredDonors.length > 0} className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500" /></th>
                            <SortableHeader label="Name" sortKey="name" sortConfigs={sortConfigs} requestSort={requestSort} />
                            <th className="p-4 font-semibold">Contact</th>
                            <th className="p-4 font-semibold">Tags</th>
                            <SortableHeader label="Join Date" sortKey="joinDate" sortConfigs={sortConfigs} requestSort={requestSort} />
                            <SortableHeader label="Total Donated" sortKey="totalDonated" sortConfigs={sortConfigs} requestSort={requestSort} />
                            <th className="p-4 font-semibold text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                         {paginatedDonors.map((donor) => (
                            <tr key={donor.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="p-4"><input type="checkbox" checked={!!selectedDonors[donor.id]} onChange={() => handleSelectOne(donor.id)} className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500" /></td>
                                <td className="p-4">
                                    <button onClick={() => onViewProfile(donor.id)} className="font-medium hover:underline text-teal-600 dark:text-teal-400">
                                        {donor.name}
                                    </button>
                                </td>
                                <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                                    <div>{donor.email}</div>
                                    <div>{donor.phone}</div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-wrap gap-1">
                                        {donor.tagIds?.map(tagId => {
                                            const tag = tagMap.get(tagId);
                                            return tag ? <span key={tag.id} className={`px-2 py-0.5 text-xs rounded-full ${tag.color}`}>{tag.name}</span> : null;
                                        })}
                                    </div>
                                </td>
                                <td className="p-4 text-gray-500 dark:text-gray-400">{new Date(donor.joinDate).toLocaleDateString()}</td>
                                <td className="p-4 font-medium text-teal-600 dark:text-teal-400">${donor.totalDonated.toLocaleString()}</td>
                                <td className="p-4 text-center">
                                    <div className="flex justify-center items-center space-x-2">
                                        <button onClick={() => onViewProfile(donor.id)} className="p-2 text-gray-400 hover:text-blue-500" title="View Profile"><Icon name="eye" /></button>
                                        <button onClick={() => handleEditDonor(donor)} className="p-2 text-gray-400 hover:text-teal-500" title="Edit Donor"><Icon name="pencil" /></button>
                                        <button onClick={() => handleDeleteClick(donor.id)} className="p-2 text-gray-400 hover:text-red-500" title="Delete Donor"><Icon name="trash" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredDonors.length === 0 && (
                    <EmptyState 
                        title="No Donors Found"
                        message="Try adjusting your search or filters, or add a new donor to get started."
                        actionText="Add New Donor"
                        onAction={handleAddNewDonor}
                    />
                )}
                 {filteredDonors.length > 0 && (
                     <Pagination 
                        currentPage={currentPage}
                        totalItems={filteredDonors.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>

            {isFormOpen && (
                <DonorForm
                    donor={selectedDonor}
                    donors={donors}
                    tags={tags}
                    actions={actions}
                    onViewProfile={handleViewProfileAndCloseForm}
                    onSave={handleSaveDonor}
                    onClose={() => setIsFormOpen(false)}
                />
            )}
            <ConfirmationModal
                isOpen={isConfirmOpen}
                title="Delete Donor"
                message="Are you sure you want to delete this donor? This will also delete all associated donations and pledges. This action cannot be undone."
                onConfirm={handleConfirmDelete}
                onCancel={() => setIsConfirmOpen(false)}
            />
             <ConfirmationModal
                isOpen={isBulkConfirmOpen}
                title={`Delete ${selectedCount} Donors`}
                message={`Are you sure you want to delete the ${selectedCount} selected donors? This action cannot be undone.`}
                onConfirm={handleConfirmBulkDelete}
                onCancel={() => setIsBulkConfirmOpen(false)}
            />
        </div>
    );
};