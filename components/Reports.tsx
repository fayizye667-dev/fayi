import React, { useState, useMemo } from 'react';
import type { Donation, Donor, Pledge } from '../types';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Icon, IconName } from './Icon';
import { EmptyState } from './EmptyState';
import { exportToCsv } from '../utils/export';
import { donationPurposes, recurringOptions } from '../data/constants';


interface ReportsProps {
    donations: Donation[];
    donors: Donor[];
    pledges: Pledge[];
}

type SortKey = 'date' | 'donorName' | 'amount' | 'purpose' | 'method';
type SortDirection = 'asc' | 'desc';

const COLORS = ['#14b8a6', '#f59e0b', '#8b5cf6', '#3b82f6', '#ec4899', '#ef4444', '#10b981'];

const KPI_Card: React.FC<{ title: string; value: string; icon: IconName; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex items-center">
        <div className={`p-3 rounded-full ${color} mr-4`}>
            <Icon name={icon} className="h-6 w-6 text-white" />
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
            <p className="text-xl font-bold text-gray-800 dark:text-white">{value}</p>
        </div>
    </div>
);

const getISODateString = (date: Date) => date.toISOString().split('T')[0];

const dateRanges = {
    'this_month': () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: getISODateString(start), end: getISODateString(now) };
    },
    'last_30': () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);
        return { start: getISODateString(start), end: getISODateString(end) };
    },
    'last_90': () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 90);
        return { start: getISODateString(start), end: getISODateString(end) };
    },
    'this_year': () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        return { start: getISODateString(start), end: getISODateString(now) };
    },
};

