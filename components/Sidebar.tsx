import React from 'react';
import type { View } from '../types';
import { Icon, IconName } from './Icon';

interface SidebarProps {
    currentView: View;
    setView: (view: View) => void;
}

const NavItem: React.FC<{
    view: View;
    label: string;
    icon: IconName;
    currentView: View;
    setView: (view: View) => void;
}> = ({ view, label, icon, currentView, setView }) => {
    const isActive = currentView === view;
    return (
        <li>
            <button
                onClick={() => setView(view)}
                className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                    isActive
                        ? 'bg-teal-500 text-white shadow-md'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
            >
                <Icon name={icon} className="h-6 w-6" />
                <span className="ml-4 font-semibold">{label}</span>
            </button>
        </li>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
    return (
        <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 p-4 shadow-lg flex-col hidden md:flex">
            <div className="flex items-center space-x-3 p-3 mb-6">
                <div className="p-2 bg-teal-500 rounded-full">
                   <Icon name="heart" className="h-8 w-8 text-gold-400" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Alkahaf DS</h1>
            </div>
            <nav className="flex-1">
                <ul className="space-y-2">
                    <NavItem view="dashboard" label="Dashboard" icon="home" currentView={currentView} setView={setView} />
                    <NavItem view="donors" label="Donors" icon="users" currentView={currentView} setView={setView} />
                    <NavItem view="donations" label="Receipts" icon="receipt" currentView={currentView} setView={setView} />
                    <NavItem view="pledges" label="Pledges" icon="pledge" currentView={currentView} setView={setView} />
                    <NavItem view="recurring" label="Recurring" icon="refresh" currentView={currentView} setView={setView} />
                    <NavItem view="reports" label="Reports" icon="chartBar" currentView={currentView} setView={setView} />
                    <NavItem view="outbox" label="Outbox" icon="paperAirplane" currentView={currentView} setView={setView} />
                </ul>
            </nav>
            <div>
                 <ul className="space-y-2">
                    <NavItem view="settings" label="Settings" icon="cog" currentView={currentView} setView={setView} />
                </ul>
            </div>
        </aside>
    );
};