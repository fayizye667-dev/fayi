import React, { useState, useMemo, useEffect } from 'react';
import type { Pledge, Donor, PledgeTask } from '../types';
import { PledgeForm } from './PledgeForm';
import { Icon } from './Icon';
import { Pagination } from './Pagination';
import { EmptyState } from './EmptyState';
import { PledgeActions } from '../hooks/useData';
import { ConfirmationModal } from './ConfirmationModal';


interface PledgeListProps {
    pledges: Pledge[];
    donors: Donor[];
    actions: PledgeActions;
    initialPayload?: { action?: 'add'; donorId?: string; filters?: { status: Pledge['status'] } };
    onClearPayload: () => void;
}

type SortKey = 'donorName' | 'amount' | 'dueDate' | 'status';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
    key: SortKey;
    direction: SortDirection;
}

const ITEMS_PER_PAGE = 10;

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


export const PledgeList: React.FC<PledgeListProps> = ({ pledges, donors, actions, initialPayload, onClearPayload }) => {
    const { add, update, deleteBulk, updateStatusBulk, addTask, toggleTask } = actions;
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPledge, setEditingPledge] = useState<Pledge | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<Pledge['status'] | 'All'>('All');
    const [filterDueDate, setFilterDueDate] = useState({ start: '', end: '' });
    const [expandedPledgeId, setExpandedPledgeId] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'dueDate', direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [initialDonorId, setInitialDonorId] = useState<string | undefined>(undefined);

    const [selectedPledges, setSelectedPledges] = useState<Record<string, boolean>>({});
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [bulkStatus, setBulkStatus] = useState<Pledge['status']>('Completed');

     useEffect(() => {
        if (initialPayload) {
            if (initialPayload.action === 'add' && initialPayload.donorId) {
                setInitialDonorId(initialPayload.donorId);
                setIsFormOpen(true);
            }
            if (initialPayload.filters?.status) {
                setFilterStatus(initialPayload.filters.status);
            }
            onClearPayload();
        }
    }, [initialPayload, onClearPayload]);

    const getDonorName = (donorId: string) => {
        return donors.find(d => d.id === donorId)?.name || 'Unknown Donor';
    };

    const getStatusColor = (status: Pledge['status']) => {
        switch (status) {
            case 'Pending': return 'text-yellow-500';
            case 'Due': return 'text-red-500';
            case 'Completed': return 'text-green-500';
            default: return 'text-gray-500';
        }
    };
    
    const requestSort = (key: SortKey) => {
        let direction: SortDirection = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredPledges = useMemo(() => {
        let processedPledges = pledges.map(pledge => ({
            ...pledge,
            donorName: getDonorName(pledge.donorId)
        }));
        
        let filtered = [...processedPledges];

        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(pledge => pledge.donorName.toLowerCase().includes(lowercasedTerm));
        }

        if (filterStatus !== 'All') {
            filtered = filtered.filter(pledge => pledge.status === filterStatus);
        }

        if (filterDueDate.start) {
            filtered = filtered.filter(pledge => new Date(pledge.dueDate) >= new Date(filterDueDate.start));
        }
        if (filterDueDate.end) {
            filtered = filtered.filter(pledge => new Date(pledge.dueDate) <= new Date(filterDueDate.end));
        }
        
        if (sortConfig !== null) {
            filtered.sort((a, b) => {
                const key = sortConfig.key;
                let aValue: any = a[key as keyof typeof a];
                let bValue: any = b[key as keyof typeof b];

                if (key === 'dueDate') {
                    aValue = new Date(aValue as string).getTime();
                    bValue = new Date(bValue as string).getTime();
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        
        return filtered;
    }, [pledges, filterStatus, filterDueDate, searchTerm, donors, sortConfig]);
    
    const paginatedPledges = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredPledges.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredPledges, currentPage]);
    
    const resetFilters = () => {
        setSearchTerm('');
        setFilterStatus('All');
        setFilterDueDate({ start: '', end: '' });
        setCurrentPage(1);
    };

    const selectedCount = Object.values(selectedPledges).filter(Boolean).length;

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newSelected: Record<string, boolean> = {};
        if (e.target.checked) {
            filteredPledges.forEach(p => newSelected[p.id] = true);
        }
        setSelectedPledges(newSelected);
    };

    const handleSelectOne = (id: string) => {
        setSelectedPledges(prev => ({...prev, [id]: !prev[id]}));
    };

    const handleDeleteSelected = () => {
        if (selectedCount > 0) {
            setIsConfirmOpen(true);
        }
    }

    const handleConfirmDelete = () => {
        const idsToDelete = Object.keys(selectedPledges).filter(id => selectedPledges[id]);
        deleteBulk(idsToDelete);
        setSelectedPledges({});
        setIsConfirmOpen(false);
    };

    const handleUpdateStatusSelected = () => {
        const idsToUpdate = Object.keys(selectedPledges).filter(id => selectedPledges[id]);
        updateStatusBulk(idsToUpdate, bulkStatus);
        setSelectedPledges({});
    };

    const handleEditPledge = (pledge: Pledge) => {
        setEditingPledge(pledge);
        setIsFormOpen(true);
    };

    const handleSavePledge = (pledgeData: Omit<Pledge, 'id' | 'status' | 'tasks'> | Pledge) => {
        if ('id' in pledgeData) {
            update(pledgeData);
        } else {
            add(pledgeData);
        }
        setIsFormOpen(false);
        setEditingPledge(null);
    };

    const handleMarkReceived = (pledge: Pledge) => {
        update({ ...pledge, status: 'Completed' });
    };

    const AddTaskForm: React.FC<{ pledgeId: string }> = ({ pledgeId }) => {
        const [description, setDescription] = useState('');
        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (description.trim()) {
                addTask(pledgeId, { description });
                setDescription('');
            }
        };

        return (
            <form onSubmit={handleSubmit} className="mt-4 flex items-center space-x-2">
                <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="New task description..."
                    className="flex-grow p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">Add Task</button>
            </form>
        );
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pledges</h1>
                <div className="flex items-center space-x-3">
                    {selectedCount > 0 && (
                        <>
                            <button onClick={handleDeleteSelected} className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"><Icon name="trash" className="h-4 w-4 mr-1"/> Delete ({selectedCount})</button>
                            <div className="flex items-center space-x-2">
                                <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value as any)} className="p-2 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600">
                                    <option value="Completed">Completed</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Due">Due</option>
                                </select>
                                <button onClick={handleUpdateStatusSelected} className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Update Status</button>
                            </div>
                        </>
                    )}
                    <button
                        onClick={() => {
                            setInitialDonorId(undefined);
                            setEditingPledge(null);
                            setIsFormOpen(true)
                        }}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition duration-200 flex items-center"
                    >
                        <Icon name="plus" className="h-5 w-5 mr-2" />
                        Add Pledge
                    </button>
                </div>
            </div>

            <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1">
                        <label className="block text-sm font-medium mb-1">Search by Donor</label>
                        <input
                            type="text"
                            placeholder="Enter donor name..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value as any)}
                            className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600"
                        >
                            <option value="All">All</option>
                            <option value="Pending">Pending</option>
                            <option value="Due">Due</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </div>
                    <div className="lg:col-span-1">
                        <label className="block text-sm font-medium mb-1">Due Date</label>
                        <div className="flex items-center space-x-2">
                            <input type="date" value={filterDueDate.start} onChange={e => setFilterDueDate(p => ({ ...p, start: e.target.value }))} className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600"/>
                            <span>to</span>
                            <input type="date" value={filterDueDate.end} onChange={e => setFilterDueDate(p => ({ ...p, end: e.target.value }))} className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600"/>
                        </div>
                    </div>
                    <div className="flex items-end">
                         <button onClick={resetFilters} className="w-full md:w-auto px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border dark:border-gray-600 rounded-lg">Reset Filters</button>
                    </div>
                </div>
            </div>

             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="p-4 w-12"><input type="checkbox" onChange={handleSelectAll} checked={selectedCount > 0 && selectedCount === filteredPledges.length && filteredPledges.length > 0} className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"/></th>
                            <th className="p-4 w-12"></th>
                            <SortableHeader label="Donor Name" sortKey="donorName" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader label="Amount" sortKey="amount" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader label="Due Date" sortKey="dueDate" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} requestSort={requestSort} />
                            <th className="p-4 font-semibold">Tasks</th>
                            <th className="p-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedPledges.map((pledge) => {
                            const totalTasks = pledge.tasks?.length || 0;
                            const completedTasks = pledge.tasks?.filter(t => t.completed).length || 0;
                            return (
                            <React.Fragment key={pledge.id}>
                                <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="p-4"><input type="checkbox" checked={!!selectedPledges[pledge.id]} onChange={() => handleSelectOne(pledge.id)} className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500" /></td>
                                    <td className="p-4 text-center">
                                        <button onClick={() => setExpandedPledgeId(expandedPledgeId === pledge.id ? null : pledge.id)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400">
                                            <Icon name="chevronDown" className={`h-5 w-5 transition-transform ${expandedPledgeId === pledge.id ? 'rotate-180' : ''}`} />
                                        </button>
                                    </td>
                                    <td className="p-4">{getDonorName(pledge.donorId)}</td>
                                    <td className="p-4 font-medium text-teal-600 dark:text-teal-400">${pledge.amount.toLocaleString()}</td>
                                    <td className="p-4 text-gray-500 dark:text-gray-400">{new Date(pledge.dueDate).toLocaleDateString()}</td>
                                    <td className={`p-4 font-semibold ${getStatusColor(pledge.status)}`}>{pledge.status}</td>
                                    <td className="p-4">
                                        {totalTasks > 0 ? (
                                            <div className="flex items-center space-x-2 text-sm">
                                                <span className={`${completedTasks === totalTasks ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}`}>{completedTasks}/{totalTasks}</span>
                                                <div className="w-16 bg-gray-200 rounded-full h-1.5 dark:bg-gray-600">
                                                    <div 
                                                        className={`${completedTasks === totalTasks ? 'bg-green-500' : 'bg-teal-500'} h-1.5 rounded-full`}
                                                        style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-xs italic">No tasks</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => handleEditPledge(pledge)} className="text-teal-500 hover:text-teal-700 mr-4">Edit</button>
                                        <button onClick={() => handleMarkReceived(pledge)} className="text-green-500 hover:text-green-700">Mark Received</button>
                                    </td>
                                </tr>
                                {expandedPledgeId === pledge.id && (
                                    <tr className="bg-gray-50 dark:bg-gray-900/50">
                                        <td></td>
                                        <td colSpan={7} className="p-6">
                                            <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">Tasks</h4>
                                            {(!pledge.tasks || pledge.tasks.length === 0) ? (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">No tasks for this pledge.</p>
                                            ) : (
                                                <ul className="space-y-2">
                                                    {pledge.tasks.map(task => (
                                                        <li key={task.id} className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={task.completed}
                                                                onChange={() => toggleTask(pledge.id, task.id)}
                                                                className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 mr-3"
                                                            />
                                                            <span className={`text-sm ${task.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>{task.description}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                            <AddTaskForm pledgeId={pledge.id} />
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        )})}
                    </tbody>
                </table>
                 {filteredPledges.length === 0 && (
                   <EmptyState
                        title="No Pledges Found"
                        message="Try adjusting your filters, or add a new pledge to track upcoming donations."
                        actionText="Add New Pledge"
                        onAction={() => setIsFormOpen(true)}
                    />
                )}
                 {filteredPledges.length > 0 && (
                    <Pagination 
                        currentPage={currentPage}
                        totalItems={filteredPledges.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>
            
            {isFormOpen && (
                <PledgeForm 
                    pledge={editingPledge}
                    donors={donors}
                    onSave={handleSavePledge}
                    onClose={() => {
                        setIsFormOpen(false);
                        setEditingPledge(null);
                    }}
                    initialDonorId={initialDonorId}
                />
            )}

            <ConfirmationModal
                isOpen={isConfirmOpen}
                title={`Delete ${selectedCount} Pledge(s)`}
                message={`Are you sure you want to delete ${selectedCount} selected pledge(s)? This action cannot be undone.`}
                onConfirm={handleConfirmDelete}
                onCancel={() => setIsConfirmOpen(false)}
            />
        </div>
    );
};