export const Reports: React.FC<ReportsProps> = ({ donations, donors, pledges }) => {
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'date', direction: 'desc' });
    const [dateRange, setDateRange] = useState(dateRanges['this_year']());

    // New filter states
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAmount, setFilterAmount] = useState({ min: '', max: '' });
    const [filterMethod, setFilterMethod] = useState<'All' | 'Cash' | 'Online'>('All');
    const [filterPurpose, setFilterPurpose] = useState<(typeof donationPurposes)[number] | 'All'>('All');
    const [filterCustomPurpose, setFilterCustomPurpose] = useState('');
    const [filterRecurring, setFilterRecurring] = useState<(typeof recurringOptions)[number] | 'All'>('All');


    const donorMap = useMemo(() => new Map(donors.map(d => [d.id, d])), [donors]);

    const filteredData = useMemo(() => {
        const start = new Date(dateRange.start);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateRange.end);
        end.setHours(23, 59, 59, 999);
        
        let filteredDonations = donations.map(d => ({ ...d, donor: donorMap.get(d.donorId) }));
        
        // Apply all filters
        filteredDonations = filteredDonations.filter(d => {
            const donationDate = new Date(d.date);
            if (donationDate < start || donationDate > end) return false;

            if (searchTerm) {
                const lowercasedTerm = searchTerm.toLowerCase();
                if (!(d.donor?.name.toLowerCase().includes(lowercasedTerm) || d.id.toLowerCase().includes(lowercasedTerm))) {
                    return false;
                }
            }
            if (filterAmount.min && d.amount < parseFloat(filterAmount.min)) return false;
            if (filterAmount.max && d.amount > parseFloat(filterAmount.max)) return false;
            if (filterMethod !== 'All' && d.method !== filterMethod) return false;
            if (filterPurpose !== 'All' && d.purpose !== filterPurpose) return false;
            if (filterPurpose === 'Custom' && filterCustomPurpose && !(d.customPurpose && d.customPurpose.toLowerCase().includes(filterCustomPurpose.toLowerCase()))) return false;
            if (filterRecurring !== 'All' && d.recurring !== filterRecurring) return false;

            return true;
        });

        // Other data filtered only by date
        const newDonors = donors.filter(d => {
            const joinDate = new Date(d.joinDate);
            return joinDate >= start && joinDate <= end;
        });

        const filteredPledges = pledges.filter(p => {
            const dueDate = new Date(p.dueDate);
            return dueDate >= start && dueDate <= end;
        });
        
        return { filteredDonations, newDonors, filteredPledges };
    }, [donations, donors, pledges, dateRange, searchTerm, filterAmount, filterMethod, filterPurpose, filterCustomPurpose, filterRecurring, donorMap]);
    
     const resetFilters = () => {
        setSearchTerm('');
        setFilterAmount({ min: '', max: '' });
        setFilterMethod('All');
        setFilterPurpose('All');
        setFilterCustomPurpose('');
        setFilterRecurring('All');
        setDateRange(dateRanges['this_year']());
        setShowFilters(false);
    };

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (searchTerm) count++;
        if (filterAmount.min || filterAmount.max) count++;
        if (filterMethod !== 'All') count++;
        if (filterPurpose !== 'All') count++;
        if (filterRecurring !== 'All') count++;
        // We don't count date range as it's always active
        return count;
    }, [searchTerm, filterAmount, filterMethod, filterPurpose, filterRecurring]);


    const kpis = useMemo(() => {
        const totalDonated = filteredData.filteredDonations.reduce((sum, d) => sum + d.amount, 0);
        const donationCount = filteredData.filteredDonations.length;
        const avgDonation = donationCount > 0 ? totalDonated / donationCount : 0;
        const newDonorsCount = filteredData.newDonors.length;
        
        const completedPledges = filteredData.filteredPledges.filter(p => p.status === 'Completed').length;
        const totalPledges = filteredData.filteredPledges.length;
        const pledgeFulfilment = totalPledges > 0 ? (completedPledges / totalPledges) * 100 : 0;

        return {
            totalDonated: `$${totalDonated.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            avgDonation: `$${avgDonation.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            donationCount: donationCount.toLocaleString(),
            newDonorsCount: newDonorsCount.toLocaleString(),
            pledgeFulfilment: `${pledgeFulfilment.toFixed(0)}%`,
        };
    }, [filteredData]);

    const chartData = useMemo(() => {
        const trend = filteredData.filteredDonations.reduce((acc, d) => {
            const date = d.date;
            acc[date] = (acc[date] || 0) + d.amount;
            return acc;
        }, {} as Record<string, number>);
        
        const sortedTrend = Object.entries(trend).sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime()).map(([date, amount]) => ({ date, amount }));

        const purpose = filteredData.filteredDonations.reduce((acc, d) => {
            const p = d.purpose === 'Custom' ? (d.customPurpose || 'Custom') : d.purpose;
            acc[p] = (acc[p] || 0) + d.amount;
            return acc;
        }, {} as Record<string, number>);
        
        const purposeData = Object.entries(purpose).map(([name, value]) => ({ name, value }));
        
        const method = filteredData.filteredDonations.reduce((acc, d) => {
            acc[d.method] = (acc[d.method] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const methodData = Object.entries(method).map(([name, value]) => ({ name, value }));

        return { trendData: sortedTrend, purposeData, methodData };

    }, [filteredData.filteredDonations]);

    const sortedTableData = useMemo(() => {
        const tableData = filteredData.filteredDonations.map(d => ({...d, donorName: d.donor?.name || 'Unknown'}));
        if (sortConfig) {
            // FIX: The original sort logic was too simple and caused a TypeScript error because it couldn't guarantee that it was comparing two values of the same type (e.g., string and number). This more robust sorting logic handles different data types correctly.
            tableData.sort((a, b) => {
                const { key, direction } = sortConfig;

                let aValue: any = a[key];
                let bValue: any = b[key];

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
                return 0;
            });
        }
        return tableData;
    }, [filteredData.filteredDonations, sortConfig]);

    const requestSort = (key: SortKey) => {
        let direction: SortDirection = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleExport = () => {
        if (sortedTableData.length === 0) return;
        const headers = ['Receipt ID', 'Date', 'Donor Name', 'Amount', 'Purpose', 'Method'];
        const rows = sortedTableData.map(d => [d.id, d.date, d.donorName, d.amount, d.purpose, d.method]);
        exportToCsv(`report_${dateRange.start}_to_${dateRange.end}.csv`, [headers, ...rows]);
    };
    
    return (
        <div className="space-y-8">
            <div className="flex flex-wrap gap-4 justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports Dashboard</h1>
            </div>

            {/* Filters Section */}
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="relative flex-grow">
                         <input type="text" placeholder="Search by donor name or receipt ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500" />
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
                            <div className="lg:col-span-2">
                                <label className="block text-sm font-medium mb-1">Date Range</label>
                                <div className="flex items-center space-x-2 mb-2">
                                     <select
                                        onChange={(e) => {
                                            if (e.target.value === 'custom') return;
                                            setDateRange(dateRanges[e.target.value as keyof typeof dateRanges]());
                                        }}
                                        defaultValue="this_year"
                                        className="p-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-sm"
                                    >
                                        <option value="this_year">This Year</option>
                                        <option value="this_month">This Month</option>
                                        <option value="last_90">Last 90 Days</option>
                                        <option value="last_30">Last 30 Days</option>
                                        <option value="custom">Custom Range</option>
                                    </select>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input type="date" value={dateRange.start} onChange={e => setDateRange(dr => ({...dr, start: e.target.value}))} className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600"/>
                                    <span className="text-gray-500">to</span>
                                    <input type="date" value={dateRange.end} onChange={e => setDateRange(dr => ({...dr, end: e.target.value}))} className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600"/>
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
                                    <input type="text" value={filterCustomPurpose} onChange={e => setFilterCustomPurpose(e.target.value)} className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600"/>
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


            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <KPI_Card title="Total Donations" value={kpis.totalDonated} icon="dollarSign" color="bg-teal-500" />
                <KPI_Card title="No. of Donations" value={kpis.donationCount} icon="receipt" color="bg-indigo-500" />
                <KPI_Card title="Average Donation" value={kpis.avgDonation} icon="chartBar" color="bg-blue-500" />
                <KPI_Card title="New Donors" value={kpis.newDonorsCount} icon="users" color="bg-purple-500" />
                <KPI_Card title="Pledge Fulfillment" value={kpis.pledgeFulfilment} icon="pledge" color="bg-yellow-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Donation Trend</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData.trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)" />
                            <XAxis dataKey="date" tickFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} tick={{ fill: '#a0aec0', fontSize: 12 }} />
                            <YAxis tickFormatter={(v:number) => `$${(v/1000)}k`} tick={{ fill: '#a0aec0' }}/>
                            <Tooltip contentStyle={{ backgroundColor: '#2d3748', border: 'none', borderRadius: '0.5rem' }} />
                            <Line type="monotone" dataKey="amount" stroke="#14b8a6" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Donations by Purpose</h2>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={chartData.purposeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {chartData.purposeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
                <div className="p-4 flex justify-between items-center border-b dark:border-gray-700">
                    <h2 className="text-xl font-semibold">Detailed Donations Report</h2>
                    <button onClick={handleExport} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center">
                        <Icon name="export" className="h-4 w-4 mr-2"/> Export CSV
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                         <thead className="border-b dark:border-gray-700">
                            <tr>
                                <th className="p-4 font-semibold cursor-pointer" onClick={() => requestSort('date')}>Date</th>
                                <th className="p-4 font-semibold">Receipt ID</th>
                                <th className="p-4 font-semibold cursor-pointer" onClick={() => requestSort('donorName')}>Donor</th>
                                <th className="p-4 font-semibold cursor-pointer" onClick={() => requestSort('amount')}>Amount</th>
                                <th className="p-4 font-semibold cursor-pointer" onClick={() => requestSort('purpose')}>Purpose</th>
                                <th className="p-4 font-semibold cursor-pointer" onClick={() => requestSort('method')}>Method</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedTableData.map(d => (
                                <tr key={d.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="p-4 text-sm">{d.date}</td>
                                    <td className="p-4 font-mono text-xs">{d.id}</td>
                                    <td className="p-4">{d.donorName}</td>
                                    <td className="p-4 font-medium text-teal-500">${d.amount.toLocaleString()}</td>
                                    <td className="p-4">{d.purpose === 'Custom' ? d.customPurpose : d.purpose}</td>
                                    <td className="p-4">{d.method}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {sortedTableData.length === 0 && (
                        <EmptyState title="No Donations Found" message="No donations match the current filters." />
                    )}
                </div>
            </div>
        </div>
    );
};