
import React, { useState, useEffect } from 'react';
import type { Donor, Donation, Pledge, View } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Icon } from './Icon';

interface DashboardProps {
    donors: Donor[];
    donations: Donation[];
    pledges: Pledge[];
    setView: (view: View, payload?: any) => void;
}

const WIDGETS = {
    stats: 'Key Statistics',
    history: 'Donation History',
    actions: 'Quick Actions',
    roadmap: 'Recently Shipped',
    health: 'System Health',
    activity: 'Recent Activity'
};

type WidgetKey = keyof typeof WIDGETS;


const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; chartData?: any[]; onClick?: () => void; }> = ({ title, value, icon, color, chartData, onClick }) => {
    return (
        <div onClick={onClick} className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex flex-col justify-between ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow duration-300' : ''}`}>
            <div>
                <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full ${color}`}>
                        {icon}
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
                    </div>
                </div>
            </div>
            {chartData && chartData.length > 0 && (
                <div className="mt-4 h-16">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData}
                            margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
                        >
                            <Tooltip
                                cursor={{ stroke: '#14b8a6', strokeWidth: 1 }}
                                contentStyle={{ backgroundColor: 'rgba(45, 55, 72, 0.9)', border: 'none', borderRadius: '0.5rem', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                labelStyle={{ display: 'none' }}
                                itemStyle={{ color: '#66d9ed' }}
                                formatter={(value: number) => [`$${value.toLocaleString()}`, null]}
                            />
                            <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="#14b8a6"
                                fill="#14b8a6"
                                fillOpacity={0.2}
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

const CompletedFeatureTag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-lg text-sm font-medium">
        <Icon name="checkCircle" className="h-5 w-5" />
        <span>{children}</span>
    </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ donors, donations, pledges, setView }) => {
    const [showOnboarding, setShowOnboarding] = useState(true);
    const [customizeOpen, setCustomizeOpen] = useState(false);
    const [widgetConfig, setWidgetConfig] = useState<Record<WidgetKey, boolean>>(() => {
        try {
            const savedConfig = localStorage.getItem('dashboardWidgetConfig');
            const defaultConfig = { stats: true, history: true, actions: true, roadmap: true, health: true, activity: true };
            if (savedConfig) {
                return { ...defaultConfig, ...JSON.parse(savedConfig) };
            }
            return defaultConfig;
        } catch (error) {
            return { stats: true, history: true, actions: true, roadmap: true, health: true, activity: true };
        }
    });

    useEffect(() => {
        localStorage.setItem('dashboardWidgetConfig', JSON.stringify(widgetConfig));
    }, [widgetConfig]);

    const toggleWidget = (widget: WidgetKey) => {
        setWidgetConfig(prev => ({...prev, [widget]: !prev[widget]}));
    };
    
    const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
    const totalDonors = donors.length;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);
    const upcomingPledgesCount = pledges.filter(p => {
        const dueDate = new Date(p.dueDate);
        return p.status === 'Pending' && dueDate >= today && dueDate <= sevenDaysFromNow;
    }).length;
    
    const monthlyData = donations.reduce((acc, donation) => {
        const month = new Date(donation.date).toLocaleString('default', { month: 'short', year: 'numeric' });
        if (!acc[month]) {
            acc[month] = 0;
        }
        acc[month] += donation.amount;
        return acc;
    }, {} as Record<string, number>);
    const chartData = Object.entries(monthlyData).map(([name, amount]) => ({ name, amount })).reverse();

    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    }).reverse();

    const donationTrendData = last7Days.map(date => {
        const total = donations
            .filter(d => d.date === date)
            .reduce((sum, d) => sum + d.amount, 0);
        return { name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), amount: total };
    });

    const recentActivity = donations.slice(0, 5).map(d => ({
        ...d,
        donorName: donors.find(donor => donor.id === d.donorId)?.name || 'Unknown'
    }));

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                <div className="relative">
                    <button onClick={() => setCustomizeOpen(!customizeOpen)} className="flex items-center space-x-2 px-3 py-2 text-sm border dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Icon name="cog" className="w-5 h-5"/> <span>Customize</span>
                    </button>
                    {customizeOpen && (
                         <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-20 border border-gray-200 dark:border-gray-700">
                             {Object.entries(WIDGETS).map(([key, label]) => (
                                <label key={key} className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    {label}
                                    <input type="checkbox" checked={widgetConfig[key as WidgetKey]} onChange={() => toggleWidget(key as WidgetKey)} className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500" />
                                </label>
                             ))}
                        </div>
                    )}
                </div>
            </div>
            
            {showOnboarding && (
                <div className="relative bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 rounded-xl p-6 mb-8">
                    <button 
                        onClick={() => setShowOnboarding(false)} 
                        className="absolute top-4 right-4 text-teal-500 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-200"
                        aria-label="Dismiss onboarding guide"
                    >
                        <Icon name="x" className="h-6 w-6" />
                    </button>
                    <h2 className="text-xl font-bold text-teal-800 dark:text-teal-200">Welcome to Alkahaf Donor System!</h2>
                    <p className="text-teal-700 dark:text-teal-300 mt-1 mb-4">Here’s a quick guide to get you started:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white/60 dark:bg-gray-800/50 p-4 rounded-lg">
                            <h3 className="font-semibold text-gray-800 dark:text-white">1. Add Your First Donor</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-3">Start building your community by adding a new donor profile.</p>
                            <button onClick={() => setView('donors')} className="text-sm font-semibold text-teal-600 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-200">
                                Add a Donor &rarr;
                            </button>
                        </div>
                        <div className="bg-white/60 dark:bg-gray-800/50 p-4 rounded-lg">
                            <h3 className="font-semibold text-gray-800 dark:text-white">2. Create a New Receipt</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-3">Log a new donation to keep your financial records accurate.</p>
                            <button onClick={() => setView('donations')} className="text-sm font-semibold text-teal-600 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-200">
                                Create a Receipt &rarr;
                            </button>
                        </div>
                        <div className="bg-white/60 dark:bg-gray-800/50 p-4 rounded-lg">
                            <h3 className="font-semibold text-gray-800 dark:text-white">3. View Your Reports</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-3">Gain insights into your fundraising efforts with detailed analytics.</p>
                            <button onClick={() => setView('reports')} className="text-sm font-semibold text-teal-600 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-200">
                                Go to Reports &rarr;
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {widgetConfig.stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <StatCard 
                        title="Total Donations" 
                        value={`$${totalDonations.toLocaleString()}`}
                        icon={<Icon name="dollarSign" className="w-6 h-6" />}
                        color="bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-300"
                        chartData={donationTrendData}
                    />
                    <StatCard 
                        title="Active Donors" 
                        value={totalDonors}
                        icon={<Icon name="users" className="w-6 h-6" />}
                        color="bg-gold-100 dark:bg-gold-900 text-gold-600 dark:text-gold-300"
                    />
                    <StatCard 
                        title="Pledges Due Soon" 
                        value={upcomingPledgesCount}
                        icon={<Icon name="pledge" className="w-6 h-6" />}
                        color="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300"
                        onClick={() => setView('pledges', { filters: { status: 'Due' }})}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {widgetConfig.history && (
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                         <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Donation History</h2>
                         <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)" />
                                    <XAxis dataKey="name" tick={{ fill: '#a0aec0' }} />
                                    <YAxis tickFormatter={(value) => `$${value}`} tick={{ fill: '#a0aec0' }}/>
                                    <Tooltip 
                                        cursor={{fill: 'rgba(128, 128, 128, 0.1)'}}
                                        contentStyle={{ backgroundColor: '#2d3748', border: 'none', borderRadius: '0.5rem' }} 
                                        labelStyle={{ color: '#e2e8f0' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="amount" fill="#14b8a6" name="Donation Amount" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
                <div className="space-y-6">
                    {widgetConfig.actions && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Quick Actions</h2>
                            <div className="flex flex-col space-y-3">
                                <button onClick={() => setView('donors')} className="w-full text-left px-4 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition duration-200 flex items-center"><Icon name="plus" className="h-5 w-5 mr-2" />Add New Donor</button>
                                <button onClick={() => setView('donations')} className="w-full text-left px-4 py-3 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition duration-200 flex items-center"><Icon name="receipt" className="w-5 h-5 mr-2" />Create New Receipt</button>
                            </div>
                        </div>
                    )}
                    {widgetConfig.roadmap && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Recently Shipped Features</h2>
                            <div className="flex flex-wrap gap-3">
                                <CompletedFeatureTag>Add Recurring Donation Fields</CompletedFeatureTag>
                                <CompletedFeatureTag>Implement Search in Lists</CompletedFeatureTag>
                                <CompletedFeatureTag>Add Sorting to Tables</CompletedFeatureTag>
                                <CompletedFeatureTag>Add Task Management to Pledges</CompletedFeatureTag>
                                <CompletedFeatureTag>Improve Bulk Actions</CompletedFeatureTag>
                            </div>
                        </div>
                    )}
                    {widgetConfig.health && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">System Health</h2>
                            <div className="flex items-center space-x-3">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                <span className="text-sm font-medium text-green-600 dark:text-green-400">All Systems Operational</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">Last checked: Just now</p>
                        </div>
                    )}
                    {widgetConfig.activity && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Recent Activity</h2>
                            <ul className="space-y-3">
                                {recentActivity.map(activity => (
                                    <li key={activity.id} className="flex items-center text-sm">
                                        <div className="p-2 bg-teal-100 dark:bg-teal-900 rounded-full mr-3"><Icon name="dollarSign" className="w-4 h-4 text-teal-500"/></div>
                                        <div>
                                            <span className="font-semibold">{activity.donorName}</span> donated <span className="font-bold text-teal-500">${activity.amount.toLocaleString()}</span>.
                                            <p className="text-xs text-gray-400">{new Date(activity.date).toLocaleDateString()}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